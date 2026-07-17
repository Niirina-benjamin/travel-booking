// Détection de l'environnement
// const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// const API_URL = isLocalhost ? 'http://localhost:3000/api' : '/api';
// const API_URL = window.location.origin + '/api';

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

function displayResults(trips) {
    const resultsDiv = document.getElementById('searchResults');
    const tripsContainer = document.getElementById('availableTrips');
    
    if (!resultsDiv || !tripsContainer) return;
    
    resultsDiv.style.display = 'block';
    
    if (!trips || trips.length === 0) {
        tripsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">Aucun trajet trouvé.</div>
            </div>`;
        return;
    }
    
    // Pour chaque trajet, charger ses avis
    tripsContainer.innerHTML = trips.map(trip => `
        <div class="col-md-6 mb-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${trip.depart} → ${trip.destination}</h5>
                    <p class="card-text">
                        <strong>📅 Départ:</strong> ${new Date(trip.date_depart).toLocaleString()}<br>
                        <strong>🏁 Arrivée:</strong> ${new Date(trip.date_arrivee).toLocaleString()}<br>
                        <strong>🚌 Véhicule:</strong> ${trip.type_vehicule || 'Bus'} - ${trip.modele_vehicule || 'Standard'}<br>
                        <strong>💺 Places:</strong> ${trip.places_disponibles} disponibles
                    </p>
                    
                    <!-- ⭐ Section avis -->
                    <div class="mb-3 p-2 bg-light rounded" id="rating-${trip.id}">
                        <small class="text-muted">Chargement des avis...</small>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h4 text-primary mb-0">${trip.prix}€</span>
                        <a href="seats.html?trip=${trip.id}" class="btn btn-success">Choisir sièges</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Charger les avis pour chaque trajet
    trips.forEach(trip => loadTripRating(trip.id));
    
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Charger la note d'un trajet
async function loadTripRating(tripId) {
    try {
        const response = await fetch(`${API_URL}/reviews/trip/${tripId}`);
        const data = await response.json();
        
        const ratingDiv = document.getElementById(`rating-${tripId}`);
        if (!ratingDiv) return;
        
        if (data.reviews.length === 0) {
            ratingDiv.innerHTML = `
                <small class="text-muted">
                    <i class="far fa-star"></i> Pas encore d'avis
                </small>`;
        } else {
            const stars = '⭐'.repeat(Math.round(data.avg_rating));
            ratingDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <strong>${stars}</strong> 
                        <small>${data.avg_rating}/5</small>
                    </span>
                    <small class="text-muted">${data.reviews.length} avis</small>
                </div>
                <div class="mt-2">
                    ${data.reviews.slice(0, 2).map(r => `
                        <div class="small mb-1">
                            <strong>${r.user_name}</strong>: 
                            ${'⭐'.repeat(r.rating)} 
                            "${r.comment ? r.comment.substring(0, 50) + '...' : 'Pas de commentaire'}"
                        </div>
                    `).join('')}
                    ${data.reviews.length > 2 ? `<small class="text-primary" style="cursor:pointer;" onclick="showAllReviews(${tripId})">Voir tous les avis</small>` : ''}
                </div>`;
        }
    } catch (error) {
        console.error('Erreur chargement avis:', error);
    }
}

// Afficher tous les avis dans un modal
async function showAllReviews(tripId) {
    try {
        const response = await fetch(`${API_URL}/reviews/trip/${tripId}`);
        const data = await response.json();
        
        // Créer un modal dynamique
        const modalHTML = `
            <div class="modal fade" id="allReviewsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">⭐ Tous les avis (${data.reviews.length})</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h4 class="text-center mb-4">Note moyenne : ${data.avg_rating}/5 ⭐</h4>
                            ${data.reviews.map(r => `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between">
                                            <h6>${r.user_name}</h6>
                                            <span>${'⭐'.repeat(r.rating)}</span>
                                        </div>
                                        <p class="mb-1">${r.comment || 'Pas de commentaire'}</p>
                                        <small class="text-muted">${new Date(r.created_at).toLocaleDateString('fr-FR')}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Supprimer l'ancien modal s'il existe
        const oldModal = document.getElementById('allReviewsModal');
        if (oldModal) oldModal.remove();
        
        // Ajouter le nouveau modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Afficher le modal
        const modal = new bootstrap.Modal(document.getElementById('allReviewsModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==========================================
// RESERVATION.JS - CORRIGÉ ET COMPLET
// ==========================================

const API_BASE = typeof API_URL !== 'undefined' ? API_URL : (window.location.origin + '/api');
const AUTH_TOKEN = typeof token !== 'undefined' ? token : localStorage.getItem('token');

// Charger les villes disponibles au démarrage
async function loadCities() {
    try {
        const response = await fetch(`${API_BASE}/trips/cities`);
        const cities = await response.json();
        
        const departSelect = document.getElementById('depart');
        const destinationSelect = document.getElementById('destination');
        
        const optionsHTML = '<option value="">Choisir une ville...</option>' +
            cities.map(city => `<option value="${city}">${city}</option>`).join('');
        
        if (departSelect) departSelect.innerHTML = optionsHTML;
        if (destinationSelect) destinationSelect.innerHTML = optionsHTML;
        
        console.log('✅ Villes chargées:', cities.length);
    } catch (error) {
        console.error('❌ Erreur chargement villes:', error);
        // Fallback avec les 5 villes de base
        const fallbackCities = ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux', 'Lille', 'Toulouse', 'Nantes', 'Strasbourg', 'Montpellier'];
        const optionsHTML = '<option value="">Choisir une ville...</option>' +
            fallbackCities.map(city => `<option value="${city}">${city}</option>`).join('');
        
        document.getElementById('depart').innerHTML = optionsHTML;
        document.getElementById('destination').innerHTML = optionsHTML;
    }
}

// Charger les villes au démarrage
document.addEventListener('DOMContentLoaded', function() {
    loadCities();
});

// Gestion du formulaire de réservation
document.getElementById('reservationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('date').value;
    const passagers = document.getElementById('passagers').value;
    
    // Filtres avancés
    const prixMin = document.getElementById('prixMin')?.value;
    const prixMax = document.getElementById('prixMax')?.value;
    const placesMin = document.getElementById('placesMin')?.value;
    const dateMax = document.getElementById('dateMax')?.value;
    
    if (!depart || !destination) {
        alert('Veuillez choisir un lieu de départ et une destination');
        return;
    }
    
    localStorage.setItem('passagers', passagers || 1);
    
    // Vérifier si des filtres avancés sont utilisés
    const hasAdvancedFilters = prixMin || prixMax || placesMin || dateMax;
    let url = `${API_BASE}/trips`;
    if (hasAdvancedFilters) url = `${API_BASE}/trips/search/advanced`;
    
    const params = new URLSearchParams();
    if (depart) params.append('depart', depart);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (prixMin) params.append('prix_min', prixMin);
    if (prixMax) params.append('prix_max', prixMax);
    if (placesMin) params.append('places_min', placesMin);
    if (dateMax) params.append('date_max', dateMax);
    
    console.log('🔍 Recherche:', url, params.toString());
    
    try {
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const trips = await response.json();
        displaySearchResults(trips);
    } catch (error) {
        console.error('❌ Erreur recherche:', error);
        alert('Erreur lors de la recherche. Veuillez réessayer.');
    }
});

// Afficher les résultats
function displaySearchResults(trips) {
    const resultsDiv = document.getElementById('searchResults');
    const tripsContainer = document.getElementById('availableTrips');
    if (!resultsDiv || !tripsContainer) return;
    
    resultsDiv.style.display = 'block';
    
    if (!trips || trips.length === 0) {
        tripsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center py-4 rounded-4">
                    <i class="fas fa-search fa-2x mb-3"></i>
                    <h5>Aucun trajet trouvé</h5>
                    <p class="mb-0">Essayez avec d'autres critères de recherche</p>
                </div>
            </div>`;
        return;
    }
    
    tripsContainer.innerHTML = trips.map(trip => `
        <div class="col-md-6 mb-4">
            <div class="trip-card">
                <div class="trip-card-header">
                    <div class="trip-route">${trip.depart} → ${trip.destination}</div>
                    <div class="trip-price-tag">${trip.prix}€</div>
                </div>
                <div class="trip-card-body">
                    <div class="trip-info-item">
                        <i class="fas fa-calendar-alt"></i> 
                        <strong>Départ :</strong> ${new Date(trip.date_depart).toLocaleString('fr-FR')}
                    </div>
                    <div class="trip-info-item">
                        <i class="fas fa-calendar-check"></i> 
                        <strong>Arrivée :</strong> ${new Date(trip.date_arrivee).toLocaleString('fr-FR')}
                    </div>
                    <div class="trip-info-item">
                        <i class="fas fa-bus"></i> 
                        <strong>Véhicule :</strong> ${trip.modele_vehicule || trip.type_vehicule || 'Bus'}
                    </div>
                    <div class="trip-info-item">
                        <i class="fas fa-chair"></i> 
                        <strong>Places :</strong> ${trip.places_disponibles} disponibles
                    </div>
                    <div class="trip-info-item" id="rating-${trip.id}">
                        <i class="fas fa-star text-muted"></i> 
                        <small>Chargement des avis...</small>
                    </div>
                    <div class="text-end mt-3">
                        <a href="/seats.html?trip=${trip.id}" class="btn btn-book">
                            <i class="fas fa-chair me-2"></i>Choisir les sièges
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Charger les notes pour chaque trajet
    trips.forEach(trip => loadTripRating(trip.id));
    
    // Scroll vers les résultats
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Charger la note d'un trajet
async function loadTripRating(tripId) {
    try {
        const response = await fetch(`${API_BASE}/reviews/trip/${tripId}`);
        const data = await response.json();
        const ratingDiv = document.getElementById(`rating-${tripId}`);
        if (!ratingDiv) return;
        
        if (!data.reviews || data.reviews.length === 0) {
            ratingDiv.innerHTML = '<i class="fas fa-star text-muted"></i> <small>Pas encore d\'avis</small>';
        } else {
            const stars = '⭐'.repeat(Math.round(data.avg_rating));
            ratingDiv.innerHTML = `
                <i class="fas fa-star text-warning"></i> 
                <strong>${stars} ${data.avg_rating}/5</strong> 
                <small class="text-muted">(${data.reviews.length} avis)</small>`;
        }
    } catch (error) {
        // Ignorer l'erreur silencieusement
    }
}