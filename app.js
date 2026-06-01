import { 
  collection, 
  getDocs, 
  addDoc, 
  query,
  orderBy,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =====================
// MAPA
// =====================
let map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

let selectedPoint = null;

map.on('click', function(e) {
  selectedPoint = e.latlng;

  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  L.marker(selectedPoint).addTo(map);
});

// =====================
// PANTALLAS   oculta todas las pantallas menos la que pongas en screen
// =====================
function showScreen(screen) {
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenGame").style.display = "none";
  document.getElementById("screenMap").style.display = "none";

  document.getElementById(screen).style.display = "block";
}

// =====================
// CARGAR JUGADORES (clickar un jugador)
// =====================
async function loadPlayers() {
  const snapshot = await getDocs(collection(window.db, "players"));
  const container = document.getElementById("screenSelect");

  snapshot.forEach((docSnap) => {
    const player = docSnap.data();

    const card = document.createElement("div");
    card.style.border = "1px solid black";
    card.style.display = "inline-block";
    card.style.margin = "10px";
    card.style.padding = "10px";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <img src="${player.img || ''}" 
        style="width:100px;height:100px;object-fit:cover;background:#ddd;">
      <br><b>${player.name}</b>
    `;
    card.onclick = () => selectPlayer(docSnap.id, player.name);

    container.appendChild(card);
  });
}

// =====================
// SELECCIONAR JUGADOR
// =====================
function selectPlayer(id, name) {
  localStorage.setItem("playerId", id);
  localStorage.setItem("playerName", name); 

  document.getElementById("playerName").innerText = name;

  showScreen("screenGame");
  listenToRankingAndScore(); 
}

// =====================
// SCORE Y CLASIFICACIÓN EN TIEMPO REAL
// =====================
function listenToRankingAndScore() {
  let playerId = localStorage.getItem("playerId");
  
  const q = query(collection(window.db, "players"), orderBy("score", "desc"));

  onSnapshot(q, (snapshot) => {
    let listaJugadores = [];
    snapshot.forEach((docSnap) => {
      listaJugadores.push({ id: docSnap.id, ...docSnap.data() });
    });

    // NUEVO ELEMENTO: Buscamos el contenedor de la tabla en el HTML
    const tablaContenedor = document.getElementById("listaRankingCompleta");
    
    // Si la tabla existe en tu HTML actual, la limpiamos y la rellenamos
    if (tablaContenedor) {
      tablaContenedor.innerHTML = ""; // Borramos el contenido viejo para actualizarlo

      listaJugadores.forEach((jugador, index) => {
        const fila = document.createElement("tr");
        
        fila.innerHTML = `
          <td>#${index + 1}</td>
          <td>${jugador.name}</td>
          <td>${jugador.score} pts</td>
        `;

        // Pequeño detalle: si la fila corresponde a mi usuario, la destacamos un poco
        if (jugador.id === playerId) {
          fila.style.backgroundColor = "#e0f7fa";
          fila.style.fontWeight = "bold";
        }

        tablaContenedor.appendChild(fila);
      });
    }

    // Encontrar qué índice ocupa el jugador actual en el array ordenado
    const miIndex = listaJugadores.findIndex(j => j.id === playerId);

    if (miIndex !== -1) {
      const misDatos = listaJugadores[miIndex];

      // 1. Mostrar puntos actuales
      document.getElementById("score").innerText = misDatos.score;
      
      // 2. Mostrar indicador numérico de posición
      document.getElementById("rankingPosition").innerText = `#${miIndex + 1}`;

      // 3. Calcular cantidad de puntos respecto al siguiente
      const infoSiguiente = document.getElementById("nextPlayerInfo");
      if (miIndex > 0) {
        const rivalArriba = listaJugadores[miIndex - 1];
        const diferencia = rivalArriba.score - misDatos.score;
        infoSiguiente.innerText = `Te faltan ${diferencia} pts para adelantar a ${rivalArriba.name} 🚀`;
      } else {
        infoSiguiente.innerText = "¡Vas en 1ª posición! Conserva el liderato 👑";
      }
    }
  });
}

// =====================
// IR AL MAPA
// =====================
function goToMap() {
  showScreen("screenMap");
  setTimeout(() => { map.invalidateSize(); }, 100);
}

// =====================
// ENVIAR RESPUESTA 
// =====================
async function sendGuess() {
  let playerId = localStorage.getItem("playerId");

  if (!playerId) {
    alert("Selecciona un jugador primero");
    return;
  }

  if (!selectedPoint) {
    alert("Selecciona un punto en el mapa");
    return;
  }

  await addDoc(collection(window.db, "responses"), {
    playerId: playerId,
    lat: selectedPoint.lat,
    lng: selectedPoint.lng,
    createdAt: Date.now()
  });

  document.getElementById("status").innerText = "Respuesta enviada ✔";

  showScreen("screenGame");
}

// =====================
// INIT
// =====================
window.onload = () => {
  loadPlayers();
  showScreen("screenSelect");
};

window.selectPlayer = selectPlayer;
window.goToMap = goToMap;
window.sendGuess = sendGuess;