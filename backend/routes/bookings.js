// Obtenir une réservation spécifique
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
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});