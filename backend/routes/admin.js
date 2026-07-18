const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Dashboard stats
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [[{total: users}]] = await db.query('SELECT COUNT(*) as total FROM users');
        const [[{total: trips}]] = await db.query('SELECT COUNT(*) as total FROM trips');
        const [[{total: bookings}]] = await db.query('SELECT COUNT(*) as total FROM bookings');
        const [[{total: vehicles}]] = await db.query('SELECT COUNT(*) as total FROM vehicles');
        
        const [recentBookings] = await db.query(`
            SELECT b.*, u.nom, u.email, t.depart, t.destination, t.date_depart
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN trips t ON b.trip_id = t.id 
            ORDER BY b.date_reservation DESC 
            LIMIT 10
        `);
        
        res.json({
            stats: { users, trips, bookings, vehicles },
            recentBookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CRUD Trajets
router.get('/trips', authenticateToken, isAdmin, async (req, res) => {
    const [trips] = await db.query(`
        SELECT t.*, v.modele, v.type as type_vehicule 
        FROM trips t JOIN vehicles v ON t.vehicule_id = v.id
        ORDER BY t.date_depart DESC
    `);
    res.json(trips);
});

router.post('/trips', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { depart, destination, date_depart, date_arrivee, prix, vehicule_id, statut } = req.body;
        const [[{capacite}]] = await db.query('SELECT capacite FROM vehicles WHERE id = ?', [vehicule_id]);
        
        const [result] = await db.query(
            'INSERT INTO trips (depart, destination, date_depart, date_arrivee, prix, vehicule_id, places_disponibles, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [depart, destination, date_depart, date_arrivee, prix, vehicule_id, capacite, statut || 'programme']
        );
        
        // Générer les sièges
        const tripId = result.insertId;
        for (let i = 1; i <= capacite; i++) {
            await db.query('INSERT INTO seats (trip_id, numero_siege, statut) VALUES (?, ?, ?)',
                [tripId, `A${i}`, 'disponible']);
        }
        
        res.status(201).json({ message: 'Trajet créé', id: tripId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/trips/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { depart, destination, date_depart, date_arrivee, prix, vehicule_id, statut } = req.body;
        await db.query(
            'UPDATE trips SET depart=?, destination=?, date_depart=?, date_arrivee=?, prix=?, vehicule_id=?, statut=? WHERE id=?',
            [depart, destination, date_depart, date_arrivee, prix, vehicule_id, statut, req.params.id]
        );
        res.json({ message: 'Trajet mis à jour' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/trips/:id', authenticateToken, isAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const tripId = req.params.id;

        // 1. Supprimer les sièges réservés liés à ce trajet
        await connection.query(
            `DELETE bs FROM booking_seats bs 
             INNER JOIN bookings b ON bs.booking_id = b.id 
             WHERE b.trip_id = ?`, [tripId]
        );

        // 2. Supprimer les réservations liées au trajet
        await connection.query('DELETE FROM bookings WHERE trip_id = ?', [tripId]);

        // 3. Supprimer les avis liés au trajet
        await connection.query('DELETE FROM reviews WHERE trip_id = ?', [tripId]);

        // 4. Supprimer les sièges du trajet
        await connection.query('DELETE FROM seats WHERE trip_id = ?', [tripId]);

        // 5. Supprimer le trajet
        const [result] = await connection.query('DELETE FROM trips WHERE id = ?', [tripId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Trajet non trouvé' });
        }

        await connection.commit();
        res.json({ message: 'Trajet supprimé avec succès' });
    } catch (error) {
        await connection.rollback();
        console.error('Erreur suppression trajet:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    } finally {
        connection.release();
    }
});

// Gestion des réservations (admin)
router.get('/bookings', authenticateToken, isAdmin, async (req, res) => {
    const { statut } = req.query;
    let query = `
        SELECT b.*, u.nom, u.email, t.depart, t.destination, t.date_depart,
               GROUP_CONCAT(bs.seat_number) as seats
        FROM bookings b 
        JOIN users u ON b.user_id = u.id 
        JOIN trips t ON b.trip_id = t.id 
        LEFT JOIN booking_seats bs ON b.id = bs.booking_id
    `;
    const params = [];
    
    if (statut) {
        query += ' WHERE b.statut = ?';
        params.push(statut);
    }
    
    query += ' GROUP BY b.id ORDER BY b.date_reservation DESC';
    
    const [bookings] = await db.query(query, params);
    res.json(bookings);
});

router.put('/bookings/:id/status', authenticateToken, isAdmin, async (req, res) => {
    await db.query('UPDATE bookings SET statut = ? WHERE id = ?', 
        [req.body.statut, req.params.id]);
    res.json({ message: 'Statut mis à jour' });
});

// Gestion utilisateurs
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    const [users] = await db.query('SELECT id, nom, email, telephone, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
});

router.put('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id]);
    res.json({ message: 'Rôle mis à jour' });
});

// CRUD Véhicules
router.get('/vehicles', authenticateToken, isAdmin, async (req, res) => {
    const [vehicles] = await db.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(vehicles);
});

router.post('/vehicles', authenticateToken, isAdmin, async (req, res) => {
    const { type, modele, immatriculation, capacite, statut } = req.body;
    const [result] = await db.query(
        'INSERT INTO vehicles (type, modele, immatriculation, capacite, statut) VALUES (?, ?, ?, ?, ?)',
        [type, modele, immatriculation, capacite, statut || 'actif']
    );
    res.status(201).json({ message: 'Véhicule créé', id: result.insertId });
});

router.put('/vehicles/:id', authenticateToken, isAdmin, async (req, res) => {
    const { type, modele, immatriculation, capacite, statut } = req.body;
    await db.query(
        'UPDATE vehicles SET type=?, modele=?, immatriculation=?, capacite=?, statut=? WHERE id=?',
        [type, modele, immatriculation, capacite, statut, req.params.id]
    );
    res.json({ message: 'Véhicule mis à jour' });
});

// Obtenir tous les avis
router.get('/all-reviews', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT r.*, u.nom as user_name, t.depart, t.destination
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN trips t ON r.trip_id = t.id
            ORDER BY r.created_at DESC
        `);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Supprimer un avis
router.delete('/reviews/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ message: 'Avis supprimé' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Statistiques des avis par trajet
router.get('/reviews/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT t.id, t.depart, t.destination,
                   COUNT(r.id) as review_count,
                   ROUND(AVG(r.rating), 1) as avg_rating
            FROM trips t
            LEFT JOIN reviews r ON t.id = r.trip_id
            GROUP BY t.id
            ORDER BY avg_rating DESC
        `);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;