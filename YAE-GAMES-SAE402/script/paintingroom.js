const preloadedImg = new Image();
preloadedImg.src = "img/princ_11zon.webp";

// === Dialog management ===
const dialogues = [
    "Phew, we're finally in the painting room.",
    "Help me put the artwork in its place."
];

const finalDialogues = [
    "Thank you for your help, thanks to you the painting has been found!",
    "Thank you for helping me!"
];

let dialogueIndex = 0;
const bubble = document.getElementById('speechBubble');
const characterImg = document.getElementById('characterImg');
const tableau = document.getElementById('tableau');
const dropZone = document.getElementById('dropZone');
const endPopup = document.getElementById('endPopup');
const menuButton = document.getElementById('menuButton');
let gameCompleted = false;
let typingSpeed = 40;
let typingTimeouts = [];
let isTyping = false;
let isTableauPlaced = false;
let showingFinalDialogues = false;
let finalDialogueIndex = 0;

// Adjust sizes based on screen
function adjustTableauSize() {
    const screenWidth = window.innerWidth;
    const baseWidth = 390;
    const scaleFactor = Math.min(screenWidth / baseWidth, 1.5);

    const tableauSize = Math.min(Math.max(150, 180 * scaleFactor), 220);
    tableau.style.width = `${tableauSize}px`;

    const dropZoneSize = Math.min(Math.max(180, 200 * scaleFactor), 250);
    dropZone.style.width = `${dropZoneSize}px`;
    dropZone.style.height = `${dropZoneSize}px`;
}

adjustTableauSize();
window.addEventListener('resize', adjustTableauSize);

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
    bubble.style.opacity = 1;
    if (index < dialogues.length) {
        typeWriter(dialogues[index]);
    } else {
        bubble.style.opacity = 0;
        tableau.style.display = 'block';
        dropZone.classList.add('visible');
        makeTableauDraggable();
    }
}

function showFinalDialogue() {
    clearTyping();
    bubble.style.opacity = 1;
    if (finalDialogueIndex < finalDialogues.length) {
        typeWriter(finalDialogues[finalDialogueIndex], () => {
            // After typing is complete, wait 2 seconds before showing next dialogue
            setTimeout(() => {
                finalDialogueIndex++;
                if (finalDialogueIndex < finalDialogues.length) {
                    showFinalDialogue();
                } else {
                    // All final dialogues shown, show credits
                    bubble.style.opacity = 0;
                    showCredits();
                }
            }, 2000);
        });
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

function showCredits() {
    endPopup.classList.add('visible');
}

function returnToMainMenu() {
    window.location.href = "index.html";
}

document.addEventListener('click', function (e) {
    if (!isTableauPlaced && !e.target.closest('.sidebar') && !e.target.closest('.hamburger-menu') && !e.target.closest('.menu-button')) {
        if (isTyping) {
            clearTyping();
            bubble.textContent = dialogues[dialogueIndex];
            isTyping = false;
        } else {
            nextDialogue();
        }
    }
});

menuButton.addEventListener('click', returnToMainMenu);


showDialogue(0);

function makeTableauDraggable() {
    let isDragging = false;
    let startY, startTop;
    let animationFrame = null;
    const tableauInitialLeft = '50%';
    const tableauInitialTransform = 'translateX(-50%)';

    tableau.style.left = tableauInitialLeft;
    tableau.style.transform = tableauInitialTransform;

    tableau.addEventListener('mousedown', startDrag);
    tableau.addEventListener('touchstart', startDrag, {
        passive: false
    });

    function startDrag(e) {
        if (tableau.classList.contains('placed')) return;
        isDragging = true;
        tableau.style.cursor = 'grabbing';
        const rect = tableau.getBoundingClientRect();
        startTop = rect.top;
        if (e.type === 'mousedown') {
            startY = e.clientY;
        } else if (e.type === 'touchstart') {
            startY = e.touches[0].clientY;
        }
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, {
            passive: false
        });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        let clientY;
        if (e.type === 'mousemove') {
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientY = e.touches[0].clientY;
        }
        const dy = clientY - startY;
        let newTop = startTop + dy;
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - tableau.offsetHeight));
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
            tableau.style.top = `${newTop}px`;
            tableau.style.left = tableauInitialLeft;
            tableau.style.transform = tableauInitialTransform;
        });
        const tableauRect = tableau.getBoundingClientRect();
        const dropZoneRect = dropZone.getBoundingClientRect();
        const isInDropZone =
            tableauRect.left >= dropZoneRect.left &&
            tableauRect.right <= dropZoneRect.right &&
            tableauRect.top >= dropZoneRect.top &&
            tableauRect.bottom <= dropZoneRect.bottom;
        if (isInDropZone) {
            dropZone.style.borderColor = 'rgba(74, 222, 128, 0.5)';
        } else {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        tableau.style.cursor = 'grab';
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        const tableauRect = tableau.getBoundingClientRect();
        const dropZoneRect = dropZone.getBoundingClientRect();
        const isInDropZone =
            tableauRect.left >= dropZoneRect.left &&
            tableauRect.right <= dropZoneRect.right &&
            tableauRect.top >= dropZoneRect.top &&
            tableauRect.bottom <= dropZoneRect.bottom;
        if (isInDropZone) {
            tableau.classList.add('placed');
            tableau.style.transition = 'top 0.3s cubic-bezier(.4,2,.6,1), left 0.3s cubic-bezier(.4,2,.6,1)';
            const dropZoneCenterY = dropZoneRect.top + (dropZoneRect.height - tableauRect.height) / 2;
            const dropZoneCenterX = dropZoneRect.left + (dropZoneRect.width - tableauRect.width) / 2;
            tableau.style.top = `${dropZoneCenterY}px`;
            tableau.style.left = `${dropZoneCenterX}px`;
            tableau.style.transform = 'none';

            setTimeout(() => {
                tableau.style.transition = '';
                dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                isTableauPlaced = true;
                dropZone.classList.remove('visible');
                // Lance automatiquement les dialogues finaux
                showingFinalDialogues = true;
                showFinalDialogue();
            }, 350);
        } else {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
    }
}