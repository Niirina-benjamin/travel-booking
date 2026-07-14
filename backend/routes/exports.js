const express = require('express');
const router = express.Router();
const db = require('../config/database');
const exportService = require('../services/exportService');
const { authenticateToken } = require('../middleware/auth');

// Export CSV des réservations
router.get('/bookings/csv', authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT b.*, u.nom, u.email, t.depart, t.destination, t.date_depart,
                   GROUP_CONCAT(bs.seat_number) as seats
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN trips t ON b.trip_id = t.id 
            LEFT JOIN booking_seats bs ON b.id = bs.booking_id
            WHERE b.user_id = ?
            GROUP BY b.id
            ORDER BY b.date_reservation DESC
        `, [req.user.id]);
        
        const csv = exportService.generateCSV(bookings);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=reservations.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Télécharger le billet en HTML
router.get('/ticket/:bookingId', authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT b.*, u.nom, u.email, t.depart, t.destination, t.date_depart, t.date_arrivee,
                   GROUP_CONCAT(bs.seat_number) as seats
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN trips t ON b.trip_id = t.id 
            LEFT JOIN booking_seats bs ON b.id = bs.booking_id
            WHERE b.id = ? AND b.user_id = ?
            GROUP BY b.id
        `, [req.params.bookingId, req.user.id]);
        
        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }
        
        const html = exportService.generateBookingTicket(bookings[0]);
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;