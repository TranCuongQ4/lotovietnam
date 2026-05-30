// ============================================
// TRÒ CHƠI LÔ TÔ - SCRIPT CHÍNH
// ============================================

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('cut', (e) => e.preventDefault());

let calledNumbers = [];
let availableNumbers = [];
let isPaused = false;
let isCalling = false;
let callTimeout = null;
let audioRetryTimeout = null;

const currentNumberEl = document.getElementById('current-number');
const calledNumbersListEl = document.getElementById('called-numbers-list');
const btnCall = document.getElementById('btn-call');
const btnPause = document.getElementById('btn-pause');
const btnCheck = document.getElementById('btn-check');
const checkModal = document.getElementById('check-modal');
const resultModal = document.getElementById('result-modal');
const btnDoCheck = document.getElementById('btn-do-check');
const btnCloseCheck = document.getElementById('btn-close-check');
const btnOk = document.getElementById('btn-ok');
const resultText = document.getElementById('result-text');

function init() {
    resetGame();
    setupEventListeners();
}

// Hàm reset game - được gọi từ huongdan.js
window.resetGame = function() {
    calledNumbers = [];
    availableNumbers = Array.from({length: 90}, (_, i) => i + 1);
    updateCalledNumbersDisplay();
    currentNumberEl.textContent = '---';
    isPaused = false;
    isCalling = false;
    btnPause.classList.remove('paused');
    btnPause.textContent = 'Dừng Kêu';
    btnCall.textContent = 'Kêu Số';
    clearAllTimeouts();
};

function clearAllTimeouts() {
    if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
    }
    if (audioRetryTimeout) {
        clearTimeout(audioRetryTimeout);
        audioRetryTimeout = null;
    }
}

function updateCalledNumbersDisplay() {
    calledNumbersListEl.innerHTML = '';
    calledNumbers.forEach(num => {
        const span = document.createElement('span');
        span.className = 'called-number';
        span.textContent = num;
        calledNumbersListEl.appendChild(span);
    });
    calledNumbersListEl.scrollTop = calledNumbersListEl.scrollHeight;
}

function playSound(number) {
    const audio = new Audio(`so/${number}.mp3`);
    audio.play().catch(e => console.log('Không thể phát âm thanh:', e));
    
    audioRetryTimeout = setTimeout(() => {
        const audio2 = new Audio(`so/${number}.mp3`);
        audio2.play().catch(e => console.log('Không thể phát âm thanh lần 2:', e));
    }, 3000);
}

function callNumber() {
    if (isPaused || availableNumbers.length === 0) {
        if (availableNumbers.length === 0) {
            isCalling = false;
            btnCall.textContent = 'Hết Số Rồi';
        }
        return;
    }

    isCalling = true;
    
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers[randomIndex];
    
    availableNumbers.splice(randomIndex, 1);
    calledNumbers.push(number);
    
    currentNumberEl.textContent = number;
    playSound(number);
    updateCalledNumbersDisplay();
    
    callTimeout = setTimeout(() => {
        currentNumberEl.textContent = '---';
        
        callTimeout = setTimeout(() => {
            if (!isPaused && availableNumbers.length > 0) {
                callNumber();
            } else {
                isCalling = false;
                if (availableNumbers.length === 0) {
                    btnCall.textContent = 'Hết Số Rồi';
                }
            }
        }, 1500);
    }, 6000);
}

function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        btnPause.classList.add('paused');
        btnPause.textContent = 'Tiếp Tục';
        clearAllTimeouts();
    } else {
        btnPause.classList.remove('paused');
        btnPause.textContent = 'Dừng Kêu';
        if (isCalling && availableNumbers.length > 0) {
            callNumber();
        }
    }
}

function openCheckModal() {
    checkModal.classList.add('active');
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`num${i}`).value = '';
    }
    document.getElementById('num1').focus();
}

function closeCheckModal() {
    checkModal.classList.remove('active');
}

function doCheck() {
    const inputs = [];
    for (let i = 1; i <= 5; i++) {
        const val = parseInt(document.getElementById(`num${i}`).value);
        if (isNaN(val) || val < 1 || val > 90) {
            showResult('Vui Lòng Nhập\nĐủ 5 Số Hợp Lệ');
            return;
        }
        inputs.push(val);
    }
    
    const allMatch = inputs.every(num => calledNumbers.includes(num));
    
    if (allMatch) {
        showResult('Hợp Lệ');
    } else {
        showResult('Không Hợp Lệ');
    }
}

function showResult(text) {
    resultText.textContent = text;
    resultModal.classList.add('active');
    closeCheckModal();
}

function closeResultModal() {
    resultModal.classList.remove('active');
}

function setupEventListeners() {
    btnCall.addEventListener('click', () => {
        if (!isCalling && availableNumbers.length > 0 && !isPaused) {
            callNumber();
        } else if (isPaused) {
            return;
        }
    });
    
    btnPause.addEventListener('click', togglePause);
    btnCheck.addEventListener('click', openCheckModal);
    btnDoCheck.addEventListener('click', doCheck);
    btnCloseCheck.addEventListener('click', closeCheckModal);
    btnOk.addEventListener('click', closeResultModal);
    
    checkModal.addEventListener('click', (e) => {
        if (e.target === checkModal) closeCheckModal();
    });
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) closeResultModal();
    });
}

init();