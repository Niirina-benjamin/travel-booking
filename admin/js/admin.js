// Configuration
const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

// 🔥 Vérification stricte : doit être admin
if (!token || savedUser.role !== 'admin') {
    alert('Accès réservé aux administrateurs. Veuillez vous connecter avec un compte admin.');
    window.location.href = '/';
}

// Afficher le nom de l'admin connecté
console.log('👑 Admin connecté:', savedUser.nom);

// Vérifier le rôle admin
async function checkAdmin() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 403) {
            alert('Accès réservé aux administrateurs');
            window.location.href = '/';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur vérification admin:', error);
        return false;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    
    // Afficher la date/heure
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Charger le dashboard
    loadDashboard();
});

// Mise à jour date/heure
function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
}

// Navigation entre sections
function showSection(section) {
    document.querySelectorAll('[id$="Section"]').forEach(el => {
        el.style.display = 'none';
    });
    document.getElementById(section + 'Section').style.display = 'block';
    
    // Mettre à jour le menu actif
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('.nav-link').classList.add('active');
    
    // Charger les données selon la section
    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'trips': loadTrips(); break;
        case 'bookings': loadAllBookings(); break;
        case 'users': loadUsers(); break;
        case 'vehicles': loadVehicles(); break;
        case 'reviews': loadAllReviews(); break; // ← Ajouter cette ligne
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Stats cards
        document.getElementById('statsCards').innerHTML = `
            <div class="col-md-3">
                <div class="card stat-card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6>Utilisateurs</h6>
                                <h2>${data.stats.users}</h2>
                            </div>
                            <i class="fas fa-users stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6>Trajets</h6>
                                <h2>${data.stats.trips}</h2>
                            </div>
                            <i class="fas fa-route stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6>Réservations</h6>
                                <h2>${data.stats.bookings}</h2>
                            </div>
                            <i class="fas fa-ticket-alt stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6>Véhicules</h6>
                                <h2>${data.stats.vehicles || 0}</h2>
                            </div>
                            <i class="fas fa-bus stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Réservations récentes
        displayRecentBookings(data.recentBookings);
        
    } catch (error) {
        console.error('Erreur dashboard:', error);
    }
}

function displayRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookingsBody');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucune réservation</td></tr>';
        return;
    }
    
    tbody.innerHTML = bookings.map(b => `
        <tr>
            <td>#${b.id}</td>
            <td>${b.nom}</td>
            <td>${b.depart} → ${b.destination}</td>
            <td>${new Date(b.date_depart).toLocaleDateString('fr-FR')}</td>
            <td>${b.prix_total}€</td>
            <td><span class="status-badge ${getStatusClass(b.statut)}">${b.statut}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewBooking(${b.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==================== TRIPS ====================
async function loadTrips() {
    try {
        const response = await fetch(`${API_URL}/admin/trips`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const trips = await response.json();
        
        const tbody = document.getElementById('tripsTableBody');
        tbody.innerHTML = trips.map(t => `
            <tr>
                <td>#${t.id}</td>
                <td>${t.depart}</td>
                <td>${t.destination}</td>
                <td>${new Date(t.date_depart).toLocaleString('fr-FR')}</td>
                <td>${t.modele || 'N/A'}</td>
                <td>${t.places_disponibles}</td>
                <td>${t.prix}€</td>
                <td><span class="status-badge ${getStatusClass(t.statut)}">${t.statut}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editTrip(${t.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTrip(${t.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Charger les véhicules pour le formulaire
        loadVehiclesForSelect();
        
    } catch (error) {
        console.error('Erreur chargement trajets:', error);
    }
}

async function loadVehiclesForSelect() {
    try {
        const response = await fetch(`${API_URL}/admin/vehicles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehicles = await response.json();
        
        const select = document.getElementById('tripVehicule');
        select.innerHTML = '<option value="">Choisir un véhicule</option>' +
            vehicles.map(v => `<option value="${v.id}">${v.type} - ${v.modele} (${v.capacite} places)</option>`).join('');
    } catch (error) {
        console.error('Erreur chargement véhicules:', error);
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
        document.getElementById('tripDateDepart').value = trip.date_depart.slice(0, 16);
        document.getElementById('tripDateArrivee').value = trip.date_arrivee.slice(0, 16);
        document.getElementById('tripPrix').value = trip.prix;
        document.getElementById('tripStatut').value = trip.statut;
        
        await loadVehiclesForSelect();
        document.getElementById('tripVehicule').value = trip.vehicule_id;
        
        new bootstrap.Modal(document.getElementById('tripModal')).show();
    } catch (error) {
        console.error('Erreur:', error);
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
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tripData)
        });
        
        if (response.ok) {
            alert('Trajet enregistré avec succès !');
            bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
            loadTrips();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de l\'enregistrement');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur serveur');
    }
}

async function deleteTrip(id) {
    if (!confirm('Supprimer ce trajet ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/trips/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadTrips();
        }
    } catch (error) {
        console.error('Erreur:', error);
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
        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td>#${b.id}</td>
                <td>${b.nom || 'N/A'}</td>
                <td>${b.email || 'N/A'}</td>
                <td>${b.depart} → ${b.destination}</td>
                <td>${new Date(b.date_depart).toLocaleDateString('fr-FR')}</td>
                <td>${b.seats || 'N/A'}</td>
                <td>${b.prix_total}€</td>
                <td><span class="status-badge ${getStatusClass(b.statut)}">${b.statut}</span></td>
                <td>
                    <select class="form-select form-select-sm" onchange="updateBookingStatus(${b.id}, this.value)">
                        <option value="">Changer statut</option>
                        <option value="confirme">Confirmer</option>
                        <option value="annule">Annuler</option>
                        <option value="termine">Terminer</option>
                    </select>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement réservations:', error);
    }
}

async function updateBookingStatus(bookingId, newStatus) {
    if (!newStatus) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ statut: newStatus })
        });
        
        if (response.ok) {
            loadAllBookings();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==================== USERS ====================
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
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
        
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
    }
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    if (!confirm(`Changer le rôle en "${newRole}" ?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (response.ok) {
            loadUsers();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==================== VEHICLES ====================
async function loadVehicles() {
    try {
        const response = await fetch(`${API_URL}/admin/vehicles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehicles = await response.json();
        
        const tbody = document.getElementById('vehiclesTableBody');
        tbody.innerHTML = vehicles.map(v => `
            <tr>
                <td>#${v.id}</td>
                <td>${v.type}</td>
                <td>${v.modele}</td>
                <td>${v.immatriculation}</td>
                <td>${v.capacite} places</td>
                <td><span class="status-badge ${v.statut === 'actif' ? 'bg-success' : 'bg-warning'}">${v.statut}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editVehicle(${v.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement véhicules:', error);
    }
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
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vehicleData)
        });
        
        if (response.ok) {
            alert('Véhicule enregistré !');
            bootstrap.Modal.getInstance(document.getElementById('vehicleModal')).hide();
            loadVehicles();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==================== UTILITAIRES ====================
function getStatusClass(status) {
    const classes = {
        'confirme': 'bg-success text-white',
        'en_attente': 'bg-warning',
        'annule': 'bg-danger text-white',
        'termine': 'bg-secondary text-white',
        'programme': 'bg-primary text-white',
        'en_cours': 'bg-info text-white'
    };
    return classes[status] || 'bg-light';
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

function viewBooking(id) {
    window.open(`/confirmation.html?booking=${id}`, '_blank');
}

// Charger tous les avis
async function loadAllReviews() {
    try {
        // Récupérer tous les trajets avec leurs avis
        const [tripsRes, reviewsRes] = await Promise.all([
            fetch(`${API_URL}/admin/trips`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/admin/all-reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const trips = await tripsRes.json();
        const allReviews = await reviewsRes.json();
        
        // Stats
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
            : 0;
        
        document.getElementById('reviewsStats').innerHTML = `
            <div class="col-md-4">
                <div class="card stat-card bg-warning text-white">
                    <div class="card-body text-center">
                        <h6>Total avis</h6>
                        <h2>${totalReviews}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card bg-info text-white">
                    <div class="card-body text-center">
                        <h6>Note moyenne</h6>
                        <h2>${avgRating} ⭐</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card bg-success text-white">
                    <div class="card-body text-center">
                        <h6>Trajets notés</h6>
                        <h2>${new Set(allReviews.map(r => r.trip_id)).size}</h2>
                    </div>
                </div>
            </div>
        `;
        
        // Tableau des avis
        document.getElementById('reviewsTableBody').innerHTML = allReviews.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>${r.user_name || 'N/A'}</td>
                <td>${r.depart || 'N/A'} → ${r.destination || 'N/A'}</td>
                <td>${'⭐'.repeat(r.rating)} <small>(${r.rating}/5)</small></td>
                <td>${r.comment ? r.comment.substring(0, 80) + '...' : '<small class="text-muted">Pas de commentaire</small>'}</td>
                <td>${new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteReview(${r.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement avis:', error);
    }
}

// Supprimer un avis
async function deleteReview(reviewId) {
    if (!confirm('Supprimer cet avis ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('✅ Avis supprimé');
            loadAllReviews();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}