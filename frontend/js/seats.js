// Détection automatique de l'URL de l'API
const API_URL = window.location.origin + '/api';
console.log('🌍 API URL:', API_URL);
console.log('📍 Page origin:', window.location.origin);

let selectedSeats = [];
let tripData = null;
let maxSeats = 1;
const token = localStorage.getItem('token');

// Récupérer l'ID du trajet depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('trip');

console.log('🔍 Trip ID:', tripId);

if (!tripId) {
    alert('Aucun trajet sélectionné');
    window.location.href = '/reservation.html';
}

// Charger les détails du trajet et les sièges
async function loadTripAndSeats() {
    try {
        console.log('📡 Appel API:', `${API_URL}/trips/${tripId}`);
        
        const response = await fetch(`${API_URL}/trips/${tripId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        tripData = await response.json();
        console.log('✅ Données du trajet:', tripData);
        
        displayTripDetails();
        
        if (tripData.seats_available && tripData.seats_available.length > 0) {
            generateSeats(tripData.seats_available);
        } else {
            console.warn('⚠️ Pas de données de sièges, génération de sièges test');
            generateTestSeats(tripData.places_disponibles || 50);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        document.getElementById('tripDetails').innerHTML = `
            <div class="alert alert-danger">
                <strong>Erreur de chargement</strong><br>
                ${error.message}<br>
                <small class="text-muted">URL: ${API_URL}/trips/${tripId}</small>
            </div>
        `;
    }
}

// Générer des sièges de test
function generateTestSeats(capacity) {
    const seats = [];
    const rows = Math.ceil(capacity / 4);
    
    for (let row = 0; row < rows; row++) {
        const rowLetter = String.fromCharCode(65 + row); // A, B, C, D...
        
        for (let col = 1; col <= 4; col++) {
            const seatNumber = row * 4 + col;
            
            if (seatNumber <= capacity) {
                const seatId = `${rowLetter}${col}`;
                
                // Déterminer le statut aléatoirement
                let statut;
                const random = Math.random();
                
                if (random < 0.6) {
                    statut = 'disponible';
                } else if (random < 0.85) {
                    statut = 'reserve';
                } else {
                    statut = 'bloque';
                }
                
                seats.push({
                    numero_siege: seatId,
                    statut: statut
                });
            }
        }
    }
    
    console.log('🎲 Sièges test générés:', seats.length);
    generateSeats(seats);
}

// Afficher les détails du trajet
function displayTripDetails() {
    const detailsHTML = `
        <p><strong>Départ:</strong> ${tripData.depart}</p>
        <p><strong>Destination:</strong> ${tripData.destination}</p>
        <p><strong>Date:</strong> ${new Date(tripData.date_depart).toLocaleString()}</p>
        <p><strong>Véhicule:</strong> ${tripData.modele_vehicule || 'Bus'}</p>
        <p><strong>Places disponibles:</strong> ${tripData.places_disponibles || 'N/A'}</p>
    `;
    document.getElementById('tripDetails').innerHTML = detailsHTML;
    document.getElementById('unitPrice').textContent = tripData.prix || 0;
}

// Générer la grille des sièges
function generateSeats(seats) {
    const container = document.getElementById('seatsContainer');
    if (!container) {
        console.error('❌ Conteneur seatsContainer non trouvé');
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Grouper les sièges par rangée (lettre)
    const rows = {};
    seats.forEach(seat => {
        const match = seat.numero_siege.match(/^([A-Z]+)/);
        const rowLetter = match ? match[1] : 'A';
        if (!rows[rowLetter]) {
            rows[rowLetter] = [];
        }
        rows[rowLetter].push(seat);
    });
    
    // Trier les rangées alphabétiquement
    const sortedRows = Object.keys(rows).sort();
    
    console.log('📊 Rangées trouvées:', sortedRows);
    
    // Générer le HTML des sièges
    let seatsHTML = '';
    
    sortedRows.forEach(rowLetter => {
        const rowSeats = rows[rowLetter];
        
        // Trier les sièges par numéro dans la rangée
        rowSeats.sort((a, b) => {
            const numA = parseInt(a.numero_siege.replace(/[A-Z]+/, ''));
            const numB = parseInt(b.numero_siege.replace(/[A-Z]+/, ''));
            return numA - numB;
        });
        
        console.log(`Rangée ${rowLetter}:`, rowSeats.map(s => s.numero_siege).join(', '));
        
        // Sièges de gauche (positions 1 et 2)
        for (let i = 0; i < Math.min(2, rowSeats.length); i++) {
            seatsHTML += createSeatHTML(rowSeats[i]);
        }
        
        // Allée centrale
        if (rowSeats.length > 2) {
            seatsHTML += '<div class="aisle">ALLÉE</div>';
            
            // Sièges de droite (positions 3 et 4)
            for (let i = 2; i < Math.min(4, rowSeats.length); i++) {
                seatsHTML += createSeatHTML(rowSeats[i]);
            }
        }
    });
    
    container.innerHTML = seatsHTML;
    updateSummary();
    
    console.log('✅ Sièges générés avec succès');
}

// Créer le HTML d'un siège
function createSeatHTML(seat) {
    const status = (seat.statut || 'disponible').toLowerCase().trim();
    let cssClass = 'seat';
    let clickHandler = '';
    let title = `Siège ${seat.numero_siege}`;
    
    if (status === 'reserve' || status === 'réservé') {
        cssClass += ' reserved';
        title += ' - Réservé';
    } else if (status === 'bloque' || status === 'bloqué') {
        cssClass += ' blocked';
        title += ' - Bloqué';
    } else {
        cssClass += ' available';
        title += ' - Disponible';
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
    console.log('🔄 Toggle siège:', seatNumber);
    
    if (element.classList.contains('selected')) {
        // Désélectionner
        element.classList.remove('selected');
        element.classList.add('available');
        selectedSeats = selectedSeats.filter(s => s !== seatNumber);
        console.log('❌ Désélectionné:', seatNumber);
    } else {
        // Vérifier le nombre maximum
        const passagers = parseInt(localStorage.getItem('passagers') || 1);
        if (selectedSeats.length >= passagers) {
            alert(`Vous ne pouvez sélectionner que ${passagers} siège(s)`);
            return;
        }
        // Sélectionner
        element.classList.remove('available');
        element.classList.add('selected');
        selectedSeats.push(seatNumber);
        console.log('✅ Sélectionné:', seatNumber);
    }
    
    updateSummary();
}

// Mettre à jour le résumé
function updateSummary() {
    const count = selectedSeats.length;
    const totalPrice = count * (tripData ? tripData.prix : 0);
    
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);
    
    const seatsList = document.getElementById('selectedSeatsList');
    if (seatsList) {
        if (selectedSeats.length > 0) {
            seatsList.innerHTML = selectedSeats.map(seat => 
                `<span class="badge bg-primary m-1">${seat}</span>`
            ).join(' ');
        } else {
            seatsList.innerHTML = '<span class="text-muted">Aucun siège sélectionné</span>';
        }
    }
    
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.disabled = count === 0;
    }
}

// Confirmer la réservation
document.getElementById('confirmBooking')?.addEventListener('click', async () => {
    if (!token) {
        alert('Veuillez vous connecter pour réserver');
        window.location.href = '/';
        return;
    }
    
    if (selectedSeats.length === 0) {
        alert('Veuillez sélectionner au moins un siège');
        return;
    }
    
    try {
        console.log('📡 Envoi réservation...');
        
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
            localStorage.setItem('lastBooking', JSON.stringify({
                bookingId: data.booking_id,
                tripDetails: tripData,
                seats: selectedSeats,
                totalPrice: data.prix_total
            }));
            
            window.location.href = '/confirmation.html';
        } else {
            alert(data.message || 'Erreur lors de la réservation');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
});

// Debug
function debugSeats() {
    const allSeats = document.querySelectorAll('.seat');
    console.log(`\n🔍 === ANALYSE DES ${allSeats.length} SIÈGES ===`);
    
    const stats = { available: 0, selected: 0, reserved: 0, blocked: 0 };
    
    allSeats.forEach(seat => {
        const text = seat.textContent.trim();
        const classes = seat.className;
        const status = seat.getAttribute('data-status');
        const bgColor = window.getComputedStyle(seat).backgroundColor;
        
        if (classes.includes('available') && !classes.includes('selected')) stats.available++;
        if (classes.includes('selected')) stats.selected++;
        if (classes.includes('reserved')) stats.reserved++;
        if (classes.includes('blocked')) stats.blocked++;
    });
    
    console.log('📊 Statistiques:', stats);
    console.log('================================\n');
}

// Initialiser la page
console.log('🚀 Initialisation de la page sièges...');
loadTripAndSeats();

// Debug après chargement
setTimeout(debugSeats, 2000);