class PaymentService {
    constructor() {
        this.transactions = [];
    }
    
    async processPayment(bookingData) {
        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const transaction = {
            id: 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            bookingId: bookingData.bookingId,
            amount: bookingData.amount,
            currency: 'EUR',
            method: bookingData.paymentMethod || 'carte_bancaire',
            status: Math.random() > 0.1 ? 'completed' : 'failed', // 90% de succès
            timestamp: new Date().toISOString(),
            cardLast4: '****' + Math.floor(Math.random() * 9000 + 1000),
            transactionRef: 'TXN-' + Math.random().toString(36).substr(2, 10).toUpperCase()
        };
        
        this.transactions.push(transaction);
        
        console.log(`💳 Paiement traité: ${transaction.id} - ${transaction.status}`);
        return transaction;
    }
    
    async refundPayment(transactionId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
            transaction.status = 'refunded';
            transaction.refundedAt = new Date().toISOString();
        }
        
        console.log(`💳 Remboursement: ${transactionId}`);
        return transaction;
    }
    
    getTransactionHistory() {
        return this.transactions;
    }
}

module.exports = new PaymentService();