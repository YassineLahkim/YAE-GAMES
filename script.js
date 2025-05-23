// script.js - Code JavaScript complet pour le jeu cycliste

/* ========== CONFIGURATION DES ÉLÉMENTS ========== */
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const timerDisplay = document.getElementById('timerDisplay');
const heartsDisplay = document.getElementById('heartsDisplay');
const pauseButton = document.getElementById('pauseButton');
const tiltButton = document.getElementById('tiltButton');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');
const levelSelection = document.getElementById('levelSelection');

/* ========== NOUVELLES CONSTANTES DE DIFFICULTÉ ========== */
const DIFFICULTY_SETTINGS = {
    easy: {
        obstacleSpeed: 10,       // Plus rapide qu'avant
        spawnRate: 900,        // Apparition des obstacles plus fréquente
        playerWidth: 0.07,      // Joueur un peu plus petit (plus difficile)
        timer: 15               // Moins de temps pour finir
    },
    medium: {
        obstacleSpeed: 13,      // Plus rapide
        spawnRate: 700,         // Obstacle très fréquent
        playerWidth: 0.06,      // Plus petit encore
        timer: 15
    },
    hard: {
        obstacleSpeed: 16,      // Très rapide
        spawnRate: 500,         // Obstacle toutes les 0.6 secondes
        playerWidth: 0.05,      // Très petit joueur
        timer: 12
    },
    blind: {
        obstacleSpeed: 8,       // Plus rapide que l’ancien blind
        spawnRate: 1000,        // Apparition assez fréquente
        playerWidth: 0.08,      // Taille raisonnable (car malvoyant)
        timer: 20               // Moins de temps que les 35 secondes d’avant
    }
};


const obstacleImages = [
    new Image(),
    new Image(),
    new Image(),
    new Image()
];

obstacleImages[0].src = 'img/img-obstacle1.png';
obstacleImages[1].src = 'img/img-obstacle2.png';
obstacleImages[2].src = 'img/img-obstacle3.png';
obstacleImages[3].src = 'img/img-obstacle4.png';

function createObstacle() {
    const randomImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];

    return {
        x: Math.random(),         // position X en % (0 à 1)
        y: 0,                     // position Y
        width: 0.1,               // largeur en % (ajuste selon ton image)
        height: 0.1,              // hauteur en % (ajuste aussi)
        image: randomImage        // l'image à dessiner
    };
}


/* ========== VARIABLES DU JEU ========== */
let canvasWidth, canvasHeight;

// Joueur
const player = {
    x: 0,
    y: 0,
    width: 40,
    height: 60,
    speed: 15,
    lives: 3,
    visible: false
};

let obstacles = [];
let timer = 20;
let gameOver = false;
let isPaused = false;
let gameStarted = false;
let tiltEnabled = false;
let gameLevel = "easy";
let obstacleSpeed = 2;
let spawnRate = 2000;

// Intervalles
let gameInterval;
let spawnInterval;
let timerInterval;



/* ========== INITIALISATION ========== */
function init() {
    setupCanvas();
    setupControls();
    startPreview();
    window.addEventListener('resize', setupCanvas);

    // Détection de la prise en charge de l'inclinaison
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        tiltButton.style.display = 'block';
    } else if (window.DeviceOrientationEvent) {
        tiltButton.style.display = 'block';
    } else {
        tiltButton.style.display = 'none';
    }
}

/* ========== CONFIGURATION CANVAS ========== */
function setupCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;
    gameCanvas.width = canvasWidth;
    gameCanvas.height = canvasHeight;

    player.width = canvasWidth * 0.1;
    player.height = canvasHeight * 0.15;
    player.x = canvasWidth / 2 - player.width / 2;
    player.y = canvasHeight * 0.7;
}

/* ========== CONTRÔLES ========== */
function setupControls() {
    // Contrôle tactile
    gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameCanvas.addEventListener('touchend', handleTouchEnd);

    // Empêcher le menu contextuel
    pauseButton.addEventListener('contextmenu', (e) => e.preventDefault());

    // Configurer l'inclinaison
    setupTiltControls();
}

