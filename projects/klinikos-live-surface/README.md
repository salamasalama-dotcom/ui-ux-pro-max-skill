# Klinik.OS · live surface

An original scroll-driven site for Klinik.OS, the clinic operating system.
Self-contained static build: no framework, no build step, no runtime network
calls. Open `index.html` directly, or serve the folder.

The page is one console. Scroll position is a clinic clock, and every panel
computes its own state from that single value plus the demonstration data in
`app.js`. Nothing on the page is a hardcoded figure: the counters, the daily
summary and the sidebar totals are all derived from the same arrays that draw
the appointment book, so they cannot disagree with each other.

## Run

```bash
node tooling/serve.mjs --root . --port 4512     # or just open index.html
```

## Verify

Requires `npm i` (playwright-core) and a Chromium/Chrome binary. The harness
samples within each act, not uniformly down the document, and reports dead
scroll, cues that never reach full opacity, WCAG contrast measured on the
composited page, console errors and failed requests.

```bash
node tooling/shoot.mjs --url http://localhost:4512 --out lab/desktop
node tooling/shoot.mjs --url http://localhost:4512 --out lab/mobile  --width 390 --height 844
node tooling/shoot.mjs --url http://localhost:4512 --out lab/reduced --reduced-motion
node tooling/interact.mjs        # tabs, role matrix, first-run form, rail drag, tab order
node tooling/filecheck.mjs "$PWD"  # confirms the page still works from file://
```

Set `SCROLLCRAFT_CHROME` if your browser is not at the default path.

## Layout

```
index.html        markup and the act structure
app.css           brand tokens, panels, chrome, responsive rules
app.js            demonstration data, the clinic clock, every panel renderer
scrollcraft.js    the scroll runtime, copied verbatim and never edited
scrollcraft.css   the taste floor and the device styles, verbatim
assets/fonts/     self-hosted Archivo and IBM Plex Mono, latin + latin-ext
BRIEF.md          the brief, the feeling curve, the peak
```

Everything bespoke lives in `app.js` and reads scroll through one rAF loop.
The engine is untouched, so it can be updated in place.

## The demonstration data

The clinic, the patients and the day are invented and labelled as such in the
status bar and in the panel footer. No business outcome is claimed anywhere on
the page, and the KVKK note says plainly that the page is not a compliance
statement.
