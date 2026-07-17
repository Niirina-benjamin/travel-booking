// ==========================================
// DASHBOARD.JS - CORRIGÉ (sans doublons)
// ==========================================

// ⚠️ Utiliser les variables de script.js si elles existent
const API_BASE = typeof API_URL !== 'undefined' ? API_URL : (window.location.origin + '/api');
const AUTH_TOKEN = typeof token !== 'undefined' ? token : localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Vérification connexion
if (!AUTH_TOKEN) {
    window.location.href = '/login.html';
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard client chargé');
    
    if (user.nom) {
        document.getElementById('userName').textContent = user.nom;
    }
    
    loadDashboardData();
});

// Charger toutes les données
async function loadDashboardData() {
    try {
        const [bookingsRes, profileRes] = await Promise.all([
            fetch(`${API_BASE}/bookings`, { headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` } }),
            fetch(`${API_BASE}/profile`, { headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` } })
        ]);
        
        const bookings = await bookingsRes.json();
        const profile = await profileRes.json();
        
        updateStats(bookings, profile);
        displayUpcomingBookings(bookings);
        
    } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
    }
}

// Mettre à jour les statistiques
function updateStats(bookings, profile) {
    const totalB = bookings.length;
    const confirmed = bookings.filter(b => b.statut === 'confirme').length;
    const reviews = profile.stats?.totalReviews || 0;
    const km = totalB * 350;
    
    document.getElementById('totalBookings').textContent = totalB;
    document.getElementById('confirmedBookings').textContent = confirmed;
    document.getElementById('totalReviews').textContent = reviews;
    document.getElementById('totalKm').textContent = km;
    document.getElementById('yearCount').textContent = totalB;
    
    const yearProgress = Math.min((totalB / 10) * 100, 100);
    document.getElementById('yearProgress').style.width = yearProgress + '%';
    
    const confirmRate = totalB > 0 ? Math.round((confirmed / totalB) * 100) : 0;
    document.getElementById('confirmRate').textContent = confirmRate + '%';
    document.getElementById('confirmProgress').style.width = confirmRate + '%';
    
    const totalSpent = bookings.reduce((sum, b) => sum + parseFloat(b.prix_total || 0), 0);
    document.getElementById('totalSpent').textContent = totalSpent.toFixed(2) + ' €';
}

// Afficher les prochaines réservations
function displayUpcomingBookings(bookings) {
    const container = document.getElementById('upcomingBookings');
    const upcoming = bookings.filter(b => b.statut === 'en_attente' || b.statut === 'confirme').slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5>Aucune réservation à venir</h5>
                <p class="text-muted">Commencez par réserver votre premier voyage !</p>
                <a href="/reservation.html" class="btn btn-save text-white"><i class="fas fa-ticket-alt me-2"></i>Réserver maintenant</a>
            </div>`;
        return;
    }
    
    container.innerHTML = upcoming.map((b, index) => {
        const departureDate = new Date(b.date_depart);
        const now = new Date();
        const daysUntil = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));
        const statusClass = b.statut === 'confirme' ? 'confirmed' : 'pending';
        const statusBadge = b.statut === 'confirme' ? 'status-confirmed' : 'status-pending';
        const statusIcon = b.statut === 'confirme' ? 'fa-check-circle' : 'fa-clock';
        const statusText = b.statut === 'confirme' ? 'Confirmé' : 'En attente';
        
        return `
            <div class="booking-mini ${statusClass} animate-card" style="animation-delay: ${index * 0.1}s">
                <div class="row align-items-center">
                    <div class="col-md-7">
                        <h6 class="mb-1 fw-bold">
                            <i class="fas fa-map-marker-alt text-danger"></i> ${b.depart || '---'}
                            <i class="fas fa-arrow-right mx-2 text-primary"></i>
                            <i class="fas fa-flag-checkered text-success"></i> ${b.destination || '---'}
                        </h6>
                        <p class="mb-1 small text-muted">
                            <i class="fas fa-calendar"></i> ${departureDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            <span class="mx-2">|</span>
                            <i class="fas fa-clock"></i> ${departureDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div class="col-md-5 text-md-end mt-2 mt-md-0">
                        <span class="status-badge ${statusBadge} me-2"><i class="fas ${statusIcon}"></i> ${statusText}</span>
                        <strong>${parseFloat(b.prix_total || 0).toFixed(2)} €</strong>
                        ${daysUntil > 0 ? `<br><small class="text-info"><i class="fas fa-hourglass-half"></i> J-${daysUntil}</small>` : '<br><small class="text-success">Aujourd\'hui !</small>'}
                    </div>
                </div>
            </div>`;
    }).join('');
}