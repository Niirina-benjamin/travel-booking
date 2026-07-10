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
                // Ajouter le token si disponible
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        tripData = await response.json();
        console.log('✅ Données du trajet:', tripData);
        
        displayTripDetails();
        
        if (tripData.seats_available) {
            generateSeats(tripData.seats_available);
        } else {
            // Si pas de sièges dans la réponse, générer des sièges factices pour tester
            console.warn('⚠️ Pas de données de sièges, génération de sièges test');
            generateTestSeats(tripData.places_disponibles || 50);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors du chargement des sièges. Veuillez réessayer.');
        
        // Afficher un message d'erreur détaillé
        document.getElementById('tripDetails').innerHTML = `
            <div class="alert alert-danger">
                <strong>Erreur de chargement</strong><br>
                ${error.message}<br>
                <small class="text-muted">URL: ${API_URL}/trips/${tripId}</small>
            </div>
        `;
    }
}

// Générer des sièges de test si l'API ne renvoie pas de sièges
// Générer des sièges de test avec différents statuts
function generateTestSeats(capacity) {
    const seats = [];
    const rows = Math.ceil(capacity / 4);
    let seatNumber = 1;
    
    for (let row = 1; row <= rows; row++) {
        for (let col = 0; col < 4; col++) {
            if (seatNumber <= capacity) {
                const seatId = `${String.fromCharCode(64 + row)}${col + 1}`;
                
                // Déterminer le statut aléatoirement
                let statut;
                const random = Math.random();
                
                if (random < 0.6) {
                    statut = 'disponible';  // 60% disponibles
                } else if (random < 0.8) {
                    statut = 'reserve';     // 20% réservés
                } else {
                    statut = 'bloque';      // 20% bloqués
                }
                
                seats.push({
                    numero_siege: seatId,
                    statut: statut
                });
                
                seatNumber++;
            }
        }
    }
    
    console.log('🎲 Sièges test générés:');
    console.log('  - Disponibles:', seats.filter(s => s.statut === 'disponible').length);
    console.log('  - Réservés:', seats.filter(s => s.statut === 'reserve').length);
    console.log('  - Bloqués:', seats.filter(s => s.statut === 'bloque').length);
    
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
// Générer la grille des sièges
// Générer la grille des sièges avec disposition correcte
// Générer des sièges de test avec disposition correcte
function generateSeats(seats) {
    const container = document.getElementById('seatsContainer');
    if (!container) return;
    
    // Créer la structure de base
    container.innerHTML = `
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #28a745;"></div>
                <span>Disponible</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #007bff;"></div>
                <span>Sélectionné</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #dc3545;"></div>
                <span>Réservé</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #6c757d;"></div>
                <span>Bloqué</span>
            </div>
        </div>
        <div class="bus-front">🚌 Avant du bus</div>
        <div class="seats-grid" id="seatsGrid"></div>
        <div class="bus-back">Arrière du bus 🚌</div>
    `;
    
    const seatsGrid = document.getElementById('seatsGrid');
    
    // Grouper par rangée
    const rows = {};
    seats.forEach(seat => {
        const match = seat.numero_siege.match(/^([A-Z]+)/);
        const row = match ? match[1] : 'A';
        if (!rows[row]) rows[row] = [];
        rows[row].push(seat);
    });
    
    // Trier les rangées
    const sortedRows = Object.keys(rows).sort();
    
    // Générer les sièges
    sortedRows.forEach(rowLetter => {
        const rowSeats = rows[rowLetter];
        
        // Trier par numéro
        rowSeats.sort((a, b) => {
            const numA = parseInt(a.numero_siege.replace(/[A-Z]+/, ''));
            const numB = parseInt(b.numero_siege.replace(/[A-Z]+/, ''));
            return numA - numB;
        });
        
        // 2 sièges gauche
        for (let i = 0; i < Math.min(2, rowSeats.length); i++) {
            seatsGrid.innerHTML += createSeatHTML(rowSeats[i]);
        }
        
        // Allée si on a des sièges à droite
        if (rowSeats.length > 2) {
            seatsGrid.innerHTML += '<div class="aisle">ALLÉE</div>';
            
            // 2 sièges droite
            for (let i = 2; i < Math.min(4, rowSeats.length); i++) {
                seatsGrid.innerHTML += createSeatHTML(rowSeats[i]);
            }
        }
    });
    
    updateSummary();
}

function createSeatHTML(seat) {
    const status = (seat.statut || '').toLowerCase();
    let cssClass = 'seat available';
    let clickable = 'onclick="toggleSeat(this, \'' + seat.numero_siege + '\')"';
    
    if (status === 'reserve' || status === 'réservé') {
        cssClass = 'seat reserved';
        clickable = '';
    } else if (status === 'bloque' || status === 'bloqué') {
        cssClass = 'seat blocked';
        clickable = '';
    }
    
    return `
        <div class="${cssClass}" 
             data-seat="${seat.numero_siege}"
             data-status="${status}"
             ${clickable}
             title="Siège ${seat.numero_siege}">
            ${seat.numero_siege}
        </div>
    `;
}

// Créer un élément siège
function createSeatElement(seat) {
    const status = (seat.statut || 'disponible').toLowerCase().trim();
    let statusClass = 'available';
    let isClickable = true;
    
    switch(status) {
        case 'reserve':
        case 'réservé':
            statusClass = 'reserved';
            isClickable = false;
            break;
        case 'bloque':
        case 'bloqué':
            statusClass = 'blocked';
            isClickable = false;
            break;
        case 'disponible':
        default:
            statusClass = 'available';
            isClickable = true;
            break;
    }
    
    const clickHandler = isClickable 
        ? `onclick="toggleSeat(this, '${seat.numero_siege}')"` 
        : '';
    
    const title = isClickable 
        ? `Siège ${seat.numero_siege} - Disponible` 
        : `Siège ${seat.numero_siege} - ${status}`;
    
    return `
        <div class="seat ${statusClass}" 
             id="seat-${seat.numero_siege}"
             data-seat="${seat.numero_siege}"
             data-status="${status}"
             ${clickHandler}
             title="${title}">
            ${seat.numero_siege}
        </div>
    `;
}

// Fonction pour obtenir la classe CSS (gardée pour compatibilité)
function getStatusClass(status) {
    if (!status) return 'available';
    
    const normalizedStatus = status.toLowerCase().trim();
    
    switch(normalizedStatus) {
        case 'reserve':
        case 'réservé':
            return 'reserved';
        case 'bloque':
        case 'bloqué':
            return 'blocked';
        case 'disponible':
        default:
            return 'available';
    }
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
    }
    
    updateSummary();
}

