const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend', 'pages');

if (!fs.existsSync(pagesDir)) {
    console.error('❌ Dossier pages non trouvé:', pagesDir);
    process.exit(1);
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

console.log('🔧 Correction des chemins dans les fichiers HTML...\n');

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remplacer les chemins relatifs par des chemins absolus
    const replacements = [
        { from: /src="\.\.\/js\//g, to: 'src="/js/' },
        { from: /href="\.\.\/css\//g, to: 'href="/css/' },
        { from: /src="\.\.\/images\//g, to: 'src="/images/' },
        { from: /href="\.\.\/pages\//g, to: 'href="/' },
        { from: /href="([a-z]+)\.html"/g, to: 'href="/$1.html"' },
    ];
    
    replacements.forEach(({ from, to }) => {
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${file} - Corrigé`);
    } else {
        console.log(`⏭️  ${file} - Déjà correct`);
    }
});

console.log('\n✅ Correction terminée !');