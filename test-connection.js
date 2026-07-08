require('dotenv').config();
const mysql = require('mysql2');

console.log('🔍 Test de connexion avec :');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Erreur de connexion:', err.message);
        return;
    }
    console.log('✅ Connexion réussie à Railway MySQL !');
    
    connection.query('SELECT 1 + 1 AS solution', (error, results) => {
        if (error) throw error;
        console.log('✅ Test requête réussi:', results[0].solution);
        connection.end();
    });
});