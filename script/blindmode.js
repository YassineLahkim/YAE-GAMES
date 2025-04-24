const startBtn = document.getElementById('startBtn');
const startScreen = document.getElementById('startScreen');
const gameContainer = document.getElementById('gameContainer');
const levelDisplay = document.getElementById('levelDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const yellowBtn = document.getElementById('yellowBtn');
const redBtn    = document.getElementById('redBtn');
const blueBtn   = document.getElementById('blueBtn');
const greenBtn  = document.getElementById('greenBtn');
const winPopup  = document.getElementById('winPopup');
const losePopup = document.getElementById('losePopup');
const continueBtn = document.getElementById('continueBtn');
const retryBtn    = document.getElementById('retryBtn');
const finalScore  = document.getElementById('finalScore');
const loseScore   = document.getElementById('loseScore');

const sounds = [
    document.getElementById('yellowSound'),
    document.getElementById('redSound'),
    document.getElementById('blueSound'),
    document.getElementById('greenSound')
];

// ======================================================================
// 1) Fonction pour « unlocker » tous les <audio> sur le premier geste
// ======================================================================
function unlockAllSounds() {
  sounds.forEach(s => {
    // Essayer de jouer silencieusement pour lever la barrière autoplay
    s.play().catch(()=>{});
    s.pause();
    s.currentTime = 0;
  });
  // Ne pas le refaire
  document.body.removeEventListener('touchend', unlockAllSounds);
  document.body.removeEventListener('click',    unlockAllSounds);
}
// On installe nos écouteurs une seule fois
document.body.addEventListener('touchend', unlockAllSounds, { once: true });
document.body.addEventListener('click',    unlockAllSounds, { once: true });

// ======================================================================
//  Reste de ton code inchangé
// ======================================================================
let sequenceLengths = [2, 3, 4];
let sequence = [];
let playerSequence = [];
let level = 1;
let score = 0;
let isPlaying = false;
let isGuiding = false;
const instrumentNames = [
    'Trumpet, top left',
    'Guitar, top right',
    'Piano, bottom left',
    'Accordion, bottom right'
];

function speak(text, cb) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.onend = () => cb && cb();
        speechSynthesis.speak(u);
    } else { setTimeout(() => cb && cb(), 500); }
}

function stopAllSounds() {
    sounds.forEach(s => { s.pause(); s.currentTime = 0; });
}

function highlight(idx, cb) {
    stopAllSounds();
    const btn = document.querySelectorAll('.button')[idx];
    btn.classList.add('highlight');
    sounds[idx].play();
    setTimeout(() => { btn.classList.remove('highlight'); cb && cb(); }, 600);
}

function playButtonGuide(cb) {
    if (isGuiding) return;
    isGuiding = true;
    let i = 0;
    (function next() {
        if (i >= sounds.length) { isGuiding = false; return cb && cb(); }
        speak(instrumentNames[i], () => {
            highlight(i, () => { i++; setTimeout(next, 400); });
        });
    })();
}

startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    level = 1; score = 0; updateDisplay();
    playButtonGuide(() => nextRound());
});

continueBtn.addEventListener('click', () => window.location.href = 'paintingroom.html');
retryBtn.addEventListener('click', () => { losePopup.style.display = 'none'; nextRound(); });

[yellowBtn, redBtn, blueBtn, greenBtn].forEach((btn, i) => {
    btn.addEventListener('mousedown', () => handleInput(i));
    btn.addEventListener('touchstart', () => handleInput(i));
});

function updateDisplay() { levelDisplay.textContent = level; scoreDisplay.textContent = score; }

function nextRound() {
    isPlaying = false; playerSequence = [];
    sequence = Array.from({ length: sequenceLengths[level-1] })
                .map(() => Math.floor(Math.random()*4));
    speak('Listen to the sequence', () => {
        let i = 0;
        (function playSeq() {
            if (i >= sequence.length) {
                speak('Your turn', () => { isPlaying = true; }); return;
            }
            highlight(sequence[i], () => { i++; setTimeout(playSeq, 400); });
        })();
    });
}

function handleInput(idx) {
    if (!isPlaying) return;
    isPlaying = false; playerSequence.push(idx);
    highlight(idx, () => {
        if (sequence[playerSequence.length-1] !== idx) {
            speak('Too bad! You lost.');
            loseScore.textContent = score; losePopup.style.display = 'flex';
            return;
        }
        if (playerSequence.length === sequence.length) {
            score += 50; updateDisplay();
            if (level < sequenceLengths.length) {
                level++; setTimeout(nextRound, 500);
            } else {
                speak('Congratulations! You won the game!');
                finalScore.textContent = score; winPopup.style.display = 'flex';
            }
        } else {
            isPlaying = true;
        }
    });
}
