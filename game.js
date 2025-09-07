let easyMode = false;
// Игровая консоль

let showGameConsole = false;
let gameConsoleLog = [];
let cKeyPressed = false;
let keyInputPressed = {};
let gameConsoleInput = '';
let pipeGap = 300;
let pipeInterval = 90;
let customRedMode = false;
let pipeColor = '#228B22';
let backgroundColor = '#87CEEB';
let gravity = 0.1;
let jump = -3;

function logToGameConsole(msg) {
    // Команда /small
    if (msg.trim() === '/small') {
        birdRadius = 12;
        gameConsoleLog.push('Small mode: bird is now smaller!');
        if (gameConsoleLog.length > 8) gameConsoleLog.shift();
        return;
    }
    // Команда /inverse
    if (msg.trim() === '/inverse') {
        gravity = -0.1;
        jump = 3;
        gameConsoleLog.push('Inverse mode: bird falls up, jump sends it down!');
        if (gameConsoleLog.length > 8) gameConsoleLog.shift();
        return;
    }
    // Команда /hardcore
    if (msg.trim() === '/hardcore') {
        pipeGap = 150;
        pipeInterval = 150;
        customRedMode = true;
        pipeColor = '#FF0000';
        backgroundColor = '#000000';
        gravity = 0.25;
        jump = -5;
        gameConsoleLog.push('Hardcore mode enabled: black background, red pipes, hard difficulty, high gravity and jump!');
        if (gameConsoleLog.length > 8) gameConsoleLog.shift();
        return;
    }
    // Команда /easy
    if (msg.trim() === '/easy') {
        easyMode = true;
        pipes = [];
        gameConsoleLog.push('Easy mode enabled: all obstacles removed!');
        if (gameConsoleLog.length > 8) gameConsoleLog.shift();
        return;
    }
    // Команда /normal
    if (msg.trim() === '/normal') {
    pipeGap = 300;
    pipeInterval = 90;
    easyMode = false;
    customRedMode = false;
    pipeColor = '#228B22';
    backgroundColor = '#87CEEB';
    gravity = 0.1;
    jump = -3;
    birdRadius = 20;
    gameConsoleLog.push('Normal mode enabled: pipes, gaps and bird size are back to default!');
    if (gameConsoleLog.length > 8) gameConsoleLog.shift();
    return;
    }
    // Команда /score
    if (msg.startsWith('/score ')) {
        const value = parseInt(msg.slice(7));
        if (!isNaN(value)) {
            score = value;
            gameConsoleLog.push('Score set to ' + value);
        } else {
            gameConsoleLog.push('Invalid score value');
        }
    // Команда /hard
    } else if (msg.trim() === '/hard') {
        pipeGap = 125;
        pipeInterval = 180;
        gameConsoleLog.push('Hard mode enabled: pipes are further apart and gaps are smaller!');
    } else {
        gameConsoleLog.push(msg);
    }
    if (gameConsoleLog.length > 8) gameConsoleLog.shift();
}
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


// Game variables
let birdY = canvas.height / 2;
let birdVelocity = 0;
// gravity и jump объявлены выше как let для смены режима
const birdX = 60;
let birdRadius = 20;
let pipes = [];
let frame = 0;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') ? parseInt(localStorage.getItem('flappyHighScore')) : 0;
let gameOver = false;
let birdFragments = [];

function resetGame() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
}

