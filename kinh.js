/**
 * File: kinh.js
 * Tính năng: Kiểm tra thắng loto (đủ 5 số 1 hàng ngang)
 * Hiển thị bảng thông báo chớp nháy nền đỏ viền vàng chữ xanh, số nổi 3D nền đỏ chữ trắng
 * NÚT OK: Xóa sạch dấu chéo hiện tại để chơi lại (không reload trang)
 * NÚT HỦY: Bỏ chọn duy nhất số thứ 5 vừa bấm nhầm, giữ nguyên 4 số trước đó
 */

(function () {
    // --- 1. NHÚNG STYLE CSS VÀO TRANG ---
    const styleNode = document.createElement('style');
    styleNode.textContent = `
        /* Hiệu ứng chớp tắt nhanh cho viền vàng */
        @keyframes chopNhanh {
            0% { border-color: #ffd700; box-shadow: 0 0 10px #ffd700; }
            50% { border-color: #ff4500; box-shadow: 0 0 25px #ff4500; }
            100% { border-color: #ffd700; box-shadow: 0 0 10px #ffd700; }
        }

        /* Khung nền mờ của bảng thông báo */
        .win-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100000;
            font-family: 'Arial', sans-serif;
        }

        /* Hộp thông báo chính: Nền đỏ, viền vàng chớp nhanh */
        .win-box {
            background-color: #cc0000;
            border: 5px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            width: 330px;
            text-align: center;
            animation: chopNhanh 0.4s infinite;
            box-sizing: border-box;
        }

        /* Dòng chữ thông báo màu xanh (chọn màu xanh neon/cyan để nổi bật trên nền đỏ) */
        .win-title {
            color: #00ffff; 
            font-size: 18px;
            font-weight: bold;
            line-height: 1.5;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px #000000;
        }

        /* Vùng chứa các số thắng cuộc */
        .win-numbers-container {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 25px;
            flex-wrap: wrap;
        }

        /* Vòng tròn số nổi 3D nền đỏ chữ trắng */
        .win-ball {
            width: 45px;
            height: 45px;
            line-height: 45px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #ff4d4d, #990000);
            color: #ffffff;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 3px 5px 8px rgba(0, 0, 0, 0.5), 
                        inset -3px -3px 5px rgba(0,0,0,0.4), 
                        inset 3px 3px 5px rgba(255,255,255,0.4);
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }

        /* Vùng chứa 2 nút hành động */
        .win-buttons-group {
            display: flex;
            justify-content: space-around;
            gap: 15px;
        }

        /* Nút OK */
        .win-btn-ok {
            background: linear-gradient(to bottom, #ffd700, #ffaa00);
            color: #000000;
            border: 2px solid #ffffff;
            border-radius: 8px;
            padding: 10px 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: transform 0.1s;
            flex: 1;
        }

        /* Nút Hủy kế bên nút OK */
        .win-btn-cancel {
            background: linear-gradient(to bottom, #aaaaaa, #666666);
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 8px;
            padding: 10px 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: transform 0.1s;
            flex: 1;
        }

        .win-btn-ok:active, .win-btn-cancel:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(styleNode);

    // --- 2. TẠO CẤU TRÚC HTML CHO POPUP WIN (THÊM NÚT HỦY) ---
    const winOverlay = document.createElement('div');
    winOverlay.id = 'win-alert-popup';
    winOverlay.className = 'win-overlay';
    winOverlay.style.display = 'none';

    winOverlay.innerHTML = `
        <div class="win-box">
            <div class="win-title">Chúc Mừng Bạn Đủ 5 Số Chiến Thắng Rồi Nha Dò Số Đi</div>
            <div id="win-balls-area" class="win-numbers-container"></div>
            <div class="win-buttons-group">
                <button id="win-btn-submit" class="win-btn-ok">OK</button>
                <button id="win-btn-cancel" class="win-btn-cancel">Hủy</button>
            </div>
        </div>
    `;
    document.body.appendChild(winOverlay);

    const winBallsArea = document.getElementById('win-balls-area');
    const winBtnSubmit = document.getElementById('win-btn-submit');
    const winBtnCancel = document.getElementById('win-btn-cancel');

    // Biến lưu vết ô số cuối cùng vừa bấm (số thứ 5) làm hiện bảng
    let lastClickedCell = null;

    // --- 3. LẮP SỰ KIỆN THEO DÕI CLICK VÀO CÁC Ô SỐ ---
    const ticketContainer = document.getElementById('ticket-container');
    
    if (ticketContainer) {
        ticketContainer.addEventListener('click', function (e) {
            // Xác định xem phần tử vừa click có phải ô số hợp lệ không
            const targetCell = e.target.closest('.ticket-cell:not(.empty)');
            if (targetCell) {
                // Nếu ô đó sau khi click có class 'marked' tức là người dùng vừa chọn nó
                if (targetCell.classList.contains('marked')) {
                    lastClickedCell = targetCell;
                }
            }
            // Chờ 10ms để trạng thái toggle ổn định rồi chạy hàm kiểm tra trúng thưởng
            setTimeout(checkWinningRows, 10);
        });
    }

    // --- 4. HÀM KIỂM TRA ĐỦ 5 DẤU CHÉO TRÊN 1 HÀNG ---
    function checkWinningRows() {
        const rows = document.querySelectorAll('.ticket-row');
        
        rows.forEach(row => {
            const validCells = row.querySelectorAll('.ticket-cell:not(.empty)');
            const markedCells = row.querySelectorAll('.ticket-cell.marked');

            if (markedCells.length === 5 && validCells.length === 5) {
                let winningNumbers = [];
                markedCells.forEach(cell => {
                    winningNumbers.push(cell.getAttribute('data-number') || cell.textContent.trim());
                });

                showWinPopup(winningNumbers);
            }
        });
    }

    // --- 5. HÀM HIỂN THỊ POPUP ---
    function showWinPopup(numbers) {
        winBallsArea.innerHTML = '';

        numbers.forEach(num => {
            const ball = document.createElement('div');
            ball.className = 'win-ball';
            ball.textContent = num;
            winBallsArea.appendChild(ball);
        });

        winOverlay.style.display = 'flex';
    }

    // --- 6. SỰ KIỆN KHI NHẤN NÚT "OK" ---
    winBtnSubmit.addEventListener('click', function () {
        winOverlay.style.display = 'none';

        // Tìm tất cả các ô trên vé đang có dấu chéo và xóa sạch để chơi ván mới
        const allMarkedCells = document.querySelectorAll('.ticket-cell.marked');
        allMarkedCells.forEach(cell => {
            cell.classList.remove('marked');
        });
        
        lastClickedCell = null; // Reset bộ nhớ ô bấm nhầm
    });

    // --- 7. SỰ KIỆN KHI NHẤN NÚT "HỦY" (TÍNH NĂNG MỚI THEO YÊU CẦU) ---
    winBtnCancel.addEventListener('click', function () {
        winOverlay.style.display = 'none';

        // Nếu có lưu vết ô vừa chọn nhầm cuối cùng, gỡ class 'marked' của riêng ô đó ra
        if (lastClickedCell) {
            lastClickedCell.classList.remove('marked');
        }
        
        lastClickedCell = null; // Sử dụng xong thì reset bộ nhớ
    });
})();