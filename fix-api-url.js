const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'frontend', 'js');

if (!fs.existsSync(jsDir)) {
    console.error('❌ Dossier js non trouvé:', jsDir);
    process.exit(1);
}

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

console.log('🔧 Correction des URLs API dans les fichiers JS...\n');

files.forEach(file => {
    const filePath = path.join(jsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remplacer les URLs incorrectes
    const replacements = [
        // Remplacer les URLs en dur par la détection automatique
        {
            from: /const API_URL = ['"]https?:\/\/travel-booking-api\.onrender\.com\/api['"]/g,
            to: "const API_URL = window.location.origin + '/api'"
        },
        {
            from: /const API_URL = ['"]http:\/\/localhost:3000\/api['"]/g,
            to: "const API_URL = window.location.origin + '/api'"
        },
        // Ajouter la déclaration si elle n'existe pas
        {
            from: /^(?!.*const API_URL)/,
            to: "const API_URL = window.location.origin + '/api';\n\n",
            condition: !content.includes('const API_URL')
        }
    ];
    
    replacements.forEach(({ from, to, condition }) => {
        if (condition !== undefined && !condition) return;
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${file} - Corrigé`);
    } else {
        console.log(`⏭️  ${file} - OK`);
    }
});

console.log('\n✅ Correction terminée !');