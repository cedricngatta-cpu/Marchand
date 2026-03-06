const fs = require('fs');
const content = fs.readFileSync('lint_output_utf8.txt', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('SyncContext.tsx') || line.includes('ProductContext.tsx')) {
        console.log('\n--- ERROR MATCH ---');
        console.log(line.trim());
        // Print the next 5 lines to get the full error message and code context
        for (let j = 1; j <= 5; j++) {
            if (lines[i + j]) {
                const subLine = lines[i + j].trim();
                if (subLine) console.log(subLine);
                // Stop if we hit another file name or a summary line
                if (subLine.includes('C:\\') || subLine.includes('problems')) break;
            }
        }
    }
}
