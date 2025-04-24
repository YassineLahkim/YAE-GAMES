 // === Gestion des dialogues ===
        const dialogues = [
            "The museum is protected by an alarm system... I'll need to disable it if I want to put this painting back in its place without getting caught",
            "To deactivate the keypad, all you need to do is follow the instructions, but each step gets faster and faster.",
            "Help me enter the code and disable the alarm !"
        ];

        let dialogueIndex = 0;
        const bubble = document.getElementById('speechBubble');
        const characterContainer = document.getElementById('characterContainer');
        const modeSelection = document.getElementById('modeSelection');
        
        // Définir une vitesse d'écriture plus lente
        let typingSpeed = 80;  // Réduis la vitesse de frappe pour donner plus de temps à l'audio

        let typingTimeouts = [];
        let isTyping = false;

        function clearTyping() {
            typingTimeouts.forEach(timeout => clearTimeout(timeout));
            typingTimeouts = [];
            isTyping = false;
        }

        function typeWriter(text, callback) {
            bubble.textContent = "";
            isTyping = true;
            for (let i = 0; i < text.length; i++) {
                typingTimeouts.push(setTimeout(() => {
                    bubble.textContent += text.charAt(i);
                    if (i === text.length - 1) {
                        isTyping = false;
                        if (callback) callback();
                    }
                }, typingSpeed * i));  // Vitesse d'écriture plus lente
            }
        }

        function showDialogue(index) {
            clearTyping();
            if (index < dialogues.length) {
                bubble.style.opacity = 1;
                typeWriter(dialogues[index]);
            } else {
                bubble.style.opacity = 0;
                // Faire glisser le personnage vers la gauche après le dernier dialogue
                characterContainer.classList.add('disappear');

                // Afficher l'écran de sélection des modes après la disparition
                setTimeout(() => {
                    modeSelection.classList.add('show');
                }, 1000); // Attendre la fin de l'animation de disparition
            }
        }

        function nextDialogue() {
            if (isTyping) {
                clearTyping();
                bubble.textContent = dialogues[dialogueIndex];
                isTyping = false;
            } else {
                dialogueIndex++;
                showDialogue(dialogueIndex);
            }
        }

        // Avance le dialogue au clic
        document.addEventListener('click', function (e) {
            nextDialogue();
        });

        // Premier dialogue
        showDialogue(0);

        // === Menu de sélection de mode ===
        document.getElementById('standardModeBtn').addEventListener('click', () => {
            window.location.href = 'standardmode.html'; // Redirection vers la page mode standard
        });

        document.getElementById('accessibleModeBtn').addEventListener('click', () => {
            window.location.href = 'blindModePage.html'; // Redirection vers la page mode malvoyant
        });

        // Déplacement du personnage avec les flèches du clavier
        document.addEventListener('keydown', function(e) {
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();  // Empêche la touche 'M' de générer des caractères multiples
            }
            const characterContainer = document.getElementById('characterContainer');
            const step = 10; // Distance du mouvement par pression de touche

            let currentTop = parseInt(window.getComputedStyle(characterContainer).top) || 0;
            let currentLeft = parseInt(window.getComputedStyle(characterContainer).left) || 0;

            switch(e.key) {
                case 'ArrowUp':
                    characterContainer.style.top = `${currentTop - step}px`;
                    break;
                case 'ArrowDown':
                    characterContainer.style.top = `${currentTop + step}px`;
                    break;
                case 'ArrowLeft':
                    characterContainer.style.left = `${currentLeft - step}px`;
                    break;
                case 'ArrowRight':
                    characterContainer.style.left = `${currentLeft + step}px`;
                    break;
            }
        });