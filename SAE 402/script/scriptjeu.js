let audioContext;
let isAudioSetup = false;
const MAX_VOLUME = 0.1;

function setupAudio() {
    if (isAudioSetup) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        isAudioSetup = true;
    } catch (e) {
        console.error("Erreur audio:", e);
    }
}

function playHoleSound(isTarget) {
    if (!isAudioSetup || audioContext.state !== 'running') return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.value = isTarget ? 500 : 250;
        gain.gain.value = 0.2;
        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1500;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        osc.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error("Erreur son trou:", e);
    }
}

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const targetHole = document.getElementById('targetHole');
const trapHoles = [
    document.getElementById('trapHole1'),
    document.getElementById('trapHole2'),
    document.getElementById('trapHole3')
];
const uiScore = document.getElementById('score');
const uiLives = document.getElementById('lives');
const progressBar = document.getElementById('progressBar');
const startButton = document.getElementById('startButton');
const permissionButton = document.getElementById('permissionButton');
const orientationStatus = document.getElementById('orientationStatus');
const cheatNotification = document.getElementById('cheatNotification');
const hintButton = document.getElementById('hintButton');
const hintText = document.getElementById('hintText');
const countdown = document.getElementById('countdown');
const pauseButton = document.getElementById('pauseButton');
const trail = [];
const maxTrailLength = 65;
let gameOverSound = new Audio('game-over.mp3');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverText = document.getElementById('gameOverText');
const finalScoreValue = document.getElementById('finalScoreValue');
const restartButton = document.getElementById('restartButton');

// Dimensions
let width, height;
const ballRadius = 20;
const holeRadius = 22;

// Physics
const friction = 0.98;
const gravity = 0.15;
const maxSpeed = 12;
const tiltSensitivity = 0.8;

