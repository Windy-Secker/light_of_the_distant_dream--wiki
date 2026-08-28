/* ==========================================================================
 * 战斗规则页可视化（combat.html）
 * - 战斗轮流程图：标准流程图（圆角矩形=开始/结束、矩形=处理、菱形=判断），
 *   可与表格形式互相切换（.view-switch / .view-pane）
 * - 八个系谱的相生相克示意图：八角节点 + 箭头（相克有向 / 相生双向），
 *   可与表格形式切换，并可在 相生/相克 两种关系间切换
 * 纯原生 SVG 绘制，无第三方依赖。
 * ========================================================================== */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function $(id) { return document.getElementById(id); }

  function S(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function text(x, y, str, cls, anchor) {
    var t = S("text", { x: x, y: y, class: cls || "" });
    if (anchor) t.setAttribute("text-anchor", anchor);
    t.textContent = str;
    return t;
  }

  /* ---------- 视图切换（表格 / 流程图 / 示意图） ---------- */

  document.querySelectorAll(".view-switch").forEach(function (sw) {
    sw.addEventListener("click", function (e) {
      var btn = e.target;
      while (btn && btn !== sw && !(btn.tagName === "BUTTON" && btn.classList.contains("vs-btn"))) btn = btn.parentNode;
      if (!btn || btn === sw) return;
      var group = sw.getAttribute("data-group");
      Array.prototype.forEach.call(sw.querySelectorAll(".vs-btn"), function (b) {
        b.classList.toggle("on", b === btn);
      });
      Array.prototype.forEach.call(document.querySelectorAll('.view-pane[data-group="' + group + '"]'), function (p) {
        p.style.display = p.getAttribute("data-pane") === btn.getAttribute("data-vs") ? "" : "none";
      });
      // 切到示意图时按当前子视图重绘（首次渲染在 DOMContentLoaded 完成）
      if (group === "xy" && btn.getAttribute("data-vs") === "xy-diagram") drawXY(currentSub());
    });
  });

  /* ---------- 战斗轮流程图 ---------- */

  function renderFlow() {
    var svg = $("flow-diagram");
    if (!svg) return;

    var defs = S("defs", {});
    var marker = S("marker", {
      id: "flow-arrow", viewBox: "0 0 10 10", refX: 8.5, refY: 5,
      markerWidth: 8, markerHeight: 8, orient: "auto"
    });
    marker.appendChild(S("path", { d: "M0,0 L10,5 L0,10 z", fill: "#5c6470" }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // 节点
    svg.appendChild(S("rect", { x: 240, y: 24, width: 160, height: 44, rx: 22, class: "flow-start" }));
    svg.appendChild(S("rect", { x: 225, y: 118, width: 190, height: 58, rx: 6, class: "flow-proc" }));
    svg.appendChild(S("rect", { x: 225, y: 218, width: 190, height: 58, rx: 6, class: "flow-proc" }));
    svg.appendChild(S("rect", { x: 225, y: 318, width: 190, height: 58, rx: 6, class: "flow-proc" }));
    svg.appendChild(S("polygon", { points: "320,392 408,442 320,492 232,442", class: "flow-dec" }));
    svg.appendChild(S("rect", { x: 240, y: 528, width: 160, height: 44, rx: 22, class: "flow-start" }));

    // 纵向主线箭头
    svg.appendChild(S("line", { x1: 320, y1: 68, x2: 320, y2: 112, class: "flow-line", "marker-end": "url(#flow-arrow)" }));
    svg.appendChild(S("line", { x1: 320, y1: 176, x2: 320, y2: 212, class: "flow-line", "marker-end": "url(#flow-arrow)" }));
    svg.appendChild(S("line", { x1: 320, y1: 276, x2: 320, y2: 312, class: "flow-line", "marker-end": "url(#flow-arrow)" }));
    svg.appendChild(S("line", { x1: 320, y1: 376, x2: 320, y2: 386, class: "flow-line", "marker-end": "url(#flow-arrow)" }));
    // 是 → 结束
    svg.appendChild(S("line", { x1: 320, y1: 492, x2: 320, y2: 522, class: "flow-line", "marker-end": "url(#flow-arrow)" }));
    // 否 → 左侧回环进入下一轮（选择阶段）
    svg.appendChild(S("path", { d: "M 232 442 L 140 442 L 140 147 L 219 147", class: "flow-line", "marker-end": "url(#flow-arrow)" }));

    // 标签
    svg.appendChild(text(320, 51, "战斗轮开始", "flow-label", "middle"));
    svg.appendChild(text(320, 142, "选择阶段", "flow-label", "middle"));
    svg.appendChild(text(320, 162, "同时选择行动（含额外行动）", "flow-sub", "middle"));
    svg.appendChild(text(320, 242, "排序阶段", "flow-label", "middle"));
    svg.appendChild(text(320, 262, "按优先级确定行动顺序", "flow-sub", "middle"));
    svg.appendChild(text(320, 342, "结算阶段", "flow-label", "middle"));
    svg.appendChild(text(320, 362, "结算所有行动（额外行动最后结算）", "flow-sub", "middle"));
    svg.appendChild(text(320, 447, "战斗结束？", "flow-label", "middle"));
    svg.appendChild(text(334, 512, "是", "flow-branch-label"));
    svg.appendChild(text(146, 430, "否（继续下一轮）", "flow-branch-label"));
    svg.appendChild(text(320, 555, "战斗轮结束", "flow-label", "middle"));
  }

  /* ---------- 相生相克示意图 ---------- */

  var FAMILIES = ["物质", "能量", "空间", "生命", "意识", "因果", "时间", "解构"];
  var FCOLOR = {
    "物质": "#b8860b", "能量": "#e6a23c", "空间": "#4a90d9",
    "生命": "#52b45f", "意识": "#9b59b6", "因果": "#e05d5d",
    "时间": "#5aa7c9", "解构": "#8f8f8f"
  };
  // 相生：无方向组合（双向）
  var SHENG = [
    ["物质", "能量"], ["物质", "空间"], ["物质", "生命"],
    ["能量", "生命"], ["能量", "意识"],
    ["空间", "解构"], ["空间", "时间"],
    ["因果", "解构"]
  ];
  // 相克：有向（A 克制 B），与 5.3 表格一致
  var KE = [
    ["物质", "生命"],
    ["能量", "物质"], ["能量", "生命"],
    ["空间", "物质"], ["空间", "能量"], ["空间", "解构"],
    ["生命", "能量"], ["生命", "意识"],
    ["意识", "能量"],
    ["因果", "空间"], ["因果", "意识"], ["因果", "时间"], ["因果", "解构"],
    ["时间", "生命"], ["时间", "解构"],
    ["解构", "物质"], ["解构", "能量"], ["解构", "空间"], ["解构", "生命"], ["解构", "意识"], ["解构", "因果"]
  ];

  function nodePos(i) {
    var ang = (-90 + i * 45) * Math.PI / 180;
    return { x: 320 + 235 * Math.cos(ang), y: 320 + 235 * Math.sin(ang) };
  }

  // 两点间的弧线（贝塞尔，向远离圆心的方向弯曲，避免与其它连线重叠）
  // 两端按节点半径缩短：让箭头末端贴在气泡边缘，而不是被气泡盖住
  var NODE_R = 36;   // 节点圆半径
  var END_GAP = 38;  // 线端距节点中心的距离（= 半径 + 2px 间隙，箭头尖端正好贴边）

  function arcPath(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    var x1 = a.x + ux * END_GAP, y1 = a.y + uy * END_GAP;
    var x2 = b.x - ux * END_GAP, y2 = b.y - uy * END_GAP;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var px = -uy, py = ux;
    var ox = 320 - mx, oy = 320 - my;
    var clen = Math.sqrt(ox * ox + oy * oy);
    if (clen > 30 && (px * ox + py * oy) < 0) { px = -px; py = -py; }
    var k = 26;
    return "M" + x1.toFixed(1) + "," + y1.toFixed(1) +
      " Q" + (mx + px * k).toFixed(1) + "," + (my + py * k).toFixed(1) +
      " " + x2.toFixed(1) + "," + y2.toFixed(1);
  }

  function currentSub() {
    var bar = $("xy-sub");
    if (!bar) return "sheng";
    var b = bar.querySelector(".vs-btn.on");
    return b ? b.getAttribute("data-sub") : "sheng";
  }

  function drawXY(sub) {
    var svg = $("xy-diagram");
    if (!svg) return;
    svg.innerHTML = "";

    var defs = S("defs", {});
    // orient="auto-start-reverse"：同一 marker 在路径起点反向、终点正向 → 双向箭头
    var mkSheng = S("marker", {
      id: "xy-arrow-sheng", viewBox: "0 0 10 10", refX: 8.5, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse"
    });
    mkSheng.appendChild(S("path", { d: "M0,0 L10,5 L0,10 z", fill: "#43a047" }));
    var mkKe = S("marker", {
      id: "xy-arrow-ke", viewBox: "0 0 10 10", refX: 8.5, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: "auto"
    });
    mkKe.appendChild(S("path", { d: "M0,0 L10,5 L0,10 z", fill: "#e05d5d" }));
    defs.appendChild(mkSheng);
    defs.appendChild(mkKe);
    svg.appendChild(defs);

    var pos = FAMILIES.map(function (_, i) { return nodePos(i); });

    // 连线层
    var rels = sub === "sheng" ? SHENG : KE;
    rels.forEach(function (pair) {
      var i = FAMILIES.indexOf(pair[0]), j = FAMILIES.indexOf(pair[1]);
      var line;
      if (sub === "sheng") {
        line = S("path", {
          d: arcPath(pos[i], pos[j]),
          class: "xy-line-sheng",
          "marker-start": "url(#xy-arrow-sheng)",
          "marker-end": "url(#xy-arrow-sheng)"
        });
      } else {
        line = S("path", {
          d: arcPath(pos[i], pos[j]),
          class: "xy-line-ke",
          "marker-end": "url(#xy-arrow-ke)",
          "data-from": pair[0],
          "data-to": pair[1]
        });
      }
      svg.appendChild(line);
    });

    // 节点层（后绘制，覆盖在连线之上）
    FAMILIES.forEach(function (f, i) {
      var g = S("g", { class: "xy-node", "data-name": f });
      g.appendChild(S("circle", { cx: pos[i].x, cy: pos[i].y, r: 36, fill: "#ffffff", stroke: FCOLOR[f], "stroke-width": 2.5 }));
      g.appendChild(text(pos[i].x, pos[i].y + 5, f, "xy-node-text", "middle"));
      if (sub === "ke") {
        g.addEventListener("mouseenter", function () { highlightKe(f); });
        g.addEventListener("mouseleave", function () { highlightKe(null); });
      }
      svg.appendChild(g);
    });

    var note = $("xy-note");
    if (note) {
      note.textContent = sub === "sheng"
        ? "绿色虚线（双向箭头）＝相生组合：同时或连续使用时，伤害/效果 +2，第二个符文的愿力消耗 −1。"
        : "红色实线箭头＝克制关系：A → B 表示 A 系谱克制 B 系谱（攻击检定优势、命中伤害 +1d4）；悬停节点可高亮其克制与被克制关系。";
    }
  }

  // 悬停高亮：只保留与该节点相关的克制连线
  function highlightKe(name) {
    var svg = $("xy-diagram");
    if (!svg) return;
    Array.prototype.forEach.call(svg.querySelectorAll(".xy-line-ke"), function (line) {
      var hit = name && (line.getAttribute("data-from") === name || line.getAttribute("data-to") === name);
      line.classList.toggle("xy-dim", !!name && !hit);
    });
    Array.prototype.forEach.call(svg.querySelectorAll(".xy-node circle"), function (c) {
      c.classList.toggle("xy-dim", !!name && c.parentNode.getAttribute("data-name") !== name);
    });
  }

  // 相生 / 相克 子视图切换
  var subBar = $("xy-sub");
  if (subBar) {
    subBar.addEventListener("click", function (e) {
      var btn = e.target;
      while (btn && btn !== subBar && !(btn.tagName === "BUTTON" && btn.classList.contains("vs-btn"))) btn = btn.parentNode;
      if (!btn || btn === subBar) return;
      Array.prototype.forEach.call(subBar.querySelectorAll(".vs-btn"), function (b) {
        b.classList.toggle("on", b === btn);
      });
      drawXY(btn.getAttribute("data-sub"));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderFlow();
    drawXY(currentSub());
  });
})();
