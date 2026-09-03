/* ==========================================================================
 * 角色创建指南 —— 互动逻辑
 * 依赖：js/rune-data.js（window.RUNE_LIBRARY）
 * 功能：识质选择 / 属性分配 / 衍生计算 / 符文选择 / 专精分配 / 角色卡导出
 * ========================================================================== */
(function () {
  "use strict";

  /* ---------- 静态数据（来源于第一章） ---------- */

  var HUES = [
    { name: "赤红", core: "愤怒/抗争", scene: "被不公对待时挺身而出" },
    { name: "橙黄", core: "喜悦/温暖", scene: "守护重要之物时的满足" },
    { name: "金黄", core: "骄傲/信念", scene: "坚信自己的道路正确" },
    { name: "翠绿", core: "希望/生长", scene: "在绝望中看到转机" },
    { name: "青蓝", core: "宁静/疏离", scene: "与世界保持距离的观察者" },
    { name: "靛紫", core: "孤独/悲伤", scene: "失去重要之人后的沉默" },
    { name: "暗红", core: "绝望/毁灭", scene: "再也无法挽回的尽头" },
    { name: "灰白", core: "麻木/空洞", scene: "情感耗尽的空心人" },
    { name: "墨黑", core: "恐惧/退缩", scene: "被压倒性的力量威慑" },
    { name: "素白", core: "纯粹/守护", scene: "为了某个信念而活" },
    { name: "银灰", core: "理智/冷淡", scene: "用逻辑代替情感" },
    { name: "透明", core: "虚无/迷茫", scene: "找不到自己的位置" }
  ];

  var MODIFIERS = [
    { name: "灼", meaning: "由外界不公触发" },
    { name: "幽", meaning: "由内省与回忆触发" },
    { name: "冷", meaning: "由距离与隔阂触发" },
    { name: "明", meaning: "由目标与方向触发" },
    { name: "净", meaning: "由纯粹理念触发" },
    { name: "韧", meaning: "由长久的坚守触发" },
    { name: "凛", meaning: "由威胁与危险触发" },
    { name: "温", meaning: "由人际连接触发" },
    { name: "焚", meaning: "由自我否定触发" },
    { name: "淡", meaning: "由时间与遗忘触发" },
    { name: "浊", meaning: "由混乱与矛盾触发" },
    { name: "隐", meaning: "由隐藏的渴望触发" }
  ];

  var SPECIALTIES = [
    { name: "调查", rel: "算力", use: "搜集线索、拼接信息、发现细节" },
    { name: "神秘学", rel: "算力", use: "辨识符文、解读古代文献" },
    { name: "格斗", rel: "体魄", use: "近身战斗、武器使用" },
    { name: "潜行", rel: "体魄", use: "隐匿行踪、避开侦查" },
    { name: "追踪", rel: "算力", use: "循迹追猎、判断行进方向" },
    { name: "话术", rel: "愿力", use: "说服、套话、安抚、谈判" },
    { name: "察言观色", rel: "算力", use: "判断情绪、识破谎言" },
    { name: "野外生存", rel: "体魄", use: "辨识方向、搭建庇护所" },
    { name: "急救", rel: "算力", use: "止血、处理中毒/昏迷" },
    { name: "机械修理", rel: "算力", use: "修理器材、破解机械" },
    { name: "外语", rel: "算力", use: "阅读与书写异界语言、破译咒文" },
    { name: "灵感", rel: "愿力", use: "灵光一现、直觉感知、捕捉梦境预兆" }
  ];

  var TOTAL_ATTR = 40;
  var MIN_ATTR = 2;
  var MAX_ATTR = 20;
  var TOTAL_SPEC = 10;
  var MAX_SPEC_LEVEL = 5;

  /* ---------- 工具 ---------- */

  function $(id) { return document.getElementById(id); }

  function attrMod(v) {
    v = Math.max(MIN_ATTR, Math.min(MAX_ATTR, v | 0));
    if (v <= 3) return -3;
    if (v <= 5) return -2;
    if (v <= 8) return -1;
    if (v <= 11) return 0;
    if (v <= 14) return 1;
    if (v <= 17) return 2;
    return 3;
  }

  function clamp(v, lo, hi) {
    v = parseInt(v, 10);
    if (isNaN(v)) v = lo;
    return Math.max(lo, Math.min(hi, v));
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- 状态读取 ---------- */

  function getAttrs() {
    return {
      acu: clamp($("g-acu").value, MIN_ATTR, attrMaxFor("acu")),
      wil: clamp($("g-wil").value, MIN_ATTR, attrMaxFor("wil")),
      phy: clamp($("g-phy").value, MIN_ATTR, attrMaxFor("phy"))
    };
  }

  function getSpecs() {
    var map = {};
    SPECIALTIES.forEach(function (s) {
      map[s.name] = clamp($("spec-" + s.name).value, 0, MAX_SPEC_LEVEL);
    });
    return map;
  }

  function getSelectedRunes() {
    var out = [];
    document.querySelectorAll(".rune-cb:checked").forEach(function (cb) {
      out.push({
        name: cb.getAttribute("data-name"),
        cost: parseInt(cb.getAttribute("data-cost"), 10) || 0,
        family: cb.getAttribute("data-family"),
        summary: cb.getAttribute("data-summary"),
        miracle: cb.getAttribute("data-miracle") === "1"
      });
    });
    return out;
  }

  // 灵魂记忆与奇迹互斥：选中奇迹后禁止勾选灵魂记忆
  function updateSoulState() {
    var soul = $("g-soul");
    if (!soul) return;
    var hasMiracle = getSelectedRunes().some(function (r) { return r.miracle; });
    if (hasMiracle) {
      soul.checked = false;
      $("g-soul-value").value = 0;
      soul.disabled = true;
    } else {
      soul.disabled = false;
    }
    var sv = $("g-soul-value");
    if (sv) sv.disabled = !soul.checked;
  }

  function isDeconstructor() {
    return $("g-deconstructor").checked;
  }

  /* ---------- 初始渲染 ---------- */

  function renderHueSelects() {
    var selHue = $("g-hue"), selMod = $("g-modifier");
    HUES.forEach(function (h) {
      var opt = document.createElement("option");
      opt.value = h.name;
      opt.textContent = h.name + "（" + h.core + "）";
      selHue.appendChild(opt);
    });
    MODIFIERS.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = m.name + "（" + m.meaning + "）";
      selMod.appendChild(opt);
    });
    selHue.value = "橙黄";
    selMod.value = "温";
  }

  function renderRefTables() {
    var hueT = $("hue-table");
    hueT.innerHTML = "<thead><tr><th>色调</th><th>情感核心</th><th>常见源动力场景</th></tr></thead><tbody>" +
      HUES.map(function (h) {
        return "<tr><td><strong>" + h.name + "</strong></td><td>" + h.core + "</td><td>" + h.scene + "</td></tr>";
      }).join("") + "</tbody>";

    var modT = $("modifier-table");
    modT.innerHTML = "<thead><tr><th>修饰词</th><th>含义</th></tr></thead><tbody>" +
      MODIFIERS.map(function (m) {
        return "<tr><td><strong>" + m.name + "</strong></td><td>" + m.meaning + "</td></tr>";
      }).join("") + "</tbody>";
  }

  /* ---------- 符文选择（折叠式） ---------- */

  var selectedNames = {};

  function narratorOn() {
    return !!(window.NARRATOR && window.NARRATOR.isOn());
  }

  function rememberSelection() {
    selectedNames = {};
    document.querySelectorAll(".rune-cb:checked").forEach(function (cb) {
      selectedNames[cb.getAttribute("data-name")] = true;
    });
  }

  function soulEnabled() { return $("g-soul") && $("g-soul").checked; }
  function soulValue() { return Math.max(0, parseInt($("g-soul-value").value, 10) || 0); }

  function runeLimit() {
    return (isDeconstructor() ? 1 : 2) + (soulEnabled() ? 1 : 0);
  }

  function totalRuneCost() {
    return getSelectedRunes().reduce(function (s, r) { return s + r.cost; }, 0);
  }

  // 有效消耗 = 符文总消耗 − 灵魂记忆抵扣（最低 0）
  function effectiveCost() {
    return Math.max(0, totalRuneCost() - soulValue());
  }

  function showRuneMsg(html, type) {
    var msg = $("g-rune-msg");
    msg.innerHTML = html;
    msg.className = "callout " + (type || "warn");
    msg.style.display = "block";
    msg.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideRuneMsg() {
    var msg = $("g-rune-msg");
    msg.style.display = "none";
  }

  /* ---------- 基因系统（可选） ---------- */

  var GENE = window.GENE_DATA || { nonNegative: [], negative: [], randomWeight: { common: 50, rare: 35, epic: 15 } };
  var R_LABEL = { common: "普通", rare: "罕见", epic: "稀有" };
  var selectedPNames = {};
  var selectedNNames = {};

  function fmtBold(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }

  function geneEnabled() { return $("g-gene-enable") && $("g-gene-enable").checked; }
  function genePCount() { return parseInt($("g-gene-pcount").value, 10) || 0; }
  function geneNCount() { return parseInt($("g-gene-ncount").value, 10) || 0; }
  function geneMode() {
    var el = document.querySelector('input[name="g-genemode"]:checked');
    return el ? el.value : "pick";
  }

  function selectedGenes() {
    var p = [], n = [];
    document.querySelectorAll(".gene-cb:checked").forEach(function (cb) {
      var idx = parseInt(cb.getAttribute("data-idx"), 10);
      var kind = cb.getAttribute("data-kind");
      var pool = kind === "p" ? GENE.nonNegative : GENE.negative;
      if (pool[idx]) (kind === "p" ? p : n).push(pool[idx]);
    });
    return { p: p, n: n };
  }

  // 聚合基因数值修正（未启用基因系统时返回全零）
  function geneMods() {
    var m = { phy: 0, acu: 0, wil: 0, phyCap: 0, acuCap: 0, wilCap: 0, res: 0, hp: 0, specPoints: 0, attrPoints: 0, uncap: null, resHalf: false, minPhy: 0, minAcu: 0, minWil: 0, specs: {} };
    if (!geneEnabled()) return m;
    var s = selectedGenes();
    s.p.concat(s.n).forEach(function (g) {
      var x = g.mods || {};
      m.phy += x.phy || 0; m.acu += x.acu || 0; m.wil += x.wil || 0;
      m.phyCap += x.phyCap || 0; m.acuCap += x.acuCap || 0; m.wilCap += x.wilCap || 0;
      m.res += x.res || 0; m.hp += x.hp || 0;
      m.specPoints += x.specPoints || 0;
      m.attrPoints += x.attrPoints || 0;
      if (x.uncap) m.uncap = x.uncap;
      if (x.resHalf) m.resHalf = true;
      m.minPhy = Math.max(m.minPhy, x.minPhy || 0);
      m.minAcu = Math.max(m.minAcu, x.minAcu || 0);
      m.minWil = Math.max(m.minWil, x.minWil || 0);
      if (x.specs) Object.keys(x.specs).forEach(function (k) { m.specs[k] = (m.specs[k] || 0) + x.specs[k]; });
    });
    return m;
  }

  // 该属性的分配上限（Ⅰ/Ⅱ/Ⅲ型极端取消对应属性的上限）
  function attrMaxFor(attr) {
    var gm = geneMods();
    return gm.uncap === attr ? 100 : MAX_ATTR;
  }

  // 有效基础属性 = 分配值 + 基因加成（含下限保护）
  function effAttrs() {
    var a = getAttrs();
    var m = geneMods();
    var eff = { phy: a.phy + m.phy, acu: a.acu + m.acu, wil: a.wil + m.wil };
    if (m.minPhy && eff.phy < m.minPhy) eff.phy = m.minPhy;
    if (m.minAcu && eff.acu < m.minAcu) eff.acu = m.minAcu;
    if (m.minWil && eff.wil < m.minWil) eff.wil = m.minWil;
    eff.bonus = { phy: eff.phy - a.phy, acu: eff.acu - a.acu, wil: eff.wil - a.wil };
    return eff;
  }

  function effSpecLevel(name) {
    var base = clamp($("spec-" + name).value, 0, MAX_SPEC_LEVEL);
    return base + (geneMods().specs[name] || 0);
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

  // 注意：renderGenePools 的 build() 以“基因对象”调用分类函数（与 nonNegCat 一致）
  function negCat(g) {
    var name = (g && g.name) || "";
    // 先去掉 Lv.x 后缀（如「单科生 Lv.1」→「单科生」），按基础名称归类
    var base = name.replace(/ Lv\.\d+$/, "");
    if (["脆弱", "呆滞", "麻木", "四体不勤", "输在起跑线"].indexOf(base) !== -1) return "属性削弱类";
    if (["贫血", "夜盲", "惧火", "玻璃心", "怯场", "笨手笨脚"].indexOf(base) !== -1) return "战斗限制类";
    if (["结巴", "脸盲", "疑心", "迷信", "恐高", "幽闭", "自闭", "刻板", "易垮", "悲观", "单科生"].indexOf(base) !== -1) return "社交/认知限制类";
    if (["灾星", "回声", "罪孽"].indexOf(base) !== -1) return "特殊诅咒类";
    return "其他";
  }

  function genePickHTML(g, i, kind, checked) {
    var badgeCls = kind === "p" ? g.rarity : "negative";
    var badgeTxt = kind === "p" ? R_LABEL[g.rarity] : "负面";
    return '<label class="gene-pick gene-' + badgeCls + '"><input type="checkbox" class="gene-cb" data-kind="' + kind + '" data-idx="' + i + '"' +
      (checked ? " checked" : "") + '><div style="flex:1"><div class="gp-name">' + esc(g.name) +
      ' <span class="gene-badge ' + badgeCls + '">' + badgeTxt + "</span></div>" +
      '<div class="gp-effect">' + fmtBold(g.effect) + "</div>" +
      '<div class="gp-hint">' + esc(g.hint) + "</div>" +
      (g.note ? '<div class="gp-note">备注：' + esc(g.note) + "</div>" : "") +
      "</div></label>";
  }

  function renderGenePools() {
    var poolP = $("g-gene-pool-p"), poolN = $("g-gene-pool-n");
    if (!poolP || !poolN) return;

    function build(container, list, kind, catFn) {
      var cats = [];
      list.forEach(function (g) {
        var c = catFn(g);
        if (cats.indexOf(c) === -1) cats.push(c);
      });
      var quick = document.createElement("div");
      quick.className = "gene-quicknav";
      var dets = {};
      cats.forEach(function (c) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = c;
        btn.addEventListener("click", function () {
          var det = dets[c];
          if (!det) return;
          var willOpen = !det.open;
          det.open = willOpen;
          btn.classList.toggle("on", willOpen);
          if (willOpen) det.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        quick.appendChild(btn);
      });
      container.innerHTML = "";
      container.appendChild(quick);
      cats.forEach(function (c) {
        var items = list.filter(function (g) { return catFn(g) === c; });
        var det = document.createElement("details");
        det.className = "gene-family";
        var sum = document.createElement("summary");
        sum.textContent = c + "（" + items.length + " 个）";
        det.appendChild(sum);
        items.forEach(function (g, idx) {
          var realIdx = kind === "p" ? GENE.nonNegative.indexOf(g) : GENE.negative.indexOf(g);
          var checked = kind === "p" ? selectedPNames[g.name] : selectedNNames[g.name];
          var div = document.createElement("div");
          div.innerHTML = genePickHTML(g, realIdx, kind, !!checked);
          det.appendChild(div);
        });
        dets[c] = det;
        container.appendChild(det);
      });
    }

    build(poolP, GENE.nonNegative, "p", nonNegCat);
    build(poolN, GENE.negative, "n", negCat);
    if (window.KWFilter) window.KWFilter.refresh();
  }

  // 已选基因详细展示（与列表一致的详情：名称/稀有度/效果/扮演提示/备注）
  function renderGeneResult() {
    var box = $("g-gene-result");
    if (!box) return;
    var s = selectedGenes();
    var html = "";
    s.p.forEach(function (g) {
      html += '<div class="gene-pick gene-' + g.rarity + '"><div style="flex:1"><div class="gp-name">' + esc(g.name) +
        ' <span class="gene-badge ' + g.rarity + '">' + R_LABEL[g.rarity] + "</span></div>" +
        '<div class="gp-effect">' + fmtBold(g.effect) + "</div>" +
        '<div class="gp-hint">' + esc(g.hint) + "</div>" +
        (g.note ? '<div class="gp-note">备注：' + esc(g.note) + "</div>" : "") + "</div></div>";
    });
    s.n.forEach(function (g) {
      html += '<div class="gene-pick gene-negative"><div style="flex:1"><div class="gp-name">' + esc(g.name) +
        ' <span class="gene-badge negative">负面</span></div>' +
        '<div class="gp-effect">' + fmtBold(g.effect) + "</div>" +
        '<div class="gp-hint">' + esc(g.hint) + "</div>" +
        (g.note ? '<div class="gp-note">备注：' + esc(g.note) + "</div>" : "") + "</div></div>";
    });
    box.innerHTML = (html ? '<p style="margin:4px 0 8px"><strong>已选基因：</strong></p>' + html : "");
  }

  // 互斥：同一 exclusive 组内的基因不可同选（跨正负面）
  function enforceGeneMutual() {
    syncGeneNames();
    var groupOwner = {};
    var checked = [];
    document.querySelectorAll('.gene-cb:checked').forEach(function (cb) {
      var idx = parseInt(cb.getAttribute("data-idx"), 10);
      var pool = cb.getAttribute("data-kind") === "p" ? GENE.nonNegative : GENE.negative;
      var g = pool[idx];
      if (g && g.exclusive) checked.push({ cb: cb, g: g });
    });
    checked.forEach(function (item) {
      if (!groupOwner[item.g.exclusive]) groupOwner[item.g.exclusive] = item.g.name;
    });
    checked.forEach(function (item) {
      if (groupOwner[item.g.exclusive] && groupOwner[item.g.exclusive] !== item.g.name) {
        item.cb.checked = false;
      }
    });
    syncGeneNames();
  }

  function syncGeneNames() {
    selectedPNames = {};
    selectedNNames = {};
    document.querySelectorAll('.gene-cb[data-kind="p"]:checked').forEach(function (cb) {
      var g = GENE.nonNegative[parseInt(cb.getAttribute("data-idx"), 10)];
      if (g) selectedPNames[g.name] = true;
    });
    document.querySelectorAll('.gene-cb[data-kind="n"]:checked').forEach(function (cb) {
      var g = GENE.negative[parseInt(cb.getAttribute("data-idx"), 10)];
      if (g) selectedNNames[g.name] = true;
    });
  }

  // 随机抽取：非负面按 普通50%/罕见35%/稀有15%，负面等概率；互斥组内只取一个
  function randomSelectGenes() {
    var pcount = genePCount(), ncount = geneNCount();
    var availP = GENE.nonNegative.slice();
    var availN = GENE.negative.slice();
    var used = {};
    var usedGroup = {};
    var picksP = [];
    for (var i = 0; i < pcount; i++) {
      var pool = availP.filter(function (g) {
        return !used[g.name] && !(g.exclusive && usedGroup[g.exclusive]);
      });
      if (!pool.length) break;
      var w = GENE.randomWeight;
      var rarity = null;
      for (var t = 0; t < 12; t++) {
        var r = Math.random() * 100;
        rarity = r < w.common ? "common" : (r < w.common + w.rare ? "rare" : "epic");
        if (pool.some(function (g) { return g.rarity === rarity; })) break;
      }
      if (!pool.some(function (g) { return g.rarity === rarity; })) rarity = pool[0].rarity;
      var candidates = pool.filter(function (g) { return g.rarity === rarity; });
      var pick = candidates[Math.floor(Math.random() * candidates.length)];
      used[pick.name] = true;
      if (pick.exclusive) usedGroup[pick.exclusive] = true;
      picksP.push(pick);
    }
    var picksN = [];
    for (var j = 0; j < ncount && availN.length; j++) {
      var candidates = availN.filter(function (g) { return !(g.exclusive && usedGroup[g.exclusive]); });
      if (!candidates.length) break;
      var idx = Math.floor(Math.random() * candidates.length);
      var pick = candidates[idx];
      availN.splice(availN.indexOf(pick), 1);
      if (pick.exclusive) usedGroup[pick.exclusive] = true;
      picksN.push(pick);
    }
    selectedPNames = {};
    selectedNNames = {};
    picksP.forEach(function (g) { selectedPNames[g.name] = true; });
    picksN.forEach(function (g) { selectedNNames[g.name] = true; });
    renderGenePools();
    enforceGeneMutual();
    renderGeneResult();
    updateAttrs();
    updateSpecs();
  }

  function bindGenePanel() {
    var enable = $("g-gene-enable"), panel = $("g-gene-panel");
    if (!enable || !panel) return;
    enable.addEventListener("change", function () {
      panel.style.display = this.checked ? "block" : "none";
      renderGeneResult();
      updateAttrs();
      updateSpecs();
    });
    $("g-gene-pcount").addEventListener("change", function () {
      $("g-gene-pneed").textContent = genePCount();
      document.querySelectorAll('.gene-cb[data-kind="p"]:checked').forEach(function (cb, i) {
        if (i >= genePCount()) cb.checked = false;
      });
      syncGeneNames();
      enforceGeneMutual();
      renderGeneResult();
      updateAttrs();
      updateSpecs();
    });
    $("g-gene-ncount").addEventListener("change", function () {
      $("g-gene-nneed").textContent = geneNCount();
      document.querySelectorAll('.gene-cb[data-kind="n"]:checked').forEach(function (cb, i) {
        if (i >= geneNCount()) cb.checked = false;
      });
      syncGeneNames();
      renderGeneResult();
      updateAttrs();
      updateSpecs();
    });
    document.querySelectorAll('input[name="g-genemode"]').forEach(function (r) {
      r.addEventListener("change", function () {
        $("g-gene-pick").style.display = geneMode() === "pick" ? "block" : "none";
        $("g-gene-random").style.display = geneMode() === "random" ? "block" : "none";
      });
    });
    $("g-gene-roll").addEventListener("click", randomSelectGenes);
    panel.addEventListener("change", function (e) {
      var cb = e.target;
      if (!cb || !cb.classList || !cb.classList.contains("gene-cb")) return;
      var limit = cb.getAttribute("data-kind") === "p" ? genePCount() : geneNCount();
      var count = document.querySelectorAll('.gene-cb[data-kind="' + cb.getAttribute("data-kind") + '"]:checked').length;
      if (cb.checked && count > limit) { cb.checked = false; return; }
      enforceGeneMutual();
      renderGeneResult();
      updateAttrs();
      updateSpecs();
    });
  }

  function renderRuneList() {
    var box = $("g-rune-list");
    if (!box) return;
    rememberSelection();
    box.innerHTML = "";
    var lib = window.RUNE_LIBRARY || [];
    if (!lib.length) return;

    // 快捷索引（点击展开/收起对应系谱）
    var quick = document.createElement("div");
    quick.className = "rune-quicknav";
    lib.forEach(function (family) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = family.name;
      btn.setAttribute("data-family", family.name);
      btn.addEventListener("click", function () {
        var det = document.getElementById("rf-" + family.name);
        if (!det) return;
        var willOpen = !det.open;
        det.open = willOpen;
        btn.classList.toggle("on", willOpen);
        if (willOpen) det.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      quick.appendChild(btn);
    });
    box.appendChild(quick);

    // 折叠的系谱分组（奇迹需对应解锁码或讲述者模式可见，解锁后可作为初始符文选择）
    lib.forEach(function (family) {
      var selectable = family.runes.filter(function (r) {
        if (!r.miracle) return true;
        if (narratorOn()) return true;
        return !!(r.lock && window.UNLOCKS && window.UNLOCKS.isOpen(r.lock));
      });
      if (selectable.length === 0) return;

      var det = document.createElement("details");
      det.className = "rune-family";
      det.id = "rf-" + family.name;

      var sum = document.createElement("summary");
      sum.textContent = family.name + "（" + selectable.length + " 个符文）";
      det.appendChild(sum);

      selectable.forEach(function (r) {
        var wrap = document.createElement("label");
        wrap.className = "rune-pick" +
          (r.miracle ? " gm-only" + (r.lock ? " u-" + r.lock : "") : "");
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "rune-cb";
        cb.setAttribute("data-name", r.name);
        cb.setAttribute("data-cost", r.cost === "—" ? "0" : r.cost);
        cb.setAttribute("data-family", family.name);
        cb.setAttribute("data-summary", r.summary);
        if (r.miracle) cb.setAttribute("data-miracle", "1");
        if (selectedNames[r.name]) cb.checked = true;
        cb.addEventListener("change", onRuneChange);

        var body = document.createElement("div");
        body.style.flex = "1";
        var nameRow = document.createElement("div");
        nameRow.className = "rp-name";
        var link = document.createElement("a");
        link.href = "runes/" + encodeURIComponent(r.name) + ".html";
        link.target = "_blank";
        link.textContent = r.name;
        nameRow.appendChild(link);
        if (r.miracle) {
          var badge = document.createElement("span");
          badge.className = "badge miracle";
          badge.textContent = "奇迹";
          nameRow.appendChild(badge);
        }
        var meta = document.createElement("div");
        meta.className = "rp-meta";
        meta.textContent = "平均消耗 " + r.cost + " · " + family.name + " · " + r.summary +
          (r.miracle ? "（奇迹：不计入常规算力消耗；选择后不可再勾选灵魂记忆）" : "");
        body.appendChild(nameRow);
        body.appendChild(meta);
        wrap.appendChild(cb);
        wrap.appendChild(body);
        det.appendChild(wrap);
      });
      box.appendChild(det);
    });
    if (window.KWFilter) window.KWFilter.refresh();
  }

  function renderSpecList() {
    var box = $("g-spec-list");
    box.innerHTML = "";
    SPECIALTIES.forEach(function (s) {
      var row = document.createElement("div");
      row.className = "spec-row";
      var left = document.createElement("div");
      left.innerHTML = '<span class="spec-name">' + esc(s.name) +
        '</span><span class="spec-rel">关联 ' + esc(s.rel) + ' · ' + esc(s.use) + "</span>";
      var stepper = document.createElement("div");
      stepper.className = "stepper";

      var minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      var val = document.createElement("span");
      val.className = "spec-val";
      val.id = "specval-" + s.name;
      var plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";

      var hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.id = "spec-" + s.name;
      hidden.value = "0";

      minus.addEventListener("click", function () {
        var cur = clamp(hidden.value, 0, MAX_SPEC_LEVEL);
        if (cur > 0) hidden.value = cur - 1;
        updateSpecs();
      });
      plus.addEventListener("click", function () {
        var cur = clamp(hidden.value, 0, MAX_SPEC_LEVEL);
        var used = specUsed();
        if (cur < MAX_SPEC_LEVEL && used < Math.max(0, TOTAL_SPEC + geneMods().specPoints)) hidden.value = cur + 1;
        updateSpecs();
      });

      stepper.appendChild(minus);
      stepper.appendChild(val);
      stepper.appendChild(plus);
      row.appendChild(left);
      row.appendChild(stepper);
      row.appendChild(hidden);
      box.appendChild(row);
    });
  }

  function specUsed() {
    var sum = 0;
    SPECIALTIES.forEach(function (s) {
      sum += clamp($("spec-" + s.name).value, 0, MAX_SPEC_LEVEL);
    });
    return sum;
  }

  /* ---------- 联动更新 ---------- */

  function updateSpecs() {
    var gmods = geneMods();
    var pool = Math.max(0, TOTAL_SPEC + gmods.specPoints);
    var used = specUsed();
    var left = $("g-spec-left");
    left.textContent = (pool - used);
    left.className = "points-left " + (used <= pool ? "ok" : "bad");
    var t = $("g-spec-total");
    if (t) t.textContent = pool + " 点";
    SPECIALTIES.forEach(function (s) {
      var base = clamp($("spec-" + s.name).value, 0, MAX_SPEC_LEVEL);
      var bonus = gmods.specs[s.name] || 0;
      var effLvl = base + bonus;
      $("specval-" + s.name).textContent = effLvl + " 级" +
        (bonus ? "（基因 " + (bonus > 0 ? "+" : "") + bonus + "）" : "");
    });
    renderCard();
  }

  function updateAttrs() {
    var a = getAttrs();
    var gm = geneMods();
    var attrPool = Math.max(0, TOTAL_ATTR + gm.attrPoints);
    var sum = a.acu + a.wil + a.phy;
    var left = attrPool - sum;
    var pl = $("g-points-left");
    pl.textContent = left;
    pl.className = "points-left " + (left >= 0 ? "ok" : "bad");
    var at = $("g-attr-total");
    if (at) at.textContent = attrPool + " 点";

    var effA = effAttrs();
    var gAttr = [["g-acu", "g-acu-mod", "g-acu-gene", "acu"], ["g-wil", "g-wil-mod", "g-wil-gene", "wil"], ["g-phy", "g-phy-mod", "g-phy-gene", "phy"]];

    [["g-acu", "g-acu-r", "g-acu-mod", "acu"], ["g-wil", "g-wil-r", "g-wil-mod", "wil"], ["g-phy", "g-phy-r", "g-phy-mod", "phy"]].forEach(function (t) {
      var num = $(t[0]), range = $(t[1]);
      var max = attrMaxFor(t[3]);
      num.max = max;
      range.max = max;
      var v = clamp(num.value, MIN_ATTR, max);
      num.value = v;
      range.value = v;
      num.classList.toggle("warn", left < 0);
      $(t[2]).textContent = (attrMod(v) > 0 ? "+" : "") + attrMod(v);
    });

    // 属性框内显示基因加成（另起一行）
    gAttr.forEach(function (t) {
      var gene = $(t[2]);
      if (gene) {
        var b = effA.bonus[t[3]];
        gene.textContent = b ? "基因 " + (b > 0 ? "+" : "") + b + "（有效 " + effA[t[3]] + "）" : "";
      }
    });

    // 衍生属性（基于有效属性 = 分配值 + 基因加成）
    var hp = effA.phy * 10 + 20 + gm.hp;
    var sta = effA.phy * 5 + 10;
    var res = Math.floor(effA.phy / 3) + gm.res;
    if (gm.resHalf) res = Math.floor(res / 2);
    var wilCap = effA.wil * 10 + 20;
    var slots = isDeconstructor() ? 1 : Math.floor(effA.acu / 10) + 1;
    var eff = effectiveCost();
    var avail = effA.acu - eff;
    var soulTip = soulEnabled() && soulValue() > 0 ? "（灵魂记忆抵扣 " + soulValue() + "）" : "";

    $("g-derived").innerHTML = [
      derivedItem("生命上限（HP）", hp),
      derivedItem("体力池（STA）", sta),
      derivedItem("物理抗性", res),
      derivedItem("愿力上限", wilCap),
      derivedItem("符文槽位", slots),
      derivedItem("当前可用算力" + soulTip, avail, avail < 0)
    ].join("");

    $("g-rune-limit-label").textContent = runeLimit() + " 个符文";

    // 灵魂记忆勾选后才允许输入抵扣值
    var sv = $("g-soul-value");
    if (sv) sv.disabled = !soulEnabled();

    // 有效消耗超过算力上限时给出提示（不强制取消选择，便于调整）
    if (eff > a.acu) {
      showRuneMsg(
        "扣除灵魂记忆抵扣后，所选符文的有效消耗（<strong>" + eff + "</strong>）仍超过算力上限（<strong>" + a.acu + "</strong>）。",
        "danger"
      );
    } else {
      hideRuneMsg();
    }
    renderCard();
  }

  function derivedItem(label, value, neg) {
    return '<div class="derived-item"><div class="d-label">' + label +
      '</div><div class="d-value' + (neg ? " neg" : "") + '">' + value + "</div></div>";
  }

  function onRuneChange(e) {
    var cb = e.target;
    // 选中奇迹时先解除灵魂记忆（互斥），再按最新状态计算限制
    updateSoulState();
    var limit = runeLimit();
    var selected = getSelectedRunes();
    var a = getAttrs();
    selectedNames = {};
    selected.forEach(function (r) { selectedNames[r.name] = true; });

    // 数量限制
    if (cb.checked && selected.length > limit) {
      cb.checked = false;
      delete selectedNames[cb.getAttribute("data-name")];
      showRuneMsg("初始符文最多只能选择 <strong>" + limit + "</strong> 个" +
        (isDeconstructor() ? "（解构师）" : "") + (soulEnabled() ? "（含灵魂记忆带来的额外 1 个）" : "") + "，请先取消已选符文。");
      updateAttrs();
      return;
    }
    // 算力上限（考虑灵魂记忆抵扣）
    var eff = effectiveCost();
    if (cb.checked && eff > a.acu) {
      cb.checked = false;
      delete selectedNames[cb.getAttribute("data-name")];
      var detail = soulEnabled() && soulValue() > 0
        ? "（符文总消耗 " + totalRuneCost() + " − 灵魂记忆抵扣 " + soulValue() + "）"
        : "（" + totalRuneCost() + "）";
      showRuneMsg("所选符文的有效算力消耗 <strong>" + eff + "</strong> " + detail + " 超过你的算力上限（<strong>" + a.acu + "</strong>），已取消该选择。", "danger");
      updateAttrs();
      return;
    }
    hideRuneMsg();
    updateSoulState();
    updateAttrs();
  }

  function 识质() {
    return $("g-modifier").value + $("g-hue").value;
  }

  /* ---------- 角色卡 ---------- */

  function buildCardText() {
    var a = getAttrs();
    var runes = getSelectedRunes();
    var specs = getSpecs();
    var cost = totalRuneCost();
    var eff = effectiveCost();
    var hasSoul = soulEnabled();
    var effA = effAttrs();
    var gm = geneMods();
    var genes = selectedGenes();

    var hp = effA.phy * 10 + 20 + gm.hp;
    var sta = effA.phy * 5 + 10;
    var res = Math.floor(effA.phy / 3) + gm.res;
    if (gm.resHalf) res = Math.floor(res / 2);
    var wilCap = effA.wil * 10 + 20;
    var slots = isDeconstructor() ? 1 : Math.floor(effA.acu / 10) + 1;

    function attrLine(name, key) {
      var b = effA.bonus[key];
      return name + "：" + effA[key] + (b ? "（基因 " + (b > 0 ? "+" : "") + b + "）" : "");
    }

    var lines = [];
    lines.push("【角色名】" + ($("g-name").value.trim() || "（未填写）"));
    lines.push("【识质】" + 识质());
    lines.push("【源动力】" + ($("g-drive").value.trim() || "（未填写）"));
    lines.push("【所属组织】" + ($("g-org").value.trim() || "（未填写）"));
    lines.push("");
    lines.push("【基础属性】");
    lines.push(attrLine("算力（ACU）", "acu"));
    lines.push(attrLine("愿力（WIL）", "wil"));
    lines.push(attrLine("体魄（PHY）", "phy"));
    lines.push("");
    lines.push("【衍生属性】");
    lines.push("生命上限（HP）：" + hp);
    lines.push("体力池（STA）：" + sta);
    lines.push("物理抗性：" + res);
    lines.push("愿力上限：" + wilCap);
    lines.push("符文槽位：" + slots);
    lines.push("当前可用算力：" + (effA.acu - eff) + (hasSoul && soulValue() > 0 ? "（含灵魂记忆抵扣 " + soulValue() + "）" : ""));
    lines.push("");
    lines.push("【符文列表】");
    lines.push("   符文名 | 消耗 | 系别 | 效果");
    if (runes.length === 0) {
      lines.push("（未选择符文）");
    } else {
      runes.forEach(function (r, i) {
        lines.push((i + 1) + ". " + r.name + " | " + r.cost + " | " + r.family + " | " + r.summary);
      });
    }
    if (hasSoul) {
      lines.push("");
      lines.push("【灵魂记忆】");
      lines.push("是（抵扣算力 " + soulValue() + "，可额外选择 1 个初始符文）");
    }
    if (geneEnabled() && (genes.p.length || genes.n.length)) {
      lines.push("");
      lines.push("【基因】");
      genes.p.forEach(function (g) {
        lines.push(g.name + "（" + R_LABEL[g.rarity] + "）：" + g.effect.replace(/\*\*/g, "") + "　扮演：" + g.hint);
      });
      genes.n.forEach(function (g) {
        lines.push(g.name + "（负面）：" + g.effect.replace(/\*\*/g, "") + "　扮演：" + g.hint);
      });
    }
    lines.push("");
    lines.push("【专精】");
    SPECIALTIES.forEach(function (s) {
      var base = specs[s.name];
      var bonus = gm.specs[s.name] || 0;
      lines.push(s.name + "：" + (base + bonus) + " 级" + (bonus ? "（基因 " + (bonus > 0 ? "+" : "") + bonus + "）" : ""));
    });
    lines.push("");
    lines.push("【背景简述】" + ($("g-background").value.trim() || "（未填写）"));
    lines.push("【关键记忆】" + ($("g-memory").value.trim() || "（未填写）"));
    lines.push("【个人目标】" + ($("g-goal").value.trim() || "（未填写）"));
    return lines.join("\n");
  }

  function renderCard() {
    $("g-card").textContent = buildCardText();
    var a = getAttrs();
    var gm = geneMods();
    var pl = Math.max(0, TOTAL_ATTR + gm.attrPoints) - (a.acu + a.wil + a.phy);
    $("g-points-left").textContent = pl;

    // 识质含义预览
    var mod = $("g-modifier").value, hue = $("g-hue").value;
    var mInfo = MODIFIERS.filter(function (m) { return m.name === mod; })[0];
    var hInfo = HUES.filter(function (h) { return h.name === hue; })[0];
    var p = $("g-识质-preview");
    if (p) {
      p.textContent = "识质 = 修饰词 + 主色调 → " + mod + hue +
        "（" + (mInfo ? mInfo.meaning : "") + "；" + (hInfo ? hInfo.core : "") + "）";
    }
  }

  /* ---------- 导出 / 复制 / 示例 / 重置 ---------- */

  function exportCard() {
    var text = buildCardText();
    var name = $("g-name").value.trim() || "未命名角色";
    var blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function copyCard() {
    var text = buildCardText();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        flash("角色卡已复制到剪贴板");
      }, fallback);
    } else {
      fallback();
      flash("角色卡已复制到剪贴板");
    }
  }

  function flash(msg) {
    var d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#232a35;color:#fff;padding:10px 18px;border-radius:8px;z-index:99;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.25)";
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 1800);
  }

  function loadExample() {
    $("g-name").value = "刘思明";
    $("g-modifier").value = "冷";
    $("g-hue").value = "灰白";
    $("g-drive").value = "我要阻止那些本不该发生的悲剧重演。";
    $("g-org").value = "梦境裁判所（特别行动科）";
    $("g-acu").value = 16; $("g-acu-r").value = 16;
    $("g-wil").value = 14; $("g-wil-r").value = 14;
    $("g-phy").value = 10; $("g-phy-r").value = 10;
    $("g-deconstructor").checked = false;
    $("g-soul").checked = false;
    $("g-soul-value").value = 0;

    document.querySelectorAll(".rune-cb").forEach(function (cb) {
      cb.checked = false;
    });
    var want = ["梦境推演"];
    document.querySelectorAll(".rune-cb").forEach(function (cb) {
      if (want.indexOf(cb.getAttribute("data-name")) !== -1) cb.checked = true;
    });

    var specVals = { "调查": 2, "神秘学": 2, "追踪": 1, "潜行": 1, "话术": 1, "察言观色": 1, "急救": 1, "灵感": 1 };
    SPECIALTIES.forEach(function (s) {
      $("spec-" + s.name).value = specVals[s.name] || 0;
    });

    $("g-background").value = "幼时离开故乡雨竹村，一场大火将村庄化为灰烬，他成为唯一的幸存者，此后被梦境裁判所收留，成长为特别行动科的调查员。曾为追查混沌基点使用禁忌符文「虚构观想」，以「时间」作为代价，此后只能稳定使用「梦境推演」一个符文。";
    $("g-memory").value = "火灾当夜，一个浑身缠绕黑色锁链的身影把他从火场中拖出，随即消失在夜色里。";
    $("g-goal").value = "找到当年那个身影，查清那场大火背后的混沌基点，让类似的悲剧不再发生。";

    hideRuneMsg();
    resetGenes();
    updateAttrs();
    updateSpecs();
  }

  function resetForm() {
    $("g-name").value = "";
    $("g-modifier").value = "温";
    $("g-hue").value = "橙黄";
    $("g-drive").value = "";
    $("g-org").value = "";
    $("g-acu").value = 10; $("g-acu-r").value = 10;
    $("g-wil").value = 10; $("g-wil-r").value = 10;
    $("g-phy").value = 10; $("g-phy-r").value = 10;
    $("g-deconstructor").checked = false;
    $("g-soul").checked = false;
    $("g-soul-value").value = 0;
    document.querySelectorAll(".rune-cb").forEach(function (cb) { cb.checked = false; });
    SPECIALTIES.forEach(function (s) { $("spec-" + s.name).value = 0; });
    $("g-background").value = "";
    $("g-memory").value = "";
    $("g-goal").value = "";
    hideRuneMsg();
    resetGenes();
    updateAttrs();
    updateSpecs();
  }

  // 重置基因状态（不勾选启用，清空选择）
  function resetGenes() {
    var enable = $("g-gene-enable");
    if (enable) {
      enable.checked = false;
      $("g-gene-panel").style.display = "none";
    }
    document.querySelectorAll(".gene-cb").forEach(function (cb) { cb.checked = false; });
    selectedPNames = {};
    selectedNNames = {};
    if ($("g-gene-result")) $("g-gene-result").innerHTML = "";
    if ($("g-gene-pneed")) $("g-gene-pneed").textContent = genePCount();
    if ($("g-gene-nneed")) $("g-gene-nneed").textContent = geneNCount();
  }

  /* ---------- 事件绑定 ---------- */

  function bindEvents() {
    var pairs = [["g-acu", "g-acu-r", "acu"], ["g-wil", "g-wil-r", "wil"], ["g-phy", "g-phy-r", "phy"]];
    pairs.forEach(function (p) {
      $(p[0]).addEventListener("input", function () { $(p[1]).value = clamp(this.value, MIN_ATTR, attrMaxFor(p[2])); updateAttrs(); });
      $(p[1]).addEventListener("input", function () { $(p[0]).value = clamp(this.value, MIN_ATTR, attrMaxFor(p[2])); updateAttrs(); });
    });

    ["g-modifier", "g-hue"].forEach(function (id) {
      $(id).addEventListener("change", function () { renderCard(); });
    });

    $("g-deconstructor").addEventListener("change", function () {
      // 超出当前上限则清空多余选择
      var limit = runeLimit();
      var selected = getSelectedRunes();
      if (selected.length > limit) {
        document.querySelectorAll(".rune-cb:checked").forEach(function (cb, i) {
          if (i >= limit) cb.checked = false;
        });
      }
      updateAttrs();
    });

    // 灵魂记忆：勾选后可输入抵扣数值，并额外获得 1 个初始符文位
    $("g-soul").addEventListener("change", function () {
      $("g-soul-value").disabled = !this.checked;
      if (!this.checked) $("g-soul-value").value = 0;
      updateAttrs();
    });
    $("g-soul-value").addEventListener("input", function () {
      this.value = Math.max(0, parseInt(this.value, 10) || 0);
      updateAttrs();
    });

    // 讲述者模式 / 解锁状态变化后重建符文列表（奇迹条目随模式/解锁显隐）
    function rebuildRuneList() {
      renderRuneList();
      updateSoulState();
      updateAttrs();
    }
    document.addEventListener("narratorchange", rebuildRuneList);
    document.addEventListener("unlockchange", rebuildRuneList);

    ["g-drive", "g-name", "g-org", "g-background", "g-memory", "g-goal"].forEach(function (id) {
      $(id).addEventListener("input", renderCard);
    });

    $("g-export").addEventListener("click", exportCard);
    $("g-copy").addEventListener("click", copyCard);
    $("g-example").addEventListener("click", loadExample);
    $("g-reset").addEventListener("click", resetForm);

    bindGenePanel();
  }

  /* ---------- 启动 ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    renderHueSelects();
    renderRefTables();
    renderRuneList();
    renderSpecList();
    bindEvents();
    renderGenePools();
    $("g-gene-panel").style.display = "none";
    $("g-gene-pick").style.display = "block";
    $("g-gene-random").style.display = "none";
    $("g-gene-pneed").textContent = genePCount();
    $("g-gene-nneed").textContent = geneNCount();
    updateSpecs();
    updateSoulState();
    updateAttrs();
  });
})();
