# LocalLens

A browser-based Points of Interest (POI) search application powered by AI. Search for locations using natural language queries with cuisine/attribute filtering.

## Features

- 🤖 **AI-Powered Search**: Uses FLAN-T5 language model running entirely in your browser
- 🎯 **Natural Language Queries**: "Show me Italian restaurants" or "Find parks near me"
- 🏷️ **Attribute Filtering**: Filter by cuisine, style, or any custom attributes
- 🌐 **Fully Client-Side**: No backend required, runs 100% in the browser
- ⚡ **WebGPU Accelerated**: Fast inference using WebGPU when available
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Live Demo

Visit the live demo at: `https://[your-username].github.io/local-lens-app/`

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to GitHub Pages

### Automatic Deployment

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the `main` branch.

### Setup Steps

1. **Enable GitHub Pages**:
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Update Repository Name** (if different):
   - Edit `vite.config.ts` and change the `base` path to match your repository name
   - Example: If your repo is `my-poi-app`, change to `/my-poi-app/`

3. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Access Your Site**:
   - Your app will be available at: `https://[username].github.io/[repo-name]/`
   - Check the Actions tab to monitor deployment progress

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains your static site
# Upload the contents to any static hosting service
```

## Configuration

### Location Settings

Edit `src/config/app.config.ts` to customize:
- Location (city, state)
- App name and description
- Data source path

### POI Data

Edit `src/data/pois.json` to add/modify POIs:
- Add new POI types to `supportedTypes` array
- Add POI entries with optional `attributes` for filtering
- Attributes enable queries like "Italian restaurants" or "dog-friendly parks"

## Browser Compatibility

- **Best Experience**: Chrome/Edge 113+ (WebGPU support)
- **Fallback**: Firefox, Safari (WebAssembly fallback)
- **Note**: First load downloads ~80MB model (cached afterward)

## Technology Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **AI Model**: FLAN-T5-small (80MB)
- **ML Framework**: Hugging Face Transformers.js
- **Acceleration**: WebGPU / WebAssembly
