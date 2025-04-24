 document.addEventListener('DOMContentLoaded', function() {
            const dialogues = [
                {
                    speaker: 'mysterious',
                    text: 'Well done! You found the painting...'
                },
                {
                    speaker: 'mysterious',
                    text: 'Now, proceed to the next puzzle to uncover more secrets...'
                },
                {
                    speaker: 'lucas',
                    text: 'Alright! Let\'s go!',
                    action: function() {
                        document.getElementById('startButton').classList.add('show');
                    }
                }
            ];

            const lucasSpeech = document.getElementById('lucasSpeech');
            const mysteriousSpeech = document.getElementById('mysteriousSpeech');
            const startButton = document.getElementById('startButton');
            const lucasCharacter = document.getElementById('lucasCharacter');
            const mysteriousCharacter = document.getElementById('mysteriousCharacter');
            const painting = document.getElementById('painting');
            const characters = document.getElementById('characters');
            const victorySound = document.getElementById('victorySound');

            let currentDialogue = 0;
            let isTyping = false;
            let typingInterval = null;

            function showDialogue() {
                if (currentDialogue >= dialogues.length) return;

                const dialogue = dialogues[currentDialogue];
                const bubble = dialogue.speaker === 'lucas' ? lucasSpeech : mysteriousSpeech;
                const otherBubble = dialogue.speaker === 'lucas' ? mysteriousSpeech : lucasSpeech;

                // Reset animations and clear any ongoing typing
                lucasCharacter.classList.remove('shake');
                if (typingInterval) clearInterval(typingInterval);

                // Execute action if exists
                if (dialogue.action) {
                    dialogue.action();
                }

                // Hide other bubble
                otherBubble.classList.remove('active');

                // Show current bubble
                bubble.textContent = '';
                bubble.classList.add('active');

                // Start typing effect
                isTyping = true;
                let i = 0;
                typingInterval = setInterval(() => {
                    if (i < dialogue.text.length) {
                        bubble.textContent += dialogue.text.charAt(i);
                        i++;
                    } else {
                        clearInterval(typingInterval);
                        typingInterval = null;
                        isTyping = false;
                    }
                }, 30);
            }

            function handleClick() {
                if (isTyping) {
                    // Complete current text immediately
                    const dialogue = dialogues[currentDialogue];
                    const bubble = dialogue.speaker === 'lucas' ? lucasSpeech : mysteriousSpeech;
                    bubble.textContent = dialogue.text;
                    clearInterval(typingInterval);
                    typingInterval = null;
                    isTyping = false;
                } else {
                    // Go to next dialogue
                    currentDialogue++;
                    if (currentDialogue < dialogues.length) {
                        showDialogue();
                    }
                }
            }

            // Gestion du clic sur l'écran
            document.addEventListener('click', handleClick);

            startButton.addEventListener('click', function() {
                document.body.classList.add('hidden');
                setTimeout(function() {
                    window.location.href = "velo.html";
                }, 300);
            });

            // Start painting animation
            setTimeout(() => {
                painting.style.opacity = '1';
                setTimeout(() => {
                    painting.classList.add('small'); // Réduire et déplacer le tableau
                    setTimeout(() => {
                        characters.style.opacity = '1'; // Afficher les personnages
                        setTimeout(() => {
                            showDialogue(); // Démarrer le dialogue
                        }, 1000);
                    }, 1000);
                }, 2000);
            }, 800);

            // Jouer le son de victoire
            victorySound.play();
        });