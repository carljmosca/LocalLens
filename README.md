# LocalLens

A browser-based Points of Interest (POI) search application powered by a local language model. Search for locations using natural language queries with advanced proximity search and attribute filtering.

This project is the result of wondering what one might do with a locally-running language model not via [Ollama](https://ollama.com/), [LMStudio](https://lmstudio.ai/), or [Ramalama](https://ramalama.ai/) (all of which are very cool in my opinion) but in the browser.  I saw one of IBM's Granite models running in the browser and it made me wonder about use cases. I forked the IBM effort I am referencing [here](https://huggingface.co/spaces/carljmosca/Granite-4.0-WebGPU) to add file attachments.  My example use case then was to convert a PDF to JSON using a provided schema which worked with mixed success.

This proof-of-concept project is the use case that came to mind next.  The idea is to leverage the language model to convert natural language prompts into SQL queries that run against an in-browser SQLite database. The application loads a pre-populated SQLite database file at startup and executes all queries as pure SQL - no JSON processing or data transformation occurs at runtime.

## Features

- 🤖 **NL2SQL Architecture**: Natural language to SQL conversion using FLAN-T5-small for NLP analysis
- 💾 **In-Browser SQLite**: Uses sql.js for a fully client-side, read-only database
- 🎯 **Natural Language Queries**: "Show me Italian restaurants" or "Find parks near me"
- 🔍 **Proximity Search**: "Parks with nearby restaurants" with Haversine distance calculations
- 🏷️ **Template-Based SQL Generation**: Three query templates (proximity, simple type, fallback)
- 🗺️ **Google Maps Integration**: Click addresses to open in Google Maps
- 🌐 **Fully Client-Side**: No backend required, runs 100% in the browser
- ⚡ **WebGPU Accelerated**: Fast NLP inference using WebGPU when available
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🐛 **Debug Logging**: Configurable debug output with SQL query preview

## Live Demo

Visit the [live demo here](https://carljmosca.github.io/LocalLens/)

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
- Search distance for proximity queries (default: 1.5 miles)

**Note**: The `pois.json` file is used only at build time to generate the SQLite database. The application loads the binary `pois.db` file at runtime from the `public/` directory.

### Debug Settings

```typescript
debug: {
  // Enable console logging for query processing
  enableLogging: false  // Set to true for detailed debug output
}
```

### SQLite Database

The application uses an **in-browser SQLite database** powered by [sql.js](https://sql.js.org/), providing a full SQL query engine that runs entirely client-side with zero server dependencies.

#### Database Architecture

The application requires a pre-populated SQLite database file (`public/pois.db`) which is loaded directly into memory at startup. The database file must be created before the application can run.

**Build-Time Database Generation**: Use the provided `scripts/generate-db.js` script to create `pois.db` from the sample `pois.json` data file during your build process.

**Database Schema:**
```sql
-- Core tables for POI data
CREATE TABLE poi_types (
  type_id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name TEXT NOT NULL UNIQUE
);

CREATE TABLE pois (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type_id INTEGER,
  address TEXT,
  latitude REAL,
  longitude REAL,
  FOREIGN KEY (type_id) REFERENCES poi_types(type_id)
);

CREATE TABLE attributes (
  attribute_id INTEGER PRIMARY KEY AUTOINCREMENT,
  attribute_name TEXT NOT NULL UNIQUE
);

CREATE TABLE poi_attributes (
  poi_id TEXT,
  attribute_id INTEGER,
  PRIMARY KEY (poi_id, attribute_id),
  FOREIGN KEY (poi_id) REFERENCES pois(id),
  FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id)
);
```

#### Creating Your Own Database

There are two methods to create a custom POI database:

##### Method 1: Using the Build Script (Recommended for Initial Setup)

Generate the database from a JSON file:

```bash
# Using the included sample data
node scripts/generate-db.js

# The script will:
# - Read src/data/pois.json
# - Read public/schema.sql
# - Generate public/pois.db (SQLite database file)
```

##### Method 2: Manual Creation with SQLite CLI

To create a custom POI database from scratch:

1. **Install SQLite** (if not already installed):
   ```bash
   # macOS
   brew install sqlite
   
   # Ubuntu/Debian
   sudo apt-get install sqlite3
   
   # Windows: Download from https://www.sqlite.org/download.html
   ```

2. **Create and Populate Database**:
   ```bash
   # Create new database
   sqlite3 public/pois.db
   
   # In SQLite shell, load schema
   .read public/schema.sql
   
   # Insert POI types
   INSERT INTO poi_types (type_name) VALUES ('museum');
   INSERT INTO poi_types (type_name) VALUES ('park');
   INSERT INTO poi_types (type_name) VALUES ('restaurant');
   
   # Insert POIs
   INSERT INTO pois (id, name, type_id, address, latitude, longitude)
   VALUES ('1', 'Boston Common', 2, '139 Tremont St, Boston, MA 02111', 42.3551, -71.0656);
   
   # Insert attributes (optional)
   INSERT INTO attributes (attribute_name) VALUES ('historic');
   INSERT INTO attributes (attribute_name) VALUES ('dog-friendly');
   
   # Link POI to attributes
   INSERT INTO poi_attributes (poi_id, attribute_id) VALUES ('1', 1);
   INSERT INTO poi_attributes (poi_id, attribute_id) VALUES ('1', 2);
   
   # Exit
   .quit
   ```

3. **Alternative: Import from CSV**:
   ```bash
   sqlite3 public/pois.db
   .mode csv
   .import pois.csv pois
   .quit
   ```

4. **Update Location Settings** in `src/config/app.config.ts`:
   ```typescript
   location: {
     city: 'Boston',
     state: 'MA',
     displayName: 'Boston, MA'
   }
   ```

5. **Rebuild and Deploy**:
   ```bash
   npm run build
   ```

#### Database File Requirements

- **Location**: Must be placed in `public/pois.db`
- **Format**: Standard SQLite 3 database file
- **Schema**: Must match the schema defined in `public/schema.sql`
- **Size**: Recommended < 10MB for optimal browser performance
- **Read-Only**: Database is loaded as read-only in the browser

#### Query Templates

The system uses three SQL templates:

1. **Proximity Template** (CROSS JOIN with Haversine):
   ```sql
   SELECT p.id AS primary_id, nearby.id AS nearby_id, 
          (haversine_distance) * 0.621371 AS distance_miles
   FROM pois p
   CROSS JOIN pois nearby
   WHERE p.type_id IN (...) AND nearby.type_id IN (...)
   AND distance <= 2.0 miles
   ```

2. **Simple Type Template**:
   ```sql
   SELECT p.id, p.name, p.type_id, p.latitude, p.longitude, p.address
   FROM pois p
   JOIN poi_types pt ON p.type_id = pt.type_id
   WHERE pt.type_name = 'museum'
   ```

3. **Fallback Template** (show all):
   ```sql
   SELECT * FROM pois LIMIT 100
   ```

## Query Examples

### Basic Type Queries
- "Show me restaurants"
- "Find parks in Richmond" 
- "Where are the museums?"

**Generated SQL**:
```sql
SELECT p.id, p.name, p.type_id, p.latitude, p.longitude, p.address
FROM pois p
JOIN poi_types pt ON p.type_id = pt.type_id
WHERE pt.type_name = 'restaurant'
LIMIT 100
```

### Proximity Search
- "Parks with nearby restaurants" (finds parks that have restaurants within 2.0 miles)
- "Museums near coffee shops" (finds museums with coffee shops nearby)
- "Find libraries near parks"

**Generated SQL**:
```sql
SELECT 
  p.id AS primary_id, p.name AS primary_name,
  nearby.id AS nearby_id, nearby.name AS nearby_name,
  (haversine_distance_calculation) * 0.621371 AS distance_miles
FROM pois p
CROSS JOIN pois nearby
WHERE p.type_id IN (SELECT type_id FROM poi_types WHERE type_name = 'park')
  AND nearby.type_id IN (SELECT type_id FROM poi_types WHERE type_name = 'restaurant')
  AND p.id != nearby.id
  AND distance_miles <= 2.0
ORDER BY p.id, distance_miles
```

### Supported Types Query
- "What types are supported?"
- "Show me all POI types"

**Returns**: List of all available POI types from the database

## Browser Compatibility

- **Best Experience**: Chrome/Edge 113+ (WebGPU support)
- **Fallback**: Firefox, Safari (WebAssembly fallback)
- **Note**: First load downloads ~80MB model (cached afterward)

## Architecture

### NL2SQL Pipeline

1. **Database Loading**: At startup, pre-populated SQLite database (`pois.db`) is loaded into memory
2. **Natural Language Input**: User enters query (e.g., "Find museums near parks")
3. **NLP Analysis**: FLAN-T5-small extracts nouns/types using `analyzeQuery()`
4. **Template Selection**: 
   - Proximity query detected → Use CROSS JOIN template
   - Simple type query → Use JOIN template  
   - Fallback → SELECT all
5. **SQL Generation**: Template populated with extracted types
6. **Validation**: SQL checked for safety (DML/DDL blocking, identifier validation)
7. **Execution**: sql.js runs **pure SQL** query against in-memory SQLite database
8. **Result Conversion**: SQL rows converted to POI objects or grouped results
9. **UI Display**: Results rendered with distances, addresses, and map links

**Key Point**: This is a true NL2SQL system - the SQLite database file is loaded directly, and all queries execute as SQL. No JSON, no data transformation, just natural language → SQL → results.

### Key Components

- **lmService**: NLP analysis and template-based SQL generation
- **sqliteService**: In-browser SQLite database initialization and query execution
- **queryService**: Orchestrates NL2SQL pipeline and result conversion
- **dataService**: Provides supported POI types for NLP matching (queries SQLite at startup)

## Technology Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Database**: sql.js (SQLite compiled to WebAssembly)
- **Language Model**: FLAN-T5-small (80MB) - runs locally in browser
- **ML Framework**: Hugging Face Transformers.js with WebGPU support
- **Acceleration**: WebGPU / WebAssembly fallback
- **Distance Calculations**: Haversine formula in SQL for proximity search
- **Maps Integration**: Google Maps links for addresses

## License and Copyright

Copyright (c) 2025 Mosca IT LLC. All rights reserved.

This software and associated documentation files are proprietary to Mosca IT LLC. Unauthorized copying, distribution, modification, or use is strictly prohibited.
