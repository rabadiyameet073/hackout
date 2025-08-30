import base64
import os

# Create assets directory if it doesn't exist
os.makedirs('assets', exist_ok=True)

# Simple 1x1 green pixel PNG in base64
green_pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

# Decode and write to files
pixel_data = base64.b64decode(green_pixel)

# Create all required assets
assets = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png']

for asset in assets:
    with open(f'assets/{asset}', 'wb') as f:
        f.write(pixel_data)
    print(f'Created {asset}')

print('All placeholder assets created successfully!')
