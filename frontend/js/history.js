// ==========================================
// HISTORY.JS - CORRIGÉ (sans doublons)
// ==========================================

// ⚠️ API_URL et token sont déjà déclarés dans script.js
// Utiliser les variables globales si elles existent
const API_BASE = typeof API_URL !== 'undefined' ? API_URL : (window.location.origin + "/api");
const AUTH_TOKEN = typeof token !== 'undefined' ? token : localStorage.getItem("token");
let currentRating = 0;

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
    console.log("📋 Page historique chargée");

    if (!AUTH_TOKEN) {
        alert("Veuillez vous connecter pour voir votre historique");
        window.location.href = "/";
        return;
    }

    initStarEvents();
    loadBookings();
});

// ============ CHARGEMENT DES RÉSERVATIONS ============
async function loadBookings() {
    console.log("📡 Chargement des réservations...");
    try {
        const response = await fetch(`${API_BASE}/bookings`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${AUTH_TOKEN}`,
            },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const bookings = await response.json();
        console.log("✅ Réservations trouvées:", bookings.length);
        displayBookings(bookings);
    } catch (error) {
        console.error("❌ Erreur:", error);
        document.getElementById("bookingsList").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Erreur lors du chargement.
                <br><small>${error.message}</small>
            </div>`;
    }
}

// ============ AFFICHAGE DES RÉSERVATIONS ============
function displayBookings(bookings) {
    const container = document.getElementById("bookingsList");
    const noBookings = document.getElementById("noBookings");

    if (!bookings || bookings.length === 0) {
        if (noBookings) noBookings.style.display = "block";
        if (container) container.innerHTML = "";
        return;
    }

    if (noBookings) noBookings.style.display = "none";

    container.innerHTML = bookings.map((booking) => {
        const statusClass = getStatusClass(booking.statut);
        const statusLabel = booking.statut || "En attente";
        const canCancel = booking.statut === "en_attente" || booking.statut === "confirme";

        return `
        <div class="booking-card ${statusClass}">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-lg-7">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <span class="status-badge status-${statusClass}">${statusLabel}</span>
                            <small class="text-muted">Réservation #${booking.id}</small>
                        </div>
                        <h4 class="route-display">
                            ${booking.depart || '---'} 
                            <i class="fas fa-arrow-right route-arrow"></i> 
                            ${booking.destination || '---'}
                        </h4>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <p class="mb-1"><i class="fas fa-calendar-alt text-primary"></i> <strong>Départ :</strong> ${formatDate(booking.date_depart)}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><i class="fas fa-calendar-check text-primary"></i> <strong>Arrivée :</strong> ${formatDate(booking.date_arrivee)}</p>
                            </div>
                        </div>
                        <p class="mt-2 mb-0">
                            <i class="fas fa-chair text-primary"></i> <strong>Sièges :</strong>
                            ${booking.seats ? booking.seats.split(",").map(s => `<span class="seat-badge">${s.trim()}</span>`).join(" ") : '<span class="text-muted">Non spécifié</span>'}
                        </p>
                    </div>
                    <div class="col-lg-5 text-lg-end mt-3 mt-lg-0">
                        <div class="price-display mb-2">${parseFloat(booking.prix_total || 0).toFixed(2)} €</div>
                        <p class="text-muted small mb-3">Réservé le ${formatDate(booking.date_reservation)}</p>
                        <div class="d-flex gap-2 justify-content-lg-end flex-wrap">
                            ${canCancel ? `<button class="btn btn-outline-danger btn-action" onclick="cancelBooking(${booking.id})"><i class="fas fa-times me-1"></i>Annuler</button>` : ''}
                            <button class="btn btn-outline-primary btn-action" onclick="viewDetails(${booking.id})"><i class="fas fa-eye me-1"></i>Détails</button>
                            <button class="btn btn-outline-warning btn-action" onclick="openReviewModal(${booking.trip_id || 1}, ${booking.id})"><i class="fas fa-star me-1"></i>Noter</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join("");
}

// ============ ANNULATION ============
async function cancelBooking(bookingId) {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
        });
        const data = await response.json();
        if (response.ok) {
            alert("✅ Réservation annulée");
            loadBookings();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Erreur:", error);
    }
}

// ============ DÉTAILS ============
function viewDetails(bookingId) {
    window.location.href = `/confirmation.html?booking=${bookingId}`;
}

// ============ AVIS / ÉTOILES ============
function initStarEvents() {
    const stars = document.querySelectorAll("#starRating i");
    stars.forEach((star) => {
        star.addEventListener("click", function () {
            setRating(parseInt(this.getAttribute("data-rating")));
        });
        star.addEventListener("mouseenter", function () {
            highlightStars(parseInt(this.getAttribute("data-rating")));
        });
        star.addEventListener("mouseleave", function () {
            highlightStars(currentRating);
        });
    });
}

function highlightStars(rating) {
    document.querySelectorAll("#starRating i").forEach((star, index) => {
        star.className = index < rating ? "fas fa-star text-warning" : "far fa-star text-warning";
    });
}

function openReviewModal(tripId, bookingId) {
    document.getElementById("reviewTripId").value = tripId;
    document.getElementById("reviewBookingId").value = bookingId;
    currentRating = 0;
    highlightStars(0);
    document.getElementById("reviewRating").value = 0;
    document.getElementById("reviewComment").value = "";
    document.getElementById("ratingText").textContent = "Cliquez sur une étoile pour noter";
    new bootstrap.Modal(document.getElementById("reviewModal")).show();
}

function setRating(rating) {
    currentRating = rating;
    document.getElementById("reviewRating").value = rating;
    highlightStars(rating);
    const texts = ["", "Très mauvais 😡", "Mauvais 😟", "Moyen 😐", "Bon 😊", "Excellent 🤩"];
    document.getElementById("ratingText").textContent = texts[rating];
}

// ============ SOUMISSION AVIS ============
document.getElementById("reviewForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (currentRating === 0) { alert("Sélectionnez une note"); return; }

    try {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
            body: JSON.stringify({
                trip_id: document.getElementById("reviewTripId").value,
                booking_id: document.getElementById("reviewBookingId").value,
                rating: currentRating,
                comment: document.getElementById("reviewComment").value,
            }),
        });
        const result = await response.json();
        if (response.ok) {
            alert("✅ Avis publié !");
            bootstrap.Modal.getInstance(document.getElementById("reviewModal")).hide();
            loadBookings();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Erreur:", error);
    }
});

// ============ EXPORT CSV ============
async function exportCSV() {
    try {
        const response = await fetch(`${API_BASE}/exports/bookings/csv`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mes_reservations.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        alert("Erreur lors de l'export");
    }
}

// ============ UTILITAIRES ============
function formatDate(dateString) {
    if (!dateString) return "---";
    try {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return dateString; }
}

function getStatusClass(statut) {
    switch (statut) {
        case "confirme": return "confirmed";
        case "en_attente": return "pending";
        case "annule": return "cancelled";
        default: return "pending";
    }
}

function getStatusBadge(statut) {
    switch (statut) {
        case "confirme": return "bg-success";
        case "en_attente": return "bg-warning text-dark";
        case "annule": return "bg-danger";
        case "termine": return "bg-secondary";
        default: return "bg-info";
    }
}