/* ==========================================================================
 * 基因 wiki 页渲染（genes.html）
 * 数据来自 js/gene-data.js（单一数据源），按稀有度着色渲染表格
 * ========================================================================== */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmt(s) { return esc(String(s)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }

  var DATA = window.GENE_DATA || { nonNegative: [], negative: [] };
  var R_LABEL = { common: "普通", rare: "罕见", epic: "稀有" };
  function badge(r) {
    return '<span class="gene-badge ' + r + '">' + (R_LABEL[r] || "负面") + "</span>";
  }

  var MECH = ["灵体", "木头人", "太阳之子", "笛卡尔", "西格玛", "真·轮回者", "远梦之光", "兽性", "魅力", "双刃剑", "易燃", "赌徒"];
  var ENV = ["向日葵", "畏光", "随性", "抗压王", "乐观"];

  function nonNegCat(g) {
    if (MECH.indexOf(g.name) !== -1) return "符文/战斗机制类";
    if (ENV.indexOf(g.name) !== -1) return "环境/状态类";
    var m = g.mods || {};
    if (m.phy || m.acu || m.wil || m.phyCap || m.acuCap || m.wilCap || m.minPhy || m.minAcu || m.minWil || m.attrPoints || m.uncap) return "属性增强类";
    if (m.specs || m.specPoints) return "专精增强类";
    return "环境/状态类";
  }

  function negCat(name) {
    // 先去掉 Lv.x 后缀（如「单科生 Lv.1」→「单科生」），按基础名称归类
    var base = name.replace(/ Lv\.\d+$/, "");
    if (["脆弱", "呆滞", "麻木", "四体不勤", "输在起跑线"].indexOf(base) !== -1) return "属性削弱类";
    if (["贫血", "夜盲", "惧火", "玻璃心", "怯场", "笨手笨脚"].indexOf(base) !== -1) return "战斗限制类";
    if (["结巴", "脸盲", "疑心", "迷信", "恐高", "幽闭", "自闭", "刻板", "易垮", "悲观", "单科生"].indexOf(base) !== -1) return "社交/认知限制类";
    if (["灾星", "回声", "罪孽"].indexOf(base) !== -1) return "特殊诅咒类";
    return "其他";
  }

  // 备注列：玩家备注 + 讲述者备注（仅讲述者可见）
  function remarkCell(g) {
    var parts = [];
    if (g.note) parts.push(esc(g.note));
    if (g.gmNote) parts.push('<span class="gm-only">（讲述者：' + fmt(g.gmNote) + "）</span>");
    return parts.join("<br>");
  }

  function renderNonNeg() {
    var container = $("g-nonneg");
    if (!container) return;
    var cats = ["属性增强类", "专精增强类", "符文/战斗机制类", "环境/状态类"];
    container.innerHTML = cats.map(function (cat) {
      var items = DATA.nonNegative.filter(function (g) { return nonNegCat(g) === cat; });
      if (!items.length) return "";
      var rows = items.map(function (g) {
        return '<tr class="gene-' + g.rarity + '"><td><strong>' + esc(g.name) + "</strong> " + badge(g.rarity) +
          "</td><td>" + fmt(g.effect) + "</td><td>" + esc(g.hint) + "</td><td>" + remarkCell(g) + "</td></tr>";
      }).join("");
      return "<h3>" + cat + "</h3><table class=\"wiki-table\"><thead><tr><th>基因名</th><th>效果</th><th>扮演提示</th><th>备注</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }).join("");
  }

  function renderNeg() {
    var container = $("g-neg");
    if (!container) return;
    var cats = ["属性削弱类", "战斗限制类", "社交/认知限制类", "特殊诅咒类"];
    container.innerHTML = cats.map(function (cat) {
      var items = DATA.negative.filter(function (g) { return negCat(g.name) === cat; });
      if (!items.length) return "";
      var rows = items.map(function (g) {
        return '<tr class="gene-negative"><td><strong>' + esc(g.name) + "</strong> " + badge("negative") +
          "</td><td>" + fmt(g.effect) + "</td><td>" + esc(g.hint) + "</td><td>" + remarkCell(g) + "</td></tr>";
      }).join("");
      return "<h3>" + cat + "</h3><table class=\"wiki-table\"><thead><tr><th>基因名</th><th>效果</th><th>扮演提示</th><th>备注</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var warn = $("g-gene-warning");
    if (warn && DATA.warning) warn.innerHTML = fmt(DATA.warning);
    renderNonNeg();
    renderNeg();
  });
})();
