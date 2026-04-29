# Favicon & OG Image Setup

## ✅ Current Status
- ✅ Using `logo.png` for favicon (all browsers)
- ✅ Manifest.json configured for PWA
- ✅ Layout.tsx updated
- ❌ **CRITICAL: Need `og-image.png` (1200x630px) for social sharing**

## Setup is Simple

Browser favicon: Uses existing `logo.png` ✅

**Only missing: og-image.png (for LinkedIn/Twitter/Facebook sharing)**

## Create OG Image (1200x630px)

### Quick Way - Use Canva (Free)
1. Go to **https://www.canva.com/**
2. Click "Create a design"
3. Search: "1200 x 630" or "Open Graph"
4. Create design with:
   - Dark blue background (#0F4C75)
   - White Evaldam logo (centered)
   - White text: "Evaldam AI"
   - Tagline: "Professional Startup Valuations"
   - Brand teal (#00b2b2) accents
5. **Download as PNG**
6. Save to `/public/og-image.png`

### Alternative - Figma/Adobe/PowerPoint
- Create 1200x630px document
- Add logo, text, colors (see Canva design above)
- Export as PNG
- Save to `/public/og-image.png`

### Minimum OG Image Requirements
- **Size**: 1200x630 pixels (required)
- **Format**: PNG or JPG
- **Location**: `/public/og-image.png`
- **Content**: Evaldam logo + brand colors + text
- **Impact**: Shows up on LinkedIn, Twitter, Facebook, WhatsApp shares

## Verification

After creating og-image.png:

```bash
# Check file exists
ls -la /public/og-image.png

# Test social preview
# Visit https://www.opengraph.xyz/
# Enter: https://equidamai.com
# Should show og-image.png in preview
```

## That's It!

| Component | Status | File |
|-----------|--------|------|
| Favicon (browsers) | ✅ Done | `/public/logo.png` |
| Favicon (iOS) | ✅ Done | `/public/logo.png` |
| PWA Manifest | ✅ Done | `/public/site.webmanifest` |
| OG Image | ⏳ **TODO** | `/public/og-image.png` |

---

## Timeline
- **10 min**: Create OG image in Canva
- **1 min**: Download & save to `/public/`
- **Done!** 🎉

Nothing else needed - favicon system ready!
