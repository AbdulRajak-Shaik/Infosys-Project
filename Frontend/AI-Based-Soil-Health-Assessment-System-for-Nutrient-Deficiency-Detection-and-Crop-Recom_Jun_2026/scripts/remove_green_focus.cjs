const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// Replacements
const replacements = [
  { regex: /focus-within:ring-primary-\w+(\/\d+)?/g, replacement: 'focus-within:ring-text-muted/25' },
  { regex: /focus-within:border-primary-\w+/g, replacement: 'focus-within:border-text-muted' },
  { regex: /focus:ring-primary-\w+(\/\d+)?/g, replacement: 'focus:ring-text-muted/25' },
  { regex: /focus:border-primary-\w+/g, replacement: 'focus:border-text-muted' },
  { regex: /focus-within:ring-green-\w+(\/\d+)?/g, replacement: 'focus-within:ring-text-muted/25' },
  { regex: /focus-within:border-green-\w+/g, replacement: 'focus-within:border-text-muted' },
  { regex: /focus:ring-green-\w+(\/\d+)?/g, replacement: 'focus:ring-text-muted/25' },
  { regex: /focus:border-green-\w+/g, replacement: 'focus:border-text-muted' },
  // And fix the "double backgrounds" on search boxes which were actually `bg-surface` wrapped in `bg-surface`.
  // Wait, the user specifically mentioned search boxes having "white outer box, dark inner box".
  // If `bg-surface` was white in Light Theme, and I changed the inner input to `bg-background` (which is #0F172A in Dark Theme), 
  // the outer box would be #111827 and inner would be #0F172A. That creates a "double container".
  // Let's make sure the inputs use `bg-transparent` inside search wrappers!
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated focus state in: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Focus ring removal completed.');