// Game State
let ball = { x: 0, y: 0, vx: 0, vy: 0 };
let gameActive = false;
let usingOrientation = false;
let orientationPermissionGranted = false;
let score = 0;
let lives = 3;
let successes = 0;
const successesNeeded = 3;
let holePositions = [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let calibration = { x: 0, y: 0 };
let isCalibrated = false;

// Cheat code
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'];
let konamiIndex = 0;
let cheatActivated = false;

// Mobile cheat
let tapSequence = [];
const cheatTapPattern = [2, 2];
let lastTapTime = 0;
let hintShown = false;

function showCheatNotification() {
    cheatNotification.style.opacity = 1;
    setTimeout(() => {
        cheatNotification.style.opacity = 0;
    }, 2000);
}

function showHint() {
    hintShown = !hintShown;
    hintText.style.display = hintShown ? 'block' : 'none';
    hintButton.textContent = hintShown ? 'Hide Hint' : 'Hint';

    if (hintShown) {
        hintText.style.animation = 'none';
        void hintText.offsetWidth;
        hintText.style.animation = 'pulse 0.5s 2';
    }
}

function activateCheat() {
    if (cheatActivated) return;
    cheatActivated = true;
    showCheatNotification();

    const cheatBall = document.createElement('div');
    cheatBall.style.position = 'absolute';
    cheatBall.style.width = ballRadius * 2 + 'px';
    cheatBall.style.height = ballRadius * 2 + 'px';
    cheatBall.style.borderRadius = '50%';
    cheatBall.style.background = 'radial-gradient(circle at 30% 30%, gold, orange)';
    cheatBall.style.left = (ball.x - ballRadius) + 'px';
    cheatBall.style.top = (ball.y - ballRadius) + 'px';
    cheatBall.style.zIndex = '100';
    cheatBall.style.transition = 'all 1s ease-out, transform 0.5s ease-out';
    cheatBall.style.boxShadow = '0 0 20px gold';
    document.body.appendChild(cheatBall);

    const targetHolePos = holePositions.find(hole => hole.isTarget);
    const holeElement = document.getElementById('targetHole');
    holeElement.classList.add('cheat-active');

    setTimeout(() => {
        cheatBall.style.left = (targetHolePos.x - ballRadius) + 'px';
        cheatBall.style.top = (targetHolePos.y - ballRadius) + 'px';
        cheatBall.style.transform = 'scale(0.5)';

        setTimeout(() => {
            cheatBall.style.opacity = '0';
            holeElement.style.transform = 'translate(-50%, -50%) scale(1.5)';

            setTimeout(() => {
                document.body.removeChild(cheatBall);
                holeElement.style.transform = 'translate(-50%, -50%) scale(1)';
                holeElement.classList.remove('cheat-active');
                successes = successesNeeded;
                updateUI();
                gameOver(true);
            }, 500);
        }, 800);
    }, 100);
}

function checkKonamiCode(key) {
    if (cheatActivated) return;

    if (key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateCheat();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
}



function handleTap() {
    const now = Date.now();
    if (now - lastTapTime > 1000) {
        tapSequence = [];
    }

    tapSequence.push(now);
    lastTapTime = now;

    setTimeout(() => {
        if (tapSequence.length === cheatTapPattern.reduce((a, b) => a + b, 0)) {
            let patternIndex = 0;
            let count = 0;
            let valid = true;

            for (let i = 1; i < tapSequence.length; i++) {
                const delta = tapSequence[i] - tapSequence[i - 1];
                if (delta < 300) {
                    count++;
                } else {
                    if (count + 1 !== cheatTapPattern[patternIndex]) {
                        valid = false;
                        break;
                    }
                    patternIndex++;
                    count = 0;
                }
            }

            if (valid && count + 1 === cheatTapPattern[patternIndex] && patternIndex === cheatTapPattern.length - 1) {
                activateCheat();
            }
        }
    }, 500);
}

function setupRestartButton() {
    restartButton.addEventListener('click', () => {
        gameOverScreen.classList.remove('active');
        resetGame();

        // Réaffiche le compte à rebours et le réinitialise
        countdown.style.display = 'flex';
        countdown.style.opacity = '1';
        countdown.style.animation = 'none';
        startCountdown();
    });
}


function init() {
    resizeCanvas();
    checkOrientationSupport();
    setupRestartButton(); // Ajoutez cette ligne

    document.addEventListener('click', function initAudio() {
        setupAudio();
        startButton.addEventListener('click', activateAudio);
        canvas.addEventListener('touchstart', activateAudio, { once: true });
        document.removeEventListener('click', initAudio);
    }, { once: true });

    document.addEventListener('keydown', (e) => {
        checkKonamiCode(e.key);
    });

    hintButton.addEventListener('click', showHint);
    canvas.addEventListener('touchstart', handleTap);

    pauseButton.addEventListener('click', () => {
        if (gameActive) {
            gameActive = false;
            pauseButton.textContent = 'RESUME';
        } else {
            gameActive = true;
            pauseButton.textContent = 'PAUSE';
            startCountdown();
        }
    });

    requestAnimationFrame(gameLoop);
}

function showCalibrationMessage(msg) {
    const calibrationMsg = document.createElement('div');
    calibrationMsg.textContent = msg;
    calibrationMsg.style.position = 'fixed';
    calibrationMsg.style.bottom = '20px';
    calibrationMsg.style.left = '0';
    calibrationMsg.style.right = '0';
    calibrationMsg.style.textAlign = 'center';
    calibrationMsg.style.color = '#4CAF50';
    calibrationMsg.style.fontSize = '16px';
    calibrationMsg.style.zIndex = '1000';
    document.body.appendChild(calibrationMsg);

    setTimeout(() => {
        document.body.removeChild(calibrationMsg);
    }, 2000);
}

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Recentrage absolu du bouton
    const startBtn = document.getElementById('startButton');
    if (startBtn) {
        startBtn.style.left = '50%';
        startBtn.style.top = '50%';
        startBtn.style.transform = 'translate(-50%, -50%)';
        startBtn.style.margin = '0';
    }

    if (gameActive) {
        placeHoles();
        ball.x = Math.min(ball.x, width - ballRadius);
        ball.y = Math.min(ball.y, height - ballRadius);
    }
}

function checkOrientationSupport() {
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ - besoin de permission
            orientationStatus.textContent = "";
            orientationStatus.style.opacity = 1;
        } else {
            // Android et autres navigateurs
            usingOrientation = true;
            orientationStatus.textContent = "";
            orientationStatus.style.opacity = 1;
        }
    } else {
        orientationStatus.textContent = "Your device does not support tilt";
        orientationStatus.style.opacity = 1;
    }
}

