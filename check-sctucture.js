const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la structure du projet...\n');

const requiredFiles = [
    'frontend/pages/index.html',
    'frontend/pages/reservation.html',
    'frontend/pages/seats.html',
    'frontend/pages/confirmation.html',
    'frontend/pages/history.html',
    'frontend/js/script.js',
    'frontend/js/history.js',
    'frontend/js/seats.js',
    'frontend/js/confirmation.js',
    'frontend/css/style.css',
    'frontend/css/seats.css',
    'admin/pages/dashboard.html',
    'admin/js/admin.js',
    'backend/server.js',
    'backend/config/database.js',
    'backend/routes/auth.js',
    'backend/routes/trips.js',
    'backend/routes/bookings.js',
    'backend/routes/admin.js',
    'package.json'
];

let allGood = true;

requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ MANQUANT: ${file}`);
        allGood = false;
    }
});

if (allGood) {
    console.log('\n✅ Tous les fichiers sont présents !');
} else {
    console.log('\n❌ Certains fichiers sont manquants. Vérifiez la structure.');
}