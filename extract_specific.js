const fs = require('fs');
const content = fs.readFileSync('lint_cat_utf8.txt', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('SyncContext.tsx:298')) {
        console.log(lines[i].trim());
        if (lines[i + 1]) console.log(lines[i + 1].trim());
        if (lines[i + 2]) console.log(lines[i + 2].trim());
    }
}
