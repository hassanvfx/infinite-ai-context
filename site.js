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

  // Explicit reading units reveal once. Groups stagger locally; media only fades.
  const revealTargets = [...document.querySelectorAll('[data-reveal]')];
  const pendingReveals = new Set();
  const queuedReveals = new Set();
  const activeReveals = new Map();
  const connectingGroups = new Map();
  let revealObserver;
  let revealSettle;
  let heroIntroHandled = false;

  const clearRevealTransition = (target) => {
    clearTimeout(activeReveals.get(target));
    activeReveals.delete(target);
    target.classList.remove('reveal-active');
    target.style.removeProperty('--reveal-delay');
  };
  const markGroup = (target, animate) => {
    const group = target.closest('[data-reveal-group]');
    if (!group || group.classList.contains('is-revealed')) return;
    group.classList.add('is-revealed');
    if (!animate || !group.matches('.easy-flow-list, .agent-compatibility-strip, .workflow-teaser')) return;
    group.classList.add('connect-active');
    connectingGroups.set(group, setTimeout(() => {
      group.classList.remove('connect-active');
      connectingGroups.delete(group);
    }, 1050));
  };
  const finishReveal = (target) => {
    clearRevealTransition(target);
    revealObserver?.unobserve(target);
    pendingReveals.delete(target);
    queuedReveals.delete(target);
    target.classList.remove('reveal-pending');
    target.classList.add('is-revealed');
    markGroup(target, false);
  };
  const revealAll = () => {
    revealObserver?.disconnect();
    queuedReveals.clear();
    revealTargets.forEach(finishReveal);
    connectingGroups.forEach((timer, group) => {
      clearTimeout(timer);
      group.classList.remove('connect-active');
    });
    connectingGroups.clear();
    root.classList.remove('reveals-ready');
  };
  const beginReveal = (target, delay) => {
    if (!pendingReveals.has(target)) return;
    pendingReveals.delete(target);
    revealObserver?.unobserve(target);
    target.style.setProperty('--reveal-delay', delay + 'ms');
    target.classList.add('reveal-active');
    target.classList.remove('reveal-pending');
    target.classList.add('is-revealed');
    markGroup(target, true);
    activeReveals.set(target, setTimeout(() => clearRevealTransition(target),
      (mobile.matches ? 500 : 600) + delay + 80));
  };
  const flushReveals = () => {
    if (reduced) return revealAll();
    try {
      const batches = new Map();
      queuedReveals.forEach((target) => {
        if (!pendingReveals.has(target)) return;
        const rect = target.getBoundingClientRect();
        if (rect.bottom <= 0) return finishReveal(target);
        const group = target.closest('[data-reveal-group]') || target;
        // Grid articles share their row, while stacked mobile articles start afresh.
        const row = target.closest('.episode');
        const rowTop = row ? row.offsetTop : 0;
        if (!batches.has(group)) batches.set(group, new Map());
        const rows = batches.get(group);
        if (!rows.has(rowTop)) rows.set(rowTop, []);
        rows.get(rowTop).push({ target, rect });
      });
      queuedReveals.clear();
      batches.forEach((rows) => rows.forEach((items) => {
        items.sort((a, b) => Math.abs(a.rect.top - b.rect.top) > 12
          ? a.rect.top - b.rect.top : a.rect.left - b.rect.left);
        items.forEach(({ target }, index) => beginReveal(target,
          Math.min(index, 3) * (mobile.matches ? 40 : 60)));
      }));
    } catch {
      // Enhancement failures must never leave readable content transparent.
      revealAll();
    }
  };
  const reconcileReveals = () => {
    if (reduced || document.hidden) return;
    pendingReveals.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (!rect.height || rect.bottom <= 0) finishReveal(target);
      else if (rect.top < innerHeight * .9) queuedReveals.add(target);
    });
    if (queuedReveals.size) schedule(flushReveals);
  };
  const setupReveals = () => {
    revealObserver?.disconnect();
    queuedReveals.clear();
    if (reduced || !('IntersectionObserver' in window)) return revealAll();
    try {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting && pendingReveals.has(target)) queuedReveals.add(target);
        });
        if (queuedReveals.size) schedule(flushReveals);
      }, { threshold: 0, rootMargin: '0px 0px -' + Math.round(innerHeight * .1) + 'px 0px' });
      revealTargets.forEach((target) => {
        if (target.classList.contains('is-revealed')) return;
        const rect = target.getBoundingClientRect();
        // First viewport, deep links and restored positions stay immediately readable.
        if (!rect.height || rect.top < innerHeight) return finishReveal(target);
        pendingReveals.add(target);
        target.classList.add('reveal-pending');
        revealObserver.observe(target);
      });
      root.classList.add('reveals-ready');
    } catch {
      revealAll();
    }
  };
  const revealDestination = (destination) => {
    if (!(destination instanceof Element)) return;
    const ancestor = destination.closest('[data-reveal]');
    if (ancestor) finishReveal(ancestor);
    const top = destination.getBoundingClientRect().top;
    destination.querySelectorAll('[data-reveal]').forEach((target) => {
      if (target.getBoundingClientRect().top - top < innerHeight * .85) finishReveal(target);
    });
  };
  const revealHash = () => {
    if (!location.hash) return;
    try { revealDestination(document.getElementById(decodeURIComponent(location.hash.slice(1)))); } catch { /* malformed hash */ }
  };
  document.addEventListener('focusin', (event) => revealDestination(event.target));
  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest?.('[data-reveal]');
    if (target) finishReveal(target);
  }, { passive: true });
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash)
        revealDestination(document.getElementById(decodeURIComponent(url.hash.slice(1))));
    } catch { /* leave normal link behavior intact */ }
  });
  document.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'opacity' && activeReveals.has(event.target)) clearRevealTransition(event.target);
  });
  window.addEventListener('hashchange', () => { revealHash(); schedule(reconcileReveals); });
  window.addEventListener('pageshow', () => { revealHash(); schedule(reconcileReveals); });
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
    if (!heroIntroHandled) {
      heroIntroHandled = true;
      if (hero && !reduced) {
        hero.classList.add('hero-intro');
        setTimeout(() => hero.classList.remove('hero-intro'), 1100);
      }
    }
    schedule(updatePage);
  };
  motionToggle.addEventListener('click', () => {
    manualReduced = !manualReduced;
    try { localStorage.setItem(motionKey, String(manualReduced)); } catch { /* current page still works */ }
    applyMotion();
  });
  systemMotion.addEventListener('change', applyMotion);
  window.addEventListener('storage', (event) => { if (event.key === motionKey) { manualReduced = event.newValue === 'true'; applyMotion(); } });
  window.addEventListener('scroll', () => {
    schedule(updatePage);
    clearTimeout(revealSettle);
    if (pendingReveals.size) revealSettle = setTimeout(() => schedule(reconcileReveals), 120);
  }, { passive: true });
  window.addEventListener('resize', () => { schedule(updatePage); schedule(setupReveals); carouselUpdates.forEach(schedule); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('motion-paused', document.hidden);
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0;
      clearTimeout(revealSettle);
      [...activeReveals.keys()].forEach(finishReveal);
    } else {
      schedule(updatePage);
      schedule(reconcileReveals);
    }
  });
  applyMotion();
})();
