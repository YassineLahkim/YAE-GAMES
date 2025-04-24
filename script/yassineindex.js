 document.addEventListener('DOMContentLoaded', function () {
            const dialogues = [
                {
                    speaker: 'lucas',
                    text: 'Sir... who are you?',
                    action: function () {
                        document.getElementById('lucasCharacter').classList.add('shake');
                    }
                },
                {
                    speaker: 'mysterious',
                    text: 'I am the Keeper of the Secrets of this garden...'
                },
                {
                    speaker: 'lucas',
                    text: 'The keeper...? I am  looking for a work of art here...'
                },
                {
                    speaker: 'mysterious',
                    text: ' If you want to find the lost work, you\'ll first have to solve my game...hidden here...'
                },
                {
                    speaker: 'lucas',
                    text: 'A game? How does it work?'
                },
                {
                    speaker: 'mysterious',
                    text: 'You\'ll have to guide a ball towards the black hole, avoiding the red traps!'
                },
                {
                    speaker: 'mysterious',
                    text: 'Reach the black hole 3 times to unlock the secret of the garden...'
                },
                {
                    speaker: 'lucas',
                    text: 'I\'m ready! Show me the game!',
                    action: function () {
                        document.getElementById('startButton').classList.add('show');
                    }
                }
            ];

            const lucasSpeech = document.getElementById('lucasSpeech');
            const mysteriousSpeech = document.getElementById('mysteriousSpeech');
            const startButton = document.getElementById('startButton');
            const lucasCharacter = document.getElementById('lucasCharacter');
            const mysteriousCharacter = document.getElementById('mysteriousCharacter');

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

            // Handle click on the screen
            document.addEventListener('click', handleClick);

            startButton.addEventListener('click', function () {
                document.body.classList.add('hidden');
                setTimeout(function () {
                    window.location.href = "accueil.html";
                }, 300);
            });

            // Start first dialogue
            setTimeout(() => {
                showDialogue();
            }, 800);
        });