#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import os
import textwrap

def create_large_tile():
    """Create a 440x280 large tile with QarbonQuery branding"""
    # Create the image
    img = Image.new('RGB', (440, 280), color='white')
    draw = ImageDraw.Draw(img)
    
    # Define colors based on the brand (from the SVG icon)
    green_primary = '#4ade80'  # Light green
    green_secondary = '#22c55e'  # Medium green
    green_dark = '#16a34a'  # Dark green
    
    # Create a gradient background
    for y in range(280):
        gradient_color = (
            int(255 * (1 - y/280) + int(green_primary[1:3], 16) * (y/280)),
            int(255 * (1 - y/280) + int(green_primary[3:5], 16) * (y/280)),
            int(255 * (1 - y/280) + int(green_primary[5:7], 16) * (y/280))
        )
        draw.line([(0, y), (440, y)], fill=gradient_color)
    
    # Try to use system fonts, with fallbacks
    try:
        title_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 42)
        subtitle_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 18)
        tagline_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 16)
    except:
        try:
            title_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 42)
            subtitle_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 18)
            tagline_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 16)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            tagline_font = ImageFont.load_default()
    
    # Add title
    title = "QarbonQuery"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (440 - title_width) // 2
    draw.text((title_x, 40), title, fill='white', font=title_font)
    
    # Add tagline
    tagline = "Carbon Footprint Tracker"
    tagline_bbox = draw.textbbox((0, 0), tagline, font=subtitle_font)
    tagline_width = tagline_bbox[2] - tagline_bbox[0]
    tagline_x = (440 - tagline_width) // 2
    draw.text((tagline_x, 95), tagline, fill='white', font=subtitle_font)
    
    # Add feature highlights
    features = [
        "• Real-time carbon tracking",
        "• AI-powered insights",
        "• Privacy-focused design"
    ]
    
    y_offset = 140
    for feature in features:
        feature_bbox = draw.textbbox((0, 0), feature, font=tagline_font)
        feature_width = feature_bbox[2] - feature_bbox[0]
        feature_x = (440 - feature_width) // 2
        draw.text((feature_x, y_offset), feature, fill='white', font=tagline_font)
        y_offset += 25
    
    # Add a simple leaf icon representation
    leaf_center_x, leaf_center_y = 220, 200
    leaf_points = [
        (leaf_center_x, leaf_center_y - 20),
        (leaf_center_x + 15, leaf_center_y - 10),
        (leaf_center_x + 10, leaf_center_y + 5),
        (leaf_center_x, leaf_center_y + 15),
        (leaf_center_x - 10, leaf_center_y + 5),
        (leaf_center_x - 15, leaf_center_y - 10)
    ]
    draw.polygon(leaf_points, fill=green_dark)
    
    # Add CO2 text on the leaf
    co2_text = "CO₂"
    co2_bbox = draw.textbbox((0, 0), co2_text, font=tagline_font)
    co2_width = co2_bbox[2] - co2_bbox[0]
    co2_height = co2_bbox[3] - co2_bbox[1]
    draw.text((leaf_center_x - co2_width//2, leaf_center_y - co2_height//2), co2_text, fill='white', font=tagline_font)
    
    return img

def create_marquee_banner():
    """Create a 1400x560 marquee banner with bold headline and hero artwork"""
    # Create the image
    img = Image.new('RGB', (1400, 560), color='white')
    draw = ImageDraw.Draw(img)
    
    # Define colors
    green_primary = '#4ade80'
    green_secondary = '#22c55e'
    green_dark = '#16a34a'
    
    # Create a more sophisticated gradient background
    for y in range(560):
        gradient_factor = y / 560
        gradient_color = (
            int(255 * (1 - gradient_factor) + int(green_primary[1:3], 16) * gradient_factor),
            int(255 * (1 - gradient_factor) + int(green_primary[3:5], 16) * gradient_factor),
            int(255 * (1 - gradient_factor) + int(green_primary[5:7], 16) * gradient_factor)
        )
        draw.line([(0, y), (1400, y)], fill=gradient_color)
    
    # Try to use system fonts
    try:
        hero_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 72)
        subtitle_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 32)
        tagline_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 24)
    except:
        try:
            hero_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 72)
            subtitle_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 32)
            tagline_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 24)
        except:
            hero_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            tagline_font = ImageFont.load_default()
    
    # Add bold headline
    headline = "Track Your Digital Carbon Footprint"
    headline_lines = textwrap.wrap(headline, width=25)
    y_offset = 100
    
    for line in headline_lines:
        line_bbox = draw.textbbox((0, 0), line, font=hero_font)
        line_width = line_bbox[2] - line_bbox[0]
        line_x = (1400 - line_width) // 2
        draw.text((line_x, y_offset), line, fill='white', font=hero_font)
        y_offset += 80
    
    # Add subtitle
    subtitle = "Real-time monitoring of your AI interactions and web browsing"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (1400 - subtitle_width) // 2
    draw.text((subtitle_x, y_offset + 20), subtitle, fill='white', font=subtitle_font)
    
    # Add features
    features = [
        "🌱 Real-time carbon tracking",
        "🤖 AI-powered insights", 
        "🔒 Privacy-focused design",
        "📊 Detailed analytics"
    ]
    
    y_offset += 80
    for i, feature in enumerate(features):
        feature_bbox = draw.textbbox((0, 0), feature, font=tagline_font)
        feature_width = feature_bbox[2] - feature_bbox[0]
        
        # Position features in two columns
        if i < 2:
            feature_x = (1400 // 2 - feature_width) // 2
        else:
            feature_x = (1400 // 2) + (1400 // 2 - feature_width) // 2
        
        feature_y = y_offset + (i % 2) * 35
        draw.text((feature_x, feature_y), feature, fill='white', font=tagline_font)
    
    # Add large decorative leaf elements
    for i in range(3):
        leaf_x = 200 + i * 400
        leaf_y = 400
        leaf_size = 60 - i * 10
        
        leaf_points = [
            (leaf_x, leaf_y - leaf_size),
            (leaf_x + leaf_size, leaf_y - leaf_size//2),
            (leaf_x + leaf_size//2, leaf_y + leaf_size//4),
            (leaf_x, leaf_y + leaf_size),
            (leaf_x - leaf_size//2, leaf_y + leaf_size//4),
            (leaf_x - leaf_size, leaf_y - leaf_size//2)
        ]
        
        # Create semi-transparent leaf
        leaf_alpha = 100 - i * 20
        draw.polygon(leaf_points, fill=(22, 197, 94, leaf_alpha))
    
    return img

def create_screenshot_mockup():
    """Create a mockup screenshot showing the extension in action"""
    # Create the image (1280x800 screenshot size)
    img = Image.new('RGB', (1280, 800), color='#f8f9fa')
    draw = ImageDraw.Draw(img)
    
    # Try to use system fonts
    try:
        title_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 24)
        text_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 16)
        small_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 12)
    except:
        try:
            title_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 24)
            text_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 16)
            small_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 12)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
    
    # Draw browser chrome
    draw.rectangle([(0, 0), (1280, 60)], fill='#e5e7eb')
    draw.rectangle([(0, 60), (1280, 100)], fill='#f3f4f6')
    
    # Draw address bar
    draw.rectangle([(100, 70), (1000, 90)], fill='white', outline='#d1d5db')
    draw.text((110, 75), "https://chatgpt.com", fill='#374151', font=text_font)
    
    # Draw extension popup (positioned in top-right)
    popup_x, popup_y = 1000, 100
    popup_width, popup_height = 260, 400
    
    # Popup background
    draw.rectangle([(popup_x, popup_y), (popup_x + popup_width, popup_y + popup_height)], 
                   fill='white', outline='#d1d5db', width=2)
    
    # Popup header
    draw.rectangle([(popup_x, popup_y), (popup_x + popup_width, popup_y + 60)], 
                   fill='#4ade80')
    draw.text((popup_x + 10, popup_y + 10), "🌱 QarbonQuery", fill='white', font=title_font)
    draw.text((popup_x + 10, popup_y + 35), "Carbon Footprint Tracker", fill='white', font=small_font)
    
    # Popup content
    draw.text((popup_x + 10, popup_y + 80), "Today's Usage:", fill='#374151', font=text_font)
    draw.text((popup_x + 10, popup_y + 110), "2.34 g CO₂e", fill='#4ade80', font=title_font)
    
    draw.text((popup_x + 10, popup_y + 150), "Breakdown:", fill='#374151', font=text_font)
    draw.text((popup_x + 10, popup_y + 175), "• ChatGPT: 1.2 g", fill='#6b7280', font=small_font)
    draw.text((popup_x + 10, popup_y + 195), "• Web browsing: 0.8 g", fill='#6b7280', font=small_font)
    draw.text((popup_x + 10, popup_y + 215), "• Background: 0.34 g", fill='#6b7280', font=small_font)
    
    # Draw simple chart
    chart_x, chart_y = popup_x + 10, popup_y + 250
    chart_width, chart_height = 240, 80
    draw.rectangle([(chart_x, chart_y), (chart_x + chart_width, chart_y + chart_height)], 
                   fill='#f8f9fa', outline='#e5e7eb')
    
    # Draw chart bars
    for i in range(7):
        bar_x = chart_x + 10 + i * 30
        bar_height = 20 + i * 5
        draw.rectangle([(bar_x, chart_y + chart_height - bar_height), 
                       (bar_x + 20, chart_y + chart_height - 5)], 
                       fill='#4ade80')
    
    # Draw main content area (simulate ChatGPT)
    content_y = 120
    draw.rectangle([(50, content_y), (950, 750)], fill='white')
    
    # Simulate chat interface
    draw.text((70, content_y + 20), "ChatGPT", fill='#374151', font=title_font)
    draw.text((70, content_y + 60), "User: What's the carbon footprint of AI?", fill='#374151', font=text_font)
    
    # Response area
    draw.rectangle([(70, content_y + 100), (930, content_y + 300)], fill='#f8f9fa')
    draw.text((80, content_y + 110), "The carbon footprint of AI depends on several factors...", fill='#374151', font=text_font)
    
    # Add carbon tracking indicator
    draw.rectangle([(70, content_y + 320), (400, content_y + 350)], fill='#dcfce7', outline='#4ade80')
    draw.text((80, content_y + 330), "⚡ Carbon tracking active - 0.15g CO₂e this query", fill='#16a34a', font=small_font)
    
    return img

