from PIL import Image, ImageOps, ImageEnhance
import numpy as np

def process_icon(input_path, output_path, target_color, bg_tolerance=40):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Detect background (most common corner color)
    corners = [img.getpixel((0, 0)), img.getpixel((width-1, 0)), img.getpixel((0, height-1)), img.getpixel((width-1, height-1))]
    bg_color = max(set(corners), key=corners.count)
    
    data = np.array(img)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    br, bg, bb, ba = bg_color
    
    dist = np.sqrt((r - br)**2 + (g - bg)**2 + (b - bb)**2)
    mask = dist < bg_tolerance
    
    # Set background to transparent
    new_data = data.copy()
    new_data[mask] = [0, 0, 0, 0]
    
    # Get foreground mask
    fg_mask = ~mask & (a > 10)
    
    # Tint foreground to target_color while preserving luminosity
    # For white, we just make it white but keep alpha
    if target_color == "white":
        new_data[fg_mask, 0] = 255
        new_data[fg_mask, 1] = 255
        new_data[fg_mask, 2] = 255
    elif target_color == "gold":
        # Gold: #EAB308 -> (234, 179, 8)
        # We can try to preserve luminosity by adjusting the gold color
        # For simplicity, let's just force gold for now to ensure visibility
        new_data[fg_mask, 0] = 234
        new_data[fg_mask, 1] = 179
        new_data[fg_mask, 2] = 8
        
    final_img = Image.fromarray(new_data)
    
    # No cropping to avoid any weird offset issues
    final_img.save(output_path)
    print(f"Final processed {input_path} -> {output_path} with {target_color}")

# Process
process_icon("assets/mains.png", "assets/mains_transparent.png", "white")
process_icon("assets/microphone.png", "assets/microphone_transparent.png", "gold")