function requestOrientationPermission() {
    DeviceOrientationEvent.requestPermission()
        .then(response => {
            if (response === 'granted') {
                usingOrientation = true;
                orientationPermissionGranted = true;
                orientationStatus.textContent = "Tilt control enabled!";
                orientationStatus.style.opacity = 1;

                window.addEventListener('deviceorientation', handleOrientation);
            } else {
                orientationStatus.textContent = "Permission denied - Use touch";
                orientationStatus.style.opacity = 1;
            }
        })
        .catch(error => {
            console.error("Permission error:", error);
            orientationStatus.textContent = "Activation error - Use touch";
            orientationStatus.style.opacity = 1;
        });
}

function startGame() {
    startButton.style.display = 'none';
    orientationStatus.style.display = 'none';
    document.getElementById('ui').style.opacity = 1;
    if (isAudioSetup && audioContext.state !== 'running') {
        activateAudio();
    }

    // Vérifiez et demandez l'autorisation d'inclinaison si nécessaire
    if (isMobile && typeof DeviceOrientationEvent.requestPermission === 'function') {
        requestOrientationPermission();
    } else if (isMobile) {
        usingOrientation = true;
        window.addEventListener('deviceorientation', handleOrientation);
    }

    startCountdown();
}

function activateAudio() {
    if (!isAudioSetup || audioContext.state === 'running') return;

    audioContext.resume().then(() => {
        console.log("Audio activé");
    });
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    countdownElement.style.opacity = '1';
    countdownElement.style.display = 'flex';
    countdownElement.style.animation = 'none';
    void countdownElement.offsetWidth; // Trigger reflow
    countdownElement.style.animation = '';

    let count = 3;
    countdownElement.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownElement.textContent = count;
        } else {
            countdownElement.textContent = "GO!";
            setTimeout(() => {
                countdownElement.style.animation = "fadeOut 0.5s forwards";
                setTimeout(() => {
                    countdownElement.style.display = 'none';
                    initGameAfterCountdown();
                }, 500);
            }, 500);
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function initGameAfterCountdown() {
    gameActive = true;
    score = 0;
    lives = 3;
    successes = 0;
    updateUI();
    placeHoles();
    resetBall();

    if (usingOrientation && orientationPermissionGranted) {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    if (!isMobile) {
        canvas.addEventListener('mousemove', handleMouseMove);
    }
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
}

function placeHoles() {
    const targetPositions = [
        { x: width * 0.5, y: height * 0.3 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.7, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.7 },
        { x: width * 0.2, y: height * 0.2 },
        { x: width * 0.8, y: height * 0.2 },
        { x: width * 0.2, y: height * 0.8 },
        { x: width * 0.8, y: height * 0.8 }
    ];

    const randomTargetPos = targetPositions[Math.floor(Math.random() * targetPositions.length)];

    targetHole.style.left = randomTargetPos.x + 'px';
    targetHole.style.top = randomTargetPos.y + 'px';
    holePositions = [{ x: randomTargetPos.x, y: randomTargetPos.y, isTarget: true }];

    const trapPositions = [
        { x: width * 0.3, y: height * 0.3 },
        { x: width * 0.7, y: height * 0.3 },
        { x: width * 0.3, y: height * 0.7 },
        { x: width * 0.7, y: height * 0.7 },
        { x: width * 0.5, y: height * 0.2 },
        { x: width * 0.2, y: height * 0.5 },
        { x: width * 0.8, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.8 }
    ];

    const shuffledTraps = [...trapPositions].sort(() => 0.5 - Math.random()).slice(0, 3);

    const finalTrapPositions = shuffledTraps.filter(trap => {
        const dx = trap.x - randomTargetPos.x;
        const dy = trap.y - randomTargetPos.y;
        return Math.sqrt(dx * dx + dy * dy) > 150;
    });

    while (finalTrapPositions.length < 3) {
        const randomPos = {
            x: Math.max(100, Math.random() * (width - 100)),
            y: Math.max(100, Math.random() * (height - 100))
        };
        const dx = randomPos.x - randomTargetPos.x;
        const dy = randomPos.y - randomTargetPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 150) {
            finalTrapPositions.push(randomPos);
        }
    }

    for (let i = 0; i < 3; i++) {
        if (finalTrapPositions[i]) {
            trapHoles[i].style.left = finalTrapPositions[i].x + 'px';
            trapHoles[i].style.top = finalTrapPositions[i].y + 'px';
            holePositions.push({
                x: finalTrapPositions[i].x,
                y: finalTrapPositions[i].y,
                isTarget: false
            });
        }
    }
}

function resetBall() {
    ball.x = ballRadius + Math.random() * (width - 2 * ballRadius);
    ball.y = ballRadius + Math.random() * (height - 2 * ballRadius);
    ball.vx = 0;
    ball.vy = 0;
}
function resetGame() {
    cheatActivated = false;
    gameActive = false; // On laisse à false, le compte à rebours activera le jeu
    score = 0;
    lives = 3;
    successes = 0;
    updateUI();
    placeHoles();
    resetBall();

    // Réinitialisation visuelle du compte à rebours
    countdown.style.opacity = '0';
    countdown.style.display = 'flex';
}

function handleOrientation(e) {
    if (!gameActive || !usingOrientation) return;

    // Valeurs ajustées pour une meilleure sensibilité
    const maxTilt = 15; // Réduit de 30 à 15 degrés pour plus de précision
    const deadZone = 5; // Zone morte où l'inclinaison n'a pas d'effet
    const sensitivity = 0.5; // Sensibilité globale réduite

    // Auto-calibration au premier usage
    if (!isCalibrated) {
        calibration.x = e.gamma || 0;
        calibration.y = (e.beta - 90) || 0;
        isCalibrated = true;
        showCalibrationMessage("Calibration complete!");
    }

    // Applique la calibration
    const tiltX = (e.gamma - calibration.x) || 0;
    const tiltY = ((e.beta - 90) - calibration.y) || 0;

    const adjustedX = Math.min(Math.max(tiltX, -maxTilt), maxTilt);
    const adjustedY = Math.min(Math.max(tiltY, -maxTilt), maxTilt);

    // Applique la zone morte
    const applyDeadZone = (value) => {
        if (Math.abs(value) < deadZone) return 0;
        return value > 0 ? value - deadZone : value + deadZone;
    };

    const adjustedTiltX = applyDeadZone(adjustedX) / (maxTilt - deadZone);
    const adjustedTiltY = applyDeadZone(adjustedY) / (maxTilt - deadZone);

    // Applique la gravité plus progressivement
    ball.vx += adjustedTiltX * gravity * sensitivity;
    ball.vy += adjustedTiltY * gravity * sensitivity;

    // Limite la vitesse maximale
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
    }
}

