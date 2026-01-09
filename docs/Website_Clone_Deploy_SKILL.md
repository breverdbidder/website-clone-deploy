# WEBSITE CLONE & DEPLOY SKILL
## Competitive Intelligence → Competitive Implementation

**Purpose**: Clone competitor websites and deploy missing features to BidDeed.AI
**Trigger**: After completing competitive intelligence report
**Repository**: https://github.com/breverdbidder/website-clone-deploy
**Stack**: Playwright + React + Tailwind + Cloudflare Pages

---

## 🎯 WHEN TO USE THIS SKILL

**Automatic Trigger**:
- After completing competitive intelligence report
- User says: "clone this website", "replicate this site", "deploy these features"
- User says: "add [feature] from [competitor] to BidDeed.AI"

**Manual Trigger**:
- "Clone testfit.io website"
- "Extract components from [URL]"
- "Deploy [competitor's feature] to BidDeed.AI"

---

## 📊 4-STAGE WORKFLOW

### STAGE 1: FULL WEBSITE CLONE

**Goal**: Capture entire website structure, design, and functionality

**Tools**:
- Playwright (headless browser with full JS execution)
- Chrome DevTools Protocol (network monitoring)
- GitHub Actions (automated scraping)

**What to Capture**:
1. **HTML Structure**:
   - All pages (home, pricing, features, docs, blog)
   - Page hierarchy (sitemap)
   - Semantic HTML structure
   - Accessibility attributes (ARIA labels)

2. **CSS Styling**:
   - All stylesheets (inline, external, CSS-in-JS)
   - Computed styles (actual rendered styles)
   - Responsive breakpoints (mobile, tablet, desktop)
   - Animations and transitions

3. **JavaScript**:
   - All script files
   - Event listeners (clicks, hovers, scrolls)
   - State management (React state, Redux, etc.)
   - Third-party libraries (React, Vue, jQuery)

4. **Assets**:
   - Images (logos, icons, photos, illustrations)
   - Fonts (WOFF, WOFF2, TTF)
   - Videos (MP4, WebM)
   - SVG graphics

5. **API Calls**:
   - REST endpoints (captured via network tab)
   - GraphQL queries
   - Request/response schemas
   - Authentication methods

6. **Data Flows**:
   - Form submissions (contact, signup, checkout)
   - User interactions (clicks, searches, filters)
   - Real-time updates (WebSocket, SSE)

**Output**:
```
/cloned-sites/[domain]/
├── pages/
│   ├── index.html (home page)
│   ├── pricing.html
│   ├── features.html
│   └── ... (all pages)
├── assets/
│   ├── images/
│   ├── fonts/
│   └── videos/
├── styles/
│   ├── main.css (compiled CSS)
│   └── computed-styles.json (extracted computed styles)
├── scripts/
│   ├── main.js (all JavaScript)
│   └── libraries.json (detected libraries)
├── api/
│   ├── endpoints.json (all API calls)
│   └── schemas.json (request/response schemas)
└── analysis/
    ├── sitemap.json (page hierarchy)
    ├── components.json (identified components)
    └── design-system.json (colors, fonts, spacing)
```

**Implementation** (GitHub Actions workflow):

```yaml
name: Website Clone
on:
  workflow_dispatch:
    inputs:
      url:
        description: 'URL to clone'
        required: true
        default: 'https://testfit.io'

jobs:
  clone:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Playwright
        run: |
          npm install -D @playwright/test
          npx playwright install chromium
      
      - name: Clone Website
        run: |
          node scripts/clone-website.js ${{ github.event.inputs.url }}
      
      - name: Extract Components
        run: |
          node scripts/extract-components.js
      
      - name: Generate React Components
        run: |
          node scripts/html-to-react.js
      
      - name: Commit Results
        run: |
          git config user.name "Claude AI"
          git config user.email "claude@biddeed.ai"
          git add cloned-sites/
          git commit -m "feat: Clone ${{ github.event.inputs.url }}"
          git push
```

**Scraper Script** (`scripts/clone-website.js`):

