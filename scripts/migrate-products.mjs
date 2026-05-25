import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Very simple dotenv parser for this script
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting migration...");
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

    const bucketName = 'product-images';

    for (const p of productsData) {
        console.log(`Processing product: ${p.title}`);
        
        const newImages = [];
        for (const imgPath of p.images) {
            if (imgPath.startsWith('http')) {
                newImages.push(imgPath);
                continue;
            }

            // Local path is public + imgPath
            const localPath = path.join(__dirname, '..', 'public', imgPath);
            
            if (fs.existsSync(localPath)) {
                // filename for bucket
                const ext = path.extname(imgPath);
                const baseName = path.basename(imgPath, ext);
                const bucketFilePath = `migrated/${p.id}/${baseName}${ext}`;
                
                const fileBuffer = fs.readFileSync(localPath);
                
                // Determine content type roughly
                let contentType = 'image/png';
                if (ext.toLowerCase() === '.jpg' || ext.toLowerCase() === '.jpeg') contentType = 'image/jpeg';
                else if (ext.toLowerCase() === '.webp') contentType = 'image/webp';
                else if (ext.toLowerCase() === '.svg') contentType = 'image/svg+xml';
                
                // Upload
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from(bucketName)
                    .upload(bucketFilePath, fileBuffer, {
                        contentType: contentType,
                        upsert: true
                    });
                
                if (uploadError) {
                    console.error(`Failed to upload ${imgPath}:`, uploadError);
                    newImages.push(imgPath); // fallback to original path if upload fails
                } else {
                    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(bucketFilePath);
                    newImages.push(publicUrl);
                    console.log(`Uploaded ${imgPath} -> ${publicUrl}`);
                }
            } else {
                console.warn(`Local file not found: ${localPath}`);
                newImages.push(imgPath); // Keep original if not found
            }
        }

        const productRow = {
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            price: p.price,
            priority: p.priority,
            images: newImages,
            category: p.category,
            stock: p.stock,
            badge: p.badge,
            badges: p.badges,
            type: p.type,
            priceBucket: p.priceBucket,
            shippingCharge: p.shippingCharge,
            handcraftedHours: p.handcraftedHours ? p.handcraftedHours.toString() : null,
            cta: p.cta,
            seoContent: p.seoContent,
            variants: p.variants,
            status: p.status || 'live',
            minPrice: p.minPrice,
            priceLabel: p.priceLabel
        };

        const { error: insertError } = await supabase.from('products').upsert(productRow);
        if (insertError) {
            console.error(`Error inserting ${p.id}:`, insertError);
        } else {
            console.log(`Inserted product ${p.id} successfully.`);
        }
    }
    console.log("Migration complete!");
}

migrate().catch(console.error);
