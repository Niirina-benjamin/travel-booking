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
function generateSeats(seats) {
    const container = document.getElementById('seatsContainer');
    if (!container) {
        console.error('❌ Conteneur de sièges non trouvé');
        return;
    }
    
    console.log('🪑 Génération des sièges:', seats.length, 'sièges');
    
    let seatsHTML = '';
    
    // Ajouter la légende
    seatsHTML += `
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: #28a745;"></div>
                <span>Disponible</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #007bff;"></div>
                <span>Sélectionné</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #dc3545;"></div>
                <span>Réservé</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #6c757d;"></div>
                <span>Bloqué</span>
            </div>
        </div>
    `;
    
    seats.forEach((seat, index) => {
        // Ajouter une allée après chaque 2 sièges
        if (index % 4 === 2) {
            seatsHTML += '<div class="aisle">COULOIR</div>';
        }
        
        // Déterminer la classe CSS selon le statut
        let statusClass = 'available';
        let isClickable = true;
        
        // Normaliser le statut (au cas où il y aurait des variations)
        const status = (seat.statut || '').toLowerCase().trim();
        
        console.log(`Siège ${seat.numero_siege} - Statut: "${status}"`);
        
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
        
        seatsHTML += `
            <div class="seat ${statusClass}" 
                 id="seat-${seat.numero_siege}"
                 data-seat="${seat.numero_siege}"
                 data-status="${status}"
                 ${clickHandler}
                 title="Siège ${seat.numero_siege} - ${status}">
                ${seat.numero_siege}
                ${!isClickable ? '<span class="passenger-tag">✕</span>' : ''}
            </div>
        `;
    });
    
    container.innerHTML = seatsHTML;
    updateSummary();
    
    console.log('✅ Sièges générés avec succès');
}

// Fonction pour obtenir la classe CSS (fallback)
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