def main():
    """Generate all Chrome Web Store assets"""
    output_dir = "webstore-assets"
    
    print("Creating Chrome Web Store assets...")
    
    # Create large tile (440x280)
    print("Creating large tile (440x280)...")
    large_tile = create_large_tile()
    large_tile.save(os.path.join(output_dir, "large-tile-440x280.png"))
    
    # Create marquee banner (1400x560)
    print("Creating marquee banner (1400x560)...")
    marquee = create_marquee_banner()
    marquee.save(os.path.join(output_dir, "marquee-banner-1400x560.png"))
    
    # Create screenshot mockup
    print("Creating screenshot mockup (1280x800)...")
    screenshot = create_screenshot_mockup()
    screenshot.save(os.path.join(output_dir, "screenshot-1-1280x800.png"))
    
    # Create additional smaller screenshot
    print("Creating additional screenshot (640x400)...")
    screenshot_small = screenshot.resize((640, 400), Image.Resampling.LANCZOS)
    screenshot_small.save(os.path.join(output_dir, "screenshot-2-640x400.png"))
    
    print("All assets created successfully!")
    
    # Check file sizes
    print("\nFile sizes:")
    for filename in os.listdir(output_dir):
        if filename.endswith('.png'):
            filepath = os.path.join(output_dir, filename)
            size = os.path.getsize(filepath)
            print(f"  {filename}: {size:,} bytes ({size/1024/1024:.2f} MB)")
    
    print("\nAssets created in webstore-assets/ directory:")
    print("✓ small-tile-128x128.png (copied from existing icon)")
    print("✓ large-tile-440x280.png")
    print("✓ marquee-banner-1400x560.png")
    print("✓ screenshot-1-1280x800.png")
    print("✓ screenshot-2-640x400.png")

if __name__ == "__main__":
    main()
