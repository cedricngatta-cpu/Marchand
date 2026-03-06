const fs = require('fs');
const content = fs.readFileSync('lint_output.txt', 'utf16le');
const lines = content.split('\n');
const targets = ['SyncContext.tsx', 'ProductContext.tsx'];

targets.forEach(target => {
    console.log(`\n=== Errors for ${target} ===`);
    lines.forEach(line => {
        if (line.includes(target)) {
            console.log(line.trim());
        }
    });
});
