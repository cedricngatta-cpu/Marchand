const fs = require('fs');
const content = fs.readFileSync('lint_output.txt', 'utf16le');
const lines = content.split('\n');

lines.forEach(line => {
    if ((line.includes('SyncContext.tsx') || line.includes('ProductContext.tsx')) && line.includes('error')) {
        console.log(line.trim());
    }
});
