# Website Clone & Deploy

Agentic AI system to clone competitor websites and deploy features to BidDeed.AI.

## Features

- **Full Website Cloning**: Clone entire websites with Playwright (HTML, CSS, JS, assets)
- **Component Extraction**: Automatically identify reusable components (headers, forms, cards)
- **Design System Extraction**: Extract colors, fonts, spacing into Tailwind config
- **React Conversion**: Convert HTML components to React + TypeScript
- **Automated Deployment**: Deploy to Cloudflare Pages with zero user actions
- **Visual Regression Testing**: Compare deployed features vs original

## Quick Start

### Clone a Website

```bash
# Trigger GitHub Actions workflow
gh workflow run clone-website.yml -f url=https://testfit.io

# Or run locally
npm install
node scripts/clone-website.js https://testfit.io
```

### Output Structure

```
cloned-sites/
└── testfit.io/
    ├── pages/
    │   └── index.html
    ├── assets/
    ├── api/
    │   ├── endpoints.json
    │   └── responses.json
    ├── analysis/
    │   ├── components.json
    │   ├── design-system.json
    │   └── computed-styles.json
    ├── screenshots/
    │   ├── desktop.png
    │   └── mobile.png
    └── summary.json
```

## Workflow

1. **Clone**: Scrape competitor website with Playwright
2. **Extract**: Identify components and design system
3. **Convert**: Transform HTML to React components
4. **Deploy**: Push to BidDeed.AI and deploy to Cloudflare Pages
5. **Validate**: Run visual regression and functional tests

## Integration with Competitive Intelligence

This tool is part of the BidDeed.AI Competitive Intelligence ecosystem:

1. Run competitive intelligence on competitor (generates PRD/PRS)
2. Clone competitor website (this tool)
3. Deploy missing features to BidDeed.AI
4. Validate deployment

## Legal & Ethical Use

**Legal**:
- ✅ Analyze public websites
- ✅ Extract design patterns
- ✅ Replicate functionality (not copyrighted)

**Illegal**:
- ❌ Copy copyrighted content (text, images, logos)
- ❌ Steal proprietary code
- ❌ Violate Terms of Service

## Repository

**GitHub**: https://github.com/breverdbidder/website-clone-deploy

## Related Projects

- [Competitive Intelligence](https://github.com/breverdbidder/competitive-intelligence) - Full competitor analysis
- [BidDeed.AI](https://github.com/breverdbidder/brevard-bidder-scraper) - Main foreclosure auction platform
- [Life OS](https://github.com/breverdbidder/life-os) - ADHD-optimized productivity system

## License

MIT
