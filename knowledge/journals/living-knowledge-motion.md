# Living Knowledge — local visual review

## 2026-09-05 — Approved design implementation

Author requested implementation of the Living Knowledge plan on the new branch
`codex/living-knowledge-motion`. Main and the public deployment remain unchanged.
No manuscript, book cover, private source, testimonial, or author portrait was altered.

### Design decisions

- The homepage hero uses separate text-free rock and transparent network artwork,
  readable HTML typography, and three native project-knowledge panels. These panels
  illustrate Ground / Verify / Carry forward; they are not live installation status.
- Motion follows Connect / Resolve / Carry forward. Pointer depth is capped at
  three degrees; mobile uses shallow scroll motion without pointer or sensor input.
- Both pages share the dependency-free `site.js` controller and `living.css` visual
  layer. Video players and deck slides remain flat. Original hover/reveal handlers
  were removed, and obsolete hidden deck/episode markup was removed from the homepage.
- Workflow retains all 48 static JPG slides, starting at page 1. Static markup also
  makes the deck readable with JavaScript disabled. Controls use track-local offsets.
- Motion preference respects the OS, persists across pages, and disables smooth
  scripted scrolling as well as CSS motion. A static semantic composition remains
  readable when decorative artwork fails.
- Existing metadata, URLs, social image, original artwork, book actions, and seven
  supplied testimonial source links are preserved.

### New artwork and provenance

Generated with the built-in ImageGen tool, one call per asset. No third-party logos
or typography were generated. The original hero was inspected for visual direction.
The new outputs were inspected before conversion; the graph has real alpha (81.1%
fully transparent pixels in the original), retained in the WebP versions.

Final assets (relative to the public companion root):

| File | Dimensions | Bytes |
| --- | --- | ---: |
| `assets/living-rock-v1.webp` | 1536 × 1024 | 121070 |
| `assets/living-network-v1.webp` | 1536 × 1024, alpha | 222882 |
| `assets/living-rock-v1-mobile.webp` | 768 × 512 | 27644 |
| `assets/living-network-v1-mobile.webp` | 768 × 512, alpha | 70214 |

Selected homepage hero payload: 343952 bytes desktop; 97858 bytes mobile. The
original generated PNGs remain outside the public checkout; the approved prior
hero, portrait, book cover, and other supplied images are unchanged.

#### Backdrop prompt

Use case: stylized-concept
Asset type: text-free cinematic website hero backdrop, wide landscape 1536x1024.
Primary request: premium photorealistic obsidian-black rock environment with restrained electric cyan-blue filaments tracing a few fractures near the outer edges. Dramatic geological detail, rough layered slate and black obsidian, blue grazing light.
Composition: huge uninterrupted nearly black negative space across the entire LEFT and CENTER, approximately the left 70 percent of the canvas and the central upper 75 percent, reserved for HTML heading and controls. Detailed rock formations concentrated primarily on the far RIGHT edge and LOWER RIGHT corner, with subtle low rocks at the bottom edge. Asymmetrical spacious cinematic composition with depth. Center must be quiet and very dark, no bright central feature. Tiny blue filaments frame the perimeter with subtle glow, they do not cross the heading area.
Mood/palette: luxurious, mysterious, precise, near-black charcoal with electric cyan and deep blue highlights. High fidelity textured rock, controlled lighting, deep blacks.
Constraints: image only, no typography, no letters, no words, no logos, no Google mark, no icons, no interface panels, no UI, no borders, no watermark, no graph overlay. Avoid clutter and large glowing objects. Render exactly one landscape raster image.

#### Transparent network prompt

Use case: stylized-concept
Asset type: genuinely transparent PNG foreground layer for a premium cinematic website hero, wide landscape 1536x1024, true alpha channel.
Primary request: a delicate luminous electric-blue connected knowledge graph floating in space, isolated on a fully TRANSPARENT background. Thin elegantly curved cyan and royal blue light strands connect small glowing nodes into an organic crescent concentrated along the RIGHT EDGE and LOWER EDGE. Transparent empty center and left 70 percent for a title. The graph is an atmospheric design element, with gentle depth, crisp small luminous nodes, sparse subtle halos, refined precise filaments.
Composition: wide landscape; crescent arcs from upper right down along far right and across lower edge, tapering to a few very fine strands at lower left. Entire middle and left upper areas completely empty and fully transparent. Low density airy network, roughly 25 small nodes, a few slightly larger points of light. No dominant central orb.
Palette: electric cyan, azure, deep blue, for compositing over obsidian-black rocks. Preserve translucent blue glow on strands and nodes in alpha.
Background requirement: output actual alpha transparency, no background scene, no black rectangle, no white fill, no checkerboard texture painted into the image. Only the connected glowing graph is visible; all surrounding and interior blank space is transparent.
Constraints: no text, no letters, no words, no labels, no logos, no icons, no panels, no borders, no watermark, no rocks, no backdrop. Exactly one raster image.

### Verification workflow

Run `node --check site.js` and `git diff --check`. Serve this directory locally,
then run `node tests/living-knowledge.cjs` using an existing Playwright installation
on `NODE_PATH`. Set `PREVIEW_URL` for a different local server and
`PREVIEW_ARTIFACT_DIR` for screenshot output. No package or browser dependency is
shipped to visitors.

The browser suite covers both pages at 360, 390, 768, 1440, and 1920px; navigation
and anchor offsets; clipboard confirmation; lightbox and seven footer links;
carousel navigation, boundaries and touch swiping; reduced motion and persistence;
no-JavaScript and failed/delayed artwork fallbacks; enlarged headline wrapping;
and a local desktop frame/CLS sample. Final suite: PASS on 2026-09-05, including
emulated touch swipe and 200% headline wrapping. Both pages passed all five widths;
zero page-script errors and zero failed local asset responses. The local desktop
final pre-commit sample reported CLS 0, p95 frame interval 12.5ms, and zero frames above 50ms in
100 sampled frames. These are local lab observations, not field performance claims.
`node --check site.js` and `git diff --check` passed. Desktop/mobile screenshots are review
artifacts, not deployment assets. Emulation is not a substitute for testing on
physical iOS/Android hardware.

## 2026-09-05 — Author approval and PR-based release

The author reviewed the local preview and approved it: “love it”. The author
then explicitly requested committing, opening a well-documented PR as part of
a GPT-6 capability test, and merging that PR to main instead of a direct local
merge. This supersedes the implementation-only handoff boundary above.

The capability-test framing is a user-directed, qualitative task demonstration,
not an independently controlled benchmark or a claim about comparative model
performance. Scope, screenshots, measured observations, test limitations, and
reproduction instructions are documented in `docs/living-knowledge/README.md`.
No private author sources or manuscript files are included in the public change.