function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchId = touch.identifier;
        touchStartX = touch.clientX;

        // Vérifier si on touche le bouton pause
        const rect = pauseButton.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            togglePause();
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!player.visible || isPaused || !touchId) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
            const touchX = touch.clientX;
            const diff = touchX - touchStartX;
            player.x = Math.max(0, Math.min(canvasWidth - player.width, player.x + diff));
            touchStartX = touchX;
            break;
        }
    }
}

function handleTouchEnd(e) {
    if (e.changedTouches[0].identifier === touchId) {
        touchId = null;
    }
}

/* ========== INCLINAISON ========== */
function setupTiltControls() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

function handleOrientation(e) {
    if (!tiltEnabled || isPaused || !player.visible) return;

    if (e.gamma !== null) {
        const tilt = e.gamma * 0.5;
        player.x = Math.max(0, Math.min(canvasWidth - player.width, player.x + tilt));
    }
}

async function toggleTiltControls() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            if (permissionState === 'granted') {
                tiltEnabled = true;
                tiltButton.textContent = 'Désactiver Inclinaison';
            } else {
                tiltEnabled = false;
                tiltButton.textContent = 'Activer Inclinaison';
                alert('L\'inclinaison nécessite votre permission');
            }
        } catch (error) {
            console.error('Erreur de permission:', error);
        }
    } else {
        tiltEnabled = !tiltEnabled;
        tiltButton.textContent = tiltEnabled ? 'Désactiver Inclinaison' : 'Activer Inclinaison';

        if (!tiltEnabled) {
            player.x = canvasWidth / 2 - player.width / 2;
        }
    }
}

/* ========== PRÉVISUALISATION ========== */
function startPreview() {
    clearIntervals();
    gameInterval = setInterval(updatePreview, 16);
    spawnInterval = setInterval(spawnObstacle, 1000);
}

