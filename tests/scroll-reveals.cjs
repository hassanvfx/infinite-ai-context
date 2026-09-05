/* PREVIEW_URL selects the local worktree server. Artifacts stay outside the site. */
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4176/';
const out = process.env.PREVIEW_ARTIFACT_DIR || '/private/tmp/clineflow-scroll-reveals-qa';
fs.mkdirSync(out, { recursive: true });
const summary = [];
const sizes = [[360,800],[390,844],[768,960],[1440,960],[1920,1080],[844,390]];
const revealCoverage = {
  'index.html': ['.quick-install','.agent-compatibility-strip','.easy-flow','.actions',
    '.interlude-knowledge','.context-problem','.masterclass','.workflow-teaser','.book-callout','.author-card','.site-footer'],
  'workflow.html': ['.workflow-page-hero','.deck-carousel','.episodes','.episode-group',
    '.episodes-interlude-art','.book-callout','.author-card','.site-footer'],
};
const errors = [];
const noOverflow = async (page, name) => {
  const widths = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
  assert(widths[1] <= widths[0] + 1, name + ': ' + widths);
};
const readPage = async (page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .75) {
      scrollTo({ top: y, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 70));
    }
  });
  await page.waitForTimeout(1000);
};
const ready = async (page, route='index.html') => {
  await page.goto(url + route, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.classList.contains('reveals-ready'));
};
const inView = async (page, selector, fraction=.65) => {
  await page.locator(selector).first().evaluate((el, ratio) => scrollTo({
    top: scrollY + el.getBoundingClientRect().top - innerHeight * ratio, behavior:'instant'
  }), fraction);
};

