/* 手机端：页面顶部文字是否被固定顶栏（菜单/搜索）遮挡 */
"use strict";
const puppeteer = require("puppeteer-core");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://127.0.0.1:8525/";

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(BASE + "index.html", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  const m = await page.evaluate(() => {
    const toggle = document.querySelector(".menu-toggle").getBoundingClientRect();
    const search = document.querySelector(".search-toolbar").getBoundingClientRect();
    const art = document.querySelector("article.page").getBoundingClientRect();
    const h1 = document.querySelector("article.page h1").getBoundingClientRect();
    return {
      barBottom: Math.max(toggle.bottom, search.bottom),
      articleTop: Math.round(art.top),
      h1Top: Math.round(h1.top),
      h1Overlapped: h1.top < Math.max(toggle.bottom, search.bottom)
    };
  });
  console.log(JSON.stringify(m, null, 1));
  console.log("顶栏底缘:", Math.round(m.barBottom), "| h1 顶部:", m.h1Top, "| h1 被顶栏遮挡:", m.h1Overlapped);
  await browser.close();
})();
