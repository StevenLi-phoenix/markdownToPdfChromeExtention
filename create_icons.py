#!/usr/bin/env python3
"""
Simple script to create basic PNG icons for the Chrome extension.
Creates PDF-style document icons in different sizes.
"""

from PIL import Image, ImageDraw
import os

def create_icon(size):
    """Create a PDF-style icon of the given size."""
    # Create a new image with a blue background
    img = Image.new('RGBA', (size, size), (59, 130, 246, 255))  # Blue background
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    padding = int(size * 0.15)
    doc_width = size - (padding * 2)
    doc_height = size - (padding * 2)
    
    # Draw document background (white)
    draw.rectangle([padding, padding, size - padding, size - padding], 
                  fill=(255, 255, 255, 255))
    
    # Draw folded corner
    fold_size = int(size * 0.2)
    fold_points = [
        (size - padding, padding),
        (size - padding - fold_size, padding),
        (size - padding, padding + fold_size)
    ]
    draw.polygon(fold_points, fill=(229, 231, 235, 255))  # Light gray
    
    # Draw text lines
    line_height = int(size * 0.04)
    line_width = int(doc_width * 0.7)
    start_y = padding + int(size * 0.3)
    line_spacing = int(line_height * 2)
    
    for i in range(3):
        y = start_y + (i * line_spacing)
        draw.rectangle([
            padding + int(doc_width * 0.15),
            y,
            padding + int(doc_width * 0.15) + line_width,
            y + line_height
        ], fill=(107, 114, 128, 255))  # Gray lines
    
    return img

def main():
    """Create all required icon sizes."""
    sizes = [16, 32, 48, 128]
    icons_dir = 'icons'
    
    # Create icons directory if it doesn't exist
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    # Generate each icon size
    for size in sizes:
        icon = create_icon(size)
        filename = f'{icons_dir}/icon{size}.png'
        icon.save(filename, 'PNG')
        print(f'Created {filename}')
    
    print('All icons created successfully!')

if __name__ == '__main__':
    # Check if PIL is available
    try:
        from PIL import Image, ImageDraw
        main()
    except ImportError:
        print('PIL (Pillow) is required to create icons.')
        print('Install it with: pip install Pillow')
        print('\nAlternatively, you can use the extension without icons for now.')
        print('The extension should load in Chrome even without icon files.')