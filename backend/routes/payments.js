const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

// Traiter un paiement
router.post('/process', authenticateToken, async (req, res) => {
    try {
        const { bookingId, amount, paymentMethod } = req.body;
        
        const transaction = await paymentService.processPayment({
            bookingId,
            amount,
            paymentMethod
        });
        
        res.json({
            success: transaction.status === 'completed',
            transaction
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur de paiement', error: error.message });
    }
});

// Historique des transactions
router.get('/history', authenticateToken, async (req, res) => {
    const transactions = paymentService.getTransactionHistory();
    res.json(transactions);
});

module.exports = router;