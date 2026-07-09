// Récupérer les données de réservation
const bookingData = JSON.parse(localStorage.getItem('lastBooking'));
const API_URL = window.location.origin + '/api';

if (bookingData) {
    document.getElementById('bookingRef').textContent = '#' + bookingData.bookingId;
    document.getElementById('route').textContent = 
        `${bookingData.tripDetails.depart} → ${bookingData.tripDetails.destination}`;
    document.getElementById('departureDate').textContent = 
        new Date(bookingData.tripDetails.date_depart).toLocaleString();
    document.getElementById('seats').textContent = bookingData.seats.join(', ');
    document.getElementById('totalPrice').textContent = `${bookingData.totalPrice}€`;
}