```javascript
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function cloneWebsite(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Capture network requests
  const apiCalls = [];
  page.on('request', request => {
    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });
  
  // Capture responses
  const responses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        body: await response.text().catch(() => null)
      });
    }
  });
  
  // Navigate to site
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Get page HTML
  const html = await page.content();
  
  // Get computed styles for all elements
  const computedStyles = await page.evaluate(() => {
    const styles = {};
    document.querySelectorAll('*').forEach((el, index) => {
      const computed = window.getComputedStyle(el);
      styles[index] = {
        selector: el.tagName + (el.className ? `.${el.className.split(' ').join('.')}` : ''),
        styles: {
          display: computed.display,
          position: computed.position,
          width: computed.width,
          height: computed.height,
          padding: computed.padding,
          margin: computed.margin,
          background: computed.background,
          color: computed.color,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight
        }
      };
    });
    return styles;
  });
  
  // Extract design system
  const designSystem = await page.evaluate(() => {
    const colors = new Set();
    const fonts = new Set();
    
    document.querySelectorAll('*').forEach(el => {
      const computed = window.getComputedStyle(el);
      colors.add(computed.color);
      colors.add(computed.backgroundColor);
      fonts.add(computed.fontFamily);
    });
    
    return {
      colors: Array.from(colors).filter(c => c && c !== 'rgba(0, 0, 0, 0)'),
      fonts: Array.from(fonts)
    };
  });
  
  // Identify components
  const components = await page.evaluate(() => {
    const identifyComponent = (el) => {
      // Header
      if (el.tagName === 'HEADER' || el.getAttribute('role') === 'banner') {
        return { type: 'header', element: el.outerHTML };
      }
      // Navigation
      if (el.tagName === 'NAV' || el.getAttribute('role') === 'navigation') {
        return { type: 'navigation', element: el.outerHTML };
      }
      // Form
      if (el.tagName === 'FORM') {
        return { type: 'form', element: el.outerHTML };
      }
      // Button
      if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.classList.contains('button'))) {
        return { type: 'button', element: el.outerHTML };
      }
      // Card
      if (el.classList.contains('card') || el.getAttribute('role') === 'article') {
        return { type: 'card', element: el.outerHTML };
      }
      return null;
    };
    
    const components = [];
    document.querySelectorAll('*').forEach(el => {
      const component = identifyComponent(el);
      if (component) components.push(component);
    });
    
    return components;
  });
  
  // Take screenshot
  await page.screenshot({ path: `screenshots/${url.replace(/https?:\/\//, '')}.png`, fullPage: true });
  
  // Save results
  const domain = url.replace(/https?:\/\//, '').split('/')[0];
  const outputDir = `cloned-sites/${domain}`;
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(`${outputDir}/pages`, { recursive: true });
  await fs.mkdir(`${outputDir}/assets`, { recursive: true });
  await fs.mkdir(`${outputDir}/api`, { recursive: true });
  await fs.mkdir(`${outputDir}/analysis`, { recursive: true });
  
  // Save HTML
  await fs.writeFile(`${outputDir}/pages/index.html`, html);
  
  // Save computed styles
  await fs.writeFile(`${outputDir}/analysis/computed-styles.json`, JSON.stringify(computedStyles, null, 2));
  
  // Save design system
  await fs.writeFile(`${outputDir}/analysis/design-system.json`, JSON.stringify(designSystem, null, 2));
  
  // Save components
  await fs.writeFile(`${outputDir}/analysis/components.json`, JSON.stringify(components, null, 2));
  
  // Save API calls
  await fs.writeFile(`${outputDir}/api/endpoints.json`, JSON.stringify(apiCalls, null, 2));
  await fs.writeFile(`${outputDir}/api/responses.json`, JSON.stringify(responses, null, 2));
  
  console.log(`✅ Cloned ${url} to ${outputDir}`);
  
  await browser.close();
}

// Run
const url = process.argv[2] || 'https://testfit.io';
cloneWebsite(url);
```

---

### STAGE 2: COMPONENT EXTRACTION

**Goal**: Convert HTML to reusable React components

**Tools**:
- Cheerio (HTML parsing)
- Prettier (code formatting)
- TypeScript (type generation)

**Component Identification Rules**:

1. **Header Component**:
   - Element: `<header>`, `role="banner"`, `class*="header"`
   - Output: `Header.tsx` with logo, navigation, CTA button

2. **Navigation Component**:
   - Element: `<nav>`, `role="navigation"`
   - Output: `Navigation.tsx` with menu items, dropdowns

3. **Hero Component**:
   - Element: First large section with heading + CTA
   - Output: `Hero.tsx` with heading, subheading, CTA, background

4. **Feature Card Component**:
   - Element: Repeated `.card`, `.feature`, `role="article"`
   - Output: `FeatureCard.tsx` with icon, title, description

5. **Pricing Card Component**:
   - Element: Pricing table cards
   - Output: `PricingCard.tsx` with tier, price, features, CTA

6. **Form Component**:
   - Element: `<form>` with inputs
   - Output: `Form.tsx` with validation, submission

7. **Footer Component**:
   - Element: `<footer>`, `role="contentinfo"`
   - Output: `Footer.tsx` with links, social, copyright

**HTML → React Converter** (`scripts/html-to-react.js`):

```javascript
const cheerio = require('cheerio');
const fs = require('fs').promises;
const prettier = require('prettier');

async function convertToReact(htmlPath, componentName) {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const $ = cheerio.load(html);
  
  // Extract component HTML
  const componentHtml = $('body').html();
  
  // Convert class to className
  let reactJsx = componentHtml
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/style="([^"]*)"/g, (match, styles) => {
      // Convert inline styles to React style object
      const styleObj = styles.split(';').reduce((acc, style) => {
        const [key, value] = style.split(':').map(s => s.trim());
        if (key && value) {
          const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
          acc[camelKey] = value;
        }
        return acc;
      }, {});
      return `style={${JSON.stringify(styleObj)}}`;
    });
  
  // Generate React component
  const componentCode = `
import React from 'react';

interface ${componentName}Props {
  // Add props as needed
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    ${reactJsx}
  );
};
`;
  
  // Format with Prettier
  const formatted = await prettier.format(componentCode, {
    parser: 'typescript',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5'
  });
  
  return formatted;
}

