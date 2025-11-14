# LocalLens

A browser-based Points of Interest (POI) search application powered by a local language model. Search for locations using natural language queries with advanced proximity search and attribute filtering.

This project is the result of wondering what one might do with a locally-running language model not via [Ollama](https://ollama.com/), [LMStudio](https://lmstudio.ai/), or [Ramalama](https://ramalama.ai/) (all of which are very cool in my opinion) but in the browser.  I saw one of IBM's Granite models running in the browser and it made me wonder about use cases. I forked the IBM effort I am referencing [here](https://huggingface.co/spaces/carljmosca/Granite-4.0-WebGPU) to add file attachments.  My example use case then was to convert a PDF to JSON using a provided schema which worked with mixed success.

This proof-of-concept project is the use case that came to mind next.  The idea is to leverage the language model to convert the natural language prompt to a query that returns data from a points of interest JSON file.

## Features

- 🤖 **LM-Powered Search**: Uses FLAN-T5-small language model running entirely in your browser
- 🎯 **Natural Language Queries**: "Show me Italian restaurants" or "Find parks near me"
- 🔍 **Proximity Search**: "Parks with nearby restaurants" or "Museums near coffee shops"
- 🏷️ **Advanced Attribute Filtering**: Filter by cuisine, style, or any custom attributes for both primary and nearby POIs
- 🗺️ **Google Maps Integration**: Click addresses to open in Google Maps
- 🌐 **Fully Client-Side**: No backend required, runs 100% in the browser
- ⚡ **WebGPU Accelerated**: Fast inference using WebGPU when available
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🐛 **Debug Logging**: Configurable debug output for development

## Live Demo

Visit the live demo at: `https://carljmosca.github.io/LocalLens/`

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
- Search distance for proximity queries (default: 1.5 miles)

### Debug Settings

```typescript
debug: {
  // Enable console logging for query processing
  enableLogging: false  // Set to true for detailed debug output
}
```

### POI Data

Edit `public/pois.json` to add/modify POIs:
- Add new POI types to `supportedTypes` array
- Add POI entries with optional `attributes` for filtering
- Attributes enable queries like "Italian restaurants" or "dog-friendly parks"
- Ensure accurate coordinates for proximity search functionality

## Query Examples

### Basic Queries
- "Show me restaurants"
- "Find parks in Richmond" 
- "Where are the museums?"

### Attribute Filtering
- "Italian restaurants"
- "Asian restaurants" 
- "Show me Vietnamese restaurants"

### Proximity Search
- "Parks with nearby restaurants" (finds parks that have restaurants within 1.5 miles)
- "Museums near coffee shops" (finds museums with coffee shops nearby)
- "Parks with nearby Italian restaurants" (combines proximity + attribute filtering)

## Browser Compatibility

- **Best Experience**: Chrome/Edge 113+ (WebGPU support)
- **Fallback**: Firefox, Safari (WebAssembly fallback)
- **Note**: First load downloads ~80MB model (cached afterward)

## Technology Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Language Model**: FLAN-T5-small (80MB) - runs locally in browser
- **ML Framework**: Hugging Face Transformers.js with WebGPU support
- **Acceleration**: WebGPU / WebAssembly fallback
- **Distance Calculations**: Haversine formula for accurate proximity search
- **Maps Integration**: Google Maps links for addresses
