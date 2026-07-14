const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const exportRoutes = require('./routes/exports');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
// ✅ Configuration CORS explicite
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://travel-booking-ngzk.onrender.com',
            'https://travel-booking-api.onrender.com',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            undefined
        ];
        
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('❌ CORS bloqué pour:', origin);
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Logger pour debug
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

// ⚠️ IMPORTANT : Servir les fichiers statiques AVANT les routes API
// Cela permet d'éviter les conflits de routes
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Route de debug pour vérifier les fichiers disponibles
app.get('/debug/files', (req, res) => {
    const baseDir = path.join(__dirname, '..');
    const frontendDir = path.join(baseDir, 'frontend');
    const pagesDir = path.join(frontendDir, 'pages');
    const jsDir = path.join(frontendDir, 'js');
    const cssDir = path.join(frontendDir, 'css');
    
    const result = {
        baseDir,
        structure: {
            frontend: fs.existsSync(frontendDir),
            pages: fs.existsSync(pagesDir),
            js: fs.existsSync(jsDir),
            css: fs.existsSync(cssDir)
        },
        files: {}
    };
    
    // Lister les fichiers dans chaque dossier
    ['frontend', 'frontend/pages', 'frontend/js', 'frontend/css'].forEach(dir => {
        const fullPath = path.join(baseDir, dir);
        if (fs.existsSync(fullPath)) {
            result.files[dir] = fs.readdirSync(fullPath);
        } else {
            result.files[dir] = ['DOSSIER NON TROUVÉ'];
        }
    });
    
    res.json(result);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/profile', profileRoutes);

// Fonction helper pour envoyer des fichiers HTML
function sendHtmlFile(res, relativePath) {
    const filePath = path.join(__dirname, '..', relativePath);
    console.log(`📄 Tentative d'envoi: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    } else {
        console.error(`❌ Fichier non trouvé: ${filePath}`);
        return res.status(404).send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>404 - Page non trouvée</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container text-center mt-5">
                    <h1 class="display-1">404</h1>
                    <h2>Page non trouvée</h2>
                    <p class="text-muted">Le fichier <code>${relativePath}</code> n'existe pas.</p>
                    <a href="/" class="btn btn-primary">Retour à l'accueil</a>
                </div>
            </body>
            </html>
        `);
    }
}

// Routes pour les pages HTML
app.get('/', (req, res) => sendHtmlFile(res, 'frontend/pages/index.html'));
app.get('/index.html', (req, res) => sendHtmlFile(res, 'frontend/pages/index.html'));
app.get('/reservation.html', (req, res) => sendHtmlFile(res, 'frontend/pages/reservation.html'));
app.get('/seats.html', (req, res) => sendHtmlFile(res, 'frontend/pages/seats.html'));
app.get('/confirmation.html', (req, res) => sendHtmlFile(res, 'frontend/pages/confirmation.html'));
app.get('/history.html', (req, res) => sendHtmlFile(res, 'frontend/pages/history.html'));
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Route pour le dashboard admin
app.get('/admin/dashboard.html', (req, res) => sendHtmlFile(res, 'admin/pages/dashboard.html'));

// Route de fallback - Si aucune route ne correspond
app.use((req, res, next) => {
    // Vérifier si c'est une requête pour un fichier statique
    if (req.url.match(/\.(html|css|js|png|jpg|jpeg|gif|ico)$/)) {
        const filePath = path.join(__dirname, '../frontend', req.url);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    next();
});

// Gestion des erreurs 404 pour l'API
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        message: 'Route API non trouvée',
        path: req.path 
    });
});

// Gestion des erreurs 404 pour les pages
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>404 - Page non trouvée</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container text-center mt-5">
                <h1 class="display-1">404</h1>
                <p>La page demandée n'existe pas.</p>
                <a href="/" class="btn btn-primary">Retour à l'accueil</a>
            </div>
        </body>
        </html>
    `);
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    res.status(500).json({ 
        message: 'Erreur serveur interne',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📁 Dossier racine: ${path.join(__dirname, '..')}`);
    console.log(`📁 Frontend: ${path.join(__dirname, '../frontend')}`);
    console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
    
    // Vérifier que les dossiers existent
    const dirsToCheck = [
        '../frontend',
        '../frontend/pages',
        '../frontend/js',
        '../frontend/css',
        '../admin',
        '../admin/pages'
    ];
    
    dirsToCheck.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${dir} - OK`);
        } else {
            console.log(`❌ ${dir} - MANQUANT !`);
        }
    });
});