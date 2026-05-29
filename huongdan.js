// ============================================
// HƯỚNG DẪN & CHƠI LẠI & NHẠC NỀN - TẤT CẢ TRONG FILE NÀY
// ============================================

(function() {
    // ===== TẠO STYLE =====
    const style = document.createElement('style');
    style.textContent = `
        /* ===== MODAL HƯỚNG DẪN ===== */
        #huongdan-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        #huongdan-modal.active {
            display: flex;
        }
        
        .huongdan-box {
            background: linear-gradient(135deg, #20c997, #17a2b8);
            border: 4px solid #ffd700;
            border-radius: 15px;
            padding: 25px;
            width: 320px;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            animation: huongdan-pop 0.3s ease-out;
        }
        
        @keyframes huongdan-pop {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .huongdan-title {
            color: #ffd700;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .huongdan-content {
            color: #ffffff;
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 20px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            text-align: left;
        }
        
        .huongdan-author {
            color: #dc3545;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
        }
        
        .btn-dahieu {
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #8b0000;
            border: none;
            padding: 12px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
        }
        
        .btn-dahieu:active {
            transform: scale(0.95);
        }
        
        /* ===== MODAL CHƠI LẠI ===== */
        #choilai-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        #choilai-modal.active {
            display: flex;
        }
        
        .choilai-box {
            background: linear-gradient(135deg, #c41e3a, #8b0000);
            border: 4px solid #ffd700;
            border-radius: 15px;
            padding: 30px;
            width: 300px;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            animation: choilai-pop 0.3s ease-out;
        }
        
        @keyframes choilai-pop {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .choilai-text {
            color: #ffffff;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 25px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .choilai-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn-choilai-ok {
            background: linear-gradient(135deg, #28a745, #1e7e34);
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
        }
        
        .btn-choilai-ok:active {
            transform: scale(0.95);
        }
        
        .btn-choilai-khong {
            background: linear-gradient(135deg, #6c757d, #545b62);
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
        }
        
        .btn-choilai-khong:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);

    // ===== TẠO MODAL HƯỚNG DẪN =====
    const huongdanModal = document.createElement('div');
    huongdanModal.id = 'huongdan-modal';
    huongdanModal.innerHTML = `
        <div class="huongdan-box">
            <div class="huongdan-title">Hướng Dẫn Lô Tô</div>
            <div class="huongdan-content">
                * Nhấn "Kêu Số" để gọi các con số.<br>
                * Nhấn "Dừng Kêu" vì lí do gì đó của bạn, sau đó nhấn "Tiếp Tục" sẽ kêu số tiếp.<br>
                * Nhấn "Dò Số" để xác nhận người đó có thắng hay không (nhập 5 số vào xác nhận).<<br>
                * Nhấn "Giấy Dò" dành cho người chơi để dò số, nhấn vào số sẽ có dấu chéo, nhấn nữa bỏ chọn.
            </div>
            <div class="huongdan-author">
                Thiết Kế Trò Chơi Trần Cường - Zalo: 0907860662
            </div>
            <button class="btn-dahieu" id="btn-dahieu">Đã Hiểu</button>
        </div>
    `;
    document.body.appendChild(huongdanModal);

    // ===== TẠO MODAL CHƠI LẠI =====
    const choilaiModal = document.createElement('div');
    choilaiModal.id = 'choilai-modal';
    choilaiModal.innerHTML = `
        <div class="choilai-box">
            <div class="choilai-text">Bạn Muốn Chơi Lại Lô Tô ?</div>
            <div class="choilai-buttons">
                <button class="btn-choilai-ok" id="btn-choilai-ok">Ok</button>
                <button class="btn-choilai-khong" id="btn-choilai-khong">Không</button>
            </div>
        </div>
    `;
    document.body.appendChild(choilaiModal);

    // ===== NHẠC NỀN =====
    const bgMusic = new Audio('so/nenloto.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.2;
    let isMusicPlaying = false;

    function playBgMusic() {
        if (!isMusicPlaying) {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
            }).catch(e => {
                // Trình duyệt chặn autoplay, đợi user tương tác
                console.log('Kích Hoạt Game Lô Tô , Nhấn Vào Để Nhạc Nền Tương Tác:', e);
            });
        }
    }

    function stopBgMusic() {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        isMusicPlaying = false;
    }

    // Thử phát nhạc khi load (có thể bị chặn bởi trình duyệt)
    playBgMusic();

    // Phát nhạc khi user click bất kỳ đâu trên trang (nếu bị chặn autoplay)
    document.addEventListener('click', function firstInteraction() {
        playBgMusic();
        document.removeEventListener('click', firstInteraction);
    }, { once: true });

    // ===== LẤY ELEMENTS =====
    const btnHuongDan = document.getElementById('btn-huongdan');
    const btnChoiLai = document.getElementById('btn-choilai');
    const btnDaHieu = document.getElementById('btn-dahieu');
    const btnChoiLaiOk = document.getElementById('btn-choilai-ok');
    const btnChoiLaiKhong = document.getElementById('btn-choilai-khong');
    const btnCall = document.getElementById('btn-call');

    // ===== MỞ MODAL HƯỚNG DẪN =====
    btnHuongDan.addEventListener('click', function() {
        huongdanModal.classList.add('active');
    });

    // ===== ĐÓNG MODAL HƯỚNG DẪN =====
    btnDaHieu.addEventListener('click', function() {
        huongdanModal.classList.remove('active');
    });

    huongdanModal.addEventListener('click', function(e) {
        if (e.target === huongdanModal) {
            huongdanModal.classList.remove('active');
        }
    });

    // ===== MỞ MODAL CHƠI LẠI =====
    btnChoiLai.addEventListener('click', function() {
        choilaiModal.classList.add('active');
    });

    // ===== OK -> RESET GAME + PHÁT NHẠC =====
    btnChoiLaiOk.addEventListener('click', function() {
        choilaiModal.classList.remove('active');
        if (typeof window.resetGame === 'function') {
            window.resetGame();
        }
        // Phát nhạc nền trở lại khi reset game
        playBgMusic();
    });

    // ===== KHÔNG -> ĐÓNG MODAL =====
    btnChoiLaiKhong.addEventListener('click', function() {
        choilaiModal.classList.remove('active');
    });

    choilaiModal.addEventListener('click', function(e) {
        if (e.target === choilaiModal) {
            choilaiModal.classList.remove('active');
        }
    });

    // ===== KÊU SỐ -> GIẢM NHẠC NỀN =====
btnCall.addEventListener('click', function() {

    // Giảm nhỏ nhạc nền khi đọc số
    bgMusic.volume = 0.05;

    // Sau 4 giây tăng lại volume
    setTimeout(() => {
        bgMusic.volume = 0.2;
    }, 4000);

});

})();