const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques CORRECTEMENT
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin/pages')));
app.use('/admin/js', express.static(path.join(__dirname, '../admin/js')));
app.use('/admin/css', express.static(path.join(__dirname, '../admin/css')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Routes pour les pages HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/reservation.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/reservation.html'));
});

app.get('/seats.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/seats.html'));
});

app.get('/confirmation.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/confirmation.html'));
});

app.get('/history.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/history.html'));
});

// Route pour le dashboard admin
app.get('/admin/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/pages/dashboard.html'));
});

// Servir les fichiers CSS et JS
app.get('/css/:file', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/css', req.params.file));
});

app.get('/js/:file', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/js', req.params.file));
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Page non trouvée',
        path: req.path 
    });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📁 Dossier statique: ${path.join(__dirname, '../frontend')}`);
    console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
});