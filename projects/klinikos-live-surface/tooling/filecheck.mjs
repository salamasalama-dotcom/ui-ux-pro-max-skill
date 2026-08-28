import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [], fails = [];
p.on("pageerror", e => errs.push(e.message));
p.on("requestfailed", r => fails.push(r.url().split("/").pop()));
await p.goto("file://" + process.argv[2] + "/index.html", { waitUntil: "load" });
await p.waitForSelector("html.sc-ready", { timeout: 8000 });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => new Promise(r => setTimeout(r, 500)));
await p.evaluate(() => scrollTo({ top: document.body.scrollHeight * 0.55, behavior: "instant" }));
await p.evaluate(() => new Promise(r => setTimeout(r, 400)));
console.log("file:// render:", await p.evaluate(() => ({
  clock: document.querySelector(".k-status__clock b").textContent,
  stamps: document.querySelectorAll(".k-stamp.is-on").length,
  bookRows: document.querySelectorAll(".k-slot").length,
  planned: document.getElementById("now-planned").textContent,
  fontLoaded: document.fonts.check('12px "IBM Plex Mono"'),
})));
console.log("page errors:", errs.length ? errs : "none");
console.log("failed requests:", fails.length ? fails : "none");
await b.close();
