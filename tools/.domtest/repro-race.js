/* 验证 种族 子分页：导航项 / 目录隔离 / 锚点 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "worldview", "种族.html"), "utf8");

const dom = new JSDOM(html, { url: "http://127.0.0.1/worldview/种族.html", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
const { document } = window;

Object.defineProperty(window.HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get: function () { return document.body; }
});

let narratorOn = false;
window.NAV = { base: "../", page: "worldview", sub: "种族" };
window.NARRATOR = { isOn: function () { return narratorOn; } };
function setState(on) {
  narratorOn = on;
  document.body.classList.toggle("narrator-mode", on);
  document.dispatchEvent(new window.CustomEvent("narratorchange", { detail: { on: on } }));
}

// 不加载 narrator.js（它会把 NARRATOR 换成 localStorage 实现），用测试桩即可
["../js/rune-data.js", "../js/nav.js", "../js/unlock.js", "../js/toc.js"].forEach((s) => {
  window.eval(fs.readFileSync(path.join(ROOT, s.replace("../", "")), "utf8"));
});
document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));

let pass = 0, fail = 0;
function log(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name + (extra ? "  [" + extra + "]" : "")); }
  else { fail++; console.log("  ✗ FAIL " + name + (extra ? "  [" + extra + "]" : "")); }
}

console.log("== 侧边栏导航 ==");
const navText = document.querySelector(".sidebar").textContent;
log("侧边栏含「种族」", navText.indexOf("种族") !== -1);
log("种族项高亮（当前页）", (() => {
  const a = Array.from(document.querySelectorAll(".nav-children a")).find((x) => x.textContent === "种族");
  return !!a && a.className === "active";
})());

console.log("== 目录与讲述者隔离 ==");
function tocTargets() {
  const panel = document.getElementById("toc-panel");
  return panel ? Array.from(panel.querySelectorAll("a")).map((a) => a.textContent) : [];
}
let t = tocTargets();
log("玩家视角：目录不含 4.4 堕神", t.filter((x) => x.indexOf("堕神") !== -1).length === 0, "items=" + t.length);
log("玩家视角：目录含 八、速查表", t.filter((x) => x.indexOf("速查表") !== -1).length === 1);
setState(true);
t = tocTargets();
console.log("  [debug] 讲述者视角目录:", t.join(" | "));
log("讲述者视角：目录含 4.4 堕神", t.filter((x) => x.indexOf("堕神") !== -1).length === 1);
log("讲述者视角：标题 id 无重复", (() => {
  const ids = Array.from(document.querySelectorAll(".page h2, .page h3")).map((h) => h.id).filter(Boolean);
  return new Set(ids).size === ids.length;
})());
setState(false);

console.log("== 速查表锚点 ==");
const chart = document.getElementById("damage-chart");
log("速查表锚点存在", !!chart && chart.tagName === "H2");
log("速查表 8 行", document.querySelectorAll("#damage-chart ~ table tbody tr").length >= 8);

console.log("== 关键交叉链接 ==");
const bodyText = document.querySelector(".page").innerHTML;
[["runes.html#生命系", "生命系谱链接"], ["worldview/轮回.html", "灵魂→轮回"], ["worldview/混沌.html", "混沌链接"], ["worldview/基本法则.html", "观察者效应链接"], ["combat.html#s5", "解构伤害链接"]].forEach((pair) => {
  log("含 " + pair[1], bodyText.indexOf(pair[0]) !== -1);
});

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
