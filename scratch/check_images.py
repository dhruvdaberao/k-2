
import os
from PIL import Image

def get_image_info(path):
    try:
        with Image.open(path) as img:
            print(f"{path}: {img.size} {img.format}")
    except Exception as e:
        print(f"Error reading {path}: {e}")

images = [
    "public/uploads/hero/logo.png",
    "public/uploads/hero/logo_1.png",
    "public/uploads/hero/logo_d.png",
    "public/uploads/hero/keshvi-vertical-logo.png",
    "public/pwa-icon.png"
]

for img in images:
    get_image_info(os.path.join(r"c:\Users\dhruv\OneDrive\Desktop\KESHVICRAFTS", img))
