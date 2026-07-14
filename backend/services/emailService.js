const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        this.emailLogPath = path.join(__dirname, '../../logs/emails.json');
        this.ensureLogFile();
    }
    
    ensureLogFile() {
        const dir = path.dirname(this.emailLogPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.emailLogPath)) {
            fs.writeFileSync(this.emailLogPath, '[]');
        }
    }
    
    async sendBookingConfirmation(user, booking, trip) {
        const email = {
            to: user.email,
            subject: `Confirmation de réservation #${booking.id} - TravelBook`,
            template: 'booking-confirmation',
            data: {
                userName: user.nom,
                bookingId: booking.id,
                depart: trip.depart,
                destination: trip.destination,
                dateDepart: new Date(trip.date_depart).toLocaleString('fr-FR'),
                dateArrivee: new Date(trip.date_arrivee).toLocaleString('fr-FR'),
                prixTotal: booking.prix_total,
                sieges: booking.seats || 'Non spécifié',
                dateReservation: new Date().toLocaleString('fr-FR')
            },
            sentAt: new Date().toISOString(),
            status: 'sent'
        };
        
        this.logEmail(email);
        console.log(`📧 Email de confirmation envoyé à ${user.email}`);
        return email;
    }
    
    async sendBookingCancellation(user, booking) {
        const email = {
            to: user.email,
            subject: `Annulation réservation #${booking.id} - TravelBook`,
            template: 'booking-cancellation',
            data: {
                userName: user.nom,
                bookingId: booking.id,
                cancellationDate: new Date().toLocaleString('fr-FR')
            },
            sentAt: new Date().toISOString(),
            status: 'sent'
        };
        
        this.logEmail(email);
        console.log(`📧 Email d'annulation envoyé à ${user.email}`);
        return email;
    }
    
    async sendWelcomeEmail(user) {
        const email = {
            to: user.email,
            subject: 'Bienvenue sur TravelBook !',
            template: 'welcome',
            data: {
                userName: user.nom
            },
            sentAt: new Date().toISOString(),
            status: 'sent'
        };
        
        this.logEmail(email);
        console.log(`📧 Email de bienvenue envoyé à ${user.email}`);
        return email;
    }
    
    logEmail(email) {
        try {
            const logs = JSON.parse(fs.readFileSync(this.emailLogPath));
            logs.push(email);
            fs.writeFileSync(this.emailLogPath, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Erreur log email:', error);
        }
    }
    
    getEmailLogs() {
        try {
            return JSON.parse(fs.readFileSync(this.emailLogPath));
        } catch (error) {
            return [];
        }
    }
}

module.exports = new EmailService();