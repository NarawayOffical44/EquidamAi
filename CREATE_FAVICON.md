# Create favicon.ico - Quick Guide

## Problem
- Logo.png is 360KB (too large for favicon)
- Need favicon.ico for browser tab display

## Solution: Generate favicon.ico from logo.png

### Option 1: Online Tool (Easiest - 2 min)

1. Go to **https://convertio.co/png-ico/**
2. Upload `/public/logo.png`
3. Click "Convert"
4. Download file (should be small, ~50KB)
5. Rename to `favicon.ico`
6. Save to `/public/favicon.ico`

### Option 2: Using ImageMagick (Command Line)

```bash
cd /d/Apps/Evaldam/evaldam/public

# Convert logo.png to favicon.ico
convert logo.png -define icon:auto-resize=256,128,96,64,48,32,16 favicon.ico
```

**Result**: `favicon.ico` will be ~30-50KB (much smaller!)

### Option 3: Online Favicon Generator

1. Go to **https://realfavicongenerator.net/**
2. Upload `logo.png`
3. Download → Extract `favicon.ico`
4. Copy to `/public/favicon.ico`

## Verify

After saving `favicon.ico` to `/public/`:

```bash
ls -lh /d/Apps/Evaldam/evaldam/public/favicon.ico
```

Should show a small file (< 100KB)

## Test in Browser

1. **Hard Refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check browser tab - should see Evaldam logo
3. Visit homepage - favicon should appear in tab

## If Still Not Showing

1. **Clear browser cache**:
   - Chrome: Settings → Privacy → Clear Browsing Data → Cached Images
   - Firefox: Ctrl+Shift+Delete → Clear

2. **Check file location**:
   ```bash
   ls -la /d/Apps/Evaldam/evaldam/public/favicon.ico
   ```
   Should exist and be readable

3. **Test in different browser** (sometimes cache issue)

## Layout.tsx Updated ✅

The app/layout.tsx now references:
```javascript
icon: [
  { url: "/favicon.ico", sizes: "any" },  // Browser tab
  { url: "/logo.png", sizes: "192x192" }, // PWA
]
```

**Done after creating favicon.ico!**
