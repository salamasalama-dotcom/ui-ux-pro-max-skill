# HANDOFF · Klinik.OS live-surface site

Written for picking this up in a desktop terminal. Everything described here
is committed and pushed. Nothing is half-finished.

---

## 1. Where it is

| | |
|---|---|
| Repo | `https://github.com/salamasalama-dotcom/ui-ux-pro-max-skill` |
| Branch | `claude/premium-website-design-klinikos-aawom9` |
| Commit | `9263fe3` Add Klinik.OS live-surface site |
| Project | `projects/klinikos-live-surface/` |
| Registry | `scrollcraft/FINGERPRINTS.md` (build shape, so the next build differs) |

No pull request has been opened. Say so explicitly if you want one.

```bash
git clone https://github.com/salamasalama-dotcom/ui-ux-pro-max-skill
cd ui-ux-pro-max-skill
git checkout claude/premium-website-design-klinikos-aawom9
cd projects/klinikos-live-surface
open index.html          # macOS. Windows: start index.html   Linux: xdg-open index.html
```

It genuinely opens from `file://`. No server, no build step, no framework, no
runtime network calls, fonts self-hosted. Verified, not assumed.

---

## 2. What was built

An original scroll-driven site for Klinik.OS, inspired by the pacing and
cultural quality of `klinikos.framer.website` but deliberately not its shape.

The reference is a **filmic one-shot**: full-bleed hero, pinned type acts, one
continuous emotional arc. That is the default grammar and copying it produces
a re-skin. Klinik.OS sells "the operating system that removes administrative
workload," so this uses the **live surface** grammar instead: the page behaves
like the product rather than describing it.

**The page is one clinic console, and the scrollbar is a clinic day.** You land
at 08:12 inside a Thursday at a Kadıköy dental clinic, already mid-conversation.
Scrolling advances clinic time. Seven acts:

| # | id | Device | What it is |
|---|---|---|---|
| 1 | `act-gelen` | pin 2.4 | Inbox. The thread fills as the patient writes; the right panel shows which clinic record each answer came from. |
| 2 | `act-yetki` | flow | Permission layer. Two real traces of the same pipeline: one allowed, one refused at the permission check. Tabbed, operable. |
| 3 | `act-randevu` | pin 2.2 | Appointment book. The 14:00 row you watched get created appears mid-act with `asistan · APT-4471` attached. |
| 4 | `act-otomasyon` | flow | Six automation flows, each reporting its own last run. Ends on the authored silence before the peak. |
| 5 | `act-panel` | pin 3.4 | **The peak.** The whole day resolves: counters land, alerts stack, the daily summary assembles. Largest span by a clear margin. |
| 6 | `act-guvenlik` | flow | Roles and security as a settings surface. Pick a role, see what it can reach. |
| 7 | `act-kurulum` | pin 1.4 | Close is a working first-run form computing a live setup preview, footer inside the same stage so there is no dead tail. |

Total ~12.6vh. Four device families (pin, flow+in, reveal, count), never the
same one twice in a row, plus the bespoke clock.

**Signature move:** the day rail on the right edge. It is the clock, it drags
both ways so dragging it scrolls the page, and every event the day passes is
stamped onto it permanently. By the footer it is the day's complete log and
doubles as navigation. Below 900px it becomes a bottom bar with the same
behaviour.

**From your brand visuals:** navy to electric blue, the `+` motif as sparse
ground texture, the Turkish operator voice, the chat and appointment surfaces.
**Dropped:** the big centred marketing headline, which this grammar forbids.

---

## 3. Honesty rules already enforced (do not casually break these)

- Every figure on the page (counters, daily summary, sidebar totals, the
  8,3 s mean response time) is **computed at runtime** from the same arrays
  that draw the appointment book. Nothing can contradict anything else.
- The clinic, patients and day are demonstration data, labelled as such in
  the status bar and the panel footer.
- **No business-outcome claim anywhere.** The "%61 fewer no-shows" from the
  social frames was deliberately left out; there is no data behind it.
- The KVKK line says plainly that the page is not a compliance statement.

If you add a number to the page, derive it from the data or do not add it.

---

## 4. File map

