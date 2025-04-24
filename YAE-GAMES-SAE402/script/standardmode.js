// DOM Elements
        const btns = document.querySelectorAll('.grid-cell');
        const btnM = document.getElementById('btnM');
        const btnHash = document.getElementById('btnHash');
        const btnI = document.getElementById('btnI');
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
        let level = 1; // Start with level 1
        const maxLevel = 5;
        let score = 0;
        let isPlaying = false;
        let isShowingSequence = false;
        let isPaused = false;
        let sequenceSpeed = 800; // Fixed sequence speed (no excessive speed increase)
        let sequenceInterval;
    
        // Cheat code detection variable
        let cheatSequence = [];
    
        // Sounds
        const noteSounds = [];
        for (let i = 1; i <= 9; i++) {
            noteSounds.push(new Audio(`son/${i}.mp3`));
        }
    
        const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
        const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');
        const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
    
        // Initialization
        function init() {
            // Reset the state of the buttons and the green bar
            btns.forEach(btn => {
                btn.classList.remove('active', 'correct', 'wrong');
            });
            codeBar.textContent = ""; // Reset the green bar
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'Pause';
            gameOverScreenLost.style.display = 'none';
            gameOverScreenWin.style.display = 'none';
            cheatSequence = []; // Reset the cheat code sequence
    
            // Numeric button events
            btns.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    if (!isPlaying || isShowingSequence || isPaused) return;
                    
                    playerSequence.push(index);
                    activateCell(index);
                    updateCodeBar(playerSequence); // Update the green bar
                    checkSequence();
                });
            });
    
            // Special button events (no sound)
            btnM.addEventListener('click', () => {
                if (!isPlaying || isShowingSequence || isPaused) return;
                cheatSequence.push('M');
                updateCodeBar(cheatSequence); // Update the green bar
    
                if (cheatSequence.join('') === "MMI") {
                    // Trigger instant victory
                    winGame();
                }
            });
    
            btnHash.addEventListener('click', () => {
                if (!isPlaying || isShowingSequence || isPaused) return;
            });
    
            btnI.addEventListener('click', () => {
                if (!isPlaying || isShowingSequence || isPaused) return;
                cheatSequence.push('I');
                updateCodeBar(cheatSequence); // Update the green bar
    
                if (cheatSequence.join('') === "MMI") {
                    // Trigger instant victory
                    winGame();
                }
            });
    
            // Control buttons
            startBtn.addEventListener('click', startGame);
            pauseBtn.addEventListener('click', togglePause);
            playAgainBtn.addEventListener('click', playAgain);
            goToPaintingRoomBtn.addEventListener('click', () => {
                window.location.href = 'painting_room.html'; // Redirect to painting room page
            });
        }
    
        // Instant win with cheat code
        function winGame() {
            winSound.play();
            setTimeout(() => {
                finalScoreDisplayWin.textContent = score;
                gameOverScreenWin.style.display = 'flex';
                document.querySelector('.game-over h2').classList.add('game-over-win');
                document.querySelector('.game-over h2').textContent = "Congratulations, you have disabled the alarm!";
                goToPaintingRoomBtn.addEventListener('click', () => {
                    window.location.href = 'paintingroom.html'; // Redirect to painting room page
                });
            }, 1000);
        }
    
        // Game Over (Lost)
        function gameOverLost() {
            wrongSound.play();
            setTimeout(() => {
                finalScoreDisplayLost.textContent = score;
                gameOverScreenLost.style.display = 'flex';
                document.querySelector('.game-over h2').classList.add('game-over-lost');
                document.querySelector('.game-over h2').textContent = "Lost, you triggered the alarm!";
            }, 1000);
        }
    
        // Update the green bar with the cheat code
        function updateCodeBar(sequence) {
            // For numbers (1 to 9), we add +1 to each number, keeping letters the same
            codeBar.textContent = sequence.map(char => {
                if (char === 'M' || char === 'I') {
                    return char; // Leave M and I as they are
                } else {
                    return parseInt(char) + 1; // Add +1 to numbers
                }
            }).join('');
        }
    
        // Start the game
        function startGame() {
            isPlaying = true;
            isPaused = false;
            score = 0;
            level = 1; // Start at level 1
            sequenceSpeed = 800;
            levelDisplay.textContent = `${level}/5`;
            scoreDisplay.textContent = score;
            gameOverScreenLost.style.display = 'none';
            gameOverScreenWin.style.display = 'none';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = 'Pause';
            
            generateSequence();
            setTimeout(() => showSequence(), 1000);
        }
    
        // Toggle pause/play
        function togglePause() {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
            
            if (isPaused) {
                clearInterval(sequenceInterval);
            } else if (isShowingSequence) {
                showSequence();
            }
        }
    
        // Generate a random sequence
        function generateSequence() {
            sequence = [];
            const sequenceLength = level + 1; // Level 1: 2 digits, level 2: 3 digits, etc.
            
            for (let i = 0; i < sequenceLength; i++) {
                const randomIndex = Math.floor(Math.random() * 9);
                sequence.push(randomIndex);
            }
            
            sequenceSpeed = 800; // Keep the sequence speed constant
        }
    
        // Show the sequence to the player
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
    
        // Activate a cell (visually and with sound)
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
    
        // Check the player's sequence
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
            init(); // Full reset
            startGame();
        }
    
        init();