function drawBird() {
    // Тело
    ctx.beginPath();
    ctx.arc(birdX, birdY, birdRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Крыло (горизонтально и ниже)
    ctx.beginPath();
    ctx.ellipse(birdX, birdY + birdRadius / 2, birdRadius / 2, birdRadius / 4, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFE066';
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.stroke();


    // Глаз
    ctx.beginPath();
    ctx.arc(birdX + birdRadius / 2.2, birdY - birdRadius / 3, birdRadius / 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(birdX + birdRadius / 2.2, birdY - birdRadius / 3, birdRadius / 9, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();

    // Клюв
    ctx.beginPath();
    ctx.moveTo(birdX + birdRadius, birdY);
    ctx.lineTo(birdX + birdRadius + 10, birdY - 5);
    ctx.lineTo(birdX + birdRadius + 10, birdY + 5);
    ctx.closePath();
    ctx.fillStyle = '#FF8C00';
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.stroke();
}

function drawPipes() {
    ctx.fillStyle = pipeColor;
    pipes.forEach(pipe => {
        // Основные вертикальные части труб
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);

        // Верхняя горизонтальная "шляпка"
        ctx.fillRect(pipe.x - 15, pipe.top - 20, pipe.width + 30, 20);
        // Нижняя горизонтальная "шляпка"
        ctx.fillRect(pipe.x - 15, pipe.bottom, pipe.width + 30, 20);
    });
}

function updatePipes() {
    if (easyMode) return;
    if (frame % pipeInterval === 0) {
        const gap = pipeGap;
        const top = Math.random() * (canvas.height - gap - 80) + 40;
        pipes.push({
            x: canvas.width,
            width: 50,
            top: top,
            bottom: top + gap,
            passed: false
        });
    }
    pipes.forEach(pipe => {
        pipe.x -= 2;
    });
    // Remove pipes out of screen
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

function checkCollision() {
    if (birdY + birdRadius > canvas.height || birdY - birdRadius < 0) {
        return true;
    }
    for (let pipe of pipes) {
        if (
            birdX + birdRadius > pipe.x &&
            birdX - birdRadius < pipe.x + pipe.width &&
            (birdY - birdRadius < pipe.top || birdY + birdRadius > pipe.bottom)
        ) {
            return true;
        }
    }
    return false;
}

function updateScore() {
    pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + pipe.width < birdX) {
            score++;
            pipe.passed = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
            }
        }
    });
}

function drawScore() {
    ctx.font = '32px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Score: ' + score, 10, 50);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText('High Score: ' + highScore, 10, 80);
    if (score >= 100000) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ff0000ff';
        ctx.fillText('You are the ultimate champion!', 10, 110);
    } else if (score >= 10000) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ff9900ff';
        ctx.fillText('You are the Legend!', 10, 110);
    } else if (score >= 1000) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ffa51eff';
        ctx.fillText('You are Master!', 10, 110);
    } else if (score >= 100) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ffa459ff';
        ctx.fillText('This is super!', 10, 110);
    } else if (score >= 50) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ffa0a0ff';
        ctx.fillText('Very nice!', 10, 110);
    } else if (score >= 10) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ffd4d4ff';
        ctx.fillText('Easy-Peasy!', 10, 110);
    }
}

