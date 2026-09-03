/* 移动端顶栏验证：菜单+搜索并入顶栏、正文从顶栏下方开始；桌面还原 */
"use strict";
const puppeteer = require("puppeteer-core");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://127.0.0.1:8526/";

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();

  console.log("== 手机视口 390x844 ==");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(BASE + "index.html", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 400));
  let m = await page.evaluate(() => {
    const bar = document.querySelector(".topbar");
    const toggle = document.querySelector(".menu-toggle");
    const search = document.querySelector(".search-toolbar");
    const art = document.querySelector("article.page");
    const sidebar = document.querySelector(".sidebar");
    const b = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }; };
    const cs = (el, p) => getComputedStyle(el)[p];
    return {
      barExists: !!bar, barDisplay: bar ? cs(bar, "display") : null, barPos: bar ? cs(bar, "position") : null,
      barRect: bar ? b(bar) : null,
      toggleInBar: !!toggle && !!bar && bar.contains(toggle),
      searchInBar: !!search && !!bar && bar.contains(search),
      articleTop: art ? Math.round(art.getBoundingClientRect().top) : null,
      sidebarTop: sidebar ? Math.round(sidebar.getBoundingClientRect().top) : null,
      bodyScrollTop: window.scrollY
    };
  });
  console.log(JSON.stringify(m, null, 1));
  const barBottom = m.barRect ? m.barRect.bottom : null;
  const okPhone = m.barExists && m.barDisplay === "flex" && m.barPos === "fixed" &&
    m.toggleInBar && m.searchInBar && m.articleTop >= (barBottom - 2);
  console.log("手机端顶栏检查:", okPhone ? "通过" : "失败");
  console.log("（顶栏底=" + barBottom + "，正文顶=" + m.articleTop + "，侧边栏顶=" + m.sidebarTop + "）");

  console.log("== 宽屏 1440x900（应还原为桌面布局） ==");
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 400));
  m = await page.evaluate(() => {
    const bar = document.querySelector(".topbar");
    const search = document.querySelector(".search-toolbar");
    const toggle = document.querySelector(".menu-toggle");
    return {
      barExists: !!bar,
      searchFixed: !!search && getComputedStyle(search).position === "fixed",
      toggleHidden: !toggle || getComputedStyle(toggle).display === "none"
    };
  });
  console.log(JSON.stringify(m));
  const okDesktop = !m.barExists && m.searchFixed && m.toggleHidden;
  console.log("桌面端还原检查:", okDesktop ? "通过" : "失败");

  await browser.close();
  console.log(okPhone && okDesktop ? "\n全部通过" : "\n存在失败");
  process.exit(okPhone && okDesktop ? 0 : 1);
})();