// Mettre à jour le résumé
function updateSummary() {
    const count = selectedSeats.length;
    const totalPrice = count * (tripData ? tripData.prix : 0);
    
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('totalPrice').textContent = totalPrice;
    
    const seatsList = document.getElementById('selectedSeatsList');
    if (seatsList) {
        seatsList.innerHTML = selectedSeats.map(seat => 
            `<span class="badge bg-primary m-1">${seat}</span>`
        ).join(' ');
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
            // Stocker les infos pour la confirmation
            localStorage.setItem('lastBooking', JSON.stringify({
                bookingId: data.booking_id,
                tripDetails: tripData,
                seats: selectedSeats,
                totalPrice: data.prix_total
            }));
            
            // Rediriger vers la confirmation
            window.location.href = '/confirmation.html';
        } else {
            alert(data.message || 'Erreur lors de la réservation');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
});

// Initialiser la page
console.log('🚀 Initialisation de la page sièges...');
loadTripAndSeats();

// Fonction de débogage
function debugSeats() {
    const allSeats = document.querySelectorAll('.seat');
    console.log('🔍 Analyse des sièges:');
    
    const stats = {
        available: 0,
        selected: 0,
        reserved: 0,
        blocked: 0
    };
    
    allSeats.forEach(seat => {
        const classes = seat.className;
        const dataStatus = seat.getAttribute('data-status');
        const bgColor = window.getComputedStyle(seat).backgroundColor;
        
        console.log(`Siège ${seat.textContent.trim()}:`);
        console.log(`  Classes: ${classes}`);
        console.log(`  Data-status: ${dataStatus}`);
        console.log(`  Couleur de fond: ${bgColor}`);
        
        if (classes.includes('available')) stats.available++;
        if (classes.includes('selected')) stats.selected++;
        if (classes.includes('reserved')) stats.reserved++;
        if (classes.includes('blocked')) stats.blocked++;
    });
    
    console.log('📊 Statistiques:', stats);
    return stats;
}

// Appeler après la génération des sièges
// Ajoutez cette ligne après generateSeats()
setTimeout(debugSeats, 1000);