```
index.html         markup and the seven-act structure
app.css            brand tokens, panels, chrome, responsive rules
app.js             demonstration data, the clinic clock, every panel renderer
scrollcraft.js     scroll runtime, copied VERBATIM, never edit per-project
scrollcraft.css    taste floor and device styles, verbatim
assets/fonts/      self-hosted Archivo + IBM Plex Mono, latin + latin-ext
BRIEF.md           the brief, the feeling curve, the peak
README.md          run and verify instructions
tooling/           the verification harness (see below)
lab/               screenshots, gitignored
```

Everything bespoke lives in `app.js` and reads scroll through **one** rAF loop.
The engine is untouched so it can be swapped or updated in place.

**Where to edit what:**

- Clinic data, the day, messages, appointments, flows, alerts, roles, specs:
  the constants at the top of `app.js`.
- Which act owns which stretch of the working day: `SCHEDULE` in `app.js`.
- Brand colours and type: the `:root` block at the top of `app.css`.
- Act spans and cue windows: `data-sc-span` / `data-sc-cue` in `index.html`.

---

## 5. How to verify after any change

```bash
npm i                                   # playwright-core only
node tooling/serve.mjs --root . --port 4512 &
node tooling/shoot.mjs --url http://localhost:4512 --out lab/desktop
node tooling/shoot.mjs --url http://localhost:4512 --out lab/mobile  --width 390 --height 844
node tooling/shoot.mjs --url http://localhost:4512 --out lab/reduced --reduced-motion
node tooling/interact.mjs               # trace tabs, role matrix, form, rail drag, tab order
node tooling/filecheck.mjs "$PWD"       # confirms it still works from file://
```

Set `SCROLLCRAFT_CHROME` if your browser is not at the default path
(`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` in the cloud session;
on a Mac try `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).

The harness samples **within each act**, not uniformly down the document, so
findings do not move when an unrelated section changes height. It reports dead
scroll, cues that never reach full opacity, WCAG contrast measured on the
composited page, console errors and failed requests.

**Current status: all three passes clean.** Zero findings in every category.

Two harness gotchas that will waste your time if you forget them:
- `shoot.mjs` takes the background `serve.mjs` down with it when it exits.
  Re-check the port before the next run.
- If something else is already on the port, `serve.mjs` fails into a log
  nobody reads and the harness happily photographs whatever else is there.
  Confirm with `curl -s http://localhost:4512 | grep -o "<title>.*</title>"`.

---

## 6. Bugs found and fixed during the build (context, so they are not reintroduced)

1. **`behavior: "auto"` inherits `scroll-behavior: smooth`.** Every
   programmatic jump was animating, so the harness photographed mid-flight and
   the rail drag lagged. Use `behavior: "instant"` for anything that must be
   immediate. Smooth is kept only for the deliberate stamp-click navigation.
2. **`letter-spacing` is inherited as a computed length.** `-0.035em` on a 45px
   figure resolves to `-1.59px` and is inherited by its 12px caption, which ate
   the word spaces. Reset it wherever a large element has small children.
3. **The clinic clock was mapped over each act's whole document box.** A pinned
   act is only stuck for `height - viewport`, so the last third of every act's
   time played out while its stage was already sliding away, and the daily
   summary arrived off-screen. It now maps to the pinned travel.
4. **An empty-string cache key** meant the sources panel never rendered its
   empty state.
5. **Stamps not yet reached were focusable at opacity 0**, so a keyboard user
   landed on eleven invisible buttons. They are `visibility: hidden` until
   logged.

The accent was also lifted from `#3B6FF6` to `#4C7CFF` so it clears WCAG AA
comfortably in **both** directions: as ink on the navy ground (5.7:1) and as a
fill carrying dark ink (5.8:1). The old value passed by a hair either way.

---

## 7. The one thing I would change next

I ran the feel check cold against the intended curve in `BRIEF.md`. Six of the
seven acts matched.

**Act 4 (`act-otomasyon`) intended "confidence" and felt flat.** Six similarly
shaped cards are the most conventional section on the page, and it sits right
before the peak where it is also doing duty as the authored silence. It works,
but it is the weakest act.

Proposed fix, not yet applied: rebuild it as a **single running workflow ledger
driven by the same clinic clock** rather than a static card grid, so the flows
visibly fire as the day passes them, the way the alert stack already does.
That would also give the act a real timeline instead of a list.

Everything else is done and verified.