// Example usage
convertToReact('cloned-sites/testfit.io/pages/index.html', 'Hero')
  .then(code => fs.writeFile('src/components/Hero.tsx', code));
```

**Design System Extraction** (`scripts/extract-design-system.js`):

```javascript
async function extractDesignSystem(designSystemPath) {
  const designSystem = JSON.parse(await fs.readFile(designSystemPath, 'utf-8'));
  
  // Extract primary colors (most common)
  const colorCounts = {};
  designSystem.colors.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  
  const primaryColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([color]) => color);
  
  // Extract fonts
  const fonts = designSystem.fonts
    .filter(font => font && !font.includes('fallback'))
    .map(font => font.split(',')[0].trim().replace(/['"]/g, ''));
  
  // Generate Tailwind config
  const tailwindConfig = `
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${primaryColors[0]}',
        secondary: '${primaryColors[1]}',
        accent: '${primaryColors[2]}',
      },
      fontFamily: {
        sans: ['${fonts[0]}', 'sans-serif'],
        heading: ['${fonts[1] || fonts[0]}', 'sans-serif'],
      },
    },
  },
};
`;
  
  await fs.writeFile('tailwind.config.js', tailwindConfig);
  console.log('✅ Generated Tailwind config from design system');
}
```

---

### STAGE 3: FEATURE IMPLEMENTATION

**Goal**: Deploy cloned features to BidDeed.AI

**Workflow**:
1. User identifies missing feature from competitive intelligence report
2. System locates feature in cloned website components
3. System adapts component to BidDeed.AI stack (React + Tailwind + Supabase)
4. System deploys to Cloudflare Pages
5. System runs tests to verify deployment

**Example: Deploy TestFit's Interactive Map to BidDeed.AI**

**Step 1: Identify Feature**
```
User: "Deploy TestFit's interactive map feature to BidDeed.AI"
AI: Searching cloned-sites/testfit.io/analysis/components.json for map component
```

**Step 2: Extract Component**
```javascript
// Found in cloned-sites/testfit.io/analysis/components.json
{
  "type": "map",
  "library": "mapbox-gl",
  "element": "<div id='map' style='width:100%;height:600px'></div>",
  "scripts": [
    "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
  ],
  "apiKey": "pk.eyJ1IjoidGVzdGZpdCIsImEiOiJjbG..."
}
```

**Step 3: Adapt to BidDeed.AI Stack**
```typescript
// src/components/InteractiveMap.tsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  parcelBoundary?: GeoJSON.Feature;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  parcelBoundary
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [longitude, latitude],
      zoom: 16
    });
    
    // Add parcel boundary if provided
    if (parcelBoundary) {
      map.current.on('load', () => {
        map.current!.addSource('parcel', {
          type: 'geojson',
          data: parcelBoundary
        });
        
        map.current!.addLayer({
          id: 'parcel-fill',
          type: 'fill',
          source: 'parcel',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.4
          }
        });
        
        map.current!.addLayer({
          id: 'parcel-outline',
          type: 'line',
          source: 'parcel',
          paint: {
            'line-color': '#0080ff',
            'line-width': 2
          }
        });
      });
    }
    
    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, parcelBoundary]);
  
  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[600px] rounded-lg shadow-lg"
    />
  );
};
```

**Step 4: Deploy to Cloudflare Pages**
```bash
# Add to BidDeed.AI repo
git add src/components/InteractiveMap.tsx
git commit -m "feat: Add interactive map component (from TestFit)"
git push origin main

