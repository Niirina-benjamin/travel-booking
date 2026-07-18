// Configuration
const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

// Vérification admin
if (!token || savedUser.role !== 'admin') {
    alert('Accès réservé aux administrateurs.');
    window.location.href = '/';
}

console.log('👑 Admin connecté:', savedUser.nom);

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    // Charger le dashboard directement
    loadDashboard();
});

// Navigation entre sections
function showSection(section) {
    // Cacher toutes les sections
    const sections = ['dashboard', 'trips', 'bookings', 'users', 'reviews', 'vehicles'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.style.display = 'none';
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) targetSection.style.display = 'block';
    
    // Mettre à jour le menu
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Trouver et activer le lien cliqué
    const activeLink = document.querySelector(`[onclick="showSection('${section}')"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Charger les données
    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'trips': loadTrips(); break;
        case 'bookings': loadAllBookings(); break;
        case 'users': loadUsers(); break;
        case 'reviews': loadAllReviews(); break;
        case 'vehicles': loadVehicles(); break;
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Mise à jour des compteurs
        const userCount = document.getElementById('userCount');
        const tripCount = document.getElementById('tripCount');
        const bookingCount = document.getElementById('bookingCount');
        const vehicleCount = document.getElementById('vehicleCount');
        
        if (userCount) userCount.textContent = data.stats.users || 0;
        if (tripCount) tripCount.textContent = data.stats.trips || 0;
        if (bookingCount) bookingCount.textContent = data.stats.bookings || 0;
        if (vehicleCount) vehicleCount.textContent = data.stats.vehicles || 0;
        
        // Réservations récentes
        const tbody = document.getElementById('recentBookingsBody');
        if (tbody && data.recentBookings) {
            if (data.recentBookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucune réservation</td></tr>';
            } else {
                tbody.innerHTML = data.recentBookings.map(b => `
                    <tr>
                        <td>#${b.id}</td>
                        <td>${b.nom || 'N/A'}</td>
                        <td>${b.depart || '---'} → ${b.destination || '---'}</td>
                        <td>${b.date_depart ? new Date(b.date_depart).toLocaleDateString('fr-FR') : 'N/A'}</td>
                        <td>${b.prix_total || 0}€</td>
                        <td><span class="badge ${getStatusBadge(b.statut)}">${b.statut || 'N/A'}</span></td>
                    </tr>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur dashboard:', error);
    }
}