function handleMouseMove(e) {
    if (!gameActive) return;

    const tiltX = (e.clientX - width / 2) / (width / 2);
    const tiltY = (e.clientY - height / 2) / (height / 2);

    ball.vx += tiltX * gravity * 0.6;
    ball.vy += tiltY * gravity * 0.6;
}

function handleTouchMove(e) {
    if (!gameActive) return;
    e.preventDefault();

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const tiltX = (touchX - width / 2) / (width / 2);
    const tiltY = (touchY - height / 2) / (height / 2);

    ball.vx += tiltX * gravity * 0.5;
    ball.vy += tiltY * gravity * 0.5;
}

function moveTrapHoles() {
    if (!gameActive) return;

    const trapSpeed = 2;
    const trapRadius = 70;
    for (let i = 0; i < trapHoles.length; i++) {
        const trap = trapHoles[i];
        const angle = (Date.now() / 1000) * trapSpeed + i * (Math.PI / 2);
        const dx = Math.cos(angle) * trapRadius;
        const dy = Math.sin(angle) * trapRadius;

        const newX = holePositions[i + 1].x + dx;
        const newY = holePositions[i + 1].y + dy;

        trap.style.left = newX + 'px';
        trap.style.top = newY + 'px';
    }
}

function update() {
    if (!gameActive) return;

    ball.vx *= friction;
    ball.vy *= friction;

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x < ballRadius) {
        ball.x = ballRadius;
        ball.vx = -ball.vx * 0.5;
    }
    if (ball.x > width - ballRadius) {
        ball.x = width - ballRadius;
        ball.vx = -ball.vx * 0.5;
    }
    if (ball.y < ballRadius) {
        ball.y = ballRadius;
        ball.vy = -ball.vy * 0.5;
    }
    if (ball.y > height - ballRadius) {
        ball.y = height - ballRadius;
        ball.vy = -ball.vy * 0.5;
    }

    checkHoleCollisions();
    moveTrapHoles();
}

