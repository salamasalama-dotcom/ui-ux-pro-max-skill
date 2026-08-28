import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:4512", { waitUntil: "load" });
await p.waitForSelector("html.sc-ready");
await p.evaluate(() => document.fonts.ready);

const at = async (id, frac) => {
  const y = await p.evaluate(([i, f]) => {
    const el = document.getElementById(i), r = el.getBoundingClientRect();
    return Math.round(r.top + scrollY + r.height * f);
  }, [id, frac]);
  await p.evaluate(yy => scrollTo({ top: yy, behavior: "instant" }), y);
  await p.evaluate(() => new Promise(r => setTimeout(r, 250)));
};

// 1. permission trace tabs
await at("act-yetki", 0.5);
await p.click("#tab-deny");
await p.evaluate(() => new Promise(r => setTimeout(r, 120)));
console.log("DENY trace:", await p.evaluate(() => ({
  selected: document.querySelector('[aria-selected="true"]').textContent,
  halted: !!document.querySelector('.k-trace li[data-halt="true"]'),
  step3: document.querySelectorAll(".k-trace li")[2].textContent.replace(/\s+/g," ").slice(0,80),
})));

// 2. role matrix
await at("act-guvenlik", 0.5);
const before = await p.evaluate(() => document.querySelectorAll('.k-perm div[data-on="true"]').length);
await p.click('.k-rolelist button[data-role="sahip"]');
await p.evaluate(() => new Promise(r => setTimeout(r, 120)));
const after = await p.evaluate(() => ({
  on: document.querySelectorAll('.k-perm div[data-on="true"]').length,
  note: document.getElementById("role-note").textContent,
}));
console.log("ROLE asistan on:", before, "-> sahip:", JSON.stringify(after));

// 3. the first-run form actually computes
await at("act-kurulum", 0.5);
await p.fill("#f-name", "Vira Diş Kliniği");
await p.fill("#f-doctors", "6");
await p.uncheck('input[value="SMS"]');
await p.evaluate(() => new Promise(r => setTimeout(r, 120)));
console.log("FORM:", (await p.textContent(".k-out")).replace(/\s+/g, " ").trim());

// 4. the day rail drags the page (signature move)
const railTest = await p.evaluate(async () => {
  const t = document.querySelector(".k-rail__track"), r = t.getBoundingClientRect();
  const y0 = scrollY;
  const ev = (type, cy) => t.dispatchEvent(new PointerEvent(type, { clientX: r.left + 20, clientY: cy, bubbles: true, pointerId: 1 }));
  ev("pointerdown", r.top + r.height * 0.15);
  await new Promise(r2 => setTimeout(r2, 60));
  const mid = scrollY;
  ev("pointermove", r.top + r.height * 0.85);
  await new Promise(r2 => setTimeout(r2, 60));
  const end = scrollY;
  ev("pointerup", r.top + r.height * 0.85);
  return { from: y0, afterDown: mid, afterDrag: end, clock: document.querySelector(".k-rail__hand b").textContent };
});
console.log("RAIL DRAG:", JSON.stringify(railTest));

// 5. keyboard: focus order and visible rings
await p.evaluate(() => { scrollTo({ top: 0, behavior: "instant" }); document.activeElement.blur(); });
await p.evaluate(() => new Promise(r => setTimeout(r, 200)));
const tabs = [];
for (let i = 0; i < 22; i++) {
  await p.keyboard.press("Tab");
  await p.evaluate(() => new Promise(r => setTimeout(r, 200)));
  tabs.push(await p.evaluate(() => {
    const a = document.activeElement;
    const cs = getComputedStyle(a);
    const r = a.getBoundingClientRect();
    return {
      el: a.tagName.toLowerCase() + (a.id ? "#" + a.id : a.className ? "." + String(a.className).split(" ")[0] : ""),
      label: (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 34),
      onScreen: r.top >= -2 && r.bottom <= innerHeight + 2 && r.width > 0,
      opacity: cs.opacity,
    };
  }));
}
console.log("\nTAB ORDER:");
tabs.forEach((t, i) => console.log(` ${String(i + 1).padStart(2)} ${t.onScreen ? "on " : "OFF"} op=${t.opacity} ${t.el}  "${t.label}"`));
console.log("\npage errors:", errs.length ? errs : "none");
await b.close();
