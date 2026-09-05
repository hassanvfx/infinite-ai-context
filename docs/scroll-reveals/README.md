# Cinematic scroll reveals

Local review branch: `codex/scroll-reveals`, based on `main` at `0492cdb`.

Both pages now use explicit reveal annotations. Text rises, compact cards and
images gain shallow depth, and interactive media fades with fixed geometry.
Entrances happen once per page visit. The existing hero introduction and parallax
continue independently, without a second scroll entrance on the hero.

## Preview

- [Desktop motion preview](desktop.mp4)
- [Mobile WebKit motion preview](mobile-webkit.mp4)

The mobile recording uses Playwright's iPhone 13 profile in WebKit. It is browser
emulation, not a recording from a physical iPhone. Recordings demonstrate real
CSS entrances while an automation script scrolls the page; they are not frame-rate
benchmarks. The live preview uses the site's existing external video embeds.

## Design and implementation

`data-reveal="rise|depth|fade"` selects an entrance; `data-reveal-group` sets the
local reading sequence. Episode grids calculate ordering within each row. Mobile
stacks start their own sequence. No reveal unit contains another reveal unit.

Text displacement is 16px desktop / 10px mobile. Depth uses 24px and scale 0.98
desktop / 12px and scale 0.99 mobile. Media uses opacity only. Desktop duration
is 600ms with 60ms local staggering, capped at 180ms; mobile duration is 500ms
with 40ms staggering, capped at 120ms. The existing easing curve is retained.

Intersection Observer triggers near 90% of viewport height. Completed units are
unobserved; compositor hints are removed after the entrance. First-viewport,
focused and directly targeted content stays readable. A settled-scroll pass
resolves content skipped by rapid scrolling. Resize, restored navigation and
motion-preference changes reconcile pending state without replaying completed work.

System or manual reduced motion settles all pending units immediately. Content
also stays visible without JavaScript or Intersection Observer. The shared
controller handles the observer and scheduled updates; no new runtime dependency
or continuous reveal loop was added.

## Verification

- Chromium and WebKit, both routes, at 360x800, 390x844, 768x960, 1440x960,
  1920x1080 and 844x390: all 24 combinations passed.
- Checked coverage, one-time entrances, local staggering, settled opacity,
  compositor cleanup, media geometry, orientation, enlarged text, focus, anchors,
  preference changes, menu behavior, deck controls, lightbox and fallbacks.
- Existing regression suite passed: actual clipboard content, Chromium emulated
  touch swipe, reduced-motion persistence, failed/delayed artwork, anchor offsets,
  no-JavaScript navigation and deck content, and idle animation scheduling.
- Local Chromium 100-frame sample: layout-shift accumulation 0, p95 interval
  12ms, zero intervals above 50ms. These are local observations, not field metrics.
- Zero page-script errors or failed local asset responses in the regression run.
- HTML comparison confirmed existing content and destinations are unchanged;
  page changes consist of reveal annotations. Syntax and diff checks passed.

Run against a local preview with an installed Playwright runtime:

```sh
PREVIEW_URL=http://127.0.0.1:4176/ node tests/scroll-reveals.cjs
PREVIEW_URL=http://127.0.0.1:4176/ node tests/living-knowledge.cjs
PREVIEW_URL=http://127.0.0.1:4176/ node tests/reveal-previews.cjs
```

Set `NODE_PATH` if Playwright is supplied outside the project. Set
`PREVIEW_ARTIFACT_DIR` to choose the output folder. Third-party Vimeo frames are
held constant in the reveal matrix so it tests geometry rather than player
delivery; they are not replaced in website source. The preview script additionally
checks fast scrolling and history restoration, plus touch menu interaction in the
iPhone WebKit profile.

After preview delivery, the author approved committing the changes, merging to
main, and pushing main. Physical iOS validation remains a separate check.
