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
    
    // Récupérer les données du localStorage
    const storedBooking = localStorage.getItem('lastBooking');
    console.log('📦 Données localStorage:', storedBooking);
    
    if (storedBooking) {
        try {
            bookingData = JSON.parse(storedBooking);
            console.log('✅ Données parsées:', bookingData);
            
            // Vérifier que les données essentielles sont présentes
            if (bookingData.tripDetails && bookingData.bookingId) {
                displayConfirmation();
            } else {
                console.error('❌ Données incomplètes:', bookingData);
                showNoBookingFound();
            }
        } catch (error) {
            console.error('❌ Erreur parsing JSON:', error);
            showNoBookingFound();
        }
    } else {
        console.log('⚠️ Aucune réservation dans localStorage');
        showNoBookingFound();
    }
});

// Afficher la confirmation
function displayConfirmation() {
    console.log('📊 Affichage des détails de la confirmation...');
    
    // Cacher le loader, afficher le contenu
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (confirmationContent) confirmationContent.style.display = 'block';
    
    try {
        // 1. Numéro de réservation
        document.getElementById('bookingRef').textContent = '#' + bookingData.bookingId;
        
        // 2. Détails du voyage
        document.getElementById('departValue').textContent = bookingData.tripDetails.depart || '---';
        document.getElementById('destinationValue').textContent = bookingData.tripDetails.destination || '---';
        document.getElementById('dateDepartValue').textContent = formatDate(bookingData.tripDetails.date_depart);
        document.getElementById('dateArriveeValue').textContent = formatDate(bookingData.tripDetails.date_arrivee);
        
        // 3. Sièges
        const seats = bookingData.seats || [];
        displaySeats(seats);
        document.getElementById('nbPassagers').textContent = seats.length;
        
        // 4. CALCULS DES PRIX
        const prixUnitaire = parseFloat(bookingData.tripDetails.prix) || 0;
        const nbSieges = seats.length;
        const sousTotal = prixUnitaire * nbSieges;
        const taxes = sousTotal * 0.1;
        const total = sousTotal + taxes;
        
        console.log('💰 Détail des prix:', {
            'Prix unitaire': prixUnitaire + '€',
            'Nombre sièges': nbSieges,
            'Sous-total': sousTotal + '€',
            'Taxes (10%)': taxes + '€',
            'Total': total + '€'
        });
        
        // Afficher les prix
        document.getElementById('prixUnitaire').textContent = prixUnitaire.toFixed(2) + ' €';
        document.getElementById('nbSieges').textContent = nbSieges;
        document.getElementById('sousTotal').textContent = sousTotal.toFixed(2) + ' €';
        document.getElementById('taxes').textContent = taxes.toFixed(2) + ' €';
        document.getElementById('totalValue').textContent = total.toFixed(2) + ' €';
        
        // 5. Code-barres
        generateBarcode(bookingData.bookingId);
        
        console.log('✅ Confirmation affichée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage:', error);
        showNoBookingFound();
    }
}

// Afficher les sièges
function displaySeats(seats) {
    const container = document.getElementById('seatsDisplay');
    if (!container) return;
    
    if (!seats || seats.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucun siège spécifié</p>';
        return;
    }
    
    container.innerHTML = seats.map(seat => 
        `<span class="badge bg-primary m-2 p-3" style="font-size: 1.1rem;">
            <i class="fas fa-chair"></i> Siège ${seat}
        </span>`
    ).join('');
}

// Formater la date
function formatDate(dateString) {
    if (!dateString) return '---';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Générer un code-barres simple
function generateBarcode(bookingId) {
    const barcodeElement = document.getElementById('barcodeValue');
    if (!barcodeElement) return;
    
    const idStr = String(bookingId || '0');
    let barcode = '';
    
    for (let i = 0; i < idStr.length; i++) {
        const digit = parseInt(idStr[i]) || 0;
        barcode += '|'.repeat(digit + 1) + ' ';
    }
    
    barcodeElement.textContent = barcode || '|| ||| || || ||||';
}

// Message si pas de réservation
function showNoBookingFound() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (confirmationContent) confirmationContent.style.display = 'block';
    
    if (confirmationContent) {
        confirmationContent.innerHTML = `
            <div class="text-center p-5">
                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 80px;"></i>
                <h2 class="mt-3">Aucune réservation trouvée</h2>
                <p class="text-muted">Effectuez une réservation pour voir la confirmation.</p>
                <a href="/reservation.html" class="btn btn-primary btn-lg mt-3">
                    <i class="fas fa-ticket-alt"></i> Réserver maintenant
                </a>
            </div>
        `;
    }
}

// Partager par email
function shareViaEmail() {
    if (!bookingData) return;
    
    const subject = 'Confirmation TravelBook #' + bookingData.bookingId;
    const body = `Bonjour,%0D%0A%0D%0A` +
        `Réservation #${bookingData.bookingId}%0D%0A` +
        `Trajet : ${bookingData.tripDetails.depart} → ${bookingData.tripDetails.destination}%0D%0A` +
        `Date : ${formatDate(bookingData.tripDetails.date_depart)}%0D%0A` +
        `Sièges : ${(bookingData.seats || []).join(', ')}%0D%0A` +
        `Prix : ${bookingData.totalPrice || '0'}€`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}

// Partager via WhatsApp
function shareViaWhatsApp() {
    if (!bookingData) return;
    
    const text = `🎫 *Réservation confirmée !*%0A%0A` +
        `Numéro : #${bookingData.bookingId}%0A` +
        `Trajet : ${bookingData.tripDetails.depart} → ${bookingData.tripDetails.destination}%0A` +
        `Date : ${formatDate(bookingData.tripDetails.date_depart)}%0A` +
        `Sièges : ${(bookingData.seats || []).join(', ')}%0A` +
        `Prix : ${bookingData.totalPrice || '0'}€`;
    
    window.open('https://wa.me/?text=' + text, '_blank');
}

// Debug dans la console
console.log('🔍 Vérification localStorage:');
console.log('  Token:', token ? 'Présent' : 'Absent');
console.log('  lastBooking:', localStorage.getItem('lastBooking'));