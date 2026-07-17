// ==========================================
// SCRIPT.JS - COMPLET ET CORRIGÉ
// ==========================================

const API_URL = window.location.origin + '/api';
let currentUser = null;
const token = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

// Charger l'utilisateur au démarrage
if (token && savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
    } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

// Mise à jour de la navbar IMMÉDIATEMENT
function updateNavbar() {
    const loginNavItem = document.getElementById('loginNavItem');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const adminDropdownItem = document.getElementById('adminDropdownItem');
    const dashboardLink = document.getElementById('dashboardLink');
    const adminLink = document.getElementById('adminLink');

    console.log('🔄 Mise à jour navbar - currentUser:', currentUser);

    if (currentUser) {
        // Cacher le bouton connexion
        if (loginNavItem) loginNavItem.style.display = 'none';
        
        // Afficher le dropdown utilisateur
        if (userDropdownMenu) {
            userDropdownMenu.style.display = 'block';
            console.log('✅ Dropdown affiché');
        }
        
        // Afficher le nom
        if (userNameDisplay) {
            userNameDisplay.textContent = currentUser.nom;
            console.log('✅ Nom mis à jour:', currentUser.nom);
        }
        
        // Afficher le lien dashboard
        if (dashboardLink) dashboardLink.style.display = 'block';
        
        // Afficher admin si admin
        if (currentUser.role === 'admin') {
            if (adminDropdownItem) adminDropdownItem.style.display = 'block';
            if (adminLink) adminLink.style.display = 'block';
        }
    } else {
        // Afficher le bouton connexion
        if (loginNavItem) loginNavItem.style.display = 'block';
        
        // Cacher le dropdown
        if (userDropdownMenu) userDropdownMenu.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Appliquer IMMÉDIATEMENT au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page chargée - Mise à jour navbar');
    updateNavbar();
    
    // Charger les trajets si sur la page d'accueil
    if (document.getElementById('tripsList')) {
        fetch(`${API_URL}/trips`)
            .then(r => r.json())
            .then(trips => displayTrips(trips))
            .catch(e => console.error('Erreur chargement trajets:', e));
    }
});

// Déconnexion
function logout(e) {
    e.preventDefault();
    console.log('🚪 Déconnexion...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateNavbar();
    window.location.href = '/';
}

// Connexion
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Sauvegarder
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            console.log('✅ Connecté:', currentUser);
            
            // Mettre à jour la navbar
            updateNavbar();
            
            // Fermer le modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (modal) modal.hide();
            
            // Redirection
            if (data.user.role === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/dashboard.html';
            }
        } else {
            alert(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Inscription
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom: document.getElementById('registerNom').value,
                email: document.getElementById('registerEmail').value,
                password: document.getElementById('registerPassword').value,
                telephone: document.getElementById('registerTelephone').value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Inscription réussie ! Connectez-vous.');
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) registerModal.hide();
            new bootstrap.Modal(document.getElementById('loginModal')).show();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Recherche de trajets
document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('date').value;
    
    if (depart) params.append('depart', depart);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);

    try {
        const response = await fetch(`${API_URL}/trips?${params.toString()}`);
        const trips = await response.json();
        displayTrips(trips);
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Afficher les trajets
function displayTrips(trips) {
    const container = document.getElementById('tripsList');
    if (!container) return;

    if (trips.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info text-center rounded-4">Aucun trajet trouvé.</div></div>';
        return;
    }

    container.innerHTML = trips.map(trip => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="trip-card">
                <div class="trip-card-header">
                    <div class="trip-route">${trip.depart} → ${trip.destination}</div>
                    <div class="trip-price">${trip.prix}€</div>
                </div>
                <div class="trip-card-body">
                    <div class="trip-info"><i class="fas fa-calendar-alt"></i> ${new Date(trip.date_depart).toLocaleString('fr-FR')}</div>
                    <div class="trip-info"><i class="fas fa-bus"></i> ${trip.modele_vehicule || 'Bus'}</div>
                    <div class="trip-info"><i class="fas fa-chair"></i> ${trip.places_disponibles} places</div>
                    <a href="/seats.html?trip=${trip.id}" class="btn btn-book mt-3 w-100">Réserver</a>
                </div>
            </div>
        </div>
    `).join('');
}