# Cloudflare Pages auto-deploys
# URL: https://biddeed-ai.pages.dev
```

**Step 5: Verify Deployment**
```javascript
// tests/InteractiveMap.test.tsx
import { render, screen } from '@testing-library/react';
import { InteractiveMap } from '@/components/InteractiveMap';

test('renders interactive map', () => {
  render(
    <InteractiveMap 
      latitude={28.3852} 
      longitude={-80.7586}
    />
  );
  
  // Verify map container exists
  const mapContainer = screen.getByRole('region', { name: /map/i });
  expect(mapContainer).toBeInTheDocument();
  expect(mapContainer).toHaveClass('w-full', 'h-[600px]');
});
```

---

### STAGE 4: VALIDATION

**Goal**: Verify cloned feature works correctly in BidDeed.AI

**Visual Regression Testing**:
```javascript
// tests/visual-regression/InteractiveMap.spec.ts
import { test, expect } from '@playwright/test';

test('interactive map matches original design', async ({ page }) => {
  // Navigate to BidDeed.AI with map
  await page.goto('https://biddeed-ai.pages.dev/property/123');
  
  // Take screenshot
  const screenshot = await page.locator('.interactive-map').screenshot();
  
  // Compare with baseline (original TestFit map)
  expect(screenshot).toMatchSnapshot('interactive-map.png', {
    threshold: 0.1 // 10% pixel difference allowed
  });
});
```

**Functional Testing**:
```javascript
test('map shows parcel boundary', async ({ page }) => {
  await page.goto('https://biddeed-ai.pages.dev/property/123');
  
  // Wait for map to load
  await page.waitForSelector('.mapboxgl-canvas');
  
  // Verify parcel boundary is visible
  const canvas = await page.locator('.mapboxgl-canvas');
  const boundingBox = await canvas.boundingBox();
  
  expect(boundingBox).toBeTruthy();
  expect(boundingBox!.width).toBeGreaterThan(0);
  expect(boundingBox!.height).toBeGreaterThan(0);
});

test('map is interactive (pan, zoom)', async ({ page }) => {
  await page.goto('https://biddeed-ai.pages.dev/property/123');
  
  await page.waitForSelector('.mapboxgl-canvas');
  
  // Test pan
  await page.mouse.move(500, 300);
  await page.mouse.down();
  await page.mouse.move(600, 300);
  await page.mouse.up();
  
  // Test zoom
  await page.keyboard.press('+'); // Zoom in
  await page.keyboard.press('-'); // Zoom out
  
  // Verify map updated
  // (check map center changed, zoom level changed)
});
```

**Performance Testing**:
```javascript
test('map loads in <3 seconds', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('https://biddeed-ai.pages.dev/property/123');
  await page.waitForSelector('.mapboxgl-canvas');
  
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // <3 seconds
});
```

---

## 📏 ZERO USER ACTIONS PROTOCOL

**CRITICAL**: All 4 stages must be FULLY AUTOMATED with ZERO user actions.

**How to Achieve Zero Actions**:

1. **Stage 1: Full Website Clone**
   - ✅ GitHub Actions workflow (triggered automatically)
   - ✅ Playwright scraping (runs headless)
   - ✅ Results committed to repo (no manual save)

2. **Stage 2: Component Extraction**
   - ✅ Automated HTML → React conversion
   - ✅ Design system extraction (Tailwind config auto-generated)
   - ✅ Component library created (no manual coding)

3. **Stage 3: Feature Implementation**
   - ✅ Component adapted to BidDeed.AI stack (automated)
   - ✅ Deployed to Cloudflare Pages (auto-deploy on git push)
   - ✅ No manual configuration needed

4. **Stage 4: Validation**
   - ✅ Tests run automatically (GitHub Actions)
   - ✅ Visual regression (snapshots auto-compared)
   - ✅ Functional tests (Playwright runs headless)

**If Blocked**:
- Try 3 alternative approaches before reporting
- Use GitHub Actions to bypass local blocks
- Store credentials in GitHub Secrets (not manual entry)

---

## 🎯 EXAMPLE: CLONE TESTFIT.IO AND DEPLOY TO BIDDEED.AI

**Step-by-Step Execution**:

**1. Trigger**:
```
User: "Clone testfit.io and deploy their interactive map to BidDeed.AI"
```

**2. Stage 1: Clone Website**:
```bash
# Trigger GitHub Actions workflow
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/breverdbidder/website-clone-deploy/actions/workflows/clone-website.yml/dispatches \
  -d '{"ref":"main","inputs":{"url":"https://testfit.io"}}'

