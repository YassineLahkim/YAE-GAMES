 let audioContext;
        let proximityOscillator;
        let proximityGain;
        let isAudioSetup = false;
        const MAX_FREQ = 600;  // Fréquence max réduite (était 800)
        const MIN_FREQ = 200;
        const MAX_VOLUME = 0.1; // Volume max réduit à 10%

        function setupAudio() {
            if (isAudioSetup) return;

            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Oscillateur avec onde plus douce (triangle au lieu de sine)
                proximityOscillator = audioContext.createOscillator();
                proximityOscillator.type = 'triangle'; // Son plus doux que 'sine'

                // Filtre pour adoucir les aigus
                const filter = audioContext.createBiquadFilter();
                filter.type = "lowpass";
                filter.frequency.value = 2000;

                proximityGain = audioContext.createGain();
                proximityGain.gain.value = 0;

                // Chaînage avec le filtre
                proximityOscillator.connect(filter);
                filter.connect(proximityGain);
                proximityGain.connect(audioContext.destination);

                proximityOscillator.start();
                isAudioSetup = true;
            } catch (e) {
                console.error("Erreur audio:", e);
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
        const message = document.getElementById('message');
        const resultMessage = document.getElementById('resultMessage');
        const restartButton = document.getElementById('restartButton');
        const startScreen = document.getElementById('startScreen');
        const startButton = document.getElementById('startButton');
        const permissionButton = document.getElementById('permissionButton');
        const controlInfo = document.getElementById('controlInfo');
        const orientationStatus = document.getElementById('orientationStatus');
        const gameTitle = document.getElementById('gameTitle');
        const gameSubtitle = document.getElementById('gameSubtitle');
        const cheatNotification = document.getElementById('cheatNotification');
        const hintButton = document.getElementById('hintButton');
        const hintText = document.getElementById('hintText');
        const countdown = document.getElementById('countdown');
        const pauseButton = document.getElementById('pauseButton');
        const trail = []; // Stocke les positions récentes de la balle
        const maxTrailLength = 65; // Nombre de points dans la trainée
        let gameOverSound = new Audio('son/game-over.mp3'); // Met ton fichier dans le même dossier que ton HTML



        // Dimensions
        let width, height;
        const ballRadius = 20;
        const holeRadius = 22; // 22px au lieu de 30px (taille réduite de ~25%)

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
        const cheatTapPattern = [2, 2]; // 2-2
        let lastTapTime = 0;
        let hintShown = false;

        function activateAudio() {
            if (!isAudioSetup || audioContext.state === 'running') return;

            audioContext.resume().then(() => {
                proximityGain.gain.linearRampToValueAtTime(MAX_VOLUME / 2, audioContext.currentTime + 0.5); // Montée progressive
            });
        }

        function updateProximitySound() {
            if (!isAudioSetup || !gameActive || audioContext.state !== 'running') return;

            const target = holePositions.find(hole => hole.isTarget);
            if (!target) return;

            const dx = ball.x - target.x;
            const dy = ball.y - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.max(width, height);

            // Courbe logarithmique pour un changement plus progressif
            const normalizedDist = Math.min(distance / maxDist, 1);
            const freq = MIN_FREQ + (MAX_FREQ - MIN_FREQ) * Math.log(1 + 2 * normalizedDist) / Math.log(3);

            proximityOscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

            // Volume avec atténuation progressive
            const volume = MAX_VOLUME * (1 - Math.pow(normalizedDist, 0.7));
            proximityGain.gain.setTargetAtTime(
                volume,
                audioContext.currentTime,
                0.1
            );
        }

        function playHoleSound(isTarget) {
            if (!isAudioSetup || audioContext.state !== 'running') return;

            try {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();

                // Configuration plus douce
                osc.type = 'triangle'; // Onde plus douce
                osc.frequency.value = isTarget ? 500 : 250; // Fréquences réduites
                gain.gain.value = 0.2; // Volume réduit

                // Filtre anti-aigus stridents
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

            // Create a golden ball for animation
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

            // Animate the target hole
            const targetHolePos = holePositions.find(hole => hole.isTarget);
            const holeElement = document.getElementById('targetHole');
            holeElement.classList.add('cheat-active');

            // Animation to the hole
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

                        // Instant win
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

        // Initialization
        function init() {
            resizeCanvas();
            setupControlInfo();
            checkOrientationSupport();
            playIntroAnimation();

            document.addEventListener('click', function initAudio() {
                setupAudio();
                // Activer l'audio quand l'utilisateur démarre le jeu
                startButton.addEventListener('click', activateAudio);
                // Activer aussi au toucher pour mobile
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

                    // COUPURE NETTE DU SON (pas juste une baisse)
                    if (proximityGain) {
                        proximityGain.gain.cancelScheduledValues(audioContext.currentTime);
                        proximityGain.gain.setValueAtTime(0, audioContext.currentTime);
                    }
                } else {
                    gameActive = true;
                    pauseButton.textContent = 'PAUSE';
                    startCountdown();

                    // Réactivation progressive si l'audio est actif
                    if (proximityGain && audioContext.state === 'running') {
                        proximityGain.gain.setTargetAtTime(
                            MAX_VOLUME / 2,
                            audioContext.currentTime,
                            0.3
                        );
                    }
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

        function playIntroAnimation() {
            gameTitle.style.animation = "titleEnter 1s ease-out forwards";

            setTimeout(() => {
                gameSubtitle.style.animation = "subtitleEnter 0.8s ease-out forwards";
            }, 300);

            setTimeout(() => {
                startButton.style.animation = "buttonEnter 0.6s ease-out forwards";
                permissionButton.style.animation = "buttonEnter 0.6s ease-out 0.2s forwards";
            }, 800);

            setTimeout(() => {
                progressContainer.style.animation = "progressEnter 0.6s ease-out forwards";
                orientationStatus.style.opacity = 1;
                orientationStatus.style.transition = "opacity 1s 0.5s";
            }, 1200);

        }

        function resizeCanvas() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            if (gameActive) {
                placeHoles();
                ball.x = Math.min(ball.x, width - ballRadius);
                ball.y = Math.min(ball.y, height - ballRadius);
            }
        }

        function setupControlInfo() {
            if (isMobile) {
                controlInfo.innerHTML = `
                    <p>📱 Tilt your phone</p>
                    <p>or touch the screen to control</p>
                `;
            } else {
                controlInfo.innerHTML = `
                    <p>🖱️ Move your mouse</p>
                `;
            }
        }

        function checkOrientationSupport() {
            if (window.DeviceOrientationEvent) {
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    permissionButton.style.display = 'block';
                    permissionButton.addEventListener('click', requestOrientationPermission);
                    orientationStatus.textContent = "Tilt is not enabled";
                } else {
                    usingOrientation = true;
                    orientationStatus.textContent = "Tilt control available";
                    permissionButton.style.display = 'none';
                }
            } else {
                orientationStatus.textContent = "Your device does not support tilt";
                permissionButton.style.display = 'none';
            }
        }

        function requestOrientationPermission() {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        usingOrientation = true;
                        orientationPermissionGranted = true;
                        permissionButton.style.display = 'none';
                        orientationStatus.textContent = "Tilt control enabled!";
                        permissionButton.textContent = "Tilt Enabled";
                        permissionButton.style.backgroundColor = "#4CAF50";

                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        orientationStatus.textContent = "Permission denied - Use touch";
                        permissionButton.textContent = "Permission Denied";
                        permissionButton.style.backgroundColor = "#f44336";
                    }
                })
                .catch(error => {
                    console.error("Permission error:", error);
                    orientationStatus.textContent = "Activation error - Use touch";
                    permissionButton.textContent = "Activation Error";
                    permissionButton.style.backgroundColor = "#f44336";
                });
        }

        function startGame() {
            startScreen.style.opacity = 0;
            startScreen.style.transition = "opacity 0.8s ease-out";
            if (isAudioSetup && audioContext.state !== 'running') {
                activateAudio();
            }

            // Start countdown
            startCountdown();
        }

        function startCountdown() {
            const countdownElement = document.getElementById('countdown');
            countdownElement.style.opacity = 1;

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
            startScreen.style.display = 'none';
            document.getElementById('ui').style.opacity = 1;
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
            // Possible positions for the target hole (black)
            const targetPositions = [
                { x: width * 0.5, y: height * 0.3 },  // Top center
                { x: width * 0.3, y: height * 0.5 },  // Middle left
                { x: width * 0.7, y: height * 0.5 },  // Middle right
                { x: width * 0.5, y: height * 0.7 },  // Bottom center
                { x: width * 0.2, y: height * 0.2 },  // Top left corner
                { x: width * 0.8, y: height * 0.2 },  // Top right corner
                { x: width * 0.2, y: height * 0.8 },  // Bottom left corner
                { x: width * 0.8, y: height * 0.8 }   // Bottom right corner
            ];

            // Choose a random position for the target hole
            const randomTargetPos = targetPositions[Math.floor(Math.random() * targetPositions.length)];

            targetHole.style.left = randomTargetPos.x + 'px';
            targetHole.style.top = randomTargetPos.y + 'px';
            holePositions = [{ x: randomTargetPos.x, y: randomTargetPos.y, isTarget: true }];

            // Fixed positions for the traps (red)
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

            // Shuffle positions and pick 3
            const shuffledTraps = [...trapPositions].sort(() => 0.5 - Math.random()).slice(0, 3);

            // Ensure traps are not too close to the target
            const finalTrapPositions = shuffledTraps.filter(trap => {
                const dx = trap.x - randomTargetPos.x;
                const dy = trap.y - randomTargetPos.y;
                return Math.sqrt(dx * dx + dy * dy) > 150; // Minimum distance of 150px
            });

            // Ensure we have 3 traps (in case filtering removed some)
            while (finalTrapPositions.length < 3) {
                const randomPos = {
                    x: Math.max(100, Math.random() * (width - 100)),
                    y: Math.max(100, Math.random() * (height - 100))
                };
                // Check that the position is not too close to the target
                const dx = randomPos.x - randomTargetPos.x;
                const dy = randomPos.y - randomTargetPos.y;
                if (Math.sqrt(dx * dx + dy * dy) > 150) {
                    finalTrapPositions.push(randomPos);
                }
            }

            // Place the traps
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
            message.style.display = 'none';
            gameActive = true;
            score = 0;
            lives = 3;
            successes = 0;
            updateUI();
            placeHoles();
            resetBall();
        }

        function handleOrientation(e) {
            if (!gameActive || !usingOrientation) return;

            // Adjusted values for better sensitivity
            const maxTilt = 15; // Reduced from 30 to 15 degrees for more precision
            const deadZone = 5; // Dead zone where tilt has no effect
            const sensitivity = 0.5; // Reduced overall sensitivity
            // Auto-calibration on first use
            if (!isCalibrated) {
                calibration.x = e.gamma || 0;
                calibration.y = (e.beta - 90) || 0;
                isCalibrated = true;
                showCalibrationMessage("Calibration complete!");
            }

            // Apply calibration
            const tiltX = (e.gamma - calibration.x) || 0;
            const tiltY = ((e.beta - 90) - calibration.y) || 0;

            const adjustedX = Math.min(Math.max(tiltX, -maxTilt), maxTilt);
            const adjustedY = Math.min(Math.max(tiltY, -maxTilt), maxTilt);

            // Apply dead zone
            const applyDeadZone = (value) => {
                if (Math.abs(value) < deadZone) return 0;
                return value > 0 ? value - deadZone : value + deadZone;
            };

            const adjustedTiltX = applyDeadZone(adjustedX) / (maxTilt - deadZone);
            const adjustedTiltY = applyDeadZone(adjustedY) / (maxTilt - deadZone);

            // Apply gravity more gradually
            ball.vx += adjustedTiltX * gravity * sensitivity;
            ball.vy += adjustedTiltY * gravity * sensitivity;

            // Limit maximum speed
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

            // Move trap holes in a more complex pattern
            const trapSpeed = 2; // Increased speed
            const trapRadius = 70; // Larger radius for more movement
            for (let i = 0; i < trapHoles.length; i++) {
                const trap = trapHoles[i];
                const angle = (Date.now() / 1000) * trapSpeed + i * (Math.PI / 2); // Different phases for each trap
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

            updateProximitySound(); // <-- AJOUT


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
            moveTrapHoles(); // Move trap holes with increased complexity
        }

        function checkHoleCollisions() {
            for (const hole of holePositions) {
                // Position ACTUELLE du trou (même s'il est en mouvement)
                let currentHoleX, currentHoleY;

                if (hole.isTarget) {
                    // Trou noir (statique)
                    currentHoleX = hole.x;
                    currentHoleY = hole.y;
                } else {
                    // Trou rouge (mobile) - On récupère sa position réelle à l'écran
                    const trapIndex = holePositions.indexOf(hole) - 1; // -1 car le 1er élément est la cible
                    const trapElement = trapHoles[trapIndex];
                    const rect = trapElement.getBoundingClientRect();
                    currentHoleX = rect.left + rect.width / 2;
                    currentHoleY = rect.top + rect.height / 2;
                }

                // Calcul de distance entre CENTRE de la balle et CENTRE du trou
                const dx = ball.x - currentHoleX;
                const dy = ball.y - currentHoleY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Collision si DISTANCE < (Rayon balle + Rayon trou)
                if (distance < (ballRadius + holeRadius)) { // Pas de "-5", collision précise
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
                        playHoleSound(false);
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
            // Coupe le son de la balle (si actif)
            if (proximityGain) proximityGain.gain.value = 0;

            // Joue le son ONLY si défaite
            if (!isWin) {
                gameOverSound.currentTime = 0; // Réinitialise le son si déjà joué
                gameOverSound.play().catch(e => console.log("Son bloqué:", e));
            }

            // Suite du code existant...
            if (isWin) {
                playVictorySound();
                resultMessage.textContent = "Congratulations! You won!";
            } else {
                resultMessage.textContent = "Game Over!";
            }
            message.style.display = 'block';
            gameActive = false;
        }

        function playVictorySound() {
            const audio = new Audio('son/victory.mp3');
            audio.play();
            if (!isAudioSetup || audioContext.state !== 'running') return;

            try {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'triangle';
                osc.frequency.value = 440;
                gain.gain.value = 0.5;

                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();

                osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
                osc.stop(audioContext.currentTime + 1);
            } catch (e) {
                console.error("Erreur son victoire:", e);
            }

        }

        function updateUI() {
            uiScore.textContent = score;
            uiLives.innerHTML = '';
            for (let i = 0; i < lives; i++) {
                uiLives.innerHTML += '<span class="heart">❤</span>';
            }

            // Mettre à jour la barre de progression
            const progressBar = document.getElementById('progressBar');
            progressBar.style.width = `${(successes / successesNeeded) * 100}%`;
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            // 1. Dessine la trainée (nouveau)
            for (let i = 0; i < trail.length; i++) {
                const alpha = i / trail.length; // Transparence progressive
                const radius = ballRadius * (0.5 + 0.5 * alpha); // Taille décroissante

                ctx.beginPath();
                ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.6})`; // Orange semi-transparent
                ctx.fill();
            }

            // 2. Dessine la balle (code original)
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFA500';
            ctx.fill();
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 3. Reflet (code original)
            ctx.beginPath();
            ctx.arc(ball.x - ballRadius * 0.3, ball.y - ballRadius * 0.3, ballRadius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();

            // 4. Ajoute la position actuelle à la trainée (nouveau)
            trail.push({ x: ball.x, y: ball.y });
            if (trail.length > maxTrailLength) {
                trail.shift(); // Garde une longueur fixe
            }
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', resetGame);
        window.addEventListener('resize', resizeCanvas);

        init();