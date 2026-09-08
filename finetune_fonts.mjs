import fs from 'fs';

let content = fs.readFileSync('client/src/index.css', 'utf-8');

// The following classes are currently Cormorant Garamond, but they are NOT headings (they are numbers or labels)
// Let's change them to Inter
const toInter = [
  '.opt-label',
  '.question-tag',
  '.life-summary-list .summary-item',
  '.round-btn-title',
  '.score-badge-value',
  '.stat-value',
  '.life-score-value'
];

for (const cls of toInter) {
  const regex = new RegExp(`(${cls.replace(/\\./g, '\\\\.')}\\s*{[^}]*?)font-family:\\s*'Cormorant Garamond', serif`, 'g');
  content = content.replace(regex, "$1font-family: 'Inter', sans-serif");
}

// The following class was missed by the previous script because of a newline in the CSS selector:
// .question-title,
// .handwriting-text {
//   font-family: 'Inter', sans-serif;
// }
// It should be Cormorant Garamond since it's a title.

const qtRegex = /(.question-title,\s*\n.handwriting-text\s*{[^}]*?)font-family:\s*'Inter', sans-serif/g;
content = content.replace(qtRegex, "$1font-family: 'Cormorant Garamond', serif");

fs.writeFileSync('client/src/index.css', content);
console.log('Fonts fine-tuned.');
