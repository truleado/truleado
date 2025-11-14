const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../src/app/api');

function addDynamicExport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has dynamic export
  if (content.includes('export const dynamic')) {
    return false;
  }
  
  // Find the first import or export statement
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Skip comments and blank lines at the top
  while (insertIndex < lines.length && 
         (lines[insertIndex].trim().startsWith('//') || 
          lines[insertIndex].trim() === '' ||
          lines[insertIndex].trim().startsWith('/*'))) {
    insertIndex++;
  }
  
  // Insert the dynamic export after imports
  lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic';");
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return true;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'route.ts' || file === 'route.js') {
      if (addDynamicExport(filePath)) {
        console.log(`Added dynamic export to: ${filePath}`);
      }
    }
  }
}

processDirectory(apiDir);
console.log('Done!');

