import fs from 'fs';

let content = fs.readFileSync('client/src/index.css', 'utf-8');

content = content.replace(
  "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Trirong:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;600;700&display=swap');",
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');"
);

// Body font
content = content.replace(/'Geist', sans-serif/g, "'Inter', sans-serif");

// Replace Trirong and Cinzel with Cormorant Garamond
content = content.replace(/'Trirong', serif/g, "'Cormorant Garamond', serif");
content = content.replace(/'Cinzel', serif/g, "'Cormorant Garamond', serif");

// Now specifically target the header classes that were previously changed to Geist
const classesToGaramond = [
  ".brand-title",
  "h1.page-title",
  ".navbar-brand",
  ".question-title,\\n.handwriting-text",
  ".opt-label",
  ".question-tag",
  ".life-summary-list .summary-item",
  ".handwriting-font",
  ".landing-hero .page-title",
  ".round-btn-title",
  ".round-card-title",
  ".tracker-shortcut-info h3"
];

for (const cls of classesToGaramond) {
  // Find block starting with this class
  const regex = new RegExp(`(${cls.replace(/\\./g, '\\\\.')}\\s*{[^}]*?)font-family:\\s*'Inter', sans-serif`, 'g');
  content = content.replace(regex, "$1font-family: 'Cormorant Garamond', serif");
  
  // also handle !important
  const regexImp = new RegExp(`(${cls.replace(/\\./g, '\\\\.')}\\s*{[^}]*?)font-family:\\s*'Inter', sans-serif\\s*!important`, 'g');
  content = content.replace(regexImp, "$1font-family: 'Cormorant Garamond', serif !important");
}

fs.writeFileSync('client/src/index.css', content);
console.log('CSS fonts updated.');
