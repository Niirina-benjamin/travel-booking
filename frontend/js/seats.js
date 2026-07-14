// Détection automatique de l'URL de l'API
const API_URL = window.location.origin + "/api";
console.log("🌍 API URL:", API_URL);
console.log("📍 Page origin:", window.location.origin);

let selectedSeats = [];
let tripData = null;
let maxSeats = 1;
const token = localStorage.getItem("token");

// Récupérer l'ID du trajet depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get("trip");

console.log("🔍 Trip ID:", tripId);

if (!tripId) {
  alert("Aucun trajet sélectionné");
  window.location.href = "/reservation.html";
}

// Charger les détails du trajet et les sièges
async function loadTripAndSeats() {
  try {
    console.log("📡 Appel API:", `${API_URL}/trips/${tripId}`);

    const response = await fetch(`${API_URL}/trips/${tripId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    tripData = await response.json();
    console.log("✅ Données du trajet:", tripData);

    displayTripDetails();

    if (tripData.seats_available && tripData.seats_available.length > 0) {
      console.log("✅ Sièges de l'API:", tripData.seats_available.length);
      // Trier les sièges par numéro
      tripData.seats_available.sort((a, b) => {
        const numA = parseInt(a.numero_siege.replace(/\D/g, ""));
        const numB = parseInt(b.numero_siege.replace(/\D/g, ""));
        return numA - numB;
      });
      generateSeats(tripData.seats_available);
    } else {
      console.warn("⚠️ Pas de données de sièges, génération de sièges test");
      generateTestSeats(tripData.places_disponibles || 50);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    document.getElementById("tripDetails").innerHTML = `
            <div class="alert alert-danger">
                <strong>Erreur de chargement</strong><br>
                ${error.message}
            </div>
        `;
    generateTestSeats(50);
  }
}

// Générer des sièges de test
function generateTestSeats(capacity) {
  console.log("🎲 Génération de", capacity, "sièges de test...");

  const seats = [];

  for (let i = 1; i <= capacity; i++) {
    let statut;
    const random = Math.random();

    if (random < 0.6) {
      statut = "disponible";
    } else if (random < 0.85) {
      statut = "reserve";
    } else {
      statut = "bloque";
    }

    seats.push({
      numero_siege: `A${i}`,
      statut: statut,
    });
  }

  console.log("✅ Sièges générés:", seats.length);
  generateSeats(seats);
}

// Afficher les détails du trajet
function displayTripDetails() {
  const detailsHTML = `
        <p><strong>Départ:</strong> ${tripData.depart}</p>
        <p><strong>Destination:</strong> ${tripData.destination}</p>
        <p><strong>Date:</strong> ${new Date(tripData.date_depart).toLocaleString()}</p>
        <p><strong>Véhicule:</strong> ${tripData.modele_vehicule || "Bus"}</p>
        <p><strong>Places disponibles:</strong> ${tripData.places_disponibles || "N/A"}</p>
    `;
  document.getElementById("tripDetails").innerHTML = detailsHTML;
  document.getElementById("unitPrice").textContent = tripData.prix || 0;
}

// Générer la grille des sièges
function generateSeats(seats) {
  console.log("🪑 Génération de la grille pour", seats.length, "sièges");
  console.log(
    "📋 5 premiers:",
    seats.slice(0, 5).map((s) => s.numero_siege),
  );
  console.log(
    "📋 5 derniers:",
    seats.slice(-5).map((s) => s.numero_siege),
  );

  const container = document.getElementById("seatsContainer");
  if (!container) {
    console.error("❌ Conteneur seatsContainer non trouvé");
    return;
  }

  // Vider le conteneur
  container.innerHTML = "";

  // Nombre de sièges par rangée visuelle (2 gauche + 2 droite = 4 par ligne)
  const SEATS_PER_ROW = 4;
  const totalRows = Math.ceil(seats.length / SEATS_PER_ROW);

  console.log("📐 Nombre de lignes visuelles:", totalRows);

  let seatsHTML = "";

  // Générer les sièges ligne par ligne
  for (let row = 0; row < totalRows; row++) {
    const startIndex = row * SEATS_PER_ROW;
    const rowSeats = seats.slice(startIndex, startIndex + SEATS_PER_ROW);

    console.log(
      `📐 Ligne ${row + 1}: sièges ${startIndex + 1} à ${startIndex + rowSeats.length} - ${rowSeats.map((s) => s.numero_siege).join(", ")}`,
    );

    // Sièges de gauche (2 premiers)
    for (let i = 0; i < 2; i++) {
      if (i < rowSeats.length) {
        seatsHTML += createSeatHTML(rowSeats[i]);
      } else {
        // Place vide si moins de 2 sièges à gauche
        seatsHTML += '<div class="seat seat-empty"></div>';
      }
    }

    // Allée centrale
    seatsHTML += '<div class="aisle">ALLÉE</div>';

    // Sièges de droite (2 derniers)
    for (let i = 2; i < 4; i++) {
      if (i < rowSeats.length) {
        seatsHTML += createSeatHTML(rowSeats[i]);
      } else {
        // Place vide si moins de 2 sièges à droite
        seatsHTML += '<div class="seat seat-empty"></div>';
      }
    }
  }

  container.innerHTML = seatsHTML;

  const visibleSeats = container.querySelectorAll(".seat:not(.seat-empty)");
  console.log("✅ Grille générée avec succès");
  console.log("📊 Sièges visibles:", visibleSeats.length);

  updateSummary();

  // Debug après 1 seconde
  setTimeout(debugSeats, 1000);
}

// Créer le HTML d'un siège
function createSeatHTML(seat) {
  const status = (seat.statut || "disponible").toLowerCase().trim();
  let cssClass = "seat";
  let clickHandler = "";
  let title = `Siège ${seat.numero_siege}`;

  if (status === "reserve" || status === "réservé") {
    cssClass += " reserved";
    title += " - Réservé";
  } else if (status === "bloque" || status === "bloqué") {
    cssClass += " blocked";
    title += " - Bloqué";
  } else {
    cssClass += " available";
    title += " - Disponible";
    clickHandler = `onclick="toggleSeat(this, '${seat.numero_siege}')"`;
  }

  return `
        <div class="${cssClass}" 
             data-seat="${seat.numero_siege}"
             data-status="${status}"
             ${clickHandler}
             title="${title}">
            ${seat.numero_siege}
        </div>
    `;
}

// Sélectionner/Désélectionner un siège
function toggleSeat(element, seatNumber) {
  if (element.classList.contains("selected")) {
    element.classList.remove("selected");
    element.classList.add("available");
    selectedSeats = selectedSeats.filter((s) => s !== seatNumber);
  } else {
    const passagers = parseInt(localStorage.getItem("passagers") || 1);
    if (selectedSeats.length >= passagers) {
      alert(`Vous ne pouvez sélectionner que ${passagers} siège(s)`);
      return;
    }
    element.classList.remove("available");
    element.classList.add("selected");
    selectedSeats.push(seatNumber);
  }

  updateSummary();
}

// Mettre à jour le résumé
function updateSummary() {
  const count = selectedSeats.length;
  const totalPrice = count * (tripData ? tripData.prix : 0);

  document.getElementById("selectedCount").textContent = count;
  document.getElementById("totalPrice").textContent = totalPrice.toFixed(2);

  const seatsList = document.getElementById("selectedSeatsList");
  if (seatsList) {
    if (selectedSeats.length > 0) {
      seatsList.innerHTML = selectedSeats
        .map((seat) => `<span class="badge bg-primary m-1">${seat}</span>`)
        .join(" ");
    } else {
      seatsList.innerHTML =
        '<span class="text-muted">Aucun siège sélectionné</span>';
    }
  }

  const confirmBtn = document.getElementById("confirmBooking");
  if (confirmBtn) {
    confirmBtn.disabled = count === 0;
  }
}

// Confirmer la réservation
document
  .getElementById("confirmBooking")
  ?.addEventListener("click", async () => {
    if (!token) {
      alert("Veuillez vous connecter pour réserver");
      window.location.href = "/";
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Veuillez sélectionner au moins un siège");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: tripId,
          seats: selectedSeats,
          nb_passagers: selectedSeats.length,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarder TOUTES les données nécessaires
        localStorage.setItem(
          "lastBooking",
          JSON.stringify({
            bookingId: data.booking_id,
            tripDetails: tripData,
            seats: selectedSeats,
            totalPrice: data.prix_total,
            timestamp: new Date().toISOString(),
          }),
        );

        // Rediriger vers la confirmation
        window.location.href = "/confirmation.html";
      } else {
        alert(data.message || "Erreur lors de la réservation");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("Erreur de connexion au serveur");
    }
  });

// Debug
function debugSeats() {
  const allSeats = document.querySelectorAll("#seatsContainer .seat");
  console.log(`\n🔍 === ANALYSE DES SIÈGES (${allSeats.length} éléments) ===`);

  const stats = {
    available: 0,
    selected: 0,
    reserved: 0,
    blocked: 0,
    empty: 0,
  };

  allSeats.forEach((seat, index) => {
    const text = seat.textContent.trim();
    const classes = seat.className;
    const status = seat.getAttribute("data-status");

    if (classes.includes("seat-empty")) {
      stats.empty++;
      return;
    }

    if (classes.includes("available") && !classes.includes("selected"))
      stats.available++;
    if (classes.includes("selected")) stats.selected++;
    if (classes.includes("reserved")) stats.reserved++;
    if (classes.includes("blocked")) stats.blocked++;

    // Afficher les 5 premiers et 5 derniers
    if (index < 5 || index >= allSeats.length - 5) {
      console.log(`  [${index}] ${text || "(vide)"} - ${classes}`);
    }
  });

  console.log("📊 Statistiques:", stats);
  console.log("================================\n");
}

// Initialiser la page
console.log("🚀 Initialisation de la page sièges...");
loadTripAndSeats();
