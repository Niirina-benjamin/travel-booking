const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://travel-booking-api.onrender.com/api';

let selectedSeats = [];
let tripData = null;
let maxSeats = 1;
const token = localStorage.getItem('token');

// Récupérer l'ID du trajet depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('trip');

if (!tripId) {
    window.location.href = 'reservation.html';
}

// Charger les détails du trajet et les sièges
async function loadTripAndSeats() {
    try {
        const response = await fetch(`${API_URL}/trips/${tripId}`);
        tripData = await response.json();
        
        displayTripDetails();
        generateSeats(tripData.seats_available);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des sièges');
    }
}

// Afficher les détails du trajet
function displayTripDetails() {
    const detailsHTML = `
        <p><strong>Départ:</strong> ${tripData.depart}</p>
        <p><strong>Destination:</strong> ${tripData.destination}</p>
        <p><strong>Date:</strong> ${new Date(tripData.date_depart).toLocaleString()}</p>
        <p><strong>Véhicule:</strong> ${tripData.modele_vehicule}</p>
        <p><strong>Places disponibles:</strong> ${tripData.places_disponibles}</p>
    `;
    document.getElementById('tripDetails').innerHTML = detailsHTML;
    document.getElementById('unitPrice').textContent = tripData.prix;
}

// Générer la grille des sièges
function generateSeats(seats) {
    const container = document.getElementById('seatsContainer');
    let seatsHTML = '';
    
    seats.forEach((seat, index) => {
        // Ajouter une allée tous les 2 sièges
        if (index % 4 === 2) {
            seatsHTML += '<div class="aisle">ALLÉE</div>';
        }
        
        const statusClass = getStatusClass(seat.statut);
        const clickable = seat.statut === 'disponible' ? 'onclick="toggleSeat(this, \'' + seat.numero_siege + '\')"' : '';
        
        seatsHTML += `
            <div class="seat ${statusClass}" 
                 id="seat-${seat.numero_siege}"
                 data-seat="${seat.numero_siege}"
                 ${clickable}>
                ${seat.numero_siege}
            </div>
        `;
    });
    
    container.innerHTML = seatsHTML;
    updateSummary();
}

// Obtenir la classe CSS selon le statut
function getStatusClass(status) {
    switch(status) {
        case 'disponible': return 'available';
        case 'reserve': return 'reserved';
        case 'bloque': return 'blocked';
        default: return 'available';
    }
}

// Sélectionner/Désélectionner un siège
function toggleSeat(element, seatNumber) {
    if (element.classList.contains('selected')) {
        // Désélectionner
        element.classList.remove('selected');
        element.classList.add('available');
        selectedSeats = selectedSeats.filter(s => s !== seatNumber);
    } else {
        // Vérifier le nombre maximum de sièges
        if (selectedSeats.length >= maxSeats) {
            alert(`Vous ne pouvez sélectionner que ${maxSeats} siège(s)`);
            return;
        }
        // Sélectionner
        element.classList.remove('available');
        element.classList.add('selected');
        selectedSeats.push(seatNumber);
    }
    
    updateSummary();
}

// Mettre à jour le résumé
function updateSummary() {
    const count = selectedSeats.length;
    const totalPrice = count * (tripData ? tripData.prix : 0);
    
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('totalPrice').textContent = totalPrice;
    
    // Afficher les sièges sélectionnés
    const seatsList = document.getElementById('selectedSeatsList');
    seatsList.innerHTML = selectedSeats.map(seat => 
        `<span class="badge bg-primary">${seat}</span>`
    ).join(' ');
    
    // Activer/Désactiver le bouton de confirmation
    document.getElementById('confirmBooking').disabled = count === 0;
}

// Confirmer la réservation
document.getElementById('confirmBooking').addEventListener('click', async () => {
    if (!token) {
        alert('Veuillez vous connecter pour réserver');
        window.location.href = 'index.html';
        return;
    }
    
    if (selectedSeats.length === 0) {
        alert('Veuillez sélectionner au moins un siège');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                trip_id: tripId,
                seats: selectedSeats,
                nb_passagers: selectedSeats.length
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Afficher la confirmation
            document.getElementById('bookingNumber').textContent = data.booking_id;
            const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
            modal.show();
            
            // Stocker les infos pour la page de confirmation
            localStorage.setItem('lastBooking', JSON.stringify({
                bookingId: data.booking_id,
                tripDetails: tripData,
                seats: selectedSeats,
                totalPrice: data.prix_total
            }));
        } else {
            alert(data.message || 'Erreur lors de la réservation');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
});

// Initialiser la page
loadTripAndSeats();