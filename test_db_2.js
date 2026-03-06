/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (let line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: stores } = await supabase.from('stores').select('*');
    if (stores && stores.length > 0) {
        console.log("Found stores:", stores.length);
        const { data: products } = await supabase.from('products').select('*');
        console.log("Total Products in DB:", products?.length);
        if (products && products.length > 0) {
            console.log("Sample products:", products.slice(0, 5).map(p => p.name));

            // Delete all products to force re-seed
            console.log("Deleting all products to force a re-seed with NEW catalog...");
            for (let s of stores) {
                await supabase.from('products').delete().eq('store_id', s.id);
            }
            console.log("Deleted. The app should now re-seed with the new catalog.");
        }
    }
}

test();
