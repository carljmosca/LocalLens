#!/bin/bash

# Simple script to generate placeholder PWA icons
# You should replace these with actual branded icons for your app

# Create a simple SVG icon as base
cat > icon-base.svg << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb" rx="64"/>
  <circle cx="256" cy="200" r="80" fill="#ffffff"/>
  <path d="M256 300 L200 380 L312 380 Z" fill="#ffffff"/>
  <text x="256" y="450" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#ffffff">LL</text>
</svg>
EOF

echo "Generated base SVG icon. To create actual PNG icons, you need to:"
echo "1. Install ImageMagick: brew install imagemagick"
echo "2. Run the conversion commands below:"
echo ""

# Generate conversion commands for different sizes
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  echo "convert icon-base.svg -resize ${size}x${size} icon-${size}x${size}.png"
done

echo ""
echo "Or use an online tool like https://realfavicongenerator.net/"
echo "with your custom logo/icon design."