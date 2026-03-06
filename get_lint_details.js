const fs = require('fs');
const content = fs.readFileSync('lint_output_utf8.txt', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('SyncContext.tsx') || line.includes('ProductContext.tsx')) {
        console.log('---');
        console.log(line.trim());
        // Print the next line which usually contains the error message
        if (lines[index + 1]) console.log(lines[index + 1].trim());
    }
});
