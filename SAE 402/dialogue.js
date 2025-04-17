const dialogues = [
    "Salut, moi c’est Lucas.",
    "J’ai 15 ans, et j’adore partir à l’aventure pour résoudre des mystères.",
    "On dit que ce jardin cache bien des secrets… et justement, j’ai entendu une histoire étrange.",
    "Un tableau aurait disparu du musée du patrimoine de Mulhouse.",
    "Personne ne sait ce qu’il est devenu, mais la dernière fois qu’on l’a aperçu, c’était ici, au Jardin des Senteurs.",
    "T’es partant pour m’aider à fouiller un peu ?",
    "J’ai le pressentiment qu’on va découvrir quelque chose d’intéressant…"
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
        enableCharacterMovement();
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

// Avance le dialogue sur tout clic écran (hors menus)
document.addEventListener('click', function(e) {
    if (e.target.closest('.hamburger-menu') || e.target.closest('.sidebar') || e.target.closest('.map-button')) {
        return;
    }
    nextDialogue();
});

// Premier dialogue
showDialogue(0);

// Hamburger menu (inchangé)
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
hamburger.addEventListener('click', function(e) {
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    e.stopPropagation();
});

/* === Mouvement du personnage après les dialogues === */
function enableCharacterMovement() {
    characterContainer.style.pointerEvents = "auto";
    characterImg.style.pointerEvents = "auto";
    let startY = null;
    let startBottom = parseFloat(getComputedStyle(characterContainer).bottom);
    let dragging = false;

    const minScale = 0.7; // Taille minimale (70%)
    const maxScale = 1;   // Taille maximale (100%)
    const minBottom = -20; // Bas d'origine

    // Proportion du stop calculée sur iPhone 12 Pro (hauteur écran 844px)
    const stopRatio = 196.327 / 844; // ≈ 0.2325

    function getTouchY(e) {
        return e.touches ? e.touches[0].clientY : e.clientY;
    }

    function getMaxBottom() {
        return window.innerHeight * stopRatio;
    }

    function onStart(e) {
        dragging = true;
        startY = getTouchY(e);
        startBottom = parseFloat(getComputedStyle(characterContainer).bottom);
        document.body.style.userSelect = "none";
    }

    function onMove(e) {
        if (!dragging) return;
        let deltaY = getTouchY(e) - startY;
        let newBottom = startBottom - deltaY;

        // Limite le déplacement
        let maxBottom = getMaxBottom();
        if (newBottom < minBottom) newBottom = minBottom;
        if (newBottom > maxBottom) newBottom = maxBottom;
        characterContainer.style.bottom = `${newBottom}px`;

        // Calcul du scale en fonction de la position
        let ratio = (newBottom - minBottom) / (maxBottom - minBottom); // 0 (bas) à 1 (haut)
        let scale = maxScale - (maxScale - minScale) * ratio;
        characterImg.style.transform = `scale(${scale})`;
    }

    function onEnd() {
        dragging = false;
        document.body.style.userSelect = "";
    }

    // Souris
    characterContainer.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Tactile
    characterContainer.addEventListener('touchstart', onStart);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
}
