import fs from 'fs';

let content = fs.readFileSync('client/src/index.css', 'utf-8');

// Replace color: var(--gold-accent); with color: #7a6012; to fix contrast issues on text
content = content.replace(/color:\s*var\(--gold-accent\);/g, 'color: #7a6012;');

fs.writeFileSync('client/src/index.css', content);
console.log('index.css text colors updated.');
