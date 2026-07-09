// Configuration de l'API - CORRECTION ICI
const API_URL = 'https://travel-booking-ngzk.onrender.com/api';

// Gestion du token
let currentUser = null;
const token = localStorage.getItem('token');

if (token) {
    // Vérifier le token et récupérer les infos utilisateur
    fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Token invalide');
        return response.json();
    })
    .then(data => {
        if (data.user) {
            currentUser = data.user;
            updateUI();
        }
    })
    .catch(() => {
        localStorage.removeItem('token');
    });
}

// Mise à jour de l'interface utilisateur
function updateUI() {
    if (currentUser) {
        document.querySelectorAll('.nav-item .nav-link[data-bs-target="#loginModal"]').forEach(el => {
            el.textContent = currentUser.nom;
            el.removeAttribute('data-bs-toggle');
            el.removeAttribute('data-bs-target');
            el.href = '#';
            el.addEventListener('click', logout);
        });
    }
}

// Déconnexion
function logout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    currentUser = null;
    window.location.reload();
}

// Gestion de l'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        nom: document.getElementById('registerNom').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        telephone: document.getElementById('registerTelephone').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            new bootstrap.Modal(document.getElementById('loginModal')).show();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Gestion de la connexion
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            window.location.reload();
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

    container.innerHTML = trips.map(trip => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${trip.depart} → ${trip.destination}</h5>
                    <p class="card-text">
                        <strong>Départ:</strong> ${new Date(trip.date_depart).toLocaleString()}<br>
                        <strong>Arrivée:</strong> ${new Date(trip.date_arrivee).toLocaleString()}<br>
                        <strong>Véhicule:</strong> ${trip.type_vehicule} - ${trip.modele_vehicule}<br>
                        <strong>Places disponibles:</strong> ${trip.places_disponibles}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 text-primary mb-0">${trip.prix}€</span>
                        <a href="seats.html?trip=${trip.id}" class="btn btn-primary">Réserver</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Charger les trajets au chargement de la page
if (document.getElementById('tripsList')) {
    fetch(`${API_URL}/trips`)
        .then(response => response.json())
        .then(trips => displayTrips(trips))
        .catch(error => console.error('Erreur:', error));
}