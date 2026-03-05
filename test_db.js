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
    console.log("Fetching profiles...");
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) console.error("Profiles error:", pErr);
    console.log("Profiles count:", profiles?.length);

    console.log("Fetching stores...");
    const { data: stores, error: sErr } = await supabase.from('stores').select('*');
    if (sErr) console.error("Stores error:", sErr);
    console.log("Stores count:", stores?.length);

    if (stores && stores.length > 0) {
        const storeId = stores[0].id;
        console.log("Valid store id:", storeId);

        console.log("Attempting seedCatalog-like insert...");
        const standardProducts = [
            {
                store_id: storeId,
                name: "TEST_PRODUCT",
                price: 1500,
                image_url: "/images/test.png",
                color: "bg-red-50",
                icon_color: "text-slate-600",
                audio_name: "Test"
            }
        ];

        const { error: iErr } = await supabase.from('products').insert(standardProducts);
        if (iErr) {
            console.error("Insert error details:", iErr);
        } else {
            console.log("Insert success");
            await supabase.from('products').delete().eq('name', 'TEST_PRODUCT');
        }
    } else {
        console.log("No stores found.");
    }
}

test();