function gameLoop() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!showGameConsole) {
    if (!gameOver) {
            birdVelocity += gravity;
            birdY += birdVelocity;
            updatePipes();
            updateScore();
            if (checkCollision()) {
                gameOver = true;
                // Генерируем осколки
                birdFragments = [];
                for (let i = 0; i < 18; i++) {
                    birdFragments.push({
                        x: birdX,
                        y: birdY,
                        vx: Math.cos((i / 18) * 2 * Math.PI) * (2 + Math.random() * 2),
                        vy: Math.sin((i / 18) * 2 * Math.PI) * (2 + Math.random() * 2),
                        color: i % 3 === 0 ? '#FFD700' : (i % 3 === 1 ? '#FFE066' : '#FF8C00'),
                        radius: birdRadius / 5 + Math.random() * 2
                    });
                }
            }
            frame++;
            drawPipes();
            drawBird();
            drawScore();
        } else {
            // Только чистый фон и надписи при поражении
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Рисуем осколки
            birdFragments.forEach(frag => {
                frag.x += frag.vx;
                frag.y += frag.vy;
                frag.vy += 0.15; // гравитация
                ctx.beginPath();
                ctx.arc(frag.x, frag.y, frag.radius, 0, 2 * Math.PI);
                ctx.fillStyle = frag.color;
                ctx.globalAlpha = 0.85;
                ctx.fill();
                ctx.globalAlpha = 1;
            });
                ctx.font = '48px Arial';
                ctx.fillStyle = '#FF3333';
                ctx.fillText('Game Over', 70, canvas.height / 2 - 24);
                ctx.font = '32px Arial';
                ctx.fillStyle = '#333';
                ctx.fillText('Score: ' + score, 130, canvas.height / 2 + 24);
                ctx.font = '28px Arial';
                ctx.fillStyle = '#555';
                ctx.fillText('High Score: ' + highScore, 110, canvas.height / 2 + 56);
                ctx.font = '24px Arial';
                ctx.fillStyle = '#333';
                ctx.fillText('Press Space to Restart', 80, canvas.height / 2 + 90);

                // Кнопка сброса high score внизу
                const btnW = 220;
                const btnH = 40;
                const btnX = (canvas.width - btnW) / 2;
                const btnY = canvas.height - btnH - 30;
                ctx.fillStyle = '#FF8800';
                ctx.fillRect(btnX, btnY, btnW, btnH);
                ctx.font = '22px Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Reset High Score', btnX + btnW / 2, btnY + btnH / 2);
                ctx.textAlign = 'start';
                ctx.textBaseline = 'alphabetic';
            }
    } else {
        // Консоль открыта: рисуем замороженную игру всегда
        drawPipes();
        drawBird();
        drawScore();
        if (gameOver) {
            ctx.font = '48px Arial';
            ctx.fillStyle = '#FF3333';
            ctx.fillText('Game Over', 70, canvas.height / 2 - 24);
            ctx.font = '32px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('Score: ' + score, 130, canvas.height / 2 + 24);
            ctx.font = '28px Arial';
            ctx.fillStyle = '#555';
            ctx.fillText('High Score: ' + highScore, 110, canvas.height / 2 + 56);
            ctx.font = '24px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('Press Space to Restart', 80, canvas.height / 2 + 90);

            // Кнопка сброса high score внизу
            const btnW = 220;
            const btnH = 40;
            const btnX = (canvas.width - btnW) / 2;
            const btnY = canvas.height - btnH - 30;
            ctx.fillStyle = '#FF8800';
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.font = '22px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Reset High Score', btnX + btnW / 2, btnY + btnH / 2);
            ctx.textAlign = 'start';
            ctx.textBaseline = 'alphabetic';
        }
    }
    // Рисуем игровую консоль, если включена
    if (showGameConsole) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#222';
        ctx.fillRect(10, canvas.height - 160, canvas.width - 20, 150);
        ctx.globalAlpha = 1;
        ctx.font = '16px monospace';
        ctx.fillStyle = '#0f0';
        for (let i = 0; i < gameConsoleLog.length; i++) {
            ctx.fillText(gameConsoleLog[i], 20, canvas.height - 140 + i * 18);
        }
        // Строка ввода
        ctx.font = '16px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('> ' + gameConsoleInput, 20, canvas.height - 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Game Console (нажмите T для закрытия)', canvas.width / 2, canvas.height - 135);
        ctx.textAlign = 'start';
        ctx.restore();
    }
    requestAnimationFrame(gameLoop);
// Переключение игровой консоли по клавише 'C'

document.addEventListener('keydown', function(e) {
    // Открытие/закрытие консоли по T
    if (e.code === 'KeyT' && !cKeyPressed) {
        showGameConsole = !showGameConsole;
        cKeyPressed = true;
        return;
    }
    // Ввод текста в консоль
    if (showGameConsole) {
        if (e.code === 'Enter') {
            if (gameConsoleInput.trim() !== '') {
                logToGameConsole(gameConsoleInput);
                gameConsoleInput = '';
            }
            e.preventDefault();
            return;
        }
        if (e.code === 'Backspace') {
            gameConsoleInput = gameConsoleInput.slice(0, -1);
            e.preventDefault();
            return;
        }
        // Устанавливаем флаг нажатия для символа
        if (e.key.length === 1 && !keyInputPressed[e.key]) {
            keyInputPressed[e.key] = true;
        }
    }
});

document.addEventListener('keyup', function(e) {
    if (e.code === 'KeyT') {
        cKeyPressed = false;
    }
    // Ввод символов в консоль по keyup
    if (showGameConsole && e.key.length === 1 && keyInputPressed[e.key]) {
        gameConsoleInput += e.key;
        keyInputPressed[e.key] = false;
        e.preventDefault();
    }
});
// Обработка клика по canvas для сброса high score (добавляется один раз вне gameLoop)
canvas.addEventListener('click', function(e) {
    if (!gameOver) return;
    const btnW = 220;
    const btnH = 40;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = canvas.height - btnH - 30;
    // Получаем координаты клика относительно canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Проверяем, попал ли клик в область кнопки
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        localStorage.setItem('flappyHighScore', 0);
        highScore = 0;
    }
});
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!gameOver) {
            birdVelocity = jump;
        } else {
            resetGame();
        }
    }
});

gameLoop();
