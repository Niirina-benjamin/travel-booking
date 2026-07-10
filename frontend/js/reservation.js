// Détection de l'environnement
// const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// const API_URL = isLocalhost ? 'http://localhost:3000/api' : '/api';
const API_URL = window.location.origin + '/api';

console.log('🌍 Environnement:', API_URL ? 'local' : 'production');
console.log('🔗 API URL:', API_URL);

// Gestion du formulaire de recherche
document.getElementById('reservationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('date').value;
    const passagers = document.getElementById('passagers').value;
    
    if (!depart || !destination || !date) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Sauvegarder le nombre de passagers pour la sélection des sièges
    localStorage.setItem('passagers', passagers);
    
    try {
        const response = await fetch(`${API_URL}/trips?depart=${depart}&destination=${destination}&date=${date}`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const trips = await response.json();
        displaySearchResults(trips);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors de la recherche. Veuillez réessayer.');
    }
});

// Afficher les résultats de recherche
function displaySearchResults(trips) {
    const resultsDiv = document.getElementById('searchResults');
    const tripsContainer = document.getElementById('availableTrips');
    
    if (!resultsDiv || !tripsContainer) {
        console.error('❌ Éléments HTML manquants');
        return;
    }
    
    resultsDiv.style.display = 'block';
    
    if (trips.length === 0) {
        tripsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    Aucun trajet trouvé pour cette recherche.
                </div>
            </div>
        `;
        return;
    }
    
    tripsContainer.innerHTML = trips.map(trip => `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${trip.depart} → ${trip.destination}</h5>
                    <p class="card-text">
                        <strong>📅 Départ:</strong> ${new Date(trip.date_depart).toLocaleString()}<br>
                        <strong>🏁 Arrivée:</strong> ${new Date(trip.date_arrivee).toLocaleString()}<br>
                        <strong>🚌 Véhicule:</strong> ${trip.type_vehicule} - ${trip.modele_vehicule}<br>
                        <strong>💺 Places disponibles:</strong> ${trip.places_disponibles}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h4 text-primary mb-0">${trip.prix}€</span>
                        <a href="seats.html?trip=${trip.id}" class="btn btn-success btn-lg">
                            Sélectionner les sièges
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Scroll vers les résultats
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}