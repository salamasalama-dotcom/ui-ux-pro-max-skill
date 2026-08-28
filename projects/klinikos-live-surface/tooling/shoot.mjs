#!/usr/bin/env node
/**
 * Verification harness for this build.
 *
 * Samples WITHIN each act (not uniformly down the document) so findings do not
 * move when an unrelated section changes height. Reports:
 *   DEAD SCROLL   consecutive positions where nothing rendered changed. Reads
 *                 data-sc-verify-state (this page's panels live outside the
 *                 engine's devices) alongside a pixel signature of the frame.
 *   CUES          cue elements that never reach full opacity.
 *   CONTRAST      measured on the COMPOSITED page: the text is hidden, the same
 *                 frame is re-shot, and the real background under each line is
 *                 sampled. Direction is picked per line.
 *   CONSOLE / NET console errors and failed requests.
 * Writes one PNG per position plus a tiled contact sheet.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const has = (n) => argv.indexOf(n) > -1;

const URL = arg("--url", "http://localhost:4500");
const OUT = path.resolve(arg("--out", "lab/shots"));
const W = parseInt(arg("--width", "1440"), 10);
const H = parseInt(arg("--height", "900"), 10);
const PER = parseInt(arg("--per-act", "6"), 10);
const REDUCED = has("--reduced-motion");
const EXEC = process.env.SCROLLCRAFT_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

fs.mkdirSync(OUT, { recursive: true });

const lum = (r, g, b) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox", "--font-render-hinting=none"] });
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: REDUCED ? "reduce" : "no-preference",
});
const page = await ctx.newPage();

const consoleErrors = [];
const failed = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
page.on("requestfailed", (r) => failed.push(r.url() + " :: " + (r.failure()?.errorText || "?")));
page.on("response", (r) => { if (r.status() >= 400) failed.push(r.url() + " :: HTTP " + r.status()); });

await page.goto(URL, { waitUntil: "load" });
await page.waitForSelector("html.sc-ready", { timeout: 15000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
await page.evaluate(() => dispatchEvent(new Event("resize")));
await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));

// ---- build the sample list, per act -----------------------------------------
const acts = await page.evaluate(() => {
  const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  return [...document.querySelectorAll("[data-sc-act]")].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      id: el.id || el.dataset.scAct,
      device: el.dataset.scAct,
      top: Math.round(r.top + scrollY),
      height: Math.round(r.height),
      hold: el.dataset.scVerifyHold === "true",
      max,
    };
  });
});

const samples = [];
for (const a of acts) {
  // For a pinned act, include the entry and exit slides, not just pinned travel.
  const from = Math.max(0, a.top - (a.device === "flow" ? 0 : Math.min(H, a.top)));
  const to = Math.min(a.max, a.top + a.height);
  for (let i = 0; i < PER; i++) {
    const y = Math.round(from + ((to - from) * i) / (PER - 1));
    samples.push({ act: a, i, y: Math.min(y, a.max) });
  }
}

const report = { dead: [], cues: [], contrast: [], frames: [] };
let prevSig = null, deadRun = 0, deadStart = null;

const files = [];
for (let n = 0; n < samples.length; n++) {
  const s = samples[n];
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), s.y);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.evaluate(() => new Promise((r) => setTimeout(r, 160)));

  // rendered-state signature: engine progress plus this page's published state
  const sig = await page.evaluate(() => {
    const bits = [];
    document.querySelectorAll("[data-sc-act]").forEach((el) => {
      const p = getComputedStyle(el).getPropertyValue("--sc-p").trim();
      const v = el.getAttribute("data-sc-verify-state") || "";
      if (v) bits.push(el.id + "=" + v);
      bits.push((el.id || "?") + ":p" + (Math.round(parseFloat(p || "0") * 40) / 40));
    });
    document.querySelectorAll("[data-sc-cue],[data-sc-count]").forEach((el, i) => {
      bits.push("c" + i + ":" + Math.round(parseFloat(getComputedStyle(el).opacity) * 20) + ":" + (el.textContent || "").slice(0, 12));
    });
    // A pinned stage sliding off is visible motion even though its progress is
    // clamped at 1 and the page's own clock has parked. Record where each
    // sticky stage actually sits.
    document.querySelectorAll("[data-sc-stage]").forEach((st, i) => {
      bits.push("st" + i + ":" + Math.round(st.getBoundingClientRect().top / 8));
    });
    bits.push("rail:" + (document.querySelector(".k-rail__hand b")?.textContent || ""));
    bits.push("stamps:" + document.querySelectorAll(".k-stamp.is-on").length);
    return bits.join("|");
  });

  const name = String(n).padStart(3, "0") + "-" + s.act.id + "-" + s.i + ".png";
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  files.push(file);
  report.frames.push({ n, y: s.y, act: s.act.id, sig: sig.length });

  const dupY = n > 0 && samples[n - 1].y === s.y;
  if (prevSig !== null && sig === prevSig && !s.act.hold && !dupY) {
    if (deadRun === 0) deadStart = n - 1;
    deadRun++;
  } else {
    if (deadRun >= 1) report.dead.push({ from: deadStart, to: n - 1, act: samples[deadStart].act.id });
    deadRun = 0;
  }
  prevSig = sig;

  // ---- contrast on the composited page, per visible line -------------------
  const lines = await page.evaluate(() => {
    const out = [];
    const nodes = document.querySelectorAll("[data-sc-cue], .k-h, .k-sub, .k-msg p, .k-slot__who, .k-fig dt, .k-fig dd, .k-panel__foot, .k-quiet, .k-payload");
    nodes.forEach((el) => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.85) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 6) return;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const anc = el.closest("[data-sc-cue]");
      if (anc && parseFloat(getComputedStyle(anc).opacity) < 0.85) return;

      // The content box: everything outside it is covered by fixed chrome.
      const px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
      // Below 900px the sidebar becomes a tab strip UNDER the status bar and
      // the day rail becomes a bottom bar, so the content box loses height at
      // both ends rather than width at the sides.
      const box = {
        x0: px("--k-side"), y0: px("--k-status") + px("--k-tabs"),
        x1: innerWidth - px("--k-rail"), y1: innerHeight - px("--k-bottom"),
      };
      let x0 = Math.max(r.left, box.x0), y0 = Math.max(r.top, box.y0);
      let x1 = Math.min(r.right, box.x1), y1 = Math.min(r.bottom, box.y1);
      // Clip to every clipping ancestor. A line scrolled half out of a panel's
      // own scroll region is not visible text, and grading the hidden half
      // against the surface behind the panel reports a legible line as failing.
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ao = getComputedStyle(a);
        if (!/auto|scroll|hidden|clip/.test(ao.overflowY + ao.overflowX)) continue;
        const ar = a.getBoundingClientRect();
        x0 = Math.max(x0, ar.left); y0 = Math.max(y0, ar.top);
        x1 = Math.min(x1, ar.right); y1 = Math.min(y1, ar.bottom);
      }
      // inset past any corner rounding so the fill is sampled, not the corner
      const rad = parseFloat(cs.borderTopLeftRadius) || 0;
      const ix = Math.min(rad + 2, (x1 - x0) / 3), iy = Math.min(rad + 2, (y1 - y0) / 3);
      x0 += ix; x1 -= ix; y0 += iy; y1 -= iy;
      if (x1 - x0 < 8 || y1 - y0 < 5) return;

      out.push({
        text: (el.textContent || "").trim().slice(0, 46),
        color: cs.color,
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        rect: { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) },
      });
    });
    return out;
  });

  if (lines.length) {
    // hide the text (and fixed chrome, which paints over what scrolls under it)
    await page.addStyleTag({
      // Hide the GLYPHS, not the elements. visibility:hidden takes an element's
      // own background with it, so a chip or a filled message bubble would be
      // graded against whatever is behind the bubble instead of against the
      // bubble, which reports a fully legible line as ~1:1.
      content: `[data-sc-cue],[data-sc-cue] *,.k-h,.k-sub,.k-msg p,.k-slot__who,.k-fig dt,.k-fig dd,
                .k-panel__foot,.k-quiet,.k-payload,
                .k-h *,.k-sub *,.k-msg p *,.k-slot__who *,.k-fig dd *,.k-panel__foot *,.k-payload *
                {color:transparent !important;text-decoration-color:transparent !important;
                 text-shadow:none !important}`,
      // eslint-disable-next-line
    }).then((h) => (page.__hide = h));
    const buf = await page.screenshot();
    await page.evaluate(() => {
      const t = [...document.querySelectorAll("style")].pop();
      if (t) t.remove();
    });

    const { PNG } = await import("./png.mjs");
    const img = PNG(buf);
    for (const L of lines) {
      const { x, y, w, h } = L.rect;
      if (w < 8 || h < 5) continue;
      let minL = 1, maxL = 0;
      const stepX = Math.max(1, Math.floor(w / 24)), stepY = Math.max(1, Math.floor(h / 8));
      for (let py = y; py < y + h; py += stepY) {
        for (let px = x; px < x + w; px += stepX) {
          const p = img.at(px, py);
          if (!p) continue;
          const l = lum(p[0], p[1], p[2]);
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;
        }
      }
      const m = L.color.match(/[\d.]+/g);
      if (!m) continue;
      const fg = lum(+m[0], +m[1], +m[2]);
      // dark type fails on the darkest patch, light type on the brightest
      const bg = fg > 0.35 ? minL : maxL;
      const cr = ratio(fg, bg);
      const large = L.size >= 24 || (L.size >= 18.66 && +L.weight >= 700);
      const floor = large ? 3 : 4.5;
      if (cr < floor) report.contrast.push({ n, act: s.act.id, text: L.text, ratio: +cr.toFixed(2), floor, size: L.size });
    }
  }
}
if (deadRun >= 1) report.dead.push({ from: deadStart, to: samples.length - 1, act: samples[deadStart].act.id });

// ---- cues that never peak ---------------------------------------------------
const peaks = {};
for (const s of samples.filter((_, i) => i % 2 === 0)) {
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), s.y);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const got = await page.evaluate(() =>
    [...document.querySelectorAll("[data-sc-cue]")].map((el) => ({
      k: (el.textContent || "").trim().slice(0, 40) || el.className,
      o: parseFloat(getComputedStyle(el).opacity),
    })));
  for (const g of got) peaks[g.k] = Math.max(peaks[g.k] || 0, g.o);
}
for (const k of Object.keys(peaks)) if (peaks[k] < 0.98) report.cues.push({ cue: k, peak: +peaks[k].toFixed(2) });

// ---- contact sheet ----------------------------------------------------------
const cols = 6;
const rows = Math.ceil(files.length / cols);
const tw = 320, th = Math.round((H / W) * tw);
const sheet = await ctx.newPage();
await sheet.setViewportSize({ width: cols * tw, height: rows * th });
await sheet.setContent(
  `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${tw}px)">` +
  files.map((f, i) =>
    `<div style="position:relative;width:${tw}px;height:${th}px;overflow:hidden">
       <img src="file://${f}" style="width:100%;display:block">
       <span style="position:absolute;left:3px;top:2px;font:10px/1.2 monospace;color:#0f0;background:#000c;padding:1px 3px">${i}</span>
     </div>`).join(""));
await sheet.screenshot({ path: path.join(OUT, "sheet.png"), fullPage: true });

await browser.close();

const say = (t, arr, f) => {
  console.log("\n" + t + " (" + arr.length + ")");
  if (!arr.length) { console.log("  none"); return; }
  arr.slice(0, 25).forEach((x) => console.log("  " + f(x)));
  if (arr.length > 25) console.log("  ... +" + (arr.length - 25) + " more");
};
console.log(`\n=== ${REDUCED ? "REDUCED MOTION " : ""}${W}x${H} · ${samples.length} positions across ${acts.length} acts ===`);
say("DEAD SCROLL", report.dead, (d) => `frames ${d.from}-${d.to} in ${d.act}: nothing rendered changed`);
say("CUES THAT NEVER PEAK", report.cues, (c) => `${c.peak} :: ${c.cue}`);
say("CONTRAST BELOW FLOOR", report.contrast, (c) => `${c.ratio}:1 (needs ${c.floor}) ${c.size}px [${c.act}] "${c.text}"`);
say("CONSOLE ERRORS", consoleErrors, (e) => e.slice(0, 160));
say("FAILED REQUESTS", [...new Set(failed)], (e) => e.slice(0, 160));
console.log("\nsheet: " + path.join(OUT, "sheet.png"));