function updatePreview() {
    previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    previewCtx.fillStyle = '#333';
    obstacles.forEach(obs => {
        obs.y += obs.speed;
        previewCtx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    obstacles = obstacles.filter(obs => obs.y < canvasHeight);
}

/* ========== JEU PRINCIPAL ========== */
function startGame(level) {
    gameLevel = level;
    gameStarted = true;
    player.visible = true;
    player.lives = 3;
    timer = 20;
    obstacles = [];
    updateHeartsDisplay();

    switch (level) {
        case 'easy':
            obstacleSpeed = 2;
            spawnRate = 2000;
            break;
        case 'medium':
            obstacleSpeed = 3;
            spawnRate = 1500;
            break;
        case 'hard':
            obstacleSpeed = 4;
            spawnRate = 1000;
            break;
        case 'blind':
            obstacleSpeed = 1.5;
            spawnRate = 2500;
            break;
    }

    levelSelection.style.display = 'none';
    gameCanvas.style.display = 'block';
    startCountdown();
}

function startCountdown() {
    let count = 3;
    const countdownElement = document.createElement('div');
    countdownElement.id = 'countdown';
    countdownElement.style.position = 'absolute';
    countdownElement.style.top = '50%';
    countdownElement.style.left = '50%';
    countdownElement.style.transform = 'translate(-50%, -50%)';
    countdownElement.style.fontSize = '5rem';
    countdownElement.style.color = 'white';
    countdownElement.style.zIndex = '100';
    document.body.appendChild(countdownElement);

    clearInterval(spawnInterval);

    const interval = setInterval(() => {
        countdownElement.textContent = count > 0 ? count : 'GO!';
        count--;

        if (count < -1) {
            clearInterval(interval);
            document.body.removeChild(countdownElement);
            startGameLoops();
        }
    }, 1000);
}

function startGameLoops() {
    clearIntervals();
    spawnInterval = setInterval(spawnObstacle, spawnRate);
    gameInterval = setInterval(updateGame, 16);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateGame() {
    if (isPaused || gameOver) return;

    gameCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    gameCtx.fillStyle = '#333';
    obstacles.forEach(obs => {
        obs.y += obs.speed;
        gameCtx.fillRect(obs.x, obs.y, obs.width, obs.height);

        if (checkCollision(player, obs)) {
            handleCollision(obs);
        }
    });

    obstacles = obstacles.filter(obs => obs.y < canvasHeight);

    if (player.visible) {
        gameCtx.fillStyle = 'red';
        gameCtx.fillRect(player.x, player.y, player.width, player.height);
    }
}


function spawnObstacle() {
    if (isPaused) return;

    // Nouveau système de génération d'obstacles plus difficiles
    const width = canvasWidth * (0.08 + Math.random() * 0.08); // Largeur variable
    const height = canvasHeight * (0.1 + Math.random() * 0.05); // Hauteur variable

    obstacles.push({
        x: Math.random() * (canvasWidth - width),
        y: -height,
        width: width,
        height: height,
        speed: obstacleSpeed * (0.9 + Math.random() * 0.3) // Vitesse légèrement variable
    });
}
function updateTimer() {
    if (!isPaused && gameStarted) {
        timer--;
        timerDisplay.textContent = timer;
        if (timer <= 0) showWinScreen();
    }
    
}

function updateHeartsDisplay() {
    heartsDisplay.innerHTML = '';
    for (let i = 0; i < player.lives; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = '❤️';
        heartsDisplay.appendChild(heart);
    }
}

/* ========== COLLISIONS ========== */
function checkCollision(player, obstacle) {
    return player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y;
}

function handleCollision(obstacle) {
    player.lives--;
    updateHeartsDisplay();
    obstacles = obstacles.filter(obs => obs !== obstacle);

    if (player.lives <= 0) {
        showGameOver();
    }
}

/* ========== GESTION DE LA PAUSE ========== */
function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        // Afficher le menu pause
        document.getElementById('pauseMenu').style.display = 'flex';

        // Stopper les intervalles
        clearInterval(spawnInterval);
        clearInterval(timerInterval);

        // Sur mobile: empêcher le défilement accidentel
        document.body.style.overflow = 'hidden';
    } else {
        // Cacher le menu pause
        document.getElementById('pauseMenu').style.display = 'none';

        // Redémarrer le jeu
        startGameLoops();

        // Rétablir le défilement
        document.body.style.overflow = '';
    }
}

/* ========== FONCTION PAUSE ORIGINALE ========== */
function togglePause() {
    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pauseMenu');

    if (isPaused) {
        // Mode pause activé
        pauseMenu.style.display = 'flex';
        clearInterval(spawnInterval);
        clearInterval(timerInterval);

        // Empêcher le défilement sur mobile
        document.addEventListener('touchmove', preventScrollDuringPause, { passive: false });
    } else {
        // Mode pause désactivé
        pauseMenu.style.display = 'none';
        startGameLoops();

        // Réautoriser le défilement
        document.removeEventListener('touchmove', preventScrollDuringPause);
    }
}

function preventScrollDuringPause(e) {
    if (isPaused) {
        e.preventDefault();
    }
}/* ========== PAUSE ========== */
function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        pauseMenu.style.display = 'flex';
        clearInterval(spawnInterval);
        clearInterval(timerInterval);
    } else {
        pauseMenu.style.display = 'none';
        startGameLoops();
    }
}

/* ========== MENUS ========== */
function showMainMenu() {
    clearIntervals();
    gameStarted = false;
    player.visible = false;
    obstacles = [];
    gameCanvas.style.display = 'none';
    pauseMenu.style.display = 'none';
    levelSelection.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    startPreview();
}

function showGameOver() {
    gameOver = true;
    gameOverScreen.style.display = 'flex';
}

function showWinScreen() {
    gameOver = true;
    winScreen.style.display = 'flex';
}

function restartGame() {
    gameOver = false;
    isPaused = false;
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    startGame(gameLevel);
}

/* ========== UTILITAIRES ========== */
function clearIntervals() {
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
}

// Démarrer le jeu
init();

// Exporter les fonctions nécessaires pour le HTML
window.startGame = startGame;
window.togglePause = togglePause;
window.toggleTiltControls = toggleTiltControls;
window.restartGame = restartGame;
window.showMainMenu = showMainMenu;