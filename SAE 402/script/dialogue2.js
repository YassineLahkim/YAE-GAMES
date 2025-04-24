// === Préchargement de la nouvelle image pour éviter le délai d'affichage ===
const preloadedImg = new Image();
preloadedImg.src = "img/personnage-peur_11zon.webp"; // Mets ici le chemin de ta nouvelle image

// === Gestion des dialogues ===
const dialogues = [
    "Finally arrived at the Museum of Fine Arts!",
    "Now, we need to put this painting back in its place... ",
    "Help me get inside the museum."
];

let dialogueIndex = 0;
const bubble = document.getElementById('speechBubble');
const characterContainer = document.getElementById('characterContainer');
const characterImg = document.getElementById('characterImg');

let typingSpeed = 40;
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
        }, typingSpeed * i));
    }
}

function showDialogue(index) {
    clearTyping();
    if (index < dialogues.length) {
        bubble.style.opacity = 1;
        typeWriter(dialogues[index]);
    } else {
        bubble.style.opacity = 0;
        // Rediriger vers une nouvelle page après le dernier dialogue
        redirectToNewPage();
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

// === Redirection après le dialogue ===
function redirectToNewPage() {
    setTimeout(function() {
        window.location.href = "game3.html";  // Remplacez "game3.html" par l'URL de la page suivante
    }, 1000); // Attendez une seconde avant de rediriger
}
