const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page historique chargée');
    
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    loadBookings();
});

async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const bookings = await response.json();
        displayBookings(bookings);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        document.getElementById('bookingsList').innerHTML = `
            <div class="alert alert-danger">
                Erreur lors du chargement de l'historique.
            </div>
        `;
    }
}

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
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h5>${booking.depart} → ${booking.destination}</h5>
                        <p class="mb-1">📅 ${new Date(booking.date_depart).toLocaleString()}</p>
                        <p class="mb-1">💺 Sièges: ${booking.seats || 'Non spécifié'}</p>
                        <p class="mb-1">💰 Prix: ${booking.prix_total}€</p>
                        <span class="badge bg-${getStatusColor(booking.statut)}">${booking.statut}</span>
                    </div>
                    <div class="col-md-4 text-end">
                        <small class="text-muted">Réservé le ${new Date(booking.date_reservation).toLocaleDateString()}</small>
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