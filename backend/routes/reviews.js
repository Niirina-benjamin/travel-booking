const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Ajouter un avis
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { trip_id, booking_id, rating, comment } = req.body;
        const user_id = req.user.id;
        
        // Vérifier si l'utilisateur a déjà laissé un avis
        const [existing] = await db.query(
            'SELECT * FROM reviews WHERE user_id = ? AND booking_id = ?',
            [user_id, booking_id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Vous avez déjà laissé un avis pour cette réservation' });
        }
        
        const [result] = await db.query(
            'INSERT INTO reviews (user_id, trip_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [user_id, trip_id, booking_id, rating, comment]
        );
        
        res.status(201).json({ message: 'Avis ajouté', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir les avis d'un trajet
router.get('/trip/:tripId', async (req, res) => {
    try {
        const [reviews] = await db.query(
            `SELECT r.*, u.nom as user_name 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.trip_id = ? 
             ORDER BY r.created_at DESC`,
            [req.params.tripId]
        );
        
        const [[{avg_rating}]] = await db.query(
            'SELECT ROUND(AVG(rating), 1) as avg_rating FROM reviews WHERE trip_id = ?',
            [req.params.tripId]
        );
        
        res.json({ reviews, avg_rating: avg_rating || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;