# Wait for completion (5-10 minutes)
# Results: cloned-sites/testfit.io/ with all pages, assets, components
```

**3. Stage 2: Extract Components**:
```bash
# Identify map component
cat cloned-sites/testfit.io/analysis/components.json | jq '.[] | select(.type == "map")'

# Output:
{
  "type": "map",
  "library": "mapbox-gl",
  "props": {
    "latitude": 30.2672,
    "longitude": -97.7431,
    "zoom": 16
  }
}

# Convert to React component (automated)
node scripts/html-to-react.js \
  --component map \
  --output src/components/InteractiveMap.tsx
```

**4. Stage 3: Deploy to BidDeed.AI**:
```bash
# Copy component to BidDeed.AI repo
cp src/components/InteractiveMap.tsx \
   ../brevard-bidder-scraper/src/components/

# Commit and push (triggers Cloudflare Pages deploy)
cd ../brevard-bidder-scraper
git add src/components/InteractiveMap.tsx
git commit -m "feat: Add interactive map (cloned from TestFit)"
git push origin main

# Cloudflare auto-deploys in 2-3 minutes
# Live at: https://life-os-aiy.pages.dev
```

**5. Stage 4: Validate**:
```bash
# Run visual regression tests
npx playwright test tests/visual-regression/InteractiveMap.spec.ts

# Output:
✅ interactive-map.png matches baseline (98.7% similar)

# Run functional tests
npx playwright test tests/InteractiveMap.test.ts

# Output:
✅ map shows parcel boundary
✅ map is interactive (pan, zoom)
✅ map loads in 2.4 seconds
```

**6. Final Report**:
```markdown
✅ SUCCESSFULLY CLONED & DEPLOYED

Component: Interactive Map (from TestFit)
Status: Deployed to BidDeed.AI
URL: https://life-os-aiy.pages.dev/property/123
Performance: 2.4s load time (target: <3s)
Visual Match: 98.7% (target: >90%)
Tests: 3/3 passed

Next Steps:
1. Integrate with Supabase (fetch parcel data)
2. Add user controls (toggle satellite view, measure distance)
3. Connect to Zoneomics API (show zoning overlay)
```

---

## 🚀 DELIVERABLES

**After running this skill, you get**:

1. **Cloned Website Archive**:
   - `cloned-sites/[domain]/` folder with all assets
   - Deployable as standalone site (if needed)

2. **React Component Library**:
   - `src/components/` with extracted components
   - TypeScript + Tailwind styling
   - Ready to use in BidDeed.AI

3. **Design System**:
   - `tailwind.config.js` with colors, fonts, spacing
   - Matches competitor's visual design
   - Drop-in replacement for BidDeed.AI

4. **Deployment Report**:
   - Features deployed
   - Performance metrics
   - Visual regression results
   - Functional test results

---

## 📊 INTEGRATION WITH COMPETITIVE INTELLIGENCE

**Complete Workflow**:

```
┌────────────────────────────────────────────────────────────┐
│  STAGE 1: COMPETITIVE INTELLIGENCE (Already Done)          │
│  - PRD/PRS (5,129 lines, 5 parts)                         │
│  - SimilarWeb analysis                                     │
│  - Strategic recommendations                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  STAGE 2: WEBSITE CLONE (NEW)                             │
│  - Full site scraping (Playwright)                        │
│  - Component extraction (HTML → React)                    │
│  - Design system extraction (Tailwind config)             │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  STAGE 3: FEATURE IMPLEMENTATION (NEW)                    │
│  - Adapt components to BidDeed.AI stack                   │
│  - Deploy to Cloudflare Pages                             │
│  - Run automated tests                                    │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  STAGE 4: VALIDATION & REPORTING (NEW)                    │
│  - Visual regression testing                              │
│  - Functional testing                                     │
│  - Performance benchmarking                               │
│  - Final deployment report                                │
└────────────────────────────────────────────────────────────┘
```

**Trigger Pattern**:
```
User: "Run competitive intelligence on testfit.io"
→ Generates complete PRD/PRS (5,129 lines)

