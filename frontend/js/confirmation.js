// Configuration
const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');

// Éléments DOM
const loadingSpinner = document.getElementById('loadingSpinner');
const confirmationContent = document.getElementById('confirmationContent');

// Données de réservation
let bookingData = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page de confirmation chargée');
    
    // Récupérer les données de réservation
    const storedBooking = localStorage.getItem('lastBooking');
    
    if (storedBooking) {
        bookingData = JSON.parse(storedBooking);
        console.log('✅ Données de réservation trouvées:', bookingData);
        displayConfirmation();
    } else {
        // Essayer de récupérer depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking');
        
        if (bookingId && token) {
            loadBookingFromAPI(bookingId);
        } else {
            showNoBookingFound();
        }
    }
});

// Charger la réservation depuis l'API
async function loadBookingFromAPI(bookingId) {
    try {
        console.log('📡 Chargement réservation #' + bookingId);
        
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            bookingData = {
                bookingId: data.id,
                tripDetails: data,
                seats: data.seats ? data.seats.split(',') : [],
                totalPrice: data.prix_total
            };
            displayConfirmation();
        } else {
            showNoBookingFound();
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        showNoBookingFound();
    }
}

// Afficher la confirmation
function displayConfirmation() {
    // Masquer le loader
    loadingSpinner.style.display = 'none';
    confirmationContent.style.display = 'block';
    
    // Remplir les informations
    document.getElementById('bookingRef').textContent = '#' + bookingData.bookingId;
    document.getElementById('departValue').textContent = bookingData.tripDetails.depart;
    document.getElementById('destinationValue').textContent = bookingData.tripDetails.destination;
    document.getElementById('dateDepartValue').textContent = formatDate(bookingData.tripDetails.date_depart);
    document.getElementById('dateArriveeValue').textContent = formatDate(bookingData.tripDetails.date_arrivee);
    
    // Afficher les sièges
    displaySeats(bookingData.seats);
    
    // Nombre de passagers
    document.getElementById('nbPassagers').textContent = bookingData.seats.length;
    
    // Calculs financiers
    const prixUnitaire = bookingData.tripDetails.prix || 0;
    const nbSieges = bookingData.seats.length;
    const sousTotal = prixUnitaire * nbSieges;
    const taxes = sousTotal * 0.1; // 10% de taxes
    const total = sousTotal + taxes;
    
    document.getElementById('prixUnitaire').textContent = prixUnitaire.toFixed(2) + ' €';
    document.getElementById('nbSieges').textContent = nbSieges;
    document.getElementById('sousTotal').textContent = sousTotal.toFixed(2) + ' €';
    document.getElementById('taxes').textContent = taxes.toFixed(2) + ' €';
    document.getElementById('totalValue').textContent = total.toFixed(2) + ' €';
    
    // Générer un code-barres unique
    generateBarcode(bookingData.bookingId);
    
    console.log('✅ Confirmation affichée avec succès');
}

// Afficher les sièges
function displaySeats(seats) {
    const seatsDisplay = document.getElementById('seatsDisplay');
    
    if (!seats || seats.length === 0) {
        seatsDisplay.innerHTML = '<p class="text-muted">Aucun siège spécifié</p>';
        return;
    }
    
    seatsDisplay.innerHTML = seats.map(seat => 
        `<span class="seat-badge">
            <i class="fas fa-chair"></i> ${seat}
        </span>`
    ).join('');
}

// Formater la date
function formatDate(dateString) {
    if (!dateString) return '---';
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Générer un code-barres
function generateBarcode(bookingId) {
    const barcodeValue = document.getElementById('barcodeValue');
    if (!barcodeValue) return;
    
    // Créer un code-barres simple basé sur l'ID de réservation
    const idStr = bookingId.toString();
    let barcode = '';
    
    for (let i = 0; i < idStr.length; i++) {
        const digit = parseInt(idStr[i]);
        barcode += '|'.repeat(digit + 1) + ' ';
    }
    
    barcodeValue.textContent = barcode;
}

// Afficher un message si pas de réservation trouvée
function showNoBookingFound() {
    loadingSpinner.style.display = 'none';
    confirmationContent.style.display = 'block';
    
    confirmationContent.innerHTML = `
        <div class="card confirmation-card">
            <div class="card-body text-center p-5">
                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 80px;"></i>
                <h2 class="mt-3">Aucune réservation trouvée</h2>
                <p class="text-muted">
                    Aucune réservation récente n'a été trouvée.
                    <br>Veuillez effectuer une nouvelle réservation.
                </p>
                <a href="/reservation.html" class="btn btn-primary btn-lg mt-3">
                    <i class="fas fa-ticket-alt"></i> Réserver maintenant
                </a>
            </div>
        </div>
    `;
}

// Partager par email
function shareViaEmail() {
    if (!bookingData) return;
    
    const subject = encodeURIComponent('Confirmation de réservation TravelBook #' + bookingData.bookingId);
    const body = encodeURIComponent(
        'Bonjour,\n\n' +
        'Voici les détails de ma réservation :\n\n' +
        'Numéro : #' + bookingData.bookingId + '\n' +
        'Trajet : ' + bookingData.tripDetails.depart + ' → ' + bookingData.tripDetails.destination + '\n' +
        'Date : ' + formatDate(bookingData.tripDetails.date_depart) + '\n' +
        'Sièges : ' + bookingData.seats.join(', ') + '\n' +
        'Prix total : ' + bookingData.totalPrice + '€\n\n' +
        'Merci !'
    );
    
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
}

// Partager via WhatsApp
function shareViaWhatsApp() {
    if (!bookingData) return;
    
    const text = encodeURIComponent(
        '🎫 Réservation confirmée !\n' +
        'Numéro : #' + bookingData.bookingId + '\n' +
        'Trajet : ' + bookingData.tripDetails.depart + ' → ' + bookingData.tripDetails.destination + '\n' +
        'Date : ' + formatDate(bookingData.tripDetails.date_depart) + '\n' +
        'Sièges : ' + bookingData.seats.join(', ') + '\n' +
        'Prix : ' + bookingData.totalPrice + '€'
    );
    
    window.open('https://wa.me/?text=' + text, '_blank');
}

// Animation de chargement
console.log('📄 Page de confirmation prête');