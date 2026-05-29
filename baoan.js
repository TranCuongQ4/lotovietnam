// ============================================
// baoan.js - Preload & Cache Âm Thanh Lô Tô (IndexedDB)
// Tải toàn bộ file MP3 từ folder "so" và lưu vào IndexedDB
// Mỗi người chơi tự tải và lưu cache riêng trên máy họ
// ============================================

const BAOAN = {
    // === CẤU HÌNH ===
    folderPath: 'so/',
    totalFiles: 90,
    extraFiles: ['nenloto.mp3'],
    dbName: 'LotoSoundDB',
    dbVersion: 1,
    storeName: 'audioCache',
    cacheVersion: '1.0', // Đổi để invalidate cache khi cần
    concurrentDownloads: 5, // Tải 5 file cùng lúc

    // Danh sách file cần tải
    getAllFiles() {
        const files = [];
        for (let i = 1; i <= this.totalFiles; i++) {
            files.push(`${i}.mp3`);
        }
        this.extraFiles.forEach(f => files.push(f));
        return files;
    },

    // === INDEXEDDB API ===
    db: null,

    async openDB() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'filename' });
                }
            };
        });
    },

    async saveToDB(filename, base64Data) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put({
                filename: filename,
                data: base64Data,
                version: this.cacheVersion,
                timestamp: Date.now()
            });
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    async getFromDB(filename) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(filename);
            request.onsuccess = () => {
                const result = request.result;
                if (result && result.version === this.cacheVersion) {
                    resolve(result.data);
                } else {
                    resolve(null); // Version cũ hoặc không có
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    async isCached(filename) {
        const data = await this.getFromDB(filename);
        return data !== null;
    },

    async clearOldCache() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    // === CHUYỂN ĐỔI DỮ LIỆU ===
    async fetchAudioAsBase64(filename) {
        const url = this.folderPath + filename;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const blob = await response.blob();
            return await this.blobToBase64(blob);
        } catch (error) {
            console.error(`[BaoAn] Lỗi tải ${filename}:`, error);
            return null;
        }
    },

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    base64ToBlobUrl(base64String, mimeType = 'audio/mpeg') {
        try {
            const byteChars = atob(base64String);
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteNumbers[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error('[BaoAn] Lỗi decode base64:', e);
            return null;
        }
    },

    // === TẢI VÀ CACHE ===
    async downloadAndCache(filename, onProgress) {
        // Kiểm tra cache trước
        const cached = await this.getFromDB(filename);
        if (cached) {
            if (onProgress) onProgress(filename, true, true);
            return { filename, success: true, cached: true };
        }

        const base64 = await this.fetchAudioAsBase64(filename);
        if (base64) {
            try {
                await this.saveToDB(filename, base64);
                if (onProgress) onProgress(filename, true, false);
                return { filename, success: true, cached: false };
            } catch (e) {
                console.warn('[BaoAn] Không lưu được vào DB:', e);
                if (onProgress) onProgress(filename, false, false);
                return { filename, success: false, cached: false, error: e };
            }
        }

        if (onProgress) onProgress(filename, false, false);
        return { filename, success: false, cached: false };
    },

    // === TẢI TOÀN BỘ ===
    async preloadAll(options = {}) {
        const {
            onProgress = null,
            onComplete = null,
            concurrent = this.concurrentDownloads
        } = options;

        console.log('[BaoAn] Bắt đầu preload âm thanh...');
        const startTime = performance.now();

        const files = this.getAllFiles();
        const results = [];
        let completed = 0;
        let cached = 0;
        let downloaded = 0;
        let failed = 0;

        const handleProgress = (filename, success, wasCached) => {
            completed++;
            if (wasCached) cached++;
            else if (success) downloaded++;
            else failed++;

            if (onProgress) {
                onProgress({
                    filename,
                    success,
                    wasCached,
                    completed,
                    total: files.length,
                    percent: Math.round((completed / files.length) * 100)
                });
            }

            console.log(`[BaoAn] ${completed}/${files.length} - ${filename}: ${wasCached ? '✓ đã có cache' : (success ? '✓ tải xong' : '✗ THẤT BẠI')}`);
        };

        // Tải theo batch
        for (let i = 0; i < files.length; i += concurrent) {
            const batch = files.slice(i, i + concurrent);
            const batchPromises = batch.map(f => this.downloadAndCache(f, handleProgress));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[BaoAn] Hoàn tất! ${duration}s | Cache: ${cached} | Tải mới: ${downloaded} | Lỗi: ${failed}`);

        if (onComplete) {
            onComplete({
                total: files.length,
                cached,
                downloaded,
                failed,
                duration,
                results
            });
        }

        return results;
    },

    // === API CHO GAME ===

    // Tạo Audio object từ cache hoặc URL trực tiếp
    async createAudio(filename) {
        const cached = await this.getFromDB(filename);
        if (cached) {
            const blobUrl = this.base64ToBlobUrl(cached);
            if (blobUrl) {
                return new Audio(blobUrl);
            }
        }
        // Fallback: load trực tiếp từ server
        return new Audio(this.folderPath + filename);
    },

    // Phát 1 số (không delay)
    async playNumber(num) {
        const filename = `${num}.mp3`;
        const audio = await this.createAudio(filename);
        audio.play().catch(e => console.error('[BaoAn] Lỗi phát âm thanh:', e));
        return audio;
    },

    // Phát nhạc nền
    async playBackground() {
        const audio = await this.createAudio('nenloto.mp3');
        audio.loop = true;
        audio.play().catch(e => console.error('[BaoAn] Lỗi phát nhạc nền:', e));
        return audio;
    },

    // Kiểm tra trạng thái cache
    async getCacheStatus() {
        const files = this.getAllFiles();
        const status = [];
        for (const f of files) {
            status.push({
                filename: f,
                cached: await this.isCached(f)
            });
        }
        return status;
    },

    // Kiểm tra đã preload xong chưa
    async isFullyCached() {
        const files = this.getAllFiles();
        for (const f of files) {
            if (!(await this.isCached(f))) return false;
        }
        return true;
    },

    // Đếm số file đã cache
    async getCachedCount() {
        let count = 0;
        const files = this.getAllFiles();
        for (const f of files) {
            if (await this.isCached(f)) count++;
        }
        return count;
    }
};

// ============================================
// MÀN HÌNH LOADING
// ============================================
function showLoadingScreen() {
    if (document.getElementById('baan-loading')) return;

    const div = document.createElement('div');
    div.id = 'baan-loading';
    div.innerHTML = `
        <div style="
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            color: white;
            font-family: Arial, sans-serif;
        ">
            <div style="font-size: 24px; margin-bottom: 20px; font-weight: bold;">🎵 Đang tải âm thanh...</div>
            <div style="width: 300px; height: 20px; background: #333; border-radius: 10px; overflow: hidden; border: 2px solid #ffd700;">
                <div id="baan-progress-bar" style="
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #28a745, #20c997);
                    transition: width 0.3s;
                "></div>
            </div>
            <div id="baan-progress-text" style="margin-top: 10px; font-size: 16px; font-weight: bold;">0%</div>
            <div id="baan-status-text" style="margin-top: 8px; font-size: 12px; color: #aaa;">Đang chuẩn bị...</div>
            <div id="baan-detail-text" style="margin-top: 5px; font-size: 11px; color: #888;"></div>
        </div>
    `;
    document.body.appendChild(div);
}

function updateLoadingScreen(percent, text, detail) {
    const bar = document.getElementById('baan-progress-bar');
    const txt = document.getElementById('baan-progress-text');
    const status = document.getElementById('baan-status-text');
    const detailEl = document.getElementById('baan-detail-text');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = percent + '%';
    if (status && text) status.textContent = text;
    if (detailEl && detail) detailEl.textContent = detail;
}

function hideLoadingScreen() {
    const div = document.getElementById('baan-loading');
    if (div) {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s';
        setTimeout(() => div.remove(), 500);
    }
}

// ============================================
// KHỞI ĐỘNG PRELOAD
// ============================================
async function initBaoAn() {
    showLoadingScreen();

    try {
        await BAOAN.preloadAll({
            onProgress: (data) => {
                const detail = data.wasCached
                    ? `${data.filename} (đã có sẵn)`
                    : (data.success ? `${data.filename} (tải xong)` : `${data.filename} (lỗi!)`);
                updateLoadingScreen(
                    data.percent,
                    `Đang tải: ${data.completed}/${data.total} file`,
                    detail
                );
            },
            onComplete: (result) => {
                updateLoadingScreen(100, 'Hoàn tất!', `Cache: ${result.cached} | Tải mới: ${result.downloaded} | Lỗi: ${result.failed}`);
                setTimeout(hideLoadingScreen, 800);

                if (result.failed > 0) {
                    console.warn(`[BaoAn] Có ${result.failed} file không tải được`);
                }

                // Dispatch event để game biết đã sẵn sàng
                window.dispatchEvent(new CustomEvent('baoanReady', { detail: result }));
            }
        });
    } catch (e) {
        console.error('[BaoAn] Lỗi khởi động:', e);
        updateLoadingScreen(100, 'Lỗi! Sẽ dùng chế độ trực tiếp.', '');
        setTimeout(hideLoadingScreen, 1500);
        window.dispatchEvent(new CustomEvent('baoanReady', { detail: { error: e.message, mode: 'direct' } }));
    }
}

// Chạy khi DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBaoAn);
} else {
    initBaoAn();
}

// Export để dùng từ file khác
window.BAOAN = BAOAN;