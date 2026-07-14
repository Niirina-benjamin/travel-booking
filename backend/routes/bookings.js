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
        if (trips.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Trajet non trouvé' });
        }
        
        const prix_total = trips[0].prix * seats.length;

        // Créer la réservation
        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (user_id, trip_id, nb_passagers, prix_total) VALUES (?, ?, ?, ?)',
            [user_id, trip_id, nb_passagers, prix_total]
        );

        const booking_id = bookingResult.insertId;

        // Mettre à jour les sièges et créer les entrées booking_seats
        for (const seat of seats) {
            // Mettre à jour le statut du siège
            await connection.query(
                'UPDATE seats SET statut = "reserve" WHERE trip_id = ? AND numero_siege = ?',
                [trip_id, seat]
            );

            // Ajouter le siège à la réservation
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
        console.error('❌ Erreur réservation:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    } finally {
        connection.release();
    }
});

// Obtenir une réservation spécifique par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT b.*, t.depart, t.destination, t.date_depart, t.date_arrivee,
                    t.prix, v.modele as modele_vehicule, v.type as type_vehicule,
                    GROUP_CONCAT(bs.seat_number) as seats
             FROM bookings b
             JOIN trips t ON b.trip_id = t.id
             JOIN vehicles v ON t.vehicule_id = v.id
             LEFT JOIN booking_seats bs ON b.id = bs.booking_id
             WHERE b.id = ? AND b.user_id = ?
             GROUP BY b.id`,
            [req.params.id, req.user.id]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }
        
        res.json(bookings[0]);
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Historique des réservations de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
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
        console.error('❌ Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Annuler une réservation
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const bookingId = req.params.id;
        const userId = req.user.id;
        
        // Vérifier que la réservation appartient à l'utilisateur
        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ? AND statut != "annule"',
            [bookingId, userId]
        );
        
        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Réservation non trouvée ou déjà annulée' });
        }
        
        // Mettre à jour le statut de la réservation
        await connection.query(
            'UPDATE bookings SET statut = "annule" WHERE id = ?',
            [bookingId]
        );
        
        // Libérer les sièges
        await connection.query(
            `UPDATE seats s 
             JOIN booking_seats bs ON s.trip_id = (SELECT trip_id FROM bookings WHERE id = ?) 
                AND s.numero_siege = bs.seat_number
             SET s.statut = "disponible"
             WHERE bs.booking_id = ?`,
            [bookingId, bookingId]
        );
        
        // Mettre à jour les places disponibles
        const [booking] = await connection.query(
            'SELECT trip_id, nb_passagers FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        await connection.query(
            'UPDATE trips SET places_disponibles = places_disponibles + ? WHERE id = ?',
            [booking[0].nb_passagers, booking[0].trip_id]
        );
        
        await connection.commit();
        res.json({ message: 'Réservation annulée avec succès' });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Erreur annulation:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;