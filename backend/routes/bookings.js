const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Créer une réservation
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { trip_id, seats, nb_passagers } = req.body;
        const user_id = req.user.id;

        // Vérifier la disponibilité des sièges
        for (const seat of seats) {
            const [existingSeats] = await connection.query(
                'SELECT * FROM seats WHERE trip_id = ? AND numero_siege = ? AND statut = "disponible"',
                [trip_id, seat]
            );
            if (existingSeats.length === 0) {
                await connection.rollback();
                return res.status(400).json({ message: `Le siège ${seat} n'est plus disponible` });
            }
        }

        // Obtenir le prix du trajet
        const [trips] = await connection.query('SELECT prix FROM trips WHERE id = ?', [trip_id]);
        const prix_total = trips[0].prix * seats.length;

        // Créer la réservation
        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (user_id, trip_id, nb_passagers, prix_total) VALUES (?, ?, ?, ?)',
            [user_id, trip_id, nb_passagers, prix_total]
        );

        const booking_id = bookingResult.insertId;

        // Mettre à jour les sièges
        for (const seat of seats) {
            // Mettre à jour le statut du siège
            await connection.query(
                'UPDATE seats SET statut = "reserve" WHERE trip_id = ? AND numero_siege = ?',
                [trip_id, seat]
            );

            // Ajouter les sièges à la réservation
            await connection.query(
                'INSERT INTO booking_seats (booking_id, seat_number) VALUES (?, ?)',
                [booking_id, seat]
            );
        }

        // Mettre à jour les places disponibles
        await connection.query(
            'UPDATE trips SET places_disponibles = places_disponibles - ? WHERE id = ?',
            [seats.length, trip_id]
        );

        await connection.commit();
        res.status(201).json({ 
            message: 'Réservation créée avec succès', 
            booking_id,
            prix_total 
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    } finally {
        connection.release();
    }
});

// Historique des réservations
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT b.*, t.depart, t.destination, t.date_depart, t.date_arrivee,
                    GROUP_CONCAT(bs.seat_number) as seats
             FROM bookings b
             JOIN trips t ON b.trip_id = t.id
             LEFT JOIN booking_seats bs ON b.id = bs.booking_id
             WHERE b.user_id = ?
             GROUP BY b.id
             ORDER BY b.date_reservation DESC`,
            [req.user.id]
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;