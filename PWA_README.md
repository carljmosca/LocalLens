# PWA Features Documentation

LocalLens has been enhanced with Progressive Web App (PWA) capabilities, providing an app-like experience with offline functionality.

## PWA Features

### 📱 Installation
- **Install Button**: An "Install App" button appears in the header when the app can be installed
- **Cross-Platform**: Can be installed on desktop and mobile devices
- **App-like Experience**: Runs in standalone mode without browser UI when installed

### 🔄 Offline Functionality
- **Service Worker**: Caches static assets and API responses for offline use
- **AI Model Caching**: Attempts to cache the Transformers.js models for offline query processing
- **Smart Caching Strategy**: Network-first for dynamic content, cache-first for static assets
- **Offline Indicator**: Shows online/offline status in the header

### 🎯 App Manifest
The app includes a comprehensive web app manifest (`public/manifest.json`) with:
- App name and description
- Icons in multiple sizes (72x72 to 512x512)
- Standalone display mode
- Theme colors matching the app design
- Proper categorization and metadata

### 🚀 Performance
- **Lazy Loading**: Service worker registration doesn't block initial render
- **Progressive Enhancement**: PWA features enhance the experience without breaking basic functionality
- **Intelligent Caching**: Large AI model files are cached strategically to improve load times

## Technical Implementation

### Files Added/Modified for PWA:

1. **`public/manifest.json`** - Web app manifest with metadata and icons
2. **`public/sw.js`** - Service worker for offline functionality and caching
3. **`public/icons/`** - Generated app icons in multiple sizes
4. **`src/utils/pwa.ts`** - PWA utility functions and installation management
5. **`src/components/InstallPrompt.tsx`** - UI component for app installation
6. **Updated `index.html`** - Added manifest link and PWA meta tags
7. **Updated `main.tsx`** - Service worker registration
8. **Updated `Header.tsx`** - Integrated install prompt and network status
9. **Updated `LMContext.tsx`** - Added AI model caching
10. **Updated `vite.config.ts`** - PWA build configuration

### Caching Strategy:

- **Static Assets**: Cached on install (HTML, CSS, JS, icons)
- **POI Data**: Cached with network fallback
- **AI Models**: Cached when loaded for better offline experience
- **API Responses**: Cached with stale-while-revalidate strategy

### Installation Flow:

1. Browser detects PWA compatibility
2. `beforeinstallprompt` event captured and stored
3. Install button appears in header
4. User clicks install button
5. Native install dialog shown
6. App installed to home screen/desktop

## Browser Support

- **Chrome/Chromium**: Full PWA support including installation
- **Firefox**: Service worker and offline functionality (no install prompt)
- **Safari**: Basic PWA support, add to home screen
- **Edge**: Full PWA support

## Development Notes

### Icon Generation:
Icons are generated from an SVG base using ImageMagick. To regenerate:

```bash
cd public/icons
chmod +x generate-icons.sh
./generate-icons.sh
```

### Service Worker Updates:
The service worker includes automatic update detection and user notification. When a new version is deployed, users are prompted to refresh.

### Offline AI Models:
The app attempts to cache Transformers.js models for offline use. This is experimental and may not work in all browsers due to CORS restrictions.

### Testing PWA Features:

1. **Lighthouse**: Use Chrome DevTools Lighthouse to audit PWA compliance
2. **Application Panel**: Check service worker registration and cache storage
3. **Network Tab**: Verify offline functionality by throttling network
4. **Install Testing**: Test installation on various devices and browsers

## Future Enhancements

- **Background Sync**: Sync query history when back online
- **Push Notifications**: Notify about new POI additions
- **Improved Offline UX**: Better offline query handling
- **Advanced Caching**: Smarter cache invalidation and management