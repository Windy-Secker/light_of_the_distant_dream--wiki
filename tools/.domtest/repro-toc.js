/* 用 jsdom 复现 genes.html 的页内目录：讲述者切换后标题 id 是否错位（双高亮根因） */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "genes.html"), "utf8");

const dom = new JSDOM(html, {
  url: "http://127.0.0.1/genes.html",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

// jsdom 的 offsetParent 恒为 null，导致 toc.js 的可见性过滤把所有标题滤掉；
// 用 document.body 近似“可见”，让目录链接真正构建出来
Object.defineProperty(window.HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get: function () { return document.body; }
});

// 简化讲述者状态机（不加载 narrator.js；toc.js 只需要 isOn + narratorchange 事件）
let narratorOn = false;
window.NARRATOR = { isOn: function () { return narratorOn; } };
function setState(on) {
  narratorOn = on;
  document.body.classList.toggle("narrator-mode", on);
  document.dispatchEvent(new window.CustomEvent("narratorchange", { detail: { on: on } }));
}

const scripts = ["js/gene-data.js", "js/rune-data.js", "js/nav.js", "js/unlock.js", "js/genes.js", "js/toc.js"];
for (const s of scripts) {
  const code = fs.readFileSync(path.join(ROOT, s), "utf8");
  try { window.eval(code); } catch (e) { console.log("SCRIPT ERROR " + s + ": " + e.message); }
}
document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));

let pass = 0, fail = 0;
function log(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name + (extra ? "  [" + extra + "]" : "")); }
  else { fail++; console.log("  ✗ FAIL " + name + (extra ? "  [" + extra + "]" : "")); }
}

function tocTargets() {
  const panel = document.getElementById("toc-panel");
  if (!panel) return [];
  return Array.from(panel.querySelectorAll("a")).map((a) => a.getAttribute("data-target"));
}
function headingIds() {
  return Array.from(document.querySelectorAll(".page h2, .page h3")).map((h) => h.id);
}
function check(name) {
  const t = tocTargets();
  const h = headingIds();
  const dupT = t.filter((v, i) => t.indexOf(v) !== i);
  const dupH = h.filter((v, i) => v && h.indexOf(v) !== i);
  log(name + "：目录 data-target 无重复", dupT.length === 0, dupT.length ? "dup=" + dupT.join(",") : "links=" + t.length);
  log(name + "：标题 id 无重复", dupH.length === 0, dupH.length ? "dup=" + dupH.join(",") : "heads=" + h.length);
}

console.log("== 讲述者关闭（初始） ==");
check("初始状态");

console.log("== 讲述者切换重建 ==");
setState(true);  check("开启讲述者");
setState(false); check("关闭讲述者");
setState(true);  check("再次开启");

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
