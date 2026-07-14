// Configuration
const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Page historique chargée');
    
    if (!token) {
        alert('Veuillez vous connecter pour voir votre historique');
        window.location.href = '/';
        return;
    }
    
    loadBookings();
});

// Charger les réservations
async function loadBookings() {
    console.log('📡 Chargement des réservations...');
    
    try {
        // Utiliser la route racine des bookings, pas /history
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Réponse API:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        const bookings = await response.json();
        console.log('✅ Réservations trouvées:', bookings.length, bookings);
        
        displayBookings(bookings);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        document.getElementById('bookingsList').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Erreur lors du chargement de l'historique.
                <br><small>${error.message}</small>
                <br><small>Vérifiez que vous êtes bien connecté.</small>
            </div>
        `;
    }
}

// Afficher les réservations
function displayBookings(bookings) {
    const container = document.getElementById('bookingsList');
    const noBookings = document.getElementById('noBookings');
    
    if (!bookings || bookings.length === 0) {
        if (noBookings) noBookings.style.display = 'block';
        if (container) container.innerHTML = '';
        return;
    }
    
    if (noBookings) noBookings.style.display = 'none';
    
    container.innerHTML = bookings.map(booking => `
        <div class="card mb-4 shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="fas fa-ticket-alt"></i> 
                    Réservation #${booking.id}
                </h5>
                <span class="badge ${getStatusBadge(booking.statut)} fs-6">
                    ${booking.statut || 'En attente'}
                </span>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <h4 class="text-primary">
                                ${booking.depart} 
                                <i class="fas fa-arrow-right mx-2"></i> 
                                ${booking.destination}
                            </h4>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-2">
                                    <i class="fas fa-calendar-alt text-muted"></i>
                                    <strong>Départ :</strong><br>
                                    ${formatDate(booking.date_depart)}
                                </p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-2">
                                    <i class="fas fa-calendar-check text-muted"></i>
                                    <strong>Arrivée :</strong><br>
                                    ${formatDate(booking.date_arrivee)}
                                </p>
                            </div>
                        </div>
                        
                        <div class="mb-2">
                            <i class="fas fa-chair text-muted"></i>
                            <strong>Sièges :</strong>
                            ${booking.seats ? booking.seats.split(',').map(s => 
                                `<span class="badge bg-primary me-1">${s.trim()}</span>`
                            ).join('') : '<span class="text-muted">Non spécifié</span>'}
                        </div>
                        
                        <p class="mb-0">
                            <i class="fas fa-users text-muted"></i>
                            <strong>Passagers :</strong> ${booking.nb_passagers || '1'}
                        </p>
                    </div>
                    
                    <div class="col-md-4 text-end">
                        <div class="mb-3">
                            <small class="text-muted">Prix total</small>
                            <h3 class="text-success">${parseFloat(booking.prix_total).toFixed(2)} €</h3>
                        </div>
                        
                        <p class="text-muted small">
                            <i class="fas fa-clock"></i>
                            Réservé le ${formatDate(booking.date_reservation)}
                        </p>
                        
                        <div class="mt-3">
                            ${booking.statut === 'en_attente' || booking.statut === 'confirme' ? `
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="cancelBooking(${booking.id})">
                                    <i class="fas fa-times"></i> Annuler
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-primary btn-sm ms-2"
                                    onclick="viewDetails(${booking.id})">
                                <i class="fas fa-eye"></i> Détails
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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

// Obtenir la classe du badge selon le statut
function getStatusBadge(statut) {
    switch(statut) {
        case 'confirme': return 'bg-success';
        case 'en_attente': return 'bg-warning text-dark';
        case 'annule': return 'bg-danger';
        case 'termine': return 'bg-secondary';
        default: return 'bg-info';
    }
}

// Annuler une réservation
async function cancelBooking(bookingId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        return;
    }
    
    try {
        console.log('🗑️ Annulation réservation #' + bookingId);
        
        const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Réservation annulée avec succès');
            loadBookings(); // Recharger la liste
        } else {
            alert(data.message || 'Erreur lors de l\'annulation');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors de l\'annulation');
    }
}

// Voir les détails d'une réservation
function viewDetails(bookingId) {
    window.location.href = `/confirmation.html?booking=${bookingId}`;
}