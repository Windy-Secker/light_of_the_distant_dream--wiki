/* 用 jsdom 验证 combat.html 的流程图与相生相克示意图 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "combat.html"), "utf8");

const dom = new JSDOM(html, {
  url: "http://127.0.0.1/combat.html",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

const scripts = ["js/rune-data.js", "js/nav.js", "js/narrator.js", "js/unlock.js", "js/combat.js"];
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

console.log("== 战斗轮流程图 ==");
const flowSvg = document.getElementById("flow-diagram");
log("流程图 SVG 已渲染", !!flowSvg && flowSvg.querySelectorAll(".flow-start").length === 2, "start=" + (flowSvg ? flowSvg.querySelectorAll(".flow-start").length : 0));
log("流程处理节点 3 个", flowSvg.querySelectorAll(".flow-proc").length === 3);
log("判断菱形 1 个", flowSvg.querySelectorAll(".flow-dec").length === 1);
log("箭头 6 条", flowSvg.querySelectorAll(".flow-line").length === 6);
const flowText = flowSvg.textContent;
log("流程图中体现额外行动", flowText.indexOf("额外行动") !== -1);

console.log("== 额外行动规则 ==");
const docText = document.querySelector(".page").textContent;
log("1.1 三种行动类型 + 额外行动行", docText.indexOf("三种行动类型") !== -1 && docText.indexOf("只能通过符文术式等手段获得") !== -1);
log("额外行动每回合1次（如有）", docText.indexOf("每回合1次（如有）") !== -1);
log("1 标准 + 1 快速 + 1 额外（如有）", docText.indexOf("1 个标准行动 + 1 个快速行动 + 1 个额外行动（如有）") !== -1);
log("额外行动结算时机规则", docText.indexOf("本回合所有标准行动和快速行动结算完毕后，额外行动再按照先攻顺序结算") !== -1);
log("2.1 战斗轮结构含额外行动", docText.indexOf("标准行动 + 快速行动 + 额外行动（如有）") !== -1);
log("流程表格结算阶段含额外行动", docText.indexOf("额外行动在所有标准行动和快速行动结算完毕后，再按先攻顺序结算") !== -1);

console.log("== 视图切换（流程） ==");
function clickVs(group, vs) {
  const sw = document.querySelector('.view-switch[data-group="' + group + '"]');
  const btn = sw.querySelector('button[data-vs="' + vs + '"]');
  btn.click();
}
clickVs("flow", "flow-table");
log("切换到表格后表格可见", document.querySelector('.view-pane[data-pane="flow-table"]').style.display !== "none");
log("切换到表格后流程图隐藏", document.querySelector('.view-pane[data-pane="flow-diagram"]').style.display === "none");
clickVs("flow", "flow-diagram");
log("切回流程图可见", document.querySelector('.view-pane[data-pane="flow-diagram"]').style.display === "");

console.log("== 相生相克示意图 ==");
const xySvg = document.getElementById("xy-diagram");
log("示意图默认渲染（相生 8 条连线）", xySvg.querySelectorAll(".xy-line-sheng").length === 8, "lines=" + xySvg.querySelectorAll(".xy-line-sheng").length);
log("八个系谱节点", xySvg.querySelectorAll(".xy-node").length === 8);

// 切到 相克
document.querySelector('#xy-sub button[data-sub="ke"]').click();
log("相克连线 21 条", xySvg.querySelectorAll(".xy-line-ke").length === 21, "lines=" + xySvg.querySelectorAll(".xy-line-ke").length);
log("相克视图无相生线", xySvg.querySelectorAll(".xy-line-sheng").length === 0);

console.log("== 箭头末端贴气泡边缘 ==");
log("相克箭头两端距节点中心 ≈ 38（不被气泡盖住）", (() => {
  const nodes = Array.from(xySvg.querySelectorAll(".xy-node"));
  const centerOf = (name) => {
    const g = nodes.find((x) => x.getAttribute("data-name") === name);
    const c = g.querySelector("circle");
    return { x: parseFloat(c.getAttribute("cx")), y: parseFloat(c.getAttribute("cy")) };
  };
  let ok = true;
  Array.from(xySvg.querySelectorAll(".xy-line-ke")).forEach((l) => {
    const m = l.getAttribute("d").match(/^M([\d.]+),([\d.]+) Q[\d.,]+ ([\d.]+),([\d.]+)$/);
    if (!m) { ok = false; return; }
    const a = centerOf(l.getAttribute("data-from"));
    const b = centerOf(l.getAttribute("data-to"));
    const d1 = Math.hypot(parseFloat(m[1]) - a.x, parseFloat(m[2]) - a.y);
    const d2 = Math.hypot(parseFloat(m[3]) - b.x, parseFloat(m[4]) - b.y);
    if (Math.abs(d1 - 38) > 4 || Math.abs(d2 - 38) > 4) { ok = false; console.log("  [debug] " + l.getAttribute("data-from") + ">" + l.getAttribute("data-to") + " d1=" + d1.toFixed(1) + " d2=" + d2.toFixed(1)); }
  });
  return ok;
})());
log("相生线两端同样贴边（不伸入气泡）", (() => {
  document.querySelector('#xy-sub button[data-sub="sheng"]').click();
  const nodes = Array.from(xySvg.querySelectorAll(".xy-node"));
  const centerOf = (name) => {
    const g = nodes.find((x) => x.getAttribute("data-name") === name);
    const c = g.querySelector("circle");
    return { x: parseFloat(c.getAttribute("cx")), y: parseFloat(c.getAttribute("cy")) };
  };
  let ok = true;
  Array.from(xySvg.querySelectorAll(".xy-line-sheng")).forEach((l) => {
    const m = l.getAttribute("d").match(/^M([\d.]+),([\d.]+) Q[\d.,]+ ([\d.]+),([\d.]+)$/);
    if (!m) { ok = false; return; }
    // 相生线没有 data-from/to，用节点坐标计算：两端应距某两个节点中心 ≈ 38
    const pts = nodes.map((g) => {
      const c = g.querySelector("circle");
      return { x: parseFloat(c.getAttribute("cx")), y: parseFloat(c.getAttribute("cy")) };
    });
    const ends = [[parseFloat(m[1]), parseFloat(m[2])], [parseFloat(m[3]), parseFloat(m[4])]];
    ends.forEach((p) => {
      const ds = pts.map((c) => Math.hypot(p[0] - c.x, p[1] - c.y)).sort((a, b) => a - b);
      if (Math.abs(ds[0] - 38) > 4) { ok = false; console.log("  [debug] sheng end dist=" + ds[0].toFixed(1)); }
    });
  });
  document.querySelector('#xy-sub button[data-sub="ke"]').click(); // 切回相克供后续测试
  return ok;
})());
log("相生箭头为双向（marker orient=auto-start-reverse）", (() => {
  document.querySelector('#xy-sub button[data-sub="sheng"]').click();
  const mk = xySvg.querySelector("#xy-arrow-sheng");
  const line = xySvg.querySelectorAll(".xy-line-sheng")[0];
  const ok = !!mk && mk.getAttribute("orient") === "auto-start-reverse" &&
    line.getAttribute("marker-start") === "url(#xy-arrow-sheng)" &&
    line.getAttribute("marker-end") === "url(#xy-arrow-sheng)";
  document.querySelector('#xy-sub button[data-sub="ke"]').click();
  return ok;
})());

log("节点悬停高亮生效", (() => {
  const g = xySvg.querySelector(".xy-node");
  g.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: false }));
  const dimmed = xySvg.querySelectorAll(".xy-line-ke.xy-dim").length;
  const ok = dimmed > 0;
  g.dispatchEvent(new window.MouseEvent("mouseleave", { bubbles: false }));
  return ok;
})());
const note = document.getElementById("xy-note");
log("图例说明已更新（相克）", note.textContent.indexOf("克制") !== -1);

console.log("== 相克关系与 5.3 表格一致 ==");
// 从表格提取相克数据（A 克制 B），与示意图连线比对
const FAMILIES = ["物质", "能量", "空间", "生命", "意识", "因果", "时间", "解构"];
const tableRows = Array.from(document.querySelectorAll('.view-pane[data-pane="xy-table"] table')[1].querySelectorAll("tbody tr"));
const tableKe = [];
tableRows.forEach((tr) => {
  const cells = tr.querySelectorAll("td");
  const a = cells[0].textContent.trim();
  const raw = cells[1].textContent.trim();
  let targets;
  if (raw === "除时间外") targets = FAMILIES.filter((f) => f !== "时间" && f !== a); // 解构不克制自身
  else targets = raw.split("、").map((s) => s.trim()).filter(Boolean);
  targets.forEach((t) => tableKe.push(a + ">" + t));
});
const svgKe = Array.from(xySvg.querySelectorAll(".xy-line-ke")).map((l) => l.getAttribute("data-from") + ">" + l.getAttribute("data-to"));
log("示意图连线与表格一致（" + tableKe.length + " 条）", tableKe.length === 21 && tableKe.sort().join(",") === svgKe.sort().join(","));

// 切回 相生
document.querySelector('#xy-sub button[data-sub="sheng"]').click();
log("相生连线 8 条", xySvg.querySelectorAll(".xy-line-sheng").length === 8);
log("图例说明已更新（相生）", document.getElementById("xy-note").textContent.indexOf("相生") !== -1);

console.log("== 视图切换（示意图面板） ==");
clickVs("xy", "xy-diagram");
log("示意图面板显示", document.querySelector('.view-pane[data-pane="xy-diagram"]').style.display === "");
log("表格面板隐藏", document.querySelector('.view-pane[data-pane="xy-table"]').style.display === "none");
// 说明文字（相生/相克规则）位于切换面板之外，示意图视图下仍然可见
log("示意图视图下相生/相克说明文字仍可见", (() => {
  const p = document.querySelector(".page");
  const inPane = (el) => {
    let n = el;
    while (n && n !== p) {
      if (n.classList && n.classList.contains("view-pane")) return true;
      n = n.parentElement;
    }
    return false;
  };
  const shengText = Array.from(p.querySelectorAll("p, ul, blockquote")).find((el) => el.textContent.indexOf("效果增强") !== -1);
  const keText = Array.from(p.querySelectorAll("p, ul, blockquote")).find((el) => el.textContent.indexOf("攻击检定") !== -1 && el.textContent.indexOf("优势") !== -1);
  return !!shengText && !!keText && !inPane(shengText) && !inPane(keText);
})());
clickVs("xy", "xy-table");
log("切回表格显示", document.querySelector('.view-pane[data-pane="xy-table"]').style.display === "");

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
