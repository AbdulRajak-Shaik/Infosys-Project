const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const replacements = [
  { regex: /\bbg-white\b/g, replacement: 'bg-surface' },
  { regex: /\bbg-gray-50\b/g, replacement: 'bg-background' },
  { regex: /\bbg-gray-100\b/g, replacement: 'bg-background' },
  { regex: /\bbg-gray-200\b/g, replacement: 'bg-background' },
  { regex: /\bbg-gray-300\b/g, replacement: 'bg-background' },
  { regex: /\bborder-gray-100\b/g, replacement: 'border-border' },
  { regex: /\bborder-gray-200\b/g, replacement: 'border-border' },
  { regex: /\bborder-gray-300\b/g, replacement: 'border-border' },
  { regex: /\btext-black\b/g, replacement: 'text-text-primary' },
  { regex: /\btext-gray-900\b/g, replacement: 'text-text-primary' },
  { regex: /\btext-gray-800\b/g, replacement: 'text-text-primary' },
  { regex: /\btext-gray-700\b/g, replacement: 'text-text-secondary' },
  { regex: /\btext-gray-600\b/g, replacement: 'text-text-secondary' },
  { regex: /\btext-gray-500\b/g, replacement: 'text-text-muted' },
  { regex: /\btext-gray-400\b/g, replacement: 'text-text-muted' },
  { regex: /\bplaceholder-gray-400\b/g, replacement: 'placeholder-text-muted' },
  { regex: /\bplaceholder-gray-500\b/g, replacement: 'placeholder-text-muted' },
  { regex: /\bhover:bg-gray-50\b/g, replacement: 'hover:bg-surface-hover' },
  { regex: /\bhover:bg-gray-100\b/g, replacement: 'hover:bg-surface-hover' },
  { regex: /\bhover:text-gray-900\b/g, replacement: 'hover:text-text-primary' },
  { regex: /\bhover:text-gray-700\b/g, replacement: 'hover:text-text-primary' },
  { regex: /\bdivide-gray-100\b/g, replacement: 'divide-border' },
  { regex: /\bdivide-gray-200\b/g, replacement: 'divide-border' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Theme conversion completed.');
