(() => {
    // Tes trois points Game
    const targets = [
      { lat: 47.7475728399376, lng: 7.333419374726824, label: "Game 1 – Jardin des senteurs" },
      { lat: 47.747640004233766, lng: 7.334047624323847, label: "Game 2 – Rue des Franciscains" },
      { lat: 47.74575010580514,   lng: 7.338339147572666, label: "Game 3 – Musée des Beaux-Arts" }
    ];
  
    let map, routingControl, userCircle, watchId;
  
    function initMinimap() {
      if (map) return;
      map = L.map('minimap-map').setView([targets[0].lat, targets[0].lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
  
      // Place les marqueurs “Game” et affiche en permanence leur label
      targets.forEach((t, i) => {
        const icon = L.divIcon({
          className: 'game-div-icon',
          html: i + 1,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        L.marker([t.lat, t.lng], { icon })
          .addTo(map)
          .bindTooltip(
            t.label,           // Texte complet : "Game X – Lieu"
            {
              permanent: true,
              direction: 'top',
              offset: [0, -20],
              className: 'game-tooltip'
            }
          );
      });
  
      routingControl = L.Routing.control({
        waypoints: [],
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        draggableWaypoints: false,
        collapsible: true
      }).addTo(map);
    }
  
    function openMinimap() {
      document.getElementById('minimap-modal').classList.remove('hidden');
      initMinimap();
      setTimeout(() => map.invalidateSize(), 200);
  
      if (watchId) navigator.geolocation.clearWatch(watchId);
      watchId = navigator.geolocation.watchPosition(onPosition, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }
  
    function onPosition(pos) {
      const { latitude, longitude } = pos.coords;
      if (userCircle) {
        userCircle.setLatLng([latitude, longitude]);
      } else {
        userCircle = L.circleMarker([latitude, longitude], {
          radius: 8,
          className: 'user-circle'
        })
        .addTo(map)
        .bindTooltip("Votre localisation", {
          permanent: true,
          direction: 'top',
          className: 'user-tooltip'
        });
      }
  
      const waypoints = [
        L.latLng(latitude, longitude),
        ...targets.map(t => L.latLng(t.lat, t.lng))
      ];
      routingControl.setWaypoints(waypoints);
    }
  
    function onError(err) {
      console.error("Géoloc impossible :", err);
      alert("Impossible de te localiser : " + err.message);
    }
  
    function closeMinimap() {
      document.getElementById('minimap-modal').classList.add('hidden');
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    }
  
    // Listeners
    document.querySelectorAll('.map-button').forEach(btn =>
      btn.addEventListener('click', openMinimap)
    );
    document.querySelector('.minimap-close').addEventListener('click', closeMinimap);
    document.querySelector('.minimap-backdrop').addEventListener('click', closeMinimap);
  })();
  
const ham = document.getElementById('hamburger');
const sb  = document.getElementById('sidebar');
ham.addEventListener('click', e => {
  e.stopPropagation();
  ham.classList.toggle('active');
  sb.classList.toggle('active');
});
document.addEventListener('click', () => {
  if (sb.classList.contains('active')) {
    ham.classList.remove('active');
    sb.classList.remove('active');
  }
});

