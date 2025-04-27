// DOM Elements
let btns = document.querySelectorAll('.grid-cell');
let btnM = document.getElementById('btnM');
let btnHash = document.getElementById('btnHash');
let btnI = document.getElementById('btnI');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const goToPaintingRoomBtn = document.getElementById('goToPaintingRoomBtn');
const levelDisplay = document.getElementById('level');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplayLost = document.getElementById('finalScoreLost');
const finalScoreDisplayWin = document.getElementById('finalScoreWin');
const gameOverScreenLost = document.getElementById('gameOverLost');
const gameOverScreenWin = document.getElementById('gameOverWin');
const codeBar = document.getElementById('code-bar');

// Game Variables
let sequence = [];
let playerSequence = [];
let level = 1;
const maxLevel = 5;
let score = 0;
let isPlaying = false;
let isShowingSequence = false;
let isPaused = false;
let sequenceSpeed = 800;
let sequenceInterval;

// Cheat code detection
let cheatSequence = [];

// Sounds
const noteSounds = [];
for (let i = 1; i <= 9; i++) {
    noteSounds.push(new Audio(`son/${i}.mp3`));
}

const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');
const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');

// Fonction pour réinitialiser complètement un bouton
function resetButton(btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    return newBtn;
}

// Initialization
function init() {
    // Réinitialiser tous les boutons
    const newBtns = [];
    btns.forEach(btn => {
        newBtns.push(resetButton(btn));
    });
    btnM = resetButton(btnM);
    btnI = resetButton(btnI);
    btnHash = resetButton(btnHash);
    
    // Réassigner les références
    btns = document.querySelectorAll('.grid-cell');
    btnM = document.getElementById('btnM');
    btnI = document.getElementById('btnI');
    btnHash = document.getElementById('btnHash');

    // Reset UI
    btns.forEach(btn => btn.classList.remove('active', 'correct', 'wrong'));
    codeBar.textContent = "";
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    gameOverScreenLost.style.display = 'none';
    gameOverScreenWin.style.display = 'none';
    cheatSequence = [];
    playerSequence = [];

    // Numeric button events
    btns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (!isPlaying || isShowingSequence || isPaused) return;
            playerSequence.push(index);
            activateCell(index);
            updateCodeBar(playerSequence);
            checkSequence();
        });
    });

    // Special buttons
    btnM.addEventListener('click', () => {
        if (!isPlaying || isShowingSequence || isPaused) return;
        cheatSequence.push('M');
        updateCodeBar(cheatSequence);
        if (cheatSequence.join('') === "MMI") winGame();
    });

    btnI.addEventListener('click', () => {
        if (!isPlaying || isShowingSequence || isPaused) return;
        cheatSequence.push('I');
        updateCodeBar(cheatSequence);
        if (cheatSequence.join('') === "MMI") winGame();
    });

    btnHash.addEventListener('click', () => {
        if (!isPlaying || isShowingSequence || isPaused) return;
    });

    // Control buttons
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    playAgainBtn.addEventListener('click', playAgain);
    goToPaintingRoomBtn.addEventListener('click', () => {
        window.location.href = 'painting_room.html';
    });
}

function winGame() {
    winSound.play();
    setTimeout(() => {
        finalScoreDisplayWin.textContent = score;
        gameOverScreenWin.style.display = 'flex';
        document.querySelector('.game-over h2').classList.add('game-over-win');
        document.querySelector('.game-over h2').textContent = "Congratulations, you have disabled the alarm!";
        goToPaintingRoomBtn.addEventListener('click', () => {
            window.location.href = 'paintingroom.html';
        });
    }, 1000);
}

function gameOverLost() {
    wrongSound.play();
    setTimeout(() => {
        finalScoreDisplayLost.textContent = score;
        gameOverScreenLost.style.display = 'flex';
        document.querySelector('.game-over h2').classList.add('game-over-lost');
        document.querySelector('.game-over h2').textContent = "Lost, you triggered the alarm!";
    }, 1000);
}

function updateCodeBar(sequence) {
    codeBar.textContent = sequence.map(char => {
        if (char === 'M' || char === 'I') {
            return char;
        } else {
            return parseInt(char) + 1;
        }
    }).join('');
}

function startGame() {
    isPlaying = true;
    isPaused = false;
    score = 0;
    level = 1;
    sequenceSpeed = 800;
    levelDisplay.textContent = `${level}/5`;
    scoreDisplay.textContent = score;
    gameOverScreenLost.style.display = 'none';
    gameOverScreenWin.style.display = 'none';
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
    playerSequence = [];
    cheatSequence = [];
    codeBar.textContent = "";
    
    generateSequence();
    setTimeout(() => showSequence(), 1000);
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    
    if (isPaused) {
        clearInterval(sequenceInterval);
    } else if (isShowingSequence) {
        showSequence();
    }
}

function generateSequence() {
    sequence = [];
    const sequenceLength = level + 1;
    
    for (let i = 0; i < sequenceLength; i++) {
        const randomIndex = Math.floor(Math.random() * 9);
        sequence.push(randomIndex);
    }
    
    sequenceSpeed = 800;
}

function showSequence() {
    isShowingSequence = true;
    let i = 0;
    
    sequenceInterval = setInterval(() => {
        if (i >= sequence.length || isPaused) {
            clearInterval(sequenceInterval);
            if (!isPaused) {
                isShowingSequence = false;
                playerSequence = [];
            }
            return;
        }
        
        const cellIndex = sequence[i];
        activateCell(cellIndex, true);
        i++;
    }, sequenceSpeed);
}

function activateCell(index, isSequence = false) {
    const cell = btns[index];
    cell.classList.add('active');
    
    if (!isSequence || index < 9) {
        noteSounds[index].currentTime = 0;
        noteSounds[index].play();
    }
    
    setTimeout(() => {
        cell.classList.remove('active');
    }, 500);
}

function checkSequence() {
    for (let i = 0; i < playerSequence.length; i++) {
        if (playerSequence[i] !== sequence[i]) {
            gameOverLost();
            return;
        }
    }
    
    if (playerSequence.length < sequence.length) {
        return;
    }
    
    correctSound.play();
    score += level * 10;
    scoreDisplay.textContent = score;
    
    btns.forEach(cell => {
        cell.classList.add('correct');
        setTimeout(() => cell.classList.remove('correct'), 500);
    });
    
    if (level >= maxLevel) {
        winGame();
        return;
    }
    
    setTimeout(() => {
        level++;
        levelDisplay.textContent = `${level}/5`;
        
        generateSequence();
        setTimeout(() => showSequence(), 1000);
    }, 1000);
}

function playAgain() {
    gameOverScreenLost.style.display = 'none';
    gameOverScreenWin.style.display = 'none';
    playerSequence = [];
    cheatSequence = [];
    codeBar.textContent = "";
    init();
    startGame();
}

init();