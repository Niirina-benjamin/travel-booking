const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Dashboard - Statistiques
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as total FROM users');
        const [tripCount] = await db.query('SELECT COUNT(*) as total FROM trips');
        const [bookingCount] = await db.query('SELECT COUNT(*) as total FROM bookings');
        const [recentBookings] = await db.query(`
            SELECT b.*, u.nom, u.email, t.depart, t.destination 
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN trips t ON b.trip_id = t.id 
            ORDER BY b.date_reservation DESC 
            LIMIT 10
        `);
        
        res.json({
            stats: {
                users: userCount[0].total,
                trips: tripCount[0].total,
                bookings: bookingCount[0].total
            },
            recentBookings
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Gestion des trajets
router.get('/trips', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [trips] = await db.query(`
            SELECT t.*, v.modele, v.immatriculation 
            FROM trips t 
            JOIN vehicles v ON t.vehicule_id = v.id
        `);
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

router.post('/trips', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { depart, destination, date_depart, date_arrivee, prix, vehicule_id } = req.body;
        
        // Récupérer la capacité du véhicule
        const [vehicles] = await db.query('SELECT capacite FROM vehicles WHERE id = ?', [vehicule_id]);
        const places_disponibles = vehicles[0].capacite;
        
        const [result] = await db.query(
            'INSERT INTO trips (depart, destination, date_depart, date_arrivee, prix, vehicule_id, places_disponibles) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [depart, destination, date_depart, date_arrivee, prix, vehicule_id, places_disponibles]
        );
        
        res.status(201).json({ message: 'Trajet créé', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Gestion des utilisateurs
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, nom, email, telephone, role, created_at FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Gestion des véhicules
router.get('/vehicles', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [vehicles] = await db.query('SELECT * FROM vehicles');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;