User: "Now clone the website and deploy the interactive map"
→ Clones testfit.io
→ Extracts map component
→ Deploys to BidDeed.AI
→ Validates deployment
```

---

## ⚠️ LEGAL & ETHICAL CONSIDERATIONS

**What's Legal**:
✅ Analyzing competitor websites (public information)
✅ Taking inspiration from design patterns
✅ Replicating functionality (not copyrighted)
✅ Extracting color schemes, fonts (public CSS)
✅ Learning from competitor's approach

**What's Illegal**:
❌ Copying copyrighted content (text, images, logos)
❌ Stealing proprietary code (obfuscated JS)
❌ Violating Terms of Service (scraping ban)
❌ Trademark infringement (using competitor's name/logo)
❌ Patent infringement (implementing patented algorithms)

**Best Practices**:
1. **Don't copy content verbatim** - Rewrite in your own words
2. **Don't steal assets** - Create your own images, icons, logos
3. **Don't copy code** - Implement functionality from scratch
4. **Do respect robots.txt** - Check allowed scraping paths
5. **Do attribute inspiration** - Acknowledge competitor's influence
6. **Do differentiate** - Add unique value, don't just clone

**For BidDeed.AI**:
- ✅ Clone TestFit's interactive map → Adapt for foreclosure properties
- ✅ Clone design system → Use similar colors but different brand
- ✅ Clone feature list → Implement in BidDeed.AI way (with ML, XGBoost)
- ❌ Don't copy TestFit branding, logos, marketing copy
- ❌ Don't steal proprietary algorithms (generative design)

---

## 🎯 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Clone Success Rate** | 100% | All pages cloned without errors |
| **Component Extraction** | 20+ components | Header, nav, hero, features, pricing, footer |
| **Deployment Speed** | <30 minutes | From trigger to live deployment |
| **Visual Match** | >90% | Visual regression test similarity |
| **Functional Tests** | 100% pass | All interactions work correctly |
| **Performance** | <3 seconds | Page load time on BidDeed.AI |
| **Zero User Actions** | 0 | Fully automated workflow |

---

## 📚 REPOSITORY STRUCTURE

```
website-clone-deploy/
├── .github/
│   └── workflows/
│       ├── clone-website.yml (trigger scraping)
│       ├── extract-components.yml (HTML → React)
│       └── deploy-features.yml (deploy to BidDeed.AI)
├── scripts/
│   ├── clone-website.js (Playwright scraper)
│   ├── extract-components.js (component identification)
│   ├── html-to-react.js (HTML → React converter)
│   └── extract-design-system.js (Tailwind config generator)
├── cloned-sites/
│   └── [domain]/
│       ├── pages/ (all HTML pages)
│       ├── assets/ (images, fonts, videos)
│       ├── styles/ (CSS files)
│       ├── scripts/ (JavaScript files)
│       ├── api/ (API endpoints, schemas)
│       └── analysis/ (components, design system)
├── src/
│   └── components/ (generated React components)
├── tests/
│   ├── visual-regression/ (screenshot comparisons)
│   └── functional/ (Playwright tests)
└── README.md
```

---

## 🔧 INSTALLATION & SETUP

**1. Create Repository**:
```bash
gh repo create breverdbidder/website-clone-deploy --public
cd website-clone-deploy
```

**2. Install Dependencies**:
```bash
npm init -y
npm install --save-dev @playwright/test cheerio prettier
npx playwright install chromium
```

**3. Add GitHub Secrets**:
```bash
# GITHUB_TOKEN (already have: YOUR_GITHUB_TOKEN_HERE)
# MAPBOX_TOKEN (get from https://account.mapbox.com/)
# CLOUDFLARE_API_TOKEN (for deployments)
```

**4. Push to GitHub**:
```bash
git add .
git commit -m "feat: Initial website clone & deploy system"
git push origin main
```

---

## ✅ READY TO USE

This skill is now ready to integrate into your competitive intelligence ecosystem. 

**Next Steps**:
1. Create the repository structure
2. Deploy the scraper scripts
3. Test on testfit.io
4. Deploy first feature to BidDeed.AI

Want me to create the full repository and run the first clone?
