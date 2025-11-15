# PWA Deployment and Testing Checklist

**Copyright (c) 2025 Mosca IT LLC. All rights reserved.**

## Pre-deployment Checklist

### ✅ Build and Files
- [ ] `npm run build` completes successfully
- [ ] `dist/manifest.json` exists and is valid
- [ ] `dist/sw.js` (service worker) is present
- [ ] All icon files exist in `dist/icons/` (8 different sizes)
- [ ] `dist/pois.json` is included
- [ ] No critical build warnings or errors

### ✅ Manifest Validation
- [ ] Web App Manifest includes all required fields:
  - [ ] `name` and `short_name`
  - [ ] `start_url` and `scope`
  - [ ] `display: "standalone"`
  - [ ] `theme_color` and `background_color`
  - [ ] Icons array with multiple sizes
  - [ ] Valid JSON syntax

### ✅ Service Worker
- [ ] Service worker registers without errors
- [ ] Static assets are cached on first visit
- [ ] Offline functionality works for cached content
- [ ] Network status detection working
- [ ] Model caching (if applicable) doesn't break initialization

### ✅ Icon Requirements
- [ ] Icons include 192x192 (minimum PWA requirement)
- [ ] Icons include 512x512 (recommended)
- [ ] Icons are PNG format
- [ ] Icons are properly sized and not distorted
- [ ] Apple touch icon is specified in HTML

## Testing Steps

### 1. Development Testing
```bash
# Start dev server
npm run dev

# Open in browser: http://localhost:5173
# Open DevTools > Application tab
```

**Check in DevTools:**
- [ ] Service Worker is registered (Application > Service Workers)
- [ ] Manifest loads without errors (Application > Manifest)
- [ ] Cache Storage shows cached resources (Application > Cache Storage)

### 2. Build Testing
```bash
# Build for production
npm run build

# Serve the built files (using a simple HTTP server)
npx serve dist

# Open served URL in browser
```

### 3. PWA Installation Testing
- [ ] **Chrome/Edge:** Install button appears in address bar
- [ ] **Mobile Safari:** "Add to Home Screen" option in share menu
- [ ] **Chrome Mobile:** Install banner appears (may need multiple visits)
- [ ] App opens in standalone mode when launched from home screen

### 4. Lighthouse PWA Audit
```bash
# Open Chrome DevTools > Lighthouse
# Select "Progressive Web App" category
# Run audit
```

**Target Scores:**
- [ ] PWA score: 90+ 
- [ ] All PWA requirements met (green checkmarks)

### 5. Offline Testing
- [ ] Go offline (DevTools > Network tab > "Offline")
- [ ] App still loads from cache
- [ ] Basic functionality works offline
- [ ] Network status indicator shows "Offline"
- [ ] Graceful handling of offline AI queries

### 6. Cross-browser Testing
- [ ] **Chrome:** Full PWA support including installation
- [ ] **Firefox:** Service worker and offline functionality
- [ ] **Safari:** Basic PWA features, add to home screen
- [ ] **Edge:** Full PWA support

## Post-deployment Verification

### GitHub Pages Specific
- [ ] HTTPS is enabled (required for PWA)
- [ ] Base URL is configured correctly in Vite config
- [ ] All assets load from correct paths
- [ ] Manifest.json accessible at `https://yourdomain.com/manifest.json`
- [ ] Service worker accessible at `https://yourdomain.com/sw.js`

### Performance Verification
- [ ] Initial load time is reasonable
- [ ] App installation process is smooth
- [ ] Service worker doesn't significantly impact performance
- [ ] Large model files don't block initial render

## Troubleshooting Common Issues

### Service Worker Not Registering
- Check HTTPS requirement (required in production)
- Verify sw.js is accessible at root path
- Check for JavaScript errors in console
- Ensure service worker code is valid

### Install Prompt Not Showing
- Multiple visits may be needed
- Check PWA requirements are met (Lighthouse audit)
- Verify manifest.json is valid
- Some browsers require user engagement

### Offline Functionality Issues
- Check cache storage in DevTools
- Verify service worker is intercepting requests
- Check network request patterns in DevTools
- Ensure proper cache-first/network-first strategies

### Icons Not Displaying
- Verify icon files exist and are accessible
- Check icon paths in manifest.json
- Ensure icons are properly sized PNG files
- Test on multiple devices/browsers

## Success Criteria

The PWA is ready when:
- ✅ Lighthouse PWA audit passes with 90+ score
- ✅ App can be installed on multiple browsers/devices
- ✅ Basic offline functionality works
- ✅ Service worker caches assets properly
- ✅ Install prompt appears when appropriate
- ✅ App opens in standalone mode when installed
- ✅ No console errors related to PWA features