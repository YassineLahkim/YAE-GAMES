// === Dialog management ===
const dialogues = [
    "That's awesome! I managed to find the painting!",
    "I need to hurry and take it back.",
    "Help me bring the painting to the museum as quickly as possible",
    "Look, there's a bike over there.",
    "Click on the bike to transport it !"
];

let dialogueIndex = 0;
const bubble     = document.getElementById('speechBubble');
const bike       = document.getElementById('bike');
let typingSpeed   = 40;
let typingTimeouts = [];
let isTyping       = false;

// Au démarrage, on illustre le vélo, mais on désactive le clic
bike.classList.remove('clicked');
bike.style.pointerEvents = 'none';

function clearTyping() {
    typingTimeouts.forEach(t => clearTimeout(t));
    typingTimeouts = [];
    isTyping = false;
}

function typeWriter(text, cb) {
    bubble.textContent = "";
    isTyping = true;
    for (let i = 0; i < text.length; i++) {
        typingTimeouts.push(setTimeout(() => {
            bubble.textContent += text.charAt(i);
            if (i === text.length - 1) {
                isTyping = false;
                if (cb) cb();
            }
        }, typingSpeed * i));
    }
}

function showDialogue(index) {
    clearTyping();
    bubble.style.opacity = 1;
    if (index < dialogues.length) {
        typeWriter(dialogues[index], () => {
            // Dès le dernier dialogue, on illumine et on réactive le clic
            if (index === dialogues.length - 1) {
                bike.classList.add('clicked');      // effet d'aura
                bike.style.pointerEvents = 'auto';  // maintenant cliquable
            }
        });
    }
}

function nextDialogue() {
    if (isTyping) {
        clearTyping();
        bubble.textContent = dialogues[dialogueIndex];
        isTyping = false;
        if (dialogueIndex === dialogues.length - 1) {
            bike.classList.add('clicked');
            bike.style.pointerEvents = 'auto';
        }
    } else {
        dialogueIndex++;
        if (dialogueIndex < dialogues.length) {
            showDialogue(dialogueIndex);
        }
    }
}

// Ne déclenche la redirection **que** si pointer-events est activé
bike.addEventListener('click', () => {
    if (bike.style.pointerEvents === 'auto') {
        window.location.href = 'erkanindex.html';
    }
});

// Clic global pour avancer le dialogue, en ignorant les clics sur UI
document.addEventListener('click', function (e) {
    if (
        e.target.closest('#bike') ||
        e.target.closest('.hamburger-menu') ||
        e.target.closest('.sidebar') ||
        e.target.closest('.map-button') ||
        e.target.closest('#minimap-modal')
    ) return;
    nextDialogue();
});

// Démarrer
showDialogue(0);
