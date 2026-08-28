/* 验证：1) 所有页面正文左边缘一致（含目录占位与居中恢复）
        2) 符文页保留不可见目录占位
        3) 侧边栏滚动条出现时内容宽度不变 */
"use strict";
const puppeteer = require("puppeteer-core");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://127.0.0.1:8524/";
const pages = ["worldview/混沌.html", "runes/意识系.html", "runes/光束.html", "combat.html", "explore.html", "index.html"];

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();

  console.log("== 1) 各视口下正文左边缘一致 ==");
  for (const w of [1280, 1440, 1920, 390]) {
    await page.setViewport({ width: w, height: 900 });
    let first = null, ok = true;
    for (const rel of pages) {
      await page.goto(BASE + rel, { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 250));
      const m = await page.evaluate(() => {
        const art = document.querySelector("article.page");
        return { left: Math.round(art.getBoundingClientRect().left) };
      });
      if (first === null) first = m.left;
      if (m.left !== first) ok = false;
    }
    console.log(`  ${w}px: 左边缘统一 = ${ok}（left=${first}）`);
  }

  console.log("== 2) 符文页保留不可见目录占位 ==");
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + "runes/光束.html", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 250));
  const toc = await page.evaluate(() => {
    const p = document.getElementById("toc-panel");
    const b = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    return { width: Math.round(b.width), display: cs.display, visibility: cs.visibility };
  });
  console.log("  光束.html toc-panel:", JSON.stringify(toc), "（width=218 且 visibility=hidden → 占位保留且不可见）");
  const okToc = toc.width === 218 && toc.display !== "none" && toc.visibility === "hidden";
  console.log("  占位校验:", okToc ? "通过" : "失败");

  console.log("== 3) 侧边栏滚动条出现时内容宽度不变 ==");
  const navWidths = {};
  for (const h of [900, 550, 420]) {
    await page.setViewport({ width: 1440, height: h });
    await page.goto(BASE + "runes/意识系.html", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 250));
    const m = await page.evaluate(() => {
      const sb = document.querySelector(".sidebar");
      const a = document.querySelector(".sidebar .nav-link, .sidebar .nav-parent");
      return {
        scrollH: sb.scrollHeight, clientH: sb.clientHeight,
        linkW: Math.round(a.getBoundingClientRect().width),
        overflow: sb.scrollHeight > sb.clientHeight + 1
      };
    });
    navWidths[h] = m;
    console.log(`  height=${h}: 溢出=${m.overflow} 链接宽=${m.linkW}`);
  }
  const widths = Object.values(navWidths).map((m) => m.linkW);
  const okSidebar = new Set(widths).size === 1;
  console.log("  侧边栏宽度校验:", okSidebar ? "通过（宽度恒定）" : "失败（宽度变化: " + widths.join(",") + "）");

  await browser.close();
  console.log(okToc && okSidebar ? "\n全部通过" : "\n存在失败");
  process.exit(okToc && okSidebar ? 0 : 1);
})();
