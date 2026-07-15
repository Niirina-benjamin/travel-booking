// Configuration
const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Vérification connexion
if (!token) {
    window.location.href = '/login.html';
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard client chargé');
    
    // Afficher le nom
    if (user.nom) {
        document.getElementById('userName').textContent = user.nom;
    }
    
    // Charger les données
    loadDashboardData();
});

// Charger toutes les données
async function loadDashboardData() {
    try {
        // Charger les réservations
        const bookingsRes = await fetch(`${API_URL}/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookings = await bookingsRes.json();
        
        // Charger le profil
        const profileRes = await fetch(`${API_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await profileRes.json();
        
        // Mettre à jour les stats
        updateStats(bookings, profile);
        
        // Afficher les prochaines réservations
        displayUpcomingBookings(bookings);
        
    } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
    }
}

// Mettre à jour les statistiques
function updateStats(bookings, profile) {
    // Total réservations
    document.getElementById('totalBookings').textContent = bookings.length;
    
    // Réservations confirmées
    const confirmed = bookings.filter(b => b.statut === 'confirme').length;
    document.getElementById('confirmedBookings').textContent = confirmed;
    
    // Avis
    const reviews = profile.stats?.totalReviews || 0;
    document.getElementById('totalReviews').textContent = reviews;
    
    // Km parcourus (simulé)
    const km = bookings.length * 350; // ~350km par trajet en moyenne
    document.getElementById('totalKm').textContent = km;
    
    // Résumé
    document.getElementById('yearCount').textContent = bookings.length;
    const yearProgress = Math.min((bookings.length / 10) * 100, 100);
    document.getElementById('yearProgress').style.width = yearProgress + '%';
    
    const confirmRate = bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100) : 0;
    document.getElementById('confirmRate').textContent = confirmRate + '%';
    document.getElementById('confirmProgress').style.width = confirmRate + '%';
    
    // Total dépensé
    const totalSpent = bookings.reduce((sum, b) => sum + parseFloat(b.prix_total || 0), 0);
    document.getElementById('totalSpent').textContent = totalSpent.toFixed(2) + ' €';
}

// Afficher les prochaines réservations
function displayUpcomingBookings(bookings) {
    const container = document.getElementById('upcomingBookings');
    
    // Filtrer les réservations à venir ou en attente
    const upcoming = bookings.filter(b => 
        b.statut === 'en_attente' || b.statut === 'confirme'
    ).slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5>Aucune réservation à venir</h5>
                <p class="text-muted">Commencez par réserver votre premier voyage !</p>
                <a href="/reservation.html" class="btn btn-primary">
                    <i class="fas fa-ticket-alt"></i> Réserver maintenant
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcoming.map((b, index) => {
        const departureDate = new Date(b.date_depart);
        const now = new Date();
        const daysUntil = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));
        
        const statusClass = b.statut === 'confirme' ? 'confirmed' : 'pending';
        const statusBadge = b.statut === 'confirme' ? 'bg-success' : 'bg-warning text-dark';
        const statusIcon = b.statut === 'confirme' ? 'fa-check-circle' : 'fa-clock';
        const statusText = b.statut === 'confirme' ? 'Confirmé' : 'En attente';
        
        return `
            <div class="booking-card ${statusClass} p-3 animate-card" style="animation-delay: ${index * 0.1}s">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="mb-1">
                            <i class="fas fa-map-marker-alt text-danger"></i> ${b.depart || '---'}
                            <i class="fas fa-arrow-right mx-2"></i>
                            <i class="fas fa-flag-checkered text-success"></i> ${b.destination || '---'}
                        </h6>
                        <p class="mb-1 small text-muted">
                            <i class="fas fa-calendar"></i> ${departureDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            <span class="mx-2">|</span>
                            <i class="fas fa-clock"></i> ${departureDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p class="mb-0 small">
                            <span class="badge badge-custom ${statusBadge}">
                                <i class="fas ${statusIcon}"></i> ${statusText}
                            </span>
                            ${b.seats ? `<span class="ms-2"><i class="fas fa-chair"></i> ${b.seats}</span>` : ''}
                            <span class="ms-2"><strong>${parseFloat(b.prix_total || 0).toFixed(2)} €</strong></span>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        ${daysUntil > 0 ? `
                            <span class="badge bg-info badge-custom">
                                <i class="fas fa-hourglass-half"></i> J-${daysUntil}
                            </span>
                        ` : '<span class="badge bg-success badge-custom">Aujourd\'hui !</span>'}
                        <br>
                        <a href="/confirmation.html?booking=${b.id}" class="btn btn-sm btn-outline-primary mt-2">
                            <i class="fas fa-eye"></i> Détails
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Déconnexion
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}