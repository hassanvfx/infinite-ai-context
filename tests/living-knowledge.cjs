/* Run with NODE_PATH pointing to an existing Playwright installation.
 * Preview must already be served; this suite never starts or deploys the site.
 * PREVIEW_URL defaults to http://127.0.0.1:4175/.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4175/';
const output = process.env.PREVIEW_ARTIFACT_DIR || '/tmp/clineflow-motion-qa';
fs.mkdirSync(output, { recursive: true });
const errors = [];
const measurements = [];
const checkWidth = async (page, label) => {
  const result = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert(result.document <= result.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(result)}`);
};
const scrollPage = async (page) => {
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight * .7) {
      scrollTo({ top, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 110));
    }
  });
  await page.waitForTimeout(800);
};
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    const localFailures = [];
    page.on('response', (res) => { if (res.url().startsWith(url) && res.status() >= 400 && !res.url().endsWith('favicon.ico')) localFailures.push(res.url()); });
    for (const width of [360, 390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 960 });
      for (const route of ['', 'workflow.html']) {
        await page.goto(url + route, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.documentElement.classList.contains('motion-enabled'));
        await checkWidth(page, `${route || 'home'} ${width}`);
        await scrollPage(page);
        await checkWidth(page, `${route || 'home'} ${width} after scroll`);
        assert.equal(await page.locator('.resolve-pending').count(), 0, 'all reading units revealed: ' + JSON.stringify(await page.locator('.resolve-pending').evaluateAll((els) => els.map((el) => ({tag:el.tagName, text:el.textContent.slice(0,65), top:el.getBoundingClientRect().top})))));
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(250);
        if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(output, `${route ? 'workflow' : 'home'}-${width}.png`), fullPage: false });
        if (route) {
          assert.equal(await page.locator('.deck-slide').count(), 48);
          assert.equal(await page.locator('[data-carousel-current]').textContent(), '1');
          assert(await page.locator('[data-carousel-prev]').isDisabled());
          const buttons = await page.locator('.deck-carousel-button').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
          assert(Math.abs(buttons[0] - buttons[1]) < 1, 'balanced carousel controls');
          if ([390,1440].includes(width)) {
            await page.locator('.deck-carousel').scrollIntoViewIfNeeded();
            await page.screenshot({ path: path.join(output, `deck-${width}.png`) });
          }
        }
        measurements.push(`${route || 'home'} ${width}px: no overflow`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    const toggle = page.locator('[data-nav-toggle]');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert(await toggle.evaluate((el) => el === document.activeElement));
    await toggle.click();
    await page.locator('.site-nav a[href="#install"]').click();
    await page.waitForTimeout(800);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert((await page.locator('#install').boundingBox()).y >= 64);
    await toggle.click();
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.waitForFunction(() => !document.body.classList.contains('nav-open'));
    assert.equal(await page.locator('body').evaluate((el) => el.classList.contains('nav-open')), false);
    for (const anchor of ['home','install','masterclass']) {
      await page.locator(`.site-nav a[href="#${anchor}"]`).click();
      await page.waitForTimeout(900);
      assert((await page.locator(`#${anchor}`).boundingBox()).y >= 65, `anchor ${anchor} below sticky nav`);
      assert.equal(await page.locator(`.site-nav a[href="#${anchor}"]`).getAttribute('aria-current'), 'location');
    }
    for (const external of ['Book','GitHub']) {
      const link = page.locator('.site-nav a').filter({ hasText: external });
      assert.equal(await link.getAttribute('target'), '_blank');
      assert((await link.getAttribute('href')).startsWith(external === 'Book' ? 'https://www.lulu.com/' : 'https://github.com/hassanvfx/clineflow'));
    }
    await page.locator('.copy-prompt').click();
    await page.waitForFunction(() => document.querySelector('.copy-prompt').textContent === 'Copied!');
    assert.equal(await page.locator('.copy-prompt').textContent(), 'Copied!');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.locator('#quick-install-prompt').textContent());
    await page.locator('.lightbox-trigger').click();
    assert(await page.locator('dialog').isVisible());
    assert.equal(await page.locator('.lightbox-notes a').count(), 7);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(), false);
    assert(await page.locator('.lightbox-trigger').evaluate((el) => el === document.activeElement));

    await page.goto(url + 'workflow.html');
    const track = page.locator('.deck-carousel-track');
    await page.locator('[data-carousel-next]').click();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-carousel-current]').textContent(), '2');
    await track.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-carousel-current]').textContent(), '3');
    await page.locator('[data-carousel-prev]').click();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-carousel-current]').textContent(), '2');
    await track.focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-carousel-current]').textContent(), '1');
    await page.keyboard.press('End');
    await page.waitForTimeout(1400);
    assert.equal(await page.locator('[data-carousel-current]').textContent(), '48');
    assert(await page.locator('[data-carousel-next]').isDisabled());
    await page.keyboard.press('Home');
    await page.waitForTimeout(1400);
    assert.equal(await page.locator('[data-carousel-current]').textContent(), '1');
    await page.locator('.motion-toggle').click();
    assert(await page.locator('html').evaluate((el) => el.classList.contains('motion-reduced')));
    await page.goto(url);
    assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
    await page.locator('.motion-toggle').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.motion-toggle').disabled);
    assert(await page.locator('.motion-toggle').isDisabled());
    assert.equal(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior), 'auto');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('.motion-toggle').disabled);

    // Pointer depth bounded and idle animation does not spin a frame loop.
    await page.goto(url);
    await page.mouse.move(1300, 300);
    await page.waitForTimeout(150);
    const rotation = await page.locator('.knowledge-scene').evaluate((el) => parseFloat(el.style.getPropertyValue('--scene-ry')));
    assert(rotation > 0 && rotation <= 3);
    await page.addScriptTag({ content: `window.frameCount=0; const originalRAF=window.requestAnimationFrame; window.requestAnimationFrame=(f)=>{window.frameCount++;return originalRAF(f);};` });
    await page.waitForTimeout(300);
    const idleStart = await page.evaluate(() => window.frameCount);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.frameCount), idleStart, 'no perpetual idle frames');
    const profile = await page.evaluate(async () => {
      let shifts = 0;
      const observer = new PerformanceObserver((list) => list.getEntries().forEach((e) => { if (!e.hadRecentInput) shifts += e.value; }));
      observer.observe({ type: 'layout-shift', buffered: true });
      const intervals = []; let previous = performance.now();
      for (let i=0;i<100;i++) {
        await new Promise(requestAnimationFrame);
        const now=performance.now(); intervals.push(now-previous); previous=now;
        scrollTo({ top: i * 28, behavior: 'instant' });
      }
      observer.disconnect();
      return { cls: shifts, p95FrameMs: intervals.sort((a,b)=>a-b)[94], framesOver50ms: intervals.filter((n)=>n>50).length };
    });
    measurements.push(profile);
    assert(profile.cls < .1, 'no substantial animation-induced CLS');
    assert(profile.framesOver50ms < 10, 'no sustained slow frames in desktop profile');

    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width:390, height:844 } });
    const plain = await nojs.newPage();
    for (const route of ['', 'workflow.html']) {
      await plain.goto(url + route);
      await checkWidth(plain, 'no JS ' + route);
      assert(await plain.locator('h1').isVisible());
      assert(await plain.locator('.site-nav a').first().isVisible());
      if (route) assert.equal(await plain.locator('.deck-slide').count(),48);
    }
    await nojs.close();
    const touchContext = await browser.newContext({ viewport: { width:390, height:844 }, isMobile:true, hasTouch:true });
    const touch = await touchContext.newPage();
    await touch.goto(url + 'workflow.html');
    await touch.locator('.deck-carousel-track').scrollIntoViewIfNeeded();
    const rect = await touch.locator('.deck-carousel-track').boundingBox();
    const cdp = await touchContext.newCDPSession(touch);
    const y = rect.y + rect.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:rect.x+rect.width-20,y}] });
    for(let i=1;i<=12;i++) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:rect.x+rect.width-20-i*(rect.width-40)/12,y}] });
      await touch.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await touch.waitForTimeout(900);
    assert(Number(await touch.locator('[data-carousel-current]').textContent()) > 1, 'touch swipe changes deck page');
    await checkWidth(touch, 'touch swipe');
    await touchContext.close();
    const broken = await context.newPage();
    await broken.route('**/assets/living-*', (route) => route.abort());
    await broken.goto(url);
    await broken.waitForFunction(() => document.querySelector('.living-hero').classList.contains('art-fallback'));
    assert(await broken.locator('h1').isVisible());
    await checkWidth(broken,'failed artwork');
    await broken.close();
    const slow = await context.newPage();
    await slow.route('**/assets/living-*', async (route) => { await new Promise((r)=>setTimeout(r,800)); await route.continue(); });
    await slow.goto(url, { waitUntil:'domcontentloaded' });
    assert(await slow.locator('h1').isVisible());
    await slow.waitForTimeout(1200);
    await checkWidth(slow, 'delayed hero assets');
    await slow.close();
    // Text enlargement should preserve wrapping and access to controls.
    await page.setViewportSize({ width:390, height:844 });
    await page.goto(url);
    await page.addStyleTag({ content:'html { font-size: 200%; }' });
    await checkWidth(page, '200% text');
    const clippedHeadline = await page.locator('h1').evaluate((el) => {
      const range=document.createRange(); range.selectNodeContents(el);
      return [...range.getClientRects()].some((r)=>r.right > innerWidth || r.left < 0);
    });
    assert.equal(clippedHeadline, false, '200% headline must wrap, not be clipped');
    await page.screenshot({ path:path.join(output,'text-200.png') });
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(localFailures.length, 0, localFailures.join('\n'));
    console.log(JSON.stringify({ result: 'PASS', measurements, pageErrors: errors, localFailures, screenshots: output }, null, 2));
    await context.close();
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode=1; });
