# pyrefly: ignore [missing-import]
from PIL import Image, ImageFilter, ImageDraw

def process_logo(input_path, output_width=None, output_height=None, padding_ratio=0.05, bg_color=(0, 0, 0, 0), thicken=False):
    # Load original image
    im = Image.open(input_path).convert("RGBA")
    width, height = im.size
    
    # 1. Supersample the image (4x scale)
    scale = 4
    high_res_size = (width * scale, height * scale)
    im_high = im.resize(high_res_size, resample=Image.Resampling.LANCZOS)
    
    # 2. Extract background color from top-right corner
    bg_r, bg_g, bg_b, _ = im_high.getpixel((high_res_size[0] - 40, 40))
    print(f"High-res background: ({bg_r}, {bg_g}, {bg_b})")
    
    # 3. Create transparent image based on color distance and luminance
    luma = im_high.convert("L")
    
    # Make threshold much wider to capture more text width and make it look thicker
    if thicken:
        L_bg = 252  # Include almost all non-background pixels (was 248)
        L_fg = 205  # Make pixels up to 205 fully opaque (was 185)
    else:
        L_bg = 225
        L_fg = 95
        
    lut = []
    for x in range(256):
        if x >= L_bg:
            lut.append(0)
        elif x <= L_fg:
            lut.append(255)
        else:
            val = int(255 * (L_bg - x) / (L_bg - L_fg))
            lut.append(max(0, min(255, val)))
            
    alpha_high = luma.point(lut)
    
    # Filter out bottom-left watermark:
    draw = ImageDraw.Draw(alpha_high)
    draw.rectangle([0, high_res_size[1] - 80 * scale, 270 * scale, high_res_size[1]], fill=0)
    
    # Apply morphological dilation (MaxFilter) if thicken is true
    if thicken:
        # MaxFilter(9) dilates by 4 pixels at 4x resolution, making strokes significantly thicker
        # MaxFilter(9) is double the thickness change of MaxFilter(5).
        alpha_high = alpha_high.filter(ImageFilter.MaxFilter(9))
        
    # Smooth the alpha channel slightly
    alpha_high = alpha_high.filter(ImageFilter.GaussianBlur(radius=2.5))
    
    # Create the high-res text image
    text_color = (61, 35, 20) # brand brown color #3d2314
    solid_color = Image.new("RGB", high_res_size, text_color)
    text_im_high = Image.merge("RGBA", (solid_color.split()[0], solid_color.split()[1], solid_color.split()[2], alpha_high))
    
    # Downsample back to 1x
    text_im = text_im_high.resize((width, height), resample=Image.Resampling.LANCZOS)
    
    # Bounding box scan (x > 300)
    # We use alpha > 100 to detect the bounding box to capture the full stroke edge
    left, top, right, bottom = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            _, _, _, alpha = text_im.getpixel((x, y))
            if alpha > 100:  # Only count pixels that are clearly part of the text
                if x < 300:  # Let's start from 300 to make sure the tail of K is captured
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
    
    # If target sizes are specified, create a canvas and fit the cropped image
    if output_width and output_height:
        canvas = Image.new("RGBA", (output_width, output_height), bg_color)
        
        target_w = output_width - int(output_width * padding_ratio * 2)
        target_h = output_height - int(output_height * padding_ratio * 2)
        
        crop_w, crop_h = cropped.size
        ratio_w = target_w / crop_w
        ratio_h = target_h / crop_h
        scale_ratio = min(ratio_w, ratio_h)
        
        new_w = int(crop_w * scale_ratio)
        new_h = int(crop_h * scale_ratio)
        
        resized_cropped = cropped.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
        
        # Center on canvas
        paste_x = (output_width - new_w) // 2
        paste_y = (output_height - new_h) // 2
        
        canvas.paste(resized_cropped, (paste_x, paste_y), resized_cropped)
        return canvas
    else:
        return cropped

def main():
    img_path = r"C:\Users\dhruv\.gemini\antigravity-ide\brain\78756275-0122-4fd4-a99a-389c33158b25\media__1780511736311.png"
    
    print("Generating thicker logo assets with strict bounding box...")
    
    # 1. keshvi-yarn-logo-cropped.png (607 x 392)
    nav_logo = process_logo(img_path, 607, 392, padding_ratio=0.01, thicken=True)
    nav_logo.save("public/keshvi-yarn-logo-cropped.png", "PNG")
    print("Created public/keshvi-yarn-logo-cropped.png (thicker, small padding)")
    
    # 2. keshvi-text-only.png (585 x 318)
    text_only = process_logo(img_path, 585, 318, padding_ratio=0.01, thicken=True)
    text_only.save("public/keshvi-text-only.png", "PNG")
    print("Created public/keshvi-text-only.png (thicker, small padding)")
    
    # 3. uploads/hero/logo.png (791 x 508)
    hero_logo = process_logo(img_path, 791, 508, padding_ratio=0.02, thicken=True)
    hero_logo.save("public/uploads/hero/logo.png", "PNG")
    print("Created public/uploads/hero/logo.png (thicker, small padding)")
    
    # 4. logo.png (1024 x 1024)
    square_logo = process_logo(img_path, 1024, 1024, padding_ratio=0.05, thicken=True)
    square_logo.save("public/logo.png", "PNG")
    print("Created public/logo.png (thicker, small padding)")
    
    # 5. pwa-icon.png (512 x 512)
    pwa_logo = process_logo(img_path, 512, 512, padding_ratio=0.05, thicken=True)
    pwa_logo.save("public/pwa-icon.png", "PNG")
    print("Created public/pwa-icon.png (thicker, small padding)")
    
    # 6. favicon.ico
    fav_logo = process_logo(img_path, 64, 64, padding_ratio=0.02, thicken=True)
    fav_logo.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Created public/favicon.ico")
    
    # Extra variants
    nav_logo.save("public/keshvi-yarn-logo.png", "PNG")
    nav_logo.save("public/keshvi-yarn-logo-transparent.png", "PNG")
    print("Created public/keshvi-yarn-logo.png and transparent variant")
    
    print("All thicker logo assets and icons created successfully!")

if __name__ == "__main__":
    main()
