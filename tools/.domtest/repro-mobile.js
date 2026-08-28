/* 验证 mobile.js：wiki 表格被包进 .table-scroll 容器 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
let pass = 0, fail = 0;
function log(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name + (extra ? "  [" + extra + "]" : "")); }
  else { fail++; console.log("  ✗ FAIL " + name + (extra ? "  [" + extra + "]" : "")); }
}

function loadWithMobile(rel, extraScripts) {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, rel), "utf8"), {
    url: "http://127.0.0.1/" + rel,
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  (extraScripts || []).forEach((s) => window.eval(fs.readFileSync(path.join(ROOT, s), "utf8")));
  window.eval(fs.readFileSync(path.join(ROOT, "js", "mobile.js"), "utf8"));
  document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return document;
}

console.log("== 表格包裹 ==");
["index.html", "combat.html", "explore.html", "worldview/种族.html"].forEach((rel) => {
  const doc = loadWithMobile(rel);
  const tables = doc.querySelectorAll("table.wiki-table").length;
  const wrapped = doc.querySelectorAll(".table-scroll table.wiki-table").length;
  log(rel + "：全部表格已包裹（" + wrapped + "/" + tables + "）", tables > 0 && wrapped === tables);
});
// genes.html 的表格由 genes.js 动态渲染，需连同加载验证包裹
const genesDoc = loadWithMobile("genes.html", ["js/gene-data.js", "js/genes.js"]);
log("genes.html：动态表格已包裹（" + genesDoc.querySelectorAll(".table-scroll table.wiki-table").length + "）",
  genesDoc.querySelectorAll("table.wiki-table").length > 0 &&
  genesDoc.querySelectorAll(".table-scroll table.wiki-table").length === genesDoc.querySelectorAll("table.wiki-table").length);

const doc = loadWithMobile("combat.html");
log("包裹容器属性（overflow-x:auto 可滚动）", (() => {
  // 检查 CSS 是否声明了 .table-scroll 的滚动行为
  const css = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");
  return css.indexOf(".table-scroll {") !== -1 && css.indexOf("overflow-x: auto") !== -1;
})());
log("窄屏表格尺寸规则存在", fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8").indexOf("max-width: 720px") !== -1);

console.log("== 页面脚本引用 ==");
const allHtml = [];
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (d.name.endsWith(".html")) allHtml.push(p);
  });
})(ROOT);
const noMobile = allHtml.filter((f) => !fs.readFileSync(f, "utf8").includes("js/mobile.js"));
log("79 个页面均引用 mobile.js", allHtml.length === 79 && noMobile.length === 0, "missing=" + noMobile.length);

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
