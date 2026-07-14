class ExportService {
    generateCSV(bookings) {
        const headers = ['ID', 'Client', 'Email', 'Départ', 'Destination', 'Date', 'Sièges', 'Prix', 'Statut'];
        const rows = bookings.map(b => [
            b.id,
            b.nom || 'N/A',
            b.email || 'N/A',
            b.depart,
            b.destination,
            new Date(b.date_depart).toLocaleDateString('fr-FR'),
            b.seats || 'N/A',
            b.prix_total + '€',
            b.statut
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return csv;
    }
    
    generateBookingTicket(booking) {
        // Template HTML pour le billet
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Billet TravelBook #${booking.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .ticket { border: 3px solid #000; padding: 30px; max-width: 600px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { color: #667eea; margin: 0; }
                    .details { margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ccc; }
                    .barcode { text-align: center; font-family: 'Courier New', monospace; margin: 30px 0; padding: 20px; background: #f5f5f5; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <div class="header">
                        <h1>🚌 TravelBook</h1>
                        <h2>Billet de voyage</h2>
                        <h3>Réservation #${booking.id}</h3>
                    </div>
                    <div class="details">
                        <div class="detail-row">
                            <strong>Passager:</strong>
                            <span>${booking.nom || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Trajet:</strong>
                            <span>${booking.depart} → ${booking.destination}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Départ:</strong>
                            <span>${new Date(booking.date_depart).toLocaleString('fr-FR')}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Arrivée:</strong>
                            <span>${new Date(booking.date_arrivee).toLocaleString('fr-FR')}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Sièges:</strong>
                            <span>${booking.seats || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Prix:</strong>
                            <span>${booking.prix_total}€</span>
                        </div>
                    </div>
                    <div class="barcode">
                        ||| || |||| | ||| || || ||| |||| || | ||| | ${booking.id}
                    </div>
                    <div class="footer">
                        <p>Présentez ce billet à l'embarquement</p>
                        <p>TravelBook - Voyagez en toute simplicité</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new ExportService();