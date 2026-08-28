/* 用 jsdom 复现 guide.html 的运行时行为：初始化 / 专精步进 / 载入示例 / 实时联动 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "guide.html"), "utf8");

const dom = new JSDOM(html, {
  url: "http://127.0.0.1/guide.html",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

const scripts = ["js/gene-data.js", "js/rune-data.js", "js/guide.js"];
for (const s of scripts) {
  const code = fs.readFileSync(path.join(ROOT, s), "utf8");
  window.eval(code);
}
document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));

function $(id) { return document.getElementById(id); }
let pass = 0, fail = 0;
function log(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name + (extra ? "  [" + extra + "]" : "")); }
  else { fail++; console.log("  ✗ FAIL " + name + (extra ? "  [" + extra + "]" : "")); }
}

console.log("== 初始化 ==");
log("专精步进器 12 行", document.querySelectorAll(".spec-row").length === 12);
log("衍生属性 6 项", $("g-derived").children.length === 6);
log("角色卡已渲染", $("g-card").textContent.length > 0);

console.log("== 专精步进 ==");
const plus = document.querySelector(".spec-row .stepper button:last-child");
const minus = document.querySelector(".spec-row .stepper button:first-child");
plus.click();
log("点击 + 后 调查 = 1", $("spec-调查").value === "1", "value=" + $("spec-调查").value);
log("剩余专精点 = 9", $("g-spec-left").textContent.trim() === "9", "left=" + $("g-spec-left").textContent.trim());
log("角色卡显示 调查：1 级", $("g-card").textContent.indexOf("调查：1 级") !== -1);
for (let i = 0; i < 6; i++) plus.click();
log("连点至上限：调查 = 5", $("spec-调查").value === "5", "value=" + $("spec-调查").value);
minus.click();
log("点击 − 后 调查 = 4", $("spec-调查").value === "4", "value=" + $("spec-调查").value);

console.log("== 载入示例 ==");
$("g-example").click();
log("角色名 = 刘思明", $("g-name").value === "刘思明");
log("识质 = 冷灰白", $("g-modifier").value === "冷" && $("g-hue").value === "灰白");
log("算力 16 / 愿力 14 / 体魄 10", $("g-acu").value === "16" && $("g-wil").value === "14" && $("g-phy").value === "10");
log("专精 调查 = 2、神秘学 = 2", $("spec-调查").value === "2" && $("spec-神秘学").value === "2");
log("剩余专精点 = 0", $("g-spec-left").textContent.trim() === "0", "left=" + $("g-spec-left").textContent.trim());
const checkedRunes = Array.from(document.querySelectorAll(".rune-cb:checked")).map((c) => c.getAttribute("data-name"));
log("符文 = 梦境推演", checkedRunes.join(",") === "梦境推演", "runes=" + checkedRunes.join(","));
log("组织 = 梦境裁判所（特别行动科）", $("g-org").value === "梦境裁判所（特别行动科）");
const card = $("g-card").textContent;
log("角色卡含 刘思明", card.indexOf("刘思明") !== -1);
log("角色卡含 梦境推演", card.indexOf("梦境推演") !== -1);
log("角色卡含 算力（ACU）：16", card.indexOf("算力（ACU）：16") !== -1);
log("角色卡含 当前可用算力 4", card.indexOf("当前可用算力：4") !== -1);
log("角色卡含 特别行动科", card.indexOf("特别行动科") !== -1);

console.log("== 属性实时联动 ==");
$("g-acu").value = "18";
$("g-acu").dispatchEvent(new window.Event("input", { bubbles: true }));
log("改算力后卡片同步为 18", $("g-card").textContent.indexOf("算力（ACU）：18") !== -1);
$("g-phy").value = "12";
$("g-phy").dispatchEvent(new window.Event("input", { bubbles: true }));
log("改体魄后卡片同步为 12", $("g-card").textContent.indexOf("体魄（PHY）：12") !== -1);

console.log("== 基因联动（三好学生 attrPoints） ==");
$("g-gene-enable").checked = true;
$("g-gene-enable").dispatchEvent(new window.Event("change", { bubbles: true }));
const geneP = Array.from(document.querySelectorAll('.gene-cb[data-kind="p"]'));
const sanhao = geneP.find((cb) => { const g = window.GENE_DATA.nonNegative[parseInt(cb.getAttribute("data-idx"), 10)]; return g && g.name === "三好学生 Lv.1"; });
if (sanhao) {
  sanhao.checked = true;
  sanhao.dispatchEvent(new window.Event("change", { bubbles: true }));
  log("选中三好学生后属性池 = 41 点", $("g-attr-total").textContent.indexOf("41 点") !== -1, "total=" + $("g-attr-total").textContent);
  // 此时属性为 18+14+12=44，池 41 → 剩余 -3（红色提示），说明点数池联动正确
  log("剩余属性点 = 41 - 44 = -3 提示", $("g-points-left").textContent.trim() === "-3", "left=" + $("g-points-left").textContent.trim());
}

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
