const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://travel-booking-api.onrender.com/api';

const token = localStorage.getItem('token');

// Vérifier l'authentification admin
if (!token) {
    window.location.href = '../index.html';
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        document.getElementById('userCount').textContent = data.stats.users;
        document.getElementById('tripCount').textContent = data.stats.trips;
        document.getElementById('bookingCount').textContent = data.stats.bookings;
        
        // Afficher les réservations récentes
        displayRecentBookings(data.recentBookings);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function displayRecentBookings(bookings) {
    const tableHTML = `
        <div class="mt-4">
            <h4>Réservations récentes</h4>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Trajet</th>
                        <th>Prix</th>
                        <th>Statut</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(b => `
                        <tr>
                            <td>#${b.id}</td>
                            <td>${b.nom}</td>
                            <td>${b.depart} → ${b.destination}</td>
                            <td>${b.prix_total}€</td>
                            <td><span class="badge bg-${getStatusColor(b.statut)}">${b.statut}</span></td>
                            <td>${new Date(b.date_reservation).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('dashboardSection').innerHTML += tableHTML;
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

loadDashboard();