// ==================== TRIPS ====================
async function loadTrips() {
    try {
        const response = await fetch(`${API_URL}/admin/trips`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const trips = await response.json();
        
        const tbody = document.getElementById('tripsTableBody');
        if (!tbody) return;
        
        if (trips.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Aucun trajet</td></tr>';
            return;
        }
        
        tbody.innerHTML = trips.map(t => `
            <tr>
                <td>#${t.id}</td>
                <td>${t.depart}</td>
                <td>${t.destination}</td>
                <td>${new Date(t.date_depart).toLocaleString('fr-FR')}</td>
                <td>${t.modele || 'N/A'}</td>
                <td>${t.places_disponibles}</td>
                <td>${t.prix}€</td>
                <td><span class="badge ${getStatusBadge(t.statut)}">${t.statut}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editTrip(${t.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTrip(${t.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erreur trips:', error);
    }
}

async function loadVehiclesForSelect() {
    try {
        const response = await fetch(`${API_URL}/admin/vehicles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehicles = await response.json();
        
        const select = document.getElementById('tripVehicule');
        if (select) {
            select.innerHTML = '<option value="">Choisir un véhicule</option>' +
                vehicles.map(v => `<option value="${v.id}">${v.type} - ${v.modele} (${v.capacite} places)</option>`).join('');
        }
    } catch (error) {
        console.error('❌ Erreur véhicules:', error);
    }
}

function showAddTripModal() {
    document.getElementById('tripModalTitle').textContent = 'Ajouter un trajet';
    document.getElementById('tripForm').reset();
    document.getElementById('tripId').value = '';
    loadVehiclesForSelect();
    new bootstrap.Modal(document.getElementById('tripModal')).show();
}

async function editTrip(id) {
    try {
        const response = await fetch(`${API_URL}/trips/${id}`);
        const trip = await response.json();
        
        document.getElementById('tripModalTitle').textContent = 'Modifier le trajet';
        document.getElementById('tripId').value = trip.id;
        document.getElementById('tripDepart').value = trip.depart;
        document.getElementById('tripDestination').value = trip.destination;
        document.getElementById('tripDateDepart').value = trip.date_depart?.slice(0, 16);
        document.getElementById('tripDateArrivee').value = trip.date_arrivee?.slice(0, 16);
        document.getElementById('tripPrix').value = trip.prix;
        document.getElementById('tripStatut').value = trip.statut;
        
        await loadVehiclesForSelect();
        document.getElementById('tripVehicule').value = trip.vehicule_id;
        
        new bootstrap.Modal(document.getElementById('tripModal')).show();
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

async function saveTrip() {
    const tripId = document.getElementById('tripId').value;
    const tripData = {
        depart: document.getElementById('tripDepart').value,
        destination: document.getElementById('tripDestination').value,
        date_depart: document.getElementById('tripDateDepart').value,
        date_arrivee: document.getElementById('tripDateArrivee').value,
        vehicule_id: document.getElementById('tripVehicule').value,
        prix: document.getElementById('tripPrix').value,
        statut: document.getElementById('tripStatut').value
    };
    
    try {
        const url = tripId ? `${API_URL}/admin/trips/${tripId}` : `${API_URL}/admin/trips`;
        const method = tripId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(tripData)
        });
        
        if (response.ok) {
            alert('✅ Trajet enregistré !');
            bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
            loadTrips();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

async function deleteTrip(id) {
    if (!confirm('⚠️ Supprimer définitivement ce trajet ?\nToutes les réservations associées seront également supprimées.')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/trips/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur ${response.status}`);
        }
        
        const data = await response.json();
        alert('✅ ' + data.message);
        loadTrips();
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert('❌ Erreur : ' + error.message);
    }
}

// ==================== BOOKINGS ====================
async function loadAllBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter')?.value || '';
    
    try {
        const response = await fetch(`${API_URL}/admin/bookings?statut=${statusFilter}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookings = await response.json();
        
        const tbody = document.getElementById('allBookingsBody');
        if (!tbody) return;
        
        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Aucune réservation</td></tr>';
            return;
        }
        
        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td>#${b.id}</td>
                <td>${b.nom || 'N/A'}</td>
                <td>${b.email || 'N/A'}</td>
                <td>${b.depart || '---'} → ${b.destination || '---'}</td>
                <td>${b.date_depart ? new Date(b.date_depart).toLocaleDateString('fr-FR') : 'N/A'}</td>
                <td>${b.seats || 'N/A'}</td>
                <td>${b.prix_total || 0}€</td>
                <td><span class="badge ${getStatusBadge(b.statut)}">${b.statut}</span></td>
                <td>
                    <select class="form-select form-select-sm" onchange="updateBookingStatus(${b.id}, this.value)">
                        <option value="">Changer</option>
                        <option value="confirme">Confirmer</option>
                        <option value="annule">Annuler</option>
                        <option value="termine">Terminer</option>
                    </select>
                </td>
            </tr>
        `).join('');
        
    } catch (error) { console.error('❌ Erreur:', error); }
}

async function updateBookingStatus(bookingId, newStatus) {
    if (!newStatus) return;
    try {
        await fetch(`${API_URL}/admin/bookings/${bookingId}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ statut: newStatus })
        });
        loadAllBookings();
    } catch (error) { console.error('❌ Erreur:', error); }
}

// ==================== USERS ====================
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td>${u.nom}</td>
                <td>${u.email}</td>
                <td>${u.telephone || 'N/A'}</td>
                <td><span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${u.role}</span></td>
                <td>${new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="toggleUserRole(${u.id}, '${u.role}')">
                        <i class="fas fa-user-shield"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) { console.error('❌ Erreur:', error); }
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    if (!confirm(`Changer le rôle en "${newRole}" ?`)) return;
    try {
        await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role: newRole })
        });
        loadUsers();
    } catch (error) { console.error('❌ Erreur:', error); }
}

// ==================== REVIEWS ====================
async function loadAllReviews() {
    try {
        const [reviewsRes] = await Promise.all([
            fetch(`${API_URL}/admin/all-reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const allReviews = await reviewsRes.json();
        
        // Stats
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
            : 0;
        
        const reviewsStats = document.getElementById('reviewsStats');
        if (reviewsStats) {
            reviewsStats.innerHTML = `
                <div class="col-md-4"><div class="card bg-warning text-white"><div class="card-body text-center"><h6>Total avis</h6><h2>${totalReviews}</h2></div></div></div>
                <div class="col-md-4"><div class="card bg-info text-white"><div class="card-body text-center"><h6>Note moyenne</h6><h2>${avgRating} ⭐</h2></div></div></div>
                <div class="col-md-4"><div class="card bg-success text-white"><div class="card-body text-center"><h6>Trajets notés</h6><h2>${new Set(allReviews.map(r => r.trip_id)).size}</h2></div></div></div>
            `;
        }
        
        const tbody = document.getElementById('reviewsTableBody');
        if (tbody) {
            if (allReviews.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucun avis pour le moment</td></tr>';
            } else {
                tbody.innerHTML = allReviews.map(r => `
                    <tr>
                        <td>#${r.id}</td>
                        <td>${r.user_name || 'N/A'}</td>
                        <td>${r.depart || 'N/A'} → ${r.destination || 'N/A'}</td>
                        <td>${'⭐'.repeat(r.rating)} (${r.rating}/5)</td>
                        <td>${r.comment || '<small class="text-muted">Pas de commentaire</small>'}</td>
                        <td>${new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                        <td><button class="btn btn-sm btn-danger" onclick="deleteReview(${r.id})"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur avis:', error);
        const tbody = document.getElementById('reviewsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erreur de chargement</td></tr>';
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
        await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        loadAllReviews();
    } catch (error) { console.error('❌ Erreur:', error); }
}

// ==================== VEHICLES ====================
async function loadVehicles() {
    try {
        const response = await fetch(`${API_URL}/admin/vehicles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehicles = await response.json();
        
        const tbody = document.getElementById('vehiclesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = vehicles.map(v => `
            <tr>
                <td>#${v.id}</td>
                <td>${v.type}</td>
                <td>${v.modele}</td>
                <td>${v.immatriculation}</td>
                <td>${v.capacite} places</td>
                <td><span class="badge ${v.statut === 'actif' ? 'bg-success' : 'bg-warning'}">${v.statut}</span></td>
                <td><button class="btn btn-sm btn-warning" onclick="editVehicle(${v.id})"><i class="fas fa-edit"></i></button></td>
            </tr>
        `).join('');
        
    } catch (error) { console.error('❌ Erreur:', error); }
}

function showAddVehicleModal() {
    document.getElementById('vehicleForm').reset();
    document.getElementById('vehicleId').value = '';
    new bootstrap.Modal(document.getElementById('vehicleModal')).show();
}

async function saveVehicle() {
    const vehicleId = document.getElementById('vehicleId').value;
    const vehicleData = {
        type: document.getElementById('vehicleType').value,
        modele: document.getElementById('vehicleModele').value,
        immatriculation: document.getElementById('vehicleImmat').value,
        capacite: document.getElementById('vehicleCapacite').value,
        statut: document.getElementById('vehicleStatut').value
    };
    
    try {
        const url = vehicleId ? `${API_URL}/admin/vehicles/${vehicleId}` : `${API_URL}/admin/vehicles`;
        const method = vehicleId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(vehicleData)
        });
        
        if (response.ok) {
            alert('✅ Véhicule enregistré !');
            bootstrap.Modal.getInstance(document.getElementById('vehicleModal')).hide();
            loadVehicles();
        }
    } catch (error) { console.error('❌ Erreur:', error); }
}

// ==================== UTILITAIRES ====================
function getStatusBadge(status) {
    const classes = {
        'confirme': 'bg-success',
        'en_attente': 'bg-warning text-dark',
        'annule': 'bg-danger',
        'termine': 'bg-secondary',
        'programme': 'bg-primary',
        'en_cours': 'bg-info'
    };
    return classes[status] || 'bg-light';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}