function checkHoleCollisions() {
    for (const hole of holePositions) {
        let currentHoleX, currentHoleY;

        if (hole.isTarget) {
            currentHoleX = hole.x;
            currentHoleY = hole.y;
        } else {
            const trapIndex = holePositions.indexOf(hole) - 1;
            const trapElement = trapHoles[trapIndex];
            const rect = trapElement.getBoundingClientRect();
            currentHoleX = rect.left + rect.width / 2;
            currentHoleY = rect.top + rect.height / 2;
        }

        const dx = ball.x - currentHoleX;
        const dy = ball.y - currentHoleY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (ballRadius + holeRadius)) {
            if (hole.isTarget) {
                playHoleSound(true);
                score += 10;
                successes++;
                updateUI();

                if (successes >= successesNeeded) {
                    playVictorySound();
                    gameOver(true);
                } else {
                    placeHoles();
                    resetBall();
                }
            } else {
                lives--;
                updateUI();

                if (lives <= 0) {
                    gameOver(false);
                } else {
                    resetBall();
                }
            }
            break;
        }
    }
}

function gameOver(isWin) {
    gameActive = false;

    if (isWin) {
        playVictorySound();
        // La redirection est maintenant gérée dans playVictorySound()
    } else {
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.log("Son bloqué:", e));
        finalScoreValue.textContent = score;
        gameOverScreen.classList.add('active');
    }
}

function playVictorySound() {
    const victorySound = document.getElementById('victorySound');
    const manualBtn = document.getElementById('manualVictoryButton'); // Note: vérifiez l'orthographe exacte

    if (!victorySound) {
        console.error("Audio element not found");
        window.location.href = "win.html";
        return;
    }

    try {
        victorySound.currentTime = 0;
        const playPromise = victorySound.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Son joué avec succès - redirection après 1 seconde
                setTimeout(() => {
                    window.location.href = "win.html";
                }, 1000);
            }).catch(error => {
                console.log("Audio playback blocked, showing button");
                // Affiche le bouton si la lecture est bloquée
                if (manualBtn) {
                    manualBtn.style.display = 'block';
                    manualBtn.style.zIndex = '1000';
                } else {
                    console.error("Manual button not found");
                    window.location.href = "win.html";
                }
            });
        }
    } catch (e) {
        console.error("Audio error:", e);
        if (manualBtn) {
            manualBtn.style.display = 'block';
        } else {
            window.location.href = "win.html";
        }
    }
}

function updateUI() {
    uiScore.textContent = score;
    uiLives.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        uiLives.innerHTML += '<span class="heart">❤</span>';
    }

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${(successes / successesNeeded) * 100}%`;
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < trail.length; i++) {
        const alpha = i / trail.length;
        const radius = ballRadius * (0.5 + 0.5 * alpha);

        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.6})`;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFA500';
    ctx.fill();
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ball.x - ballRadius * 0.3, ball.y - ballRadius * 0.3, ballRadius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > maxTrailLength) {
        trail.shift();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', startGame);
window.addEventListener('resize', resizeCanvas);

init();