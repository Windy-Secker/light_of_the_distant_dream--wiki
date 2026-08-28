/* 验证探索与成长页：专精补充 / 3.2 新表 / 进度清空提醒 / 记录表 / 导航与搜索 */
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

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "explore.html"), "utf8"), {
  url: "http://127.0.0.1/explore.html",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;
Object.defineProperty(window.HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get: function () { return document.body; }
});
window.NAV = { base: "", page: "explore", sub: "" };
window.NARRATOR = { isOn: function () { return false; } };
window.UNLOCKS = { isOpen: function () { return false; } };
["js/rune-data.js", "js/nav.js", "js/narrator.js", "js/unlock.js", "js/toc.js", "js/search.js"].forEach((s) => {
  try { window.eval(fs.readFileSync(path.join(ROOT, s), "utf8")); } catch (e) { console.log("SCRIPT ERROR " + s + ": " + e.message); }
});
document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));

console.log("== 页面结构 ==");
const h2s = Array.from(document.querySelectorAll(".page h2")).map((h) => h.textContent);
log("六个章节齐全", h2s.length === 6 && h2s[0].indexOf("专精技能详解") !== -1 && h2s[5].indexOf("记录表") !== -1, h2s.join(" | "));

console.log("== 专精 12 项（含补充的外语/灵感） ==");
const h4s = Array.from(document.querySelectorAll(".page h4")).map((h) => h.textContent);
const needed = ["调查", "神秘学", "格斗", "潜行", "追踪", "话术", "察言观色", "野外生存", "急救", "机械修理", "外语", "灵感"];
log("12 项专精齐全", needed.every((n) => h4s.indexOf(n) !== -1), "h4=" + h4s.length);
log("外语/灵感含完整三字段", (() => {
  const tables = Array.from(document.querySelectorAll(".page h4 + table"));
  const idx = h4s.map((t) => t);
  const fi = idx.indexOf("外语"), ii = idx.indexOf("灵感");
  const has3 = (i) => {
    const t = tables[i];
    if (!t) return false;
    const txt = t.textContent;
    return txt.indexOf("涉及行为") !== -1 && txt.indexOf("典型检定场景") !== -1 && txt.indexOf("可提升条件") !== -1;
  };
  return fi >= 0 && ii >= 0 && has3(fi) && has3(ii);
})());

console.log("== 3.2 任务类事件新表 ==");
const h3s = Array.from(document.querySelectorAll(".page h3"));
const s32 = h3s.find((h) => h.textContent.indexOf("3.2") !== -1);
const tbl = s32.nextElementSibling;
const headers = Array.from(tbl.querySelectorAll("thead th")).map((th) => th.textContent.trim());
log("横向表头：未完成/一般完成/完美完成", headers.join("|") === "任务等级|未完成|一般完成|完美完成", headers.join("|"));
const rows = Array.from(tbl.querySelectorAll("tbody tr"));
log("纵向表头 Ⅱ~Ⅴ 共 4 行", rows.length === 4 && rows.every((r) => /^[ⅡⅢⅣⅤ]级$/.test(r.children[0].textContent.trim())), rows.map((r) => r.children[0].textContent.trim()).join(","));
const vals = rows.map((r) => Array.from(r.children).slice(1).map((c) => c.textContent.trim()).join(","));
log("数值逐行 +1（+0/+1/+2 … +3/+4/+5）", vals.join(";") === "+0,+1,+2;+1,+2,+3;+2,+3,+4;+3,+4,+5", vals.join(";"));

console.log("== 进度清空提醒 ==");
const pageText = document.querySelector(".page").textContent;
log("4.2 专精进度清空提醒", /连续两次空闲时间.{0,40}专精训练.{0,60}清空/.test(pageText.replace(/\s+/g, "")) || pageText.indexOf("专精训练") !== -1 && pageText.indexOf("连续两次空闲时间") !== -1 && pageText.indexOf("直接清空") !== -1);
log("4.3 观想进度清空提醒", pageText.indexOf("符文观想") !== -1 && pageText.indexOf("连续两次空闲时间") !== -1 && pageText.indexOf("直接清空") !== -1);
log("提醒共出现两次（4.2 + 4.3）", (pageText.match(/进度清空提醒/g) || []).length === 2);

console.log("== 记录表 ==");
const recordTbls = Array.from(document.querySelectorAll('.page h2[id="record"] ~ table'));
log("记录表 3 张（体魄/专精/观想）", recordTbls.length === 3);
log("专精记录表 12 行", recordTbls[1].querySelectorAll("tbody tr").length === 12);
log("体魄记录表用上限 20", recordTbls[0].textContent.indexOf("/ 20") !== -1);

console.log("== 导航与搜索 ==");
const navText = document.querySelector(".sidebar").textContent;
log("侧边栏含「探索与成长」", navText.indexOf("探索与成长") !== -1);
const navA = Array.from(document.querySelectorAll(".nav-group a")).find((a) => a.textContent === "探索与成长");
log("导航项高亮（当前页）", !!navA && navA.className.indexOf("active") !== -1);
const searchSrc = fs.readFileSync(path.join(ROOT, "js", "search.js"), "utf8");
log("搜索索引含探索与成长", searchSrc.indexOf('u: "explore.html"') !== -1);

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