(async () => {
  for (const [engine, browserType] of [['chromium',chromium],['webkit',webkit]]) {
    const browser = await browserType.launch({ headless:true });
    try {
      const context = await browser.newContext({ reducedMotion:'no-preference' });
      // Third-party player delivery is not part of reveal geometry checks.
      await context.route('https://player.vimeo.com/**', r => r.fulfill({ status:200, contentType:'text/html', body:'<body style="background:#02060b"></body>' }));
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(engine + ': ' + e.message));
      for (const [width,height] of sizes) {
        await page.setViewportSize({ width,height });
        for (const route of Object.keys(revealCoverage)) {
          await ready(page, route);
          assert.equal(await page.locator('[data-reveal] [data-reveal]').count(),0,'no nested reveal transforms');
          assert.equal(await page.locator('.living-hero [data-reveal]').count(),0,'hero has one entrance system');
          for (const selector of revealCoverage[route]) {
            assert(await page.locator(selector).first().evaluate(el => el.matches('[data-reveal]') || !!el.querySelector('[data-reveal]')), 'uncovered block: '+selector);
          }
          assert(await page.locator('.reveal-pending').count() > 0,'below-fold blocks are armed');
          await noOverflow(page, engine+route+width);
          await readPage(page);
          assert.equal(await page.locator('.reveal-pending').count(),0,'all passed blocks have resolved');
          assert.equal(await page.locator('.reveal-active').count(),0,'compositor hints cleaned');
          assert(await page.locator('[data-reveal]').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1')));
          await page.evaluate(() => scrollTo({ top:0,behavior:'instant' }));
          await page.waitForTimeout(160);
          assert.equal(await page.locator('.reveal-pending, .reveal-active').count(),0,'returning does not replay');
          await noOverflow(page, engine+route+width+' settled');
          if (width===390 || width===1440) await page.screenshot({ path:path.join(out,`${engine}-${route}-${width}.png`),fullPage:true });
          if (route==='workflow.html') {
            assert.equal(await page.locator('[data-carousel-current]').textContent(),'1');
            const widths=await page.locator('.deck-carousel-button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().width));
            assert(Math.abs(widths[0]-widths[1])<1);
          }
          summary.push(`${engine} ${route} ${width}x${height}: reveal coverage, once-only, settled visibility, no overflow`);
        }
      }
      await page.setViewportSize({width:1440,height:960});
      await ready(page);
      await inView(page,'.easy-flow-list');
      await page.waitForFunction(() => document.querySelector('.easy-flow-list li').classList.contains('reveal-active'));
      const stagger = await page.locator('.easy-flow-list li').evaluateAll(els=>els.map(el=>getComputedStyle(el).transitionDelay));
      assert.deepEqual(stagger,['0s, 0s','0.06s, 0.06s','0.12s, 0.12s']);
      const activeStyle = await page.locator('.easy-flow-list li').first().evaluate(el=>({
        duration:getComputedStyle(el).transitionDuration,transform:getComputedStyle(el).transform
      }));
      assert.equal(activeStyle.duration,'0.6s, 0.6s');
      assert.notEqual(activeStyle.transform,'none');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.documentElement.classList.contains('motion-reduced'));
      assert.equal(await page.locator('.reveal-pending, .reveal-active').count(),0);
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.reveal-pending, .reveal-active').count(),0,'preference changes never re-arm');

      await ready(page);
      await page.locator('.author-card-link').evaluate(el=>el.focus({preventScroll:true}));
      assert.equal(await page.locator('.author-card-link').evaluate(el=>getComputedStyle(el).opacity),'1','offscreen keyboard focus resolves');
      await page.locator('.site-nav a[href="#masterclass"]').click();
      await page.waitForTimeout(900);
      assert.equal(await page.locator('#masterclass-title').evaluate(el=>getComputedStyle(el).opacity),'1');
      assert((await page.locator('#masterclass-title').boundingBox()).y>=64);

      await ready(page);
      await inView(page,'.masterclass-video-frame');
      await page.waitForFunction(()=>document.querySelector('.masterclass-video-frame').classList.contains('reveal-active'));
      const mediaBefore=await page.locator('.masterclass-video-frame').boundingBox();
      assert.equal(await page.locator('.masterclass-video-frame').evaluate(el=>getComputedStyle(el).transform),'none');
      await page.waitForTimeout(800);
      const mediaAfter=await page.locator('.masterclass-video-frame').boundingBox();
      assert.deepEqual(mediaBefore,mediaAfter,'video geometry stays fixed');

      await ready(page,'workflow.html');
      await page.locator('[data-carousel-next]').click();
      await page.waitForTimeout(800);
      assert.equal(await page.locator('[data-carousel-current]').textContent(),'2');
      await page.locator('.deck-carousel-track').focus();
      await page.keyboard.press('End');
      await page.waitForTimeout(1400);
      assert.equal(await page.locator('[data-carousel-current]').textContent(),'48');
      await page.keyboard.press('Home');
      await page.waitForTimeout(1400);
      assert.equal(await page.locator('[data-carousel-current]').textContent(),'1');

      await page.setViewportSize({width:390,height:844});
      await ready(page);
      await page.locator('[data-nav-toggle]').click();
      await page.keyboard.press('Escape');
      assert(await page.locator('[data-nav-toggle]').evaluate(el=>el===document.activeElement));
      await inView(page,'.easy-flow-list');
      await page.waitForFunction(()=>document.querySelector('.easy-flow-list li').classList.contains('reveal-active'));
      assert.equal(await page.locator('.easy-flow-list li').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0.5s, 0.5s');
      await page.setViewportSize({width:844,height:390});
      await page.waitForTimeout(900);
      await noOverflow(page,'orientation change');
      await page.setViewportSize({width:390,height:844});
      await ready(page);
      await page.addStyleTag({content:'html { font-size:200%; }'});
      await noOverflow(page,'200% text');
      assert(await page.locator('h1').evaluate(el=>{
        const range=document.createRange();range.selectNodeContents(el);
        return [...range.getClientRects()].every(r=>r.left>=0&&r.right<=innerWidth+1);
      }));
      await page.goto(url+'index.html#install');
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#install').evaluate(el=>getComputedStyle(el).opacity),'1');
      await readPage(page);
      await page.locator('.lightbox-trigger').click();
      assert.equal(await page.locator('.lightbox-notes a').count(),7);
      await page.keyboard.press('Escape');
      assert(await page.locator('.lightbox-trigger').evaluate(el=>el===document.activeElement));
      await page.locator('.motion-toggle').click();
      await page.goto(url+'workflow.html');
      await page.waitForFunction(()=>document.documentElement.classList.contains('motion-reduced'));
      assert.equal(await page.locator('.reveal-pending').count(),0);
      await context.close();

      for (const mode of ['no-js','no-observer']) {
        const plain=await browser.newContext({javaScriptEnabled:mode!=='no-js',viewport:{width:390,height:844}});
        if(mode==='no-observer')await plain.addInitScript(()=>{delete window.IntersectionObserver;});
        const p=await plain.newPage();
        for(const route of ['index.html','workflow.html']){
          await p.goto(url+route,{waitUntil:'domcontentloaded'});
          assert.equal(await p.locator('.reveal-pending').count(),0);
          assert(await p.locator('[data-reveal]').evaluateAll(els=>els.every(el=>getComputedStyle(el).opacity==='1')));
          await noOverflow(p,mode+route);
        }
        await plain.close();
      }
      summary.push(`${engine}: local staggering, media geometry, preferences, focus, anchors, navigation, deck keys, orientation, enlarged text, lightbox and fallbacks passed`);
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors,[]);
  const report={result:'PASS',summary,pageErrors:errors,scope:'Chromium and WebKit emulation; no physical iOS device'};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
