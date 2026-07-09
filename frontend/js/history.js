const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

const token = localStorage.getItem('token');

// Vérifier l'authentification
if (!token) {
    window.location.href = 'index.html';
}

async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            document.getElementById('noBookings').style.display = 'block';
            return;
        }
        
        displayBookings(bookings);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookingsList');
    
    container.innerHTML = bookings.map(booking => `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">
                            ${booking.depart} → ${booking.destination}
                        </h5>
                        <p class="mb-1">
                            <strong>Date:</strong> ${new Date(booking.date_depart).toLocaleString()}
                        </p>
                        <p class="mb-1">
                            <strong>Sièges:</strong> ${booking.seats}
                        </p>
                        <p class="mb-1">
                            <strong>Prix:</strong> ${booking.prix_total}€
                        </p>
                        <span class="badge bg-${getStatusColor(booking.statut)}">
                            ${booking.statut}
                        </span>
                    </div>
                    <div class="col-md-4 text-end">
                        <p class="text-muted">
                            Réservé le ${new Date(booking.date_reservation).toLocaleDateString()}
                        </p>
                        <button class="btn btn-outline-primary btn-sm" 
                                onclick="viewDetails(${booking.id})">
                            Voir détails
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        'confirme': 'success',
        'en_attente': 'warning',
        'annule': 'danger',
        'termine': 'secondary'
    };
    return colors[status] || 'primary';
}

function viewDetails(bookingId) {
    // Implémenter l'affichage des détails
    alert('Détails de la réservation #' + bookingId);
}

loadBookings();