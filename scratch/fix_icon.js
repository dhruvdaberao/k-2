const Jimp = require('jimp');
const path = require('path');

async function processIcon() {
    try {
        const sourcePath = path.join(__dirname, '..', 'public', 'uploads', 'hero', 'logo.png');
        const targetPath = path.join(__dirname, '..', 'public', 'pwa-icon.png');
        const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
        const logoPath = path.join(__dirname, '..', 'public', 'logo.png');

        console.log(`Reading source: ${sourcePath}`);
        const logo = await Jimp.read(sourcePath);

        // Create a 512x512 transparent canvas
        const canvas = new Jimp(512, 512, 0x00000000);

        // Resize logo to ~90% of 512 (which is 460) while maintaining aspect ratio
        logo.scaleToFit(460, 460);

        // Center logo on canvas
        const x = (512 - logo.bitmap.width) / 2;
        const y = (512 - logo.bitmap.height) / 2;
        canvas.composite(logo, x, y);

        // Save as pwa-icon.png
        await canvas.writeAsync(targetPath);
        console.log(`Saved pwa-icon.png with padding to: ${targetPath}`);

        // Also save as logo.png and favicon.ico for consistency
        await canvas.writeAsync(logoPath);
        await canvas.writeAsync(faviconPath);
        console.log('Updated logo.png and favicon.ico');

    } catch (error) {
        console.error('Error processing icon:', error);
        process.exit(1);
    }
}

processIcon();
