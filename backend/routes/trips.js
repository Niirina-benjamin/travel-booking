const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtenir tous les trajets disponibles
router.get('/', async (req, res) => {
    try {
        const { depart, destination, date } = req.query;
        let query = `
            SELECT t.*, v.type as type_vehicule, v.modele as modele_vehicule 
            FROM trips t 
            JOIN vehicles v ON t.vehicule_id = v.id 
            WHERE t.statut = 'programme'
        `;
        const params = [];

        if (depart) {
            query += ' AND t.depart LIKE ?';
            params.push(`%${depart}%`);
        }
        if (destination) {
            query += ' AND t.destination LIKE ?';
            params.push(`%${destination}%`);
        }
        if (date) {
            query += ' AND DATE(t.date_depart) = ?';
            params.push(date);
        }

        const [trips] = await db.query(query, params);
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Obtenir les détails d'un trajet
router.get('/:id', async (req, res) => {
    try {
        const [trips] = await db.query(
            `SELECT t.*, v.type as type_vehicule, v.modele as modele_vehicule, v.capacite 
             FROM trips t 
             JOIN vehicles v ON t.vehicule_id = v.id 
             WHERE t.id = ?`,
            [req.params.id]
        );
        
        if (trips.length === 0) {
            return res.status(404).json({ message: 'Trajet non trouvé' });
        }

        // Obtenir les sièges disponibles
        const [seats] = await db.query(
            'SELECT * FROM seats WHERE trip_id = ? AND statut = "disponible"',
            [req.params.id]
        );

        res.json({ ...trips[0], seats_available: seats });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Recherche avancée
router.get('/search/advanced', async (req, res) => {
    try {
        const { depart, destination, date_min, date_max, prix_min, prix_max, places_min } = req.query;
        
        let query = `
            SELECT t.*, v.type as type_vehicule, v.modele as modele_vehicule,
                   (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE trip_id = t.id) as avg_rating,
                   (SELECT COUNT(*) FROM reviews WHERE trip_id = t.id) as review_count
            FROM trips t 
            JOIN vehicles v ON t.vehicule_id = v.id 
            WHERE t.statut = 'programme'
        `;
        const params = [];
        
        if (depart) {
            query += ' AND t.depart LIKE ?';
            params.push(`%${depart}%`);
        }
        if (destination) {
            query += ' AND t.destination LIKE ?';
            params.push(`%${destination}%`);
        }
        if (date_min) {
            query += ' AND t.date_depart >= ?';
            params.push(date_min);
        }
        if (date_max) {
            query += ' AND t.date_depart <= ?';
            params.push(date_max);
        }
        if (prix_min) {
            query += ' AND t.prix >= ?';
            params.push(prix_min);
        }
        if (prix_max) {
            query += ' AND t.prix <= ?';
            params.push(prix_max);
        }
        if (places_min) {
            query += ' AND t.places_disponibles >= ?';
            params.push(places_min);
        }
        
        query += ' ORDER BY t.date_depart ASC';
        
        const [trips] = await db.query(query, params);
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir la liste des villes disponibles
router.get('/cities', async (req, res) => {
    try {
        const [departs] = await db.query('SELECT DISTINCT depart FROM trips WHERE statut = "programme"');
        const [destinations] = await db.query('SELECT DISTINCT destination FROM trips WHERE statut = "programme"');
        
        // Fusionner et dédoublonner
        const cities = new Set();
        departs.forEach(d => cities.add(d.depart));
        destinations.forEach(d => cities.add(d.destination));
        
        res.json([...cities].sort());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;