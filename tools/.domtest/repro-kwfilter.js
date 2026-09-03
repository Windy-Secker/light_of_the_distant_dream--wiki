/* 验证 kwfilter.js：符文库 / 基因页 / 创建指南选择器的关键字过滤 */
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

function makeDom(rel, scripts) {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, rel), "utf8"), {
    url: "http://127.0.0.1/" + rel, runScripts: "outside-only", pretendToBeVisual: true
  });
  const { window } = dom;
  window.NARRATOR = { isOn: function () { return false; }, onChanged: function () {} };
  window.UNLOCKS = { isOpen: function () { return false; } };
  scripts.forEach((s) => {
    try { window.eval(fs.readFileSync(path.join(ROOT, "js", s), "utf8")); }
    catch (e) { console.log("SCRIPT ERROR " + s + ": " + e.message); }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return dom;
}

function type(doc, win, input, value) {
  input.value = value;
  input.dispatchEvent(new win.Event("input", { bubbles: true }));
}
const visibleRows = (sel, win) => Array.from(win.document.querySelectorAll(sel)).filter((r) => r.tagName === "TR" && r.style.display !== "none");
const visiblePicks = (sel, win) => Array.from(win.document.querySelectorAll(sel)).filter((p) => p.style.display !== "none");
const ROW_SEL = { runes: "#rune-library tbody tr", genes: "#g-nonneg tbody tr, #g-neg tbody tr" };

console.log("== runes.html（符文库总览） ==");
let dom = makeDom("runes.html", ["rune-data.js", "mobile.js", "kwfilter.js"]);
let win = dom.window, doc = win.document;
let input = doc.querySelector("input.kw-filter");
log("检索框存在", !!input);
log("初始 49 行可见", visibleRows(ROW_SEL.runes, win).length === 49, "rows=" + visibleRows(ROW_SEL.runes, win).length);
type(doc, win, input, "光束");
log("输入「光束」后仅 1 行可见", visibleRows(ROW_SEL.runes, win).length === 1);
log("其余系谱表格（.table-scroll）已隐藏", Array.from(doc.querySelectorAll("#rune-library .table-scroll")).filter((t) => t.style.display === "none").length === 7, "hidden=" + Array.from(doc.querySelectorAll("#rune-library .table-scroll")).filter((t) => t.style.display === "none").length);
type(doc, win, input, "不存在的符文xyz");
log("无匹配时空态提示显示", doc.getElementById("rune-kw-empty").style.display !== "none");
type(doc, win, input, "");
log("清空后恢复 49 行", visibleRows(ROW_SEL.runes, win).length === 49);

console.log("== genes.html（基因分页，含动态渲染） ==");
dom = makeDom("genes.html", ["gene-data.js", "genes.js", "mobile.js", "kwfilter.js"]);
win = dom.window; doc = win.document;
input = doc.querySelector("input.kw-filter");
log("检索框存在", !!input);
const totalGene = visibleRows(ROW_SEL.genes, win).length;
console.log("  [debug] 可见=" + totalGene + " 隐藏=" + Array.from(doc.querySelectorAll("#g-nonneg tbody tr, #g-neg tbody tr")).filter((r) => r.style.display === "none").length + " 输入=" + JSON.stringify(input.value));
log("初始全部基因行可见（" + totalGene + "）", totalGene > 80, "rows=" + totalGene);
type(doc, win, input, "自闭");
const rows = visibleRows(ROW_SEL.genes, win);
log("输入「自闭」后仅匹配行可见", rows.length === 2, "rows=" + rows.length + " text=" + (rows[0] ? rows[0].textContent.slice(0, 20) : "-"));
type(doc, win, input, "");
log("清空后恢复", visibleRows(ROW_SEL.genes, win).length === totalGene);

console.log("== guide.html（创建指南选择器） ==");
dom = makeDom("guide.html", ["gene-data.js", "rune-data.js", "guide.js", "mobile.js", "kwfilter.js"]);
win = dom.window; doc = win.document;
log("符文列表已渲染", doc.querySelectorAll("#g-rune-list .rune-pick").length > 40, "picks=" + doc.querySelectorAll("#g-rune-list .rune-pick").length);
log("基因池已渲染（正负共 " + doc.querySelectorAll("#g-gene-pick .gene-pick").length + "）", doc.querySelectorAll("#g-gene-pick .gene-pick").length > 80, "picks=" + doc.querySelectorAll("#g-gene-pick .gene-pick").length);
log("负面基因按 4 类分组（无「其他」）", (() => {
  const btns = Array.from(doc.querySelectorAll("#g-gene-pool-n .gene-quicknav button")).map((b) => b.textContent);
  return btns.join("|") === "属性削弱类|战斗限制类|社交/认知限制类|特殊诅咒类";
})());
const runeInput = doc.querySelector("#g-rune-list ~ .kw-bar .kw-filter, .kw-bar input.kw-filter");
// 符文检索框：第四步的 kw-bar 在 #g-rune-list 之前
const runeKw = Array.from(doc.querySelectorAll("input.kw-filter")).find((i) => i.getAttribute("data-scope") === "#g-rune-list");
const geneKw = Array.from(doc.querySelectorAll("input.kw-filter")).find((i) => i.getAttribute("data-scope") === "#g-gene-pick");
log("两个检索框（符文/基因）就位", !!runeKw && !!geneKw);
type(doc, win, runeKw, "梦境推演");
log("符文检索：仅梦境推演可见", visiblePicks("#g-rune-list .rune-pick", win).length === 1, "picks=" + visiblePicks("#g-rune-list .rune-pick", win).length);
type(doc, win, runeKw, "");
log("符文检索清空恢复", visiblePicks("#g-rune-list .rune-pick", win).length > 40);
type(doc, win, geneKw, "蛮力");
log("基因检索：仅含蛮力的条目可见", (() => {
  const v = visiblePicks("#g-gene-pick .gene-pick", win);
  return v.length > 0 && v.every((p) => p.textContent.indexOf("蛮力") !== -1);
})());
// 随机选择后列表重建，验证 refresh 仍生效
type(doc, win, geneKw, "");
doc.querySelector("#g-gene-enable").checked = true;
doc.querySelector("#g-gene-enable").dispatchEvent(new win.Event("change", { bubbles: true }));
doc.getElementById("g-gene-roll").click();
log("随机重建后检索框仍可过滤", (() => {
  type(doc, win, geneKw, "赌徒");
  const v = visiblePicks("#g-gene-pick .gene-pick", win);
  const ok = v.length > 0 && v.every((p) => p.textContent.indexOf("赌徒") !== -1);
  type(doc, win, geneKw, "");
  return ok;
})());

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
