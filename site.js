/* Shared progressive enhancement. No framework, animation runtime, or network dependency. */
(() => {
  'use strict';
  const root = document.documentElement;
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 720px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionKey = 'clineflow.reduceMotion';
  let manualReduced = false;
  try { manualReduced = localStorage.getItem(motionKey) === 'true'; } catch { /* file/private mode */ }
  let reduced = systemMotion.matches || manualReduced;
  let frame = 0;
  const frameTasks = new Set();
  const schedule = (task) => {
    frameTasks.add(task);
    if (frame || document.hidden) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const tasks = [...frameTasks];
      frameTasks.clear();
      tasks.forEach((run) => run());
    });
  };
  const scrollBehavior = () => reduced ? 'auto' : 'smooth';
  const clamp = (n, limit) => Math.max(-limit, Math.min(limit, n));

  // A disclosure on mobile; all links remain available when JavaScript is absent.
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  const links = [...nav.querySelectorAll('a')];
  const closeNav = (restoreFocus = false) => {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    nav.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('nav-open');
    if (restoreFocus && wasOpen) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') return closeNav(true);
    nav.classList.add('is-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    document.body.classList.add('nav-open');
    links[0].focus();
  });
  links.forEach((link) => link.addEventListener('click', () => closeNav()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav(true);
    if (event.key !== 'Tab' || !mobile.matches || toggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.shiftKey && document.activeElement === toggle) { event.preventDefault(); links.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); toggle.focus(); }
  });
  document.addEventListener('click', (event) => { if (!header.contains(event.target)) closeNav(); });
  mobile.addEventListener('change', () => { closeNav(); schedule(updatePage); });
  header.classList.add('nav-enhanced');

  const sectionLinks = links.filter((link) => link.getAttribute('href').startsWith('#'));
  const sections = sectionLinks.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
  const backTop = document.createElement('button');
  backTop.className = 'scroll-top';
  backTop.type = 'button';
  backTop.setAttribute('aria-label', 'Back to top');
  backTop.textContent = '↑';
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: scrollBehavior() }));
  document.body.append(backTop);

  // Copy success is a clipboard confirmation, never an installation status.
  document.querySelectorAll('[data-copy-target]').forEach((button) => {
    let reset;
    button.addEventListener('click', async () => {
      const prompt = document.getElementById(button.dataset.copyTarget).textContent;
      const feedback = document.getElementById('copy-feedback');
      let copied = false;
      try { await navigator.clipboard.writeText(prompt); copied = true; } catch {
        const field = document.createElement('textarea');
        field.value = prompt;
        field.style.cssText = 'position:fixed;opacity:0;inset:0;pointer-events:none';
        document.body.append(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch { /* manual fallback below */ }
        field.remove();
        button.focus();
      }
      if (!copied) { feedback.textContent = 'Copy failed. Select the prompt and copy it manually.'; return; }
      button.textContent = 'Copied!';
      feedback.textContent = 'Installer prompt copied to your clipboard.';
      const panel = button.closest('.quick-install');
      panel.classList.add('is-copied');
      clearTimeout(reset);
      reset = setTimeout(() => { button.textContent = 'Copy prompt'; panel.classList.remove('is-copied'); }, 2200);
    });
  });

  // One reusable image dialog, with footer notes supplied by each trigger.
  const triggers = [...document.querySelectorAll('[data-lightbox-src]')];
  if (triggers.length) {
    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-labelledby', 'lightbox-title');
    dialog.innerHTML = '<div class="lightbox-inner"><header class="lightbox-header"><p class="lightbox-title" id="lightbox-title"></p><button class="lightbox-close" type="button" aria-label="Close image">×</button></header><div class="lightbox-body"><img class="lightbox-image" alt=""></div><footer class="lightbox-footer"><p>Source posts</p><div class="lightbox-notes"></div></footer></div>';
    document.body.append(dialog);
    let opener;
    triggers.forEach((trigger) => trigger.addEventListener('click', () => {
      opener = trigger;
      const img = dialog.querySelector('img');
      img.src = trigger.dataset.lightboxSrc;
      img.alt = trigger.dataset.lightboxAlt || '';
      dialog.querySelector('.lightbox-title').textContent = trigger.dataset.lightboxTitle || 'Image preview';
      let notes = [];
      try { notes = JSON.parse(trigger.dataset.lightboxNotes || '[]'); } catch { /* optional */ }
      dialog.querySelector('.lightbox-notes').replaceChildren(...notes.flatMap((note) => {
        try { if (!['https:', 'http:'].includes(new URL(note.href).protocol)) return []; } catch { return []; }
        const a = document.createElement('a');
        a.href = note.href; a.textContent = note.label; a.target = '_blank'; a.rel = 'noopener noreferrer';
        return [a];
      }));
      dialog.showModal();
      document.body.classList.add('lightbox-open');
    }));
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { document.body.classList.remove('lightbox-open'); opener?.focus(); });
  }

  // Static slides work without JS; navigation uses coordinates local to the track.
  const carouselUpdates = [];
  document.querySelectorAll('[data-carousel-start-index]').forEach((track) => {
    const slides = [...track.querySelectorAll('.deck-slide')];
    if (!slides.length) return;
    const card = track.closest('.deck-carousel');
    const prev = card.querySelector('[data-carousel-prev]');
    const next = card.querySelector('[data-carousel-next]');
    const current = card.querySelector('[data-carousel-current]');
    card.querySelector('[data-carousel-total]').textContent = slides.length;
    const position = (slide) => slide.offsetLeft - slides[0].offsetLeft;
    const nearest = () => slides.reduce((best, slide, index) => Math.abs(position(slide) - track.scrollLeft) < Math.abs(position(slides[best]) - track.scrollLeft) ? index : best, 0);
    let destination = 0;
    let navigating = false;
    let settling;
    const update = () => {
      const index = nearest();
      current.textContent = index + 1;
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
    };
    const go = (index) => {
      destination = Math.max(0, Math.min(slides.length - 1, index));
      navigating = true;
      track.scrollTo({ left: position(slides[destination]), behavior: scrollBehavior() });
      if (reduced) { navigating = false; update(); }
    };
    prev.addEventListener('click', () => go((navigating ? destination : nearest()) - 1));
    next.addEventListener('click', () => go((navigating ? destination : nearest()) + 1));
    track.addEventListener('keydown', (event) => {
      const actions = { ArrowLeft: () => go((navigating ? destination : nearest()) - 1), ArrowRight: () => go((navigating ? destination : nearest()) + 1), Home: () => go(0), End: () => go(slides.length - 1) };
      if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
    });
    track.addEventListener('pointerdown', () => { navigating = false; });
    track.addEventListener('wheel', () => { navigating = false; }, { passive: true });
    track.addEventListener('scroll', () => {
      schedule(update);
      clearTimeout(settling);
      settling = setTimeout(() => { navigating = false; update(); }, 120);
    }, { passive: true });
    track.scrollLeft = 0;
    update();
    let lastWidth = track.clientWidth;
    if ('ResizeObserver' in window) new ResizeObserver(() => {
      const width = track.clientWidth;
      if (width === lastWidth) return;
      const page = Math.max(0, Number(current.textContent) - 1);
      lastWidth = width;
      track.scrollTo({ left: position(slides[page]), behavior: 'instant' });
      schedule(update);
    }).observe(track);
    carouselUpdates.push(update);
  });

  const hero = document.querySelector('.living-hero');
  const scenery = hero ? [...hero.querySelectorAll('.hero-rock, .hero-network')] : [];
  const panels = hero ? [...hero.querySelectorAll('.knowledge-panel')] : [];
  const scene = hero?.querySelector('.knowledge-scene');
  const interlude = document.querySelector('.episodes-interlude-art');
  const active = new Set();
  let pointerX = 0;
  let pointerY = 0;
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => { if (isIntersecting) active.add(target); else active.delete(target); });
      schedule(updatePage);
    });
    [hero, interlude].filter(Boolean).forEach((element) => visibility.observe(element));
  }
  if (hero) {
    hero.addEventListener('pointermove', (event) => {
      if (reduced || !finePointer.matches || mobile.matches) return;
      const rect = hero.getBoundingClientRect();
      pointerX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, 1);
      pointerY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, 1);
      schedule(updatePage);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; schedule(updatePage); });
    hero.querySelectorAll('.hero-scenery img').forEach((img) => {
      const failed = () => hero.classList.add('art-fallback');
      img.addEventListener('error', failed);
      if (img.complete && !img.naturalWidth) failed();
    });
  }

  function updatePage() {
    if (document.hidden) return;
    const offset = header.getBoundingClientRect().height + 90;
    let selected = sections[0];
    sections.forEach((section) => { if (section.getBoundingClientRect().top <= offset) selected = section; });
    if (selected) sectionLinks.forEach((link) => {
      const on = link.hash === '#' + selected.id;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    const showTop = window.scrollY > 720;
    backTop.classList.toggle('is-visible', showTop);
    backTop.tabIndex = showTop ? 0 : -1;
    if (reduced) return;
    if (hero && active.has(hero)) {
      const rect = hero.getBoundingClientRect();
      const progress = clamp(-rect.top / rect.height, 1);
      const px = mobile.matches ? 0 : pointerX;
      const py = mobile.matches ? 0 : pointerY;
      const drift = progress * (mobile.matches ? 12 : 48);
      scenery.forEach((layer, index) => {
        layer.style.setProperty('--layer-x', (px * (index + 1) * 8).toFixed(2) + 'px');
        layer.style.setProperty('--layer-y', clamp(drift * (index + 1) / 2 + py * 8, mobile.matches ? 12 : 48).toFixed(2) + 'px');
      });
      scene.style.setProperty('--scene-rx', (-py * 3).toFixed(2) + 'deg');
      scene.style.setProperty('--scene-ry', (px * 3).toFixed(2) + 'deg');
      panels.forEach((panel, index) => {
        panel.style.setProperty('--layer-x', (px * (index + 1) * 8).toFixed(2) + 'px');
        panel.style.setProperty('--layer-y', (py * (index + 1) * 5).toFixed(2) + 'px');
      });
    }
    if (interlude && active.has(interlude)) {
      const rect = interlude.getBoundingClientRect();
      const progress = clamp((innerHeight / 2 - rect.top - rect.height / 2) / innerHeight, 1);
      interlude.style.setProperty('--interlude-y', (progress * (mobile.matches ? 8 : 20)).toFixed(2) + 'px');
    }
  }

  // Resolve individual reading units, never transform video players or tall sections.
  const revealSelector = '.hero-copy > *, .hero-footer, .quick-install, .agent-compatibility-strip, .easy-flow-header > *, .easy-flow-list, .easy-flow-list > li, .interlude-title, .interlude-lead, .interlude-note, .context-problem-copy > *, .context-problem-image, .masterclass-card-copy > *, .masterclass-blurb > *, .workflow-teaser, .workflow-page-hero > :not(img), .deck-carousel-header, .episode-group-heading, .episode > p, .episode > h3, .book-callout-cover, .book-callout-copy > *, .author-avatar-link, .author-card-copy > *';
  const revealTargets = [...document.querySelectorAll(revealSelector)];
  let revealObserver;
  const setupReveals = () => {
    revealObserver?.disconnect();
    if (reduced || !('IntersectionObserver' in window)) {
      revealTargets.forEach((el) => el.classList.remove('resolve-pending'));
      return;
    }
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.remove('resolve-pending');
        target.classList.add('is-resolved');
        observer.unobserve(target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    revealTargets.forEach((target, index) => {
      if (target.classList.contains('is-resolved')) return;
      target.dataset.resolve = target.matches('.easy-flow-list') ? 'fade' : '';
      target.style.setProperty('--resolve-delay', (index % 3) * 70 + 'ms');
      // Never hide the first viewport or content already passed on a deep link.
      if (target.getBoundingClientRect().top >= innerHeight) target.classList.add('resolve-pending');
      revealObserver.observe(target);
    });
  };
  const motionToggle = document.querySelector('.motion-toggle');
  const applyMotion = () => {
    reduced = systemMotion.matches || manualReduced;
    root.classList.toggle('motion-reduced', reduced);
    root.classList.toggle('motion-enabled', !reduced);
    motionToggle.hidden = false;
    motionToggle.setAttribute('aria-pressed', String(reduced));
    motionToggle.textContent = systemMotion.matches ? 'Reduced motion · system' : 'Reduce motion';
    motionToggle.disabled = systemMotion.matches;
    motionToggle.title = systemMotion.matches ? 'Reduced motion follows your device’s accessibility setting.' : 'Reduce animation on both ClineFlow pages.';
    if (reduced) {
      [...scenery, ...panels, scene, interlude].filter(Boolean).forEach((el) => {
        ['--layer-x', '--layer-y', '--scene-rx', '--scene-ry', '--interlude-y'].forEach((key) => el.style.removeProperty(key));
      });
    }
    setupReveals();
    schedule(updatePage);
  };
  motionToggle.addEventListener('click', () => {
    manualReduced = !manualReduced;
    try { localStorage.setItem(motionKey, String(manualReduced)); } catch { /* current page still works */ }
    applyMotion();
  });
  systemMotion.addEventListener('change', applyMotion);
  window.addEventListener('storage', (event) => { if (event.key === motionKey) { manualReduced = event.newValue === 'true'; applyMotion(); } });
  window.addEventListener('scroll', () => schedule(updatePage), { passive: true });
  window.addEventListener('resize', () => { schedule(updatePage); carouselUpdates.forEach(schedule); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('motion-paused', document.hidden);
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule(updatePage);
  });
  applyMotion();
})();
