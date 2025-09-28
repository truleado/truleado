# Favicon Setup for Truleado

This directory contains all the favicon files for the Truleado website, optimized for different browsers, devices, and use cases.

## Files Included

### Standard Favicons
- `favicon.ico` - Classic ICO format for older browsers
- `favicon.png` - Main PNG favicon (fallback)
- `favicon.svg` - Vector format for modern browsers

### Size-Specific PNG Files
- `favicon-16x16.png` - 16x16px (browser tabs)
- `favicon-32x32.png` - 32x32px (browser tabs, bookmarks)
- `favicon-48x48.png` - 48x48px (Windows taskbar)
- `favicon-64x64.png` - 64x64px (Windows taskbar)
- `favicon-96x96.png` - 96x96px (Android home screen)
- `favicon-128x128.png` - 128x128px (Chrome Web Store)
- `favicon-144x144.png` - 144x144px (Windows tiles)
- `favicon-152x152.png` - 152x152px (iPad home screen)
- `favicon-256x256.png` - 256x256px (High DPI displays)
- `favicon-384x384.png` - 384x384px (Android splash screen)
- `favicon-512x512.png` - 512x512px (Android splash screen)

### Apple Touch Icons
- `favicon-apple-touch-icon.png` - 180x180px (iOS home screen)

### Android Chrome Icons
- `favicon-android-chrome-192x192.png` - 192x192px (Android home screen)
- `favicon-android-chrome-512x512.png` - 512x512px (Android splash screen)

### Configuration Files
- `site.webmanifest` - Web App Manifest for PWA support
- `browserconfig.xml` - Windows tile configuration

## Browser Support

### Desktop Browsers
- **Chrome/Edge**: Uses PNG files with appropriate sizes
- **Firefox**: Uses PNG files and ICO fallback
- **Safari**: Uses PNG files and Apple touch icon
- **Internet Explorer**: Uses ICO file

### Mobile Browsers
- **iOS Safari**: Uses Apple touch icon (180x180)
- **Android Chrome**: Uses Android Chrome icons (192x192, 512x512)
- **Other Mobile**: Falls back to PNG files

### PWA Support
- **Web App Manifest**: Configured for standalone app experience
- **Theme Color**: Set to Truleado brand color (#148cfc)
- **Background Color**: White (#ffffff)

## Implementation

The favicon configuration is implemented in `src/app/layout.tsx` with:
1. Next.js metadata API for modern favicon handling
2. Direct HTML link tags for maximum compatibility
3. Proper MIME types and size specifications
4. Theme color and viewport meta tags

## Maintenance

To update favicons:
1. Replace the source image files
2. Regenerate all sizes using a tool like:
   - [favicon.io](https://favicon.io/)
   - [realfavicongenerator.net](https://realfavicongenerator.net/)
   - [favicon-generator.org](https://www.favicon-generator.org/)
3. Update the manifest and config files if needed
4. Test across different browsers and devices

## Testing

Test favicon display on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- PWA installation
- Windows tiles
- macOS dock
- Browser bookmarks
- Social media sharing
