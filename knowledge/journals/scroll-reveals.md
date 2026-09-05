# 2026-09-05 / Cinematic scroll reveals

The author approved once-per-visit, restrained cinematic reveals for every major
block on the homepage and Workflow page. Implementation lives in the isolated
`codex/scroll-reveals` worktree, based on `0492cdb`. The case-study workspace and
its tagged evidence remain intact.

Replaced the old global selector and modulo staggering with explicit HTML hooks
and local groups. Small reading units reveal independently; media fades without
translation or scaling. Existing book-cover perspective and separator parallax
remain on inner elements, avoiding transform conflicts. The hero retains its
opening, which is now guarded against replay when motion preferences change.

Reveals complete once. Focus and hash navigation settle the needed content
immediately; rapid scrolling, orientation changes and history restoration have
visibility reconciliation. Reduced motion, missing observers or initialization
failure leave content visible. Active transition hints and observer subscriptions
are cleaned up after use. No additional library or asset generation was needed.

Verification: the 24-case Chromium/WebKit viewport matrix passed, followed by
the existing interaction and resilience suite. HTML comparison confirmed source
copy, links and metadata were preserved. The existing suite's local 100-frame
sample reported layout-shift accumulation 0, p95 12ms and zero frames over 50ms;
there were no page-script errors or failed local asset responses. Physical iOS
testing is not claimed; WebKit emulation and an iPhone profile are used.

Desktop/mobile recordings and reproduction instructions are in
`docs/scroll-reveals/`. Following preview delivery, the author explicitly approved
committing the changes, merging to main, and pushing main.
