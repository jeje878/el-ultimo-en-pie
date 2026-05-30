// Cargar jugadores de Firebase
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
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
// PANTALLAS
// =====================
function showScreen(screen) {
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenGame").style.display = "none";
  document.getElementById("screenMap").style.display = "none";

  document.getElementById(screen).style.display = "block";
}


// =====================
// CARGAR JUGADORES
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
      <b>${player.name}</b>
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

  document.getElementById("playerName").innerText = name;

  showScreen("screenGame");
  loadPlayerScore(id);
}


// =====================
// SCORE EN TIEMPO REAL
// =====================
function loadPlayerScore(id) {
  const ref = doc(window.db, "players", id);

  onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      document.getElementById("score").innerText =
        snap.data().score;
    }
  });
}


// =====================
// IR AL MAPA
// =====================
function goToMap() {
  showScreen("screenMap");
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

  document.getElementById("status").innerText =
    "Respuesta enviada ✔";

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