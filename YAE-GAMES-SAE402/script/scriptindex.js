// === Menu hamburger ===
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
hamburger.addEventListener('click', function (e) {
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    e.stopPropagation();
});

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');

    // Gestion du clic sur l'icône hamburger
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        sidebar.classList.toggle('active');
        
        // Bloque le défilement de la page quand le menu est ouvert
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : 'auto';
    });

    // Fermeture du menu au clic extérieur
    document.addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            hamburger.classList.remove('active');
            sidebar.classList.remove('active');
            document.body.style.overflow = 'auto'; // Rétablit le défilement
        }
    });

    // Empêcher la fermeture quand on clique dans le menu
    sidebar.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Gestion des clics sur les éléments du menu
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Fermeture automatique
            sidebar.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = 'auto'; // Rétablit le défilement
            
            // Logique spécifique à l'élément (ex: navigation)
            handleMenuItemAction(this);
        });
    });

    // Gestion personnalisée des actions
    function handleMenuItemAction(clickedItem) {
        const itemText = clickedItem.textContent.trim();
        console.log('Menu sélectionné:', itemText);
        
        // Exemple de redirection (à adapter)
        const target = clickedItem.dataset.target;
        if (target) {
            window.location.href = target;
        }
    }
});
