const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '../src/data/products.json');

async function main() {
    let productsList;
    try {
        const fileData = fs.readFileSync(productsFilePath, 'utf8');
        productsList = JSON.parse(fileData);
    } catch (err) {
        console.error("Failed to read products.json", err);
        return;
    }

    const updatedProducts = productsList.map(p => {
        const title = p.title;
        const ctg = p.category || "Crafts";

        const intro = `Welcome to the detailed exploration of our ${title}. Every single piece at Keshvi Crafts is carefully handmade, radiating charm and elegance. The ${title} is designed uniquely for those who truly appreciate the time and skill required in the art of crochet. Created from premium materials, this piece brings a distinctive flair to your collection while celebrating slow fashion and sustainability. Our artisan-first approach ensures that when you purchase the ${title}, you receive something truly special and personalized.`;

        const materials = `We source only high-quality yarn and threads for the ${title}. Most of our crochet items are made using 100% premium acrylic or pure cotton yarn, known for its superb durability, vibrant colors, and soft texture. The stuffing, if applicable, consists of lightweight, hypoallergenic polyfill to ensure it retains its shape over years of use.`;

        const craftsmanship = `The ${title} is a labor of love, precisely crafted stitch by stitch. The process involves intricate pattern work that takes multiple hours of continuous crocheting. Our artisans pay meticulous attention to detail—from ensuring consistent tension for uniform loops to securing every knot firmly. The dedication embedded in the ${title} makes it stand out from typical machine-made alternatives.`;

        const useCases = `This beautiful ${title} serves multiple purposes. It is a fantastic addition to your personal items, elevating your everyday style. As an accessory or decor item, it brings a handmade, personalized touch to your space or attire. Furthermore, it serves as a deeply meaningful gift for loved ones during birthdays, anniversaries, or special milestones, symbolizing care and thoughtfulness.`;

        const care = `To keep the ${title} looking fresh, we recommend gentle hand washing in cold water using a mild detergent. Avoid aggressive wringing to prevent deformation of the stitches. Let it air dry flat on a clean surface away from direct sunlight. Do not machine wash or employ strong bleach.`;

        const faqs = [
            {
                q: `Is the ${title} customizable?`,
                a: `For items marked 'Made to Order' or 'Custom Made', you can usually select specific colors or minor size variations. Please reach out to us on Instagram to confirm customization details.`
            },
            {
                q: `How long will it take to deliver?`,
                a: `Since the ${title} is meticulously handmade, shipping generally occurs within a specific timeline. Ready items ship within a few days, while made-to-order pieces require 10-15 days. We ensure safe packaging so it arrives perfectly intact.`
            }
        ];

        p.seoContent = {
            intro,
            materials,
            craftsmanship,
            useCases,
            care,
            faqs
        };

        return p;
    });

    try {
        fs.writeFileSync(productsFilePath, JSON.stringify(updatedProducts, null, 2), 'utf8');
        console.log("Successfully enriched products.json with structured SEO JSON content.");
    } catch (err) {
        console.error("Failed to write products.json", err);
    }
}

main();
