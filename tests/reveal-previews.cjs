/* Record real scroll entrances; use PREVIEW_URL and PREVIEW_ARTIFACT_DIR to relocate. */
const { chromium, webkit, devices } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4176/';
const out = process.env.PREVIEW_ARTIFACT_DIR || '/private/tmp/clineflow-scroll-reveals-qa/previews';
fs.mkdirSync(out, {recursive:true});
const demos = [
  {name:'desktop',engine:chromium,options:{viewport:{width:1440,height:960}},size:{width:1440,height:960}},
  {name:'mobile-webkit',engine:webkit,options:{...devices['iPhone 13']},size:{width:390,height:844}},
];
const scrollTo = async (page, selector, fraction=.58, duration=520) => {
  await page.locator(selector).first().evaluate(async (el,{fraction,duration}) => {
    const from=scrollY;
    const to=Math.max(0,from+el.getBoundingClientRect().top-innerHeight*fraction);
    const start=performance.now();
    await new Promise(resolve=>{
      const tick=time=>{
        const p=Math.min(1,(time-start)/duration);
        const t=p*p*(3-2*p);
        scrollTo({top:from+(to-from)*t,behavior:'instant'});
        if(p<1)requestAnimationFrame(tick);else resolve();
      };
      requestAnimationFrame(tick);
    });
  },{fraction,duration});
};
(async()=>{
  const report=[];
  for(const demo of demos){
    const browser=await demo.engine.launch({headless:true});
    try{
      const context=await browser.newContext({...demo.options,reducedMotion:'no-preference',recordVideo:{dir:out,size:demo.size}});
      const page=await context.newPage();
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(1200);
      for(const selector of ['.quick-install','.agent-compatibility-strip','.easy-flow-header','.easy-flow-list li','.interlude-knowledge']){
        await scrollTo(page,selector);
        await page.waitForTimeout(1000);
      }
      await page.screenshot({path:path.join(out,`${demo.name}-still.png`)});
      const video=page.video();
      await context.close();
      await video.saveAs(path.join(out,`${demo.name}.webm`));

      // Focused restoration and fast-scroll checks in the same engine/device profile.
      const check=await browser.newContext({...demo.options,reducedMotion:'no-preference'});
      await check.route('https://player.vimeo.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<body style="background:#02060b"></body>'}));
      const p=await check.newPage();
      await p.goto(url,{waitUntil:'domcontentloaded'});
      await p.waitForFunction(()=>document.documentElement.classList.contains('reveals-ready'));
      if(demo.name==='mobile-webkit'){
        const b=await p.locator('[data-nav-toggle]').boundingBox();
        await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
        assert.equal(await p.locator('[data-nav-toggle]').getAttribute('aria-expanded'),'true');
        const install=await p.locator('.site-nav a[href="#install"]').boundingBox();
        await p.touchscreen.tap(install.x+install.width/2,install.y+install.height/2);
        assert.equal(await p.locator('[data-nav-toggle]').getAttribute('aria-expanded'),'false');
      }
      await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
      await p.waitForTimeout(1100);
      assert.equal(await p.locator('.reveal-pending, .reveal-active').count(),0,'fast scroll settles passed blocks');
      await p.goto(url+'workflow.html');
      await p.goBack({waitUntil:'domcontentloaded'});
      await p.waitForTimeout(1100);
      assert(await p.locator('[data-reveal]').evaluateAll(es=>es.every(e=>{
        const r=e.getBoundingClientRect();return r.bottom<=0||r.top>=innerHeight*.9||getComputedStyle(e).opacity==='1';
      })),'restored viewport is readable');
      if(demo.name==='mobile-webkit'){
        await p.setViewportSize({width:844,height:390});
        await p.waitForTimeout(800);
        assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      }
      await check.close();
      report.push({name:demo.name,browser:browser.version(),viewport:demo.size,checks:'PASS: fast scroll, restored navigation'+(demo.name==='mobile-webkit'?', iPhone-profile touch menu, landscape':''),physicalDevice:false});
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(out,'previews.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
