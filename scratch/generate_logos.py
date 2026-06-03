import os
from PIL import Image, ImageFilter, ImageDraw

def get_cropped_logo(input_path, thicken=True):
    # Load original image
    im = Image.open(input_path).convert("RGBA")
    width, height = im.size
    
    # 1. Supersample the image (4x scale)
    scale = 4
    high_res_size = (width * scale, height * scale)
    im_high = im.resize(high_res_size, resample=Image.Resampling.LANCZOS)
    
    # 2. Extract background color from top-right corner
    bg_r, bg_g, bg_b, _ = im_high.getpixel((high_res_size[0] - 40, 40))
    print(f"High-res background reference color: ({bg_r}, {bg_g}, {bg_b})")
    
    # 3. Create transparent image based on color distance and luminance
    alpha_data = []
    
    # Load high-res pixels
    pixels = im_high.load()
    
    for y in range(high_res_size[1]):
        for x in range(high_res_size[0]):
            r, g, b, a = pixels[x, y]
            
            # Distance from background color
            dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)**0.5
            
            # Grayscale luminance
            l = 0.299 * r + 0.587 * g + 0.114 * b
            
            # Watermark area (bottom left):
            if x < 270 * scale and y > high_res_size[1] - 80 * scale:
                alpha_data.append(0)
                continue
            
            # Background detection:
            # If the pixel is very close to the background color (dist < 22) or very bright (l > 230),
            # it is 100% transparent background.
            if dist < 22 or l > 230:
                alpha_data.append(0)
            else:
                # Text stroke detection:
                if thicken:
                    l_bg = 228
                    l_fg = 185
                else:
                    l_bg = 220
                    l_fg = 100
                
                if l <= l_fg:
                    alpha_data.append(255)
                elif l >= l_bg:
                    alpha_data.append(0)
                else:
                    val = int(255 * (l_bg - l) / (l_bg - l_fg))
                    alpha_data.append(max(0, min(255, val)))
                    
    # Create alpha image from data
    alpha_high = Image.new("L", high_res_size)
    alpha_high.putdata(alpha_data)
    
    # Apply morphological dilation (MaxFilter) if thicken is true
    if thicken:
        # MaxFilter(9) dilates by 4 pixels at 4x resolution, making strokes significantly thicker
        alpha_high = alpha_high.filter(ImageFilter.MaxFilter(9))
        
    # Smooth the alpha channel slightly
    alpha_high = alpha_high.filter(ImageFilter.GaussianBlur(radius=2.0))
    
    # Create the high-res text image
    text_color = (61, 35, 20) # brand brown color #3d2314
    solid_color = Image.new("RGB", high_res_size, text_color)
    text_im_high = Image.merge("RGBA", (solid_color.split()[0], solid_color.split()[1], solid_color.split()[2], alpha_high))
    
    # Downsample back to 1x
    text_im = text_im_high.resize((width, height), resample=Image.Resampling.LANCZOS)
    
    # Bounding box scan (x > 300)
    left, top, right, bottom = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            _, _, _, alpha = text_im.getpixel((x, y))
            if alpha > 80:  # Only count pixels that are clearly part of the text
                if x < 300:  # Start from 300 to avoid smudge area
                    continue
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y
                
    print(f"Refined Bounding Box (strict): left={left}, top={top}, right={right}, bottom={bottom}")
    
    # Crop to the refined bounding box (with some small safety margin)
    padding = 6
    crop_left = max(0, left - padding)
    crop_top = max(0, top - padding)
    crop_right = min(width, right + padding)
    crop_bottom = min(height, bottom + padding)
    cropped = text_im.crop((crop_left, crop_top, crop_right, crop_bottom))
    return cropped

def fit_to_canvas(cropped_img, output_width, output_height, padding_ratio=0.05, bg_color=(0, 0, 0, 0)):
    canvas = Image.new("RGBA", (output_width, output_height), bg_color)
    
    target_w = output_width - int(output_width * padding_ratio * 2)
    target_h = output_height - int(output_height * padding_ratio * 2)
    
    crop_w, crop_h = cropped_img.size
    ratio_w = target_w / crop_w
    ratio_h = target_h / crop_h
    scale_ratio = min(ratio_w, ratio_h)
    
    new_w = int(crop_w * scale_ratio)
    new_h = int(crop_h * scale_ratio)
    
    resized_cropped = cropped_img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
    
    # Center on canvas
    paste_x = (output_width - new_w) // 2
    paste_y = (output_height - new_h) // 2
    
    canvas.paste(resized_cropped, (paste_x, paste_y), resized_cropped)
    return canvas

def main():
    img_path = r"C:\Users\dhruv\.gemini\antigravity-ide\brain\78756275-0122-4fd4-a99a-389c33158b25\media__1780511736311.png"
    
    print("Generating thicker logo assets with 100% transparent background (Optimized)...")
    
    # Process the high-res text crop ONCE (takes ~8 seconds)
    cropped = get_cropped_logo(img_path, thicken=True)
    
    # Now generate all variants (takes milliseconds!)
    # 1. keshvi-yarn-logo-cropped.png (607 x 392)
    nav_logo = fit_to_canvas(cropped, 607, 392, padding_ratio=0.01)
    nav_logo.save("public/keshvi-yarn-logo-cropped.png", "PNG")
    print("Created public/keshvi-yarn-logo-cropped.png")
    
    # 2. keshvi-text-only.png (585 x 318)
    text_only = fit_to_canvas(cropped, 585, 318, padding_ratio=0.01)
    text_only.save("public/keshvi-text-only.png", "PNG")
    print("Created public/keshvi-text-only.png")
    
    # 3. uploads/hero/logo.png (791 x 508)
    hero_logo = fit_to_canvas(cropped, 791, 508, padding_ratio=0.02)
    hero_logo.save("public/uploads/hero/logo.png", "PNG")
    print("Created public/uploads/hero/logo.png")
    
    # 4. logo.png (1024 x 1024)
    square_logo = fit_to_canvas(cropped, 1024, 1024, padding_ratio=0.05)
    square_logo.save("public/logo.png", "PNG")
    print("Created public/logo.png")
    
    # 5. pwa-icon.png (512 x 512)
    pwa_logo = fit_to_canvas(cropped, 512, 512, padding_ratio=0.05)
    pwa_logo.save("public/pwa-icon.png", "PNG")
    print("Created public/pwa-icon.png")
    
    # 6. favicon.ico
    fav_logo = fit_to_canvas(cropped, 64, 64, padding_ratio=0.02)
    fav_logo.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Created public/favicon.ico")
    
    # Extra variants
    nav_logo.save("public/keshvi-yarn-logo.png", "PNG")
    nav_logo.save("public/keshvi-yarn-logo-transparent.png", "PNG")
    print("Created public/keshvi-yarn-logo.png and transparent variant")
    
    print("All thicker logo assets and icons created successfully with 100% transparent bg!")

if __name__ == "__main__":
    main()
