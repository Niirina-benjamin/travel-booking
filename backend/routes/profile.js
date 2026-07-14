const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Obtenir le profil
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, nom, email, telephone, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Statistiques de l'utilisateur
        const [[{total: totalBookings}]] = await db.query(
            'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?',
            [req.user.id]
        );
        
        const [[{total: totalReviews}]] = await db.query(
            'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
            [req.user.id]
        );
        
        res.json({
            ...users[0],
            stats: {
                totalBookings,
                totalReviews
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour le profil
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { nom, email, telephone } = req.body;
        
        await db.query(
            'UPDATE users SET nom = ?, email = ?, telephone = ? WHERE id = ?',
            [nom, email, telephone, req.user.id]
        );
        
        res.json({ message: 'Profil mis à jour' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Changer le mot de passe
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const validPassword = await bcrypt.compare(currentPassword, users[0].password);
        
        if (!validPassword) {
            return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        
        res.json({ message: 'Mot de passe changé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Notifications de l'utilisateur
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Marquer une notification comme lue
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;