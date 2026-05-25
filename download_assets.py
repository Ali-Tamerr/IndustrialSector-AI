import urllib.request
import os
import sys

assets = {
    "react.production.min.js": "https://unpkg.com/react@18/umd/react.production.min.js",
    "react-dom.production.min.js": "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
    "babel.min.js": "https://unpkg.com/@babel/standalone/babel.min.js",
    "tailwind.js": "https://cdn.tailwindcss.com"
}

# Create assets folder in project root
project_root = os.path.dirname(os.path.abspath(__file__))
assets_dir = os.path.join(project_root, "assets")
os.makedirs(assets_dir, exist_ok=True)

print("Starting Core Frontend Asset Synchronization...")
print(f"Target Directory: {assets_dir}\n")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

for name, url in assets.items():
    filepath = os.path.join(assets_dir, name)
    print(f"Fetching {name} from {url}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(filepath, 'wb') as out_file:
                out_file.write(response.read())
        print(f" -> Synchronized successfully! Size: {os.path.getsize(filepath)} bytes.")
    except Exception as e:
        print(f" -> ERROR downloading {name}: {e}")
        sys.exit(1)

print("\nAll core frontend assets successfully localized!")
