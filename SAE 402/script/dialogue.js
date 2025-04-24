// === Préchargement de la nouvelle image pour éviter le délai d'affichage ===
const preloadedImg = new Image();
preloadedImg.src = "img/personnage-peur_11zon.webp"; // Mets ici le chemin de ta nouvelle image

// === Gestion des dialogues ===
const dialogues = [
    "Hi, I'm Lucas.",
    "I'm 15, and I love going on adventures to solve mysteries.",
    "They say this garden hides a lot of secrets... and I've heard a strange story. ",
    "A painting has disappeared from the Mulhouse Fine Arts Museum",
    "Nobody knows what happened to it, but the last time it was seen was here, in the 'Jardin des Senteurs' ",
    "Are you up for helping me rummage around?",
    "Slide your finger upwards to explore the park !"
    
];

let dialogueIndex = 0;
const bubble = document.getElementById('speechBubble');
const characterContainer = document.getElementById('characterContainer');
const characterImg = document.getElementById('characterImg');
const lightDiscovery = document.getElementById('lightDiscovery');

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

// === Dialogues spéciaux lumière ===
const lightDialogues = [
    "Wait... did you see that?",
    "There's a light over there... just between the bushes.",
    "Come on, help me... click on it to see what it is."
];
let lightDialogueIndex = 0;
let showingLightDialogues = false;

function showLightDialogue(index) {
    if (index < lightDialogues.length) {
        bubble.style.opacity = 1;
        typeWriter(lightDialogues[index]);
        showingLightDialogues = true;
        lightDialogueIndex = index;
    } else {
        // Fin des dialogues spéciaux
        showingLightDialogues = false;
        bubble.style.opacity = 0;
    }
}

// Avance le dialogue sur tout clic écran (hors menus)
document.addEventListener('click', function (e) {
    if (e.target.closest('.hamburger-menu') || e.target.closest('.sidebar') || e.target.closest('.map-button')) {
        return;
    }
    if (showingLightDialogues) {
        if (isTyping) {
            clearTyping();
            bubble.textContent = lightDialogues[lightDialogueIndex];
            isTyping = false;
        } else {
            lightDialogueIndex++;
            if (lightDialogueIndex < lightDialogues.length) {
                showLightDialogue(lightDialogueIndex);
            } else {
                showingLightDialogues = false;
                bubble.style.opacity = 0;
            }
        }
    } else {
        nextDialogue();
    }
});

// Premier dialogue
showDialogue(0);



// === Mouvement du personnage : uniquement vertical, verrouillage, changement d'image en haut, lumière et dialogues spéciaux ===
function enableCharacterMovement() {
    characterContainer.style.pointerEvents = "auto";
    characterImg.style.pointerEvents = "auto";
    let startY = null;
    let startBottom = parseFloat(getComputedStyle(characterContainer).bottom);
    let dragging = false;
    let photoChanged = false;
    let lockedAtTop = false;
    let lightMessageShown = false;

    const minScale = 0.7;
    const maxScale = 1;
    const minBottom = -20;
    const stopRatio = 196.327 / 844;

    function getTouchY(e) {
        return e.touches ? e.touches[0].clientY : e.clientY;
    }

    function getMaxBottom() {
        return window.innerHeight * stopRatio;
    }

    function onStart(e) {
        if (lockedAtTop) return;
        dragging = true;
        startY = getTouchY(e);
        startBottom = parseFloat(getComputedStyle(characterContainer).bottom);
        document.body.style.userSelect = "none";
    }

    function onMove(e) {
        if (!dragging || lockedAtTop) return;
        let deltaY = getTouchY(e) - startY;
        let newBottom = startBottom - deltaY;

        let maxBottom = getMaxBottom();
        if (newBottom < minBottom) newBottom = minBottom;
        if (newBottom > maxBottom) newBottom = maxBottom;
        characterContainer.style.bottom = `${newBottom}px`;

        let ratio = (newBottom - minBottom) / (maxBottom - minBottom);
        let scale = maxScale - (maxScale - minScale) * ratio;
        characterImg.style.transform = `scale(${scale})`;

        if (Math.abs(newBottom - maxBottom) < 2 && !lockedAtTop) {
            characterContainer.style.bottom = `${maxBottom}px`;
            characterImg.style.transform = `scale(${maxScale - (maxScale - minScale) * 1})`;
            lockedAtTop = true;
            if (!photoChanged) {
                characterImg.src = "img/personnage-peur_11zon.webp";
                photoChanged = true;
            }
            if (lightDiscovery) {
                lightDiscovery.style.display = "block";
            }
            if (!lightMessageShown) {
                showLightDialogue(0);
                lightMessageShown = true;
            }
        }
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

    // Clique sur la lumière : redirige vers une nouvelle page
    if (lightDiscovery) {
        lightDiscovery.onclick = function () {
            window.location.href = "yassineindex.html"; // Mets ici le nom de ta nouvelle page
        };
    }
}
