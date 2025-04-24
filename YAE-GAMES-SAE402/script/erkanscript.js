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
        obstacleSpeed: 6,
        spawnRate: 900,
        playerWidth: 0.07,
        timer: 15
    },
    medium: {
        obstacleSpeed: 8,
        spawnRate: 700,
        playerWidth: 0.06,
        timer: 15
    },
    hard: {
        obstacleSpeed:10,
        spawnRate: 500,
        playerWidth: 0.05,
        timer: 12
    },
    blind: {
        obstacleSpeed: 6,
        spawnRate: 1000,
        playerWidth: 0.08,
        timer: 20
    }
};

const obstacleImages = [
    new Image(),
    new Image(),
    new Image(),
    new Image()
];

obstacleImages[0].src = 'img/img-obstacle1.webp';
obstacleImages[1].src = 'img/img-obstacle2.webp';
obstacleImages[2].src = 'img/img-obstacle3.webp';
obstacleImages[3].src = 'img/img-obstacle4.webp';

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
    width: 60,  // Augmentez cette valeur pour rendre l'image plus large
    height: 80, // Ajustez cette valeur pour conserver les proportions
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

    // Mettre à jour la position et la taille du joueur
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

    obstacles.forEach(obs => {
        obs.y += obs.speed;
        previewCtx.drawImage(obs.image, obs.x * canvasWidth, obs.y * canvasHeight, obs.width * canvasWidth, obs.height * canvasHeight);
    });

    obstacles = obstacles.filter(obs => obs.y < 1);
}

/* ========== JEU PRINCIPAL ========== */
function startGame(level) {
    gameLevel = level;
    gameStarted = true;
    player.visible = true;
    player.lives = 3;
    timer = DIFFICULTY_SETTINGS[level].timer;
    obstacles = [];
    updateHeartsDisplay();

    obstacleSpeed = DIFFICULTY_SETTINGS[level].obstacleSpeed;
    spawnRate = DIFFICULTY_SETTINGS[level].spawnRate;

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

    obstacles.forEach(obs => {
        obs.y += obs.speed / canvasHeight;
        gameCtx.drawImage(obs.image, obs.x * canvasWidth, obs.y * canvasHeight, obs.width * canvasWidth, obs.height * canvasHeight);

        if (checkCollision(player, obs)) {
            handleCollision(obs);
        }

        // Vérifier si le mode "Malvoyant" est activé
        if (gameLevel === 'blind') {
            // Calculer la distance entre l'obstacle et le joueur
            const distance = Math.abs(player.y - obs.y * canvasHeight);

            // Jouer un son si l'obstacle est proche
            if (distance < canvasHeight * 0.5) {
                const audio = document.getElementById('obstacleSound');
                audio.volume = 1 - (distance / (canvasHeight * 0.5)); // Ajuster le volume en fonction de la distance
                audio.play();
            }
        }
    });

    obstacles = obstacles.filter(obs => obs.y < 1);

    if (player.visible && cyclistImage.complete) { // Vérifiez si l'image est chargée
        gameCtx.drawImage(cyclistImage, player.x, player.y, player.width, player.height);
    }
}


const cyclistImage = new Image();
cyclistImage.src = 'img/img-velo.webp'; // Assurez-vous que le chemin est correct


function spawnObstacle() {
    if (isPaused) return;

    const obstacle = createObstacle();
    obstacle.speed = obstacleSpeed * (0.9 + Math.random() * 0.3); // Vitesse légèrement variable
    obstacles.push(obstacle);
}

function updateTimer() {
    if (!isPaused && gameStarted) {
        timer--;
        timerDisplay.textContent = timer;
        if (timer <= 0) {
            showWinScreen(); // Afficher l'écran de victoire
        }
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
    return player.x < obstacle.x * canvasWidth + obstacle.width * canvasWidth &&
        player.x + player.width > obstacle.x * canvasWidth &&
        player.y < obstacle.y * canvasHeight + obstacle.height * canvasHeight &&
        player.y + player.height > obstacle.y * canvasHeight;
}

function handleCollision(obstacle) {
    player.lives--;
    updateHeartsDisplay();
    obstacles = obstacles.filter(obs => obs !== obstacle);

    if (player.lives <= 0) {
        showGameOver(); // Afficher l'écran de défaite
    }
}

function showWinScreen() {
    gameOver = true;
    isPaused = true; // Mettre le jeu en pause pour arrêter les intervalles
    window.location.href = 'Victoire.html'; // Rediriger vers la nouvelle page
}


function showGameOver() {
    gameOver = true;
    isPaused = true; // Mettre le jeu en pause pour arrêter les intervalles
    gameOverScreen.style.display = 'flex';
}

/* ========== GESTION DE LA PAUSE ========== */
function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        // Afficher le menu pause
        pauseMenu.style.display = 'flex';

        // Stopper les intervalles
        clearInterval(spawnInterval);
        clearInterval(timerInterval);

        // Sur mobile: empêcher le défilement accidentel
        document.body.style.overflow = 'hidden';
    } else {
        // Cacher le menu pause
        pauseMenu.style.display = 'none';

        // Redémarrer le jeu
        startGameLoops();

        // Rétablir le défilement
        document.body.style.overflow = '';
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

function restartGame() {
    gameOver = false;
    isPaused = false;
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    showMainMenu(); // Rediriger vers le menu principal pour recommencer
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


document.getElementById('enableSoundButton').addEventListener('click', function() {
    const audio = document.getElementById('obstacleSound');
    audio.play().then(() => {
        console.log('Son activé');
    }).catch(error => {
        console.error('Erreur de lecture audio:', error);
    });
});

function playObstacleSound(distance) {
    const audio = document.getElementById('obstacleSound');
    audio.volume = 1 - (distance / (canvasHeight * 0.5)); // Ajuster le volume en fonction de la distance
    audio.play().catch(error => {
        console.error('Erreur de lecture audio:', error);
    });
}


// Optionnel : on s'assure que ça marche aussi bien tactile qu'à la souris
document.querySelector('.cheatButton').addEventListener('touchstart', function() {
    // Tu peux ajouter une vibration ou autre effet ici si tu veux
    console.log("Bouton pressé en tactile");
  });