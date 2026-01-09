const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function cloneWebsite(url) {
  console.log(`🚀 Starting clone of ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    if (response.url().includes('/api/') || response.url().includes('.json')) {
      try {
        const body = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: body.substring(0, 10000) // Limit to 10KB
        });
      } catch (e) {
        // Ignore binary responses
      }
    }
  });
  
  console.log('📄 Navigating to site...');
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  
  console.log('📸 Taking screenshots...');
  const domain = url.replace(/https?:\/\//, '').split('/')[0];
  const outputDir = `cloned-sites/${domain}`;
  
  await fs.mkdir(`${outputDir}/screenshots`, { recursive: true });
  await page.screenshot({ 
    path: `${outputDir}/screenshots/desktop.png`, 
    fullPage: true 
  });
  
  // Mobile screenshot
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ 
    path: `${outputDir}/screenshots/mobile.png`, 
    fullPage: true 
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('🔍 Extracting HTML...');
  const html = await page.content();
  
  console.log('🎨 Extracting computed styles...');
  const computedStyles = await page.evaluate(() => {
    const styles = {};
    let index = 0;
    
    document.querySelectorAll('*').forEach((el) => {
      if (index >= 1000) return; // Limit to first 1000 elements
      
      const computed = window.getComputedStyle(el);
      const tagName = el.tagName.toLowerCase();
      const className = el.className ? `.${el.className.toString().split(' ').join('.')}` : '';
      
      styles[index] = {
        selector: tagName + className,
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
      index++;
    });
    
    return styles;
  });
  
  console.log('🎨 Extracting design system...');
  const designSystem = await page.evaluate(() => {
    const colors = new Set();
    const fonts = new Set();
    
    document.querySelectorAll('*').forEach(el => {
      const computed = window.getComputedStyle(el);
      
      // Colors
      const color = computed.color;
      const bgColor = computed.backgroundColor;
      if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        colors.add(color);
      }
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        colors.add(bgColor);
      }
      
      // Fonts
      const fontFamily = computed.fontFamily;
      if (fontFamily) {
        fonts.add(fontFamily);
      }
    });
    
    return {
      colors: Array.from(colors).slice(0, 50), // Top 50 colors
      fonts: Array.from(fonts).slice(0, 20) // Top 20 fonts
    };
  });
  
  console.log('🧩 Identifying components...');
  const components = await page.evaluate(() => {
    const identifyComponent = (el) => {
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList);
      const role = el.getAttribute('role');
      
      // Header
      if (tag === 'header' || role === 'banner' || classes.some(c => c.includes('header'))) {
        return { type: 'header', html: el.outerHTML.substring(0, 5000) };
      }
      
      // Navigation
      if (tag === 'nav' || role === 'navigation' || classes.some(c => c.includes('nav'))) {
        return { type: 'navigation', html: el.outerHTML.substring(0, 5000) };
      }
      
      // Form
      if (tag === 'form') {
        return { type: 'form', html: el.outerHTML.substring(0, 5000) };
      }
      
      // Button
      if (tag === 'button' || (tag === 'a' && classes.some(c => c.includes('button')))) {
        return { type: 'button', html: el.outerHTML.substring(0, 1000) };
      }
      
      // Card
      if (classes.some(c => c.includes('card')) || role === 'article') {
        return { type: 'card', html: el.outerHTML.substring(0, 5000) };
      }
      
      // Footer
      if (tag === 'footer' || role === 'contentinfo' || classes.some(c => c.includes('footer'))) {
        return { type: 'footer', html: el.outerHTML.substring(0, 5000) };
      }
      
      return null;
    };
    
    const components = [];
    const seen = new Set();
    
    document.querySelectorAll('*').forEach(el => {
      const component = identifyComponent(el);
      if (component && !seen.has(component.type)) {
        components.push(component);
        seen.add(component.type);
      }
    });
    
    return components;
  });
  
  console.log('💾 Saving results...');
  
  // Create directory structure
  await fs.mkdir(`${outputDir}/pages`, { recursive: true });
  await fs.mkdir(`${outputDir}/assets`, { recursive: true });
  await fs.mkdir(`${outputDir}/api`, { recursive: true });
  await fs.mkdir(`${outputDir}/analysis`, { recursive: true });
  
  // Save HTML
  await fs.writeFile(`${outputDir}/pages/index.html`, html);
  
  // Save computed styles
  await fs.writeFile(
    `${outputDir}/analysis/computed-styles.json`, 
    JSON.stringify(computedStyles, null, 2)
  );
  
  // Save design system
  await fs.writeFile(
    `${outputDir}/analysis/design-system.json`, 
    JSON.stringify(designSystem, null, 2)
  );
  
  // Save components
  await fs.writeFile(
    `${outputDir}/analysis/components.json`, 
    JSON.stringify(components, null, 2)
  );
  
  // Save API calls
  await fs.writeFile(
    `${outputDir}/api/endpoints.json`, 
    JSON.stringify(apiCalls, null, 2)
  );
  
  await fs.writeFile(
    `${outputDir}/api/responses.json`, 
    JSON.stringify(responses, null, 2)
  );
  
  // Generate summary report
  const summary = {
    url,
    clonedAt: new Date().toISOString(),
    stats: {
      pages: 1,
      components: components.length,
      colors: designSystem.colors.length,
      fonts: designSystem.fonts.length,
      apiCalls: apiCalls.length,
      htmlSize: Buffer.byteLength(html, 'utf8')
    }
  };
  
  await fs.writeFile(
    `${outputDir}/summary.json`, 
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`✅ Clone complete! Saved to ${outputDir}`);
  console.log(`📊 Stats:`);
  console.log(`   - Components: ${components.length}`);
  console.log(`   - Colors: ${designSystem.colors.length}`);
  console.log(`   - Fonts: ${designSystem.fonts.length}`);
  console.log(`   - API Calls: ${apiCalls.length}`);
  console.log(`   - HTML Size: ${(summary.stats.htmlSize / 1024).toFixed(2)} KB`);
  
  await browser.close();
  
  return summary;
}

// Run if called directly
if (require.main === module) {
  const url = process.argv[2] || 'https://testfit.io';
  cloneWebsite(url)
    .then(summary => {
      console.log('\n✨ Summary:', JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { cloneWebsite };
