/* ==========================================================================
 * 站内搜索（右上角搜索框）
 * - 索引：主页面 + 世界观章节 + 系谱/符文条目（数据来自 rune-data.js）
 * - 讲述者模式关闭时，不返回/不展示“仅讲述者”条目（奇迹、世界观机密章节）
 * - 依赖：window.NAV.base、window.RUNE_LIBRARY（rune-data.js）、window.NARRATOR
 * ========================================================================== */
(function () {
  "use strict";

  var BASE = (window.NAV && window.NAV.base) || "";

  /* ---------- 索引 ---------- */

  var STATIC_INDEX = [
    { t: "主页", u: "index.html", c: "页面", d: "欢迎 愿力 算力 符文 识质 轮回者 开始", g: false },
    { t: "序章：什么是TRPG？", u: "trpg.html", c: "页面", d: "TRPG 桌上角色扮演 跑团 主持人 玩家 角色卡 骰子 检定 规则书 新手入门", g: false },
    { t: "角色创建指南", u: "guide.html", c: "页面", d: "创建 识质 源动力 基础属性 衍生属性 专精 角色卡 导出 灵魂记忆 符文选择", g: false },
    { t: "世界观", u: "worldview.html", c: "页面", d: "基础设定 愿力 观察者效应 识质 符文 轮回者 觉醒 灵魂印记 梦境裁判所 记忆档案 混沌 名词对照", g: false },
    { t: "世界观 · 基本法则", u: "worldview/基本法则.html", c: "世界观", d: "基本法则 愿力 观察者效应 识质 符文本质 算力 第六感", g: false },
    { t: "世界观 · 混沌", u: "worldview/混沌.html", c: "世界观", d: "混沌 本质 等价交换 污染 混沌造物 浓度等级", g: false },
    { t: "世界观 · 轮回", u: "worldview/轮回.html", c: "世界观 · 需解锁", d: "轮回 轮回者 觉醒 灵魂印记 基耶夏韦 轮回巨构 转世 识觉抑制 余烬纪元 无瑕纪元 新芽纪元 地心", g: false, l: "kijexawe" },
    { t: "世界观 · 种族", u: "worldview/种族.html", c: "世界观", d: "种族 生物 物质域 灵质域 生命力 活体生物 灵体生物 鬼魂 神话生物 混沌造物 混沌转化 智慧生物 人造生物 符文实体 纯粹生物 伤害速查表", g: false },
    { t: "世界观 · 审判日", u: "worldview.html#gm-judgement-day", c: "世界观 · 讲述者", d: "审判日 堕神 降临 预测 奇迹 希望 隐患", g: true },
    { t: "世界观 · 海德里斯与复乐园", u: "worldview.html#gm-hydris", c: "世界观 · 讲述者", d: "海德里斯 太阳的后裔 永生者 抗争派 复乐园 失乐园 生命力转移 混沌同化", g: true },
    { t: "世界观 · 奇迹符文的深层设定", u: "worldview.html#gm-miracle", c: "世界观 · 讲述者", d: "奇迹 共同性质 灵魂记忆 继承 解析 已知奇迹 代价 堕神", g: true },
    { t: "世界观 · 混沌与堕神的深层机制", u: "worldview.html#gm-chaos", c: "世界观 · 讲述者", d: "混沌造物 大灰狼 雨竹村 堕神层级 地心巨构 灵魂不灭", g: true },
    { t: "组织", u: "orgs.html", c: "页面", d: "组织 梦境裁判所 蔷薇学会 混沌导引学派 其它派系 轮回者组织", g: false },
    { t: "组织 · 梦境裁判所", u: "orgs/梦境裁判所.html", c: "组织", d: "梦境裁判所 总部 曙川市 九层 第七层 特别行动科 处决科 秘密保护科 占卜科 职级 记忆库 制式符文", g: false },
    { t: "组织 · 蔷薇学会", u: "orgs/蔷薇学会.html", c: "组织", d: "蔷薇学会 符文解构学 解构师 斯图尔特·史密斯 符文解构概论 密克罗林 董事会 会员", g: false },
    { t: "组织 · 混沌导引学派", u: "orgs/混沌导引学派.html", c: "组织", d: "混沌导引学派 混沌 研究 抑制 隐秘", g: false },
    { t: "组织 · 失乐园和复乐园", u: "orgs/失乐园和复乐园.html", c: "组织", d: "失乐园 复乐园 海德里斯 永生者 抗争派 自然派 谎言派 降临派 原罪 混沌屏蔽 空间结界 传闻", g: false },
    { t: "探索与成长", u: "explore.html", c: "页面", d: "探索 成长 专精 调查 神秘学 格斗 潜行 追踪 话术 察言观色 野外生存 急救 机械修理 外语 灵感 恢复 生命值 体力池 愿力 事件 空闲时间 体魄 观想 符文 奇遇 羁绊 里程碑 记录表", g: false },
    { t: "战斗规则", u: "combat.html", c: "页面", d: "战斗 标准行动 快速行动 距离 战斗轮 流程图 先攻 偷袭 攻击检定 伤害 减免 相生 相克 示意图 防御 状态 混沌浓度 识质共鸣 速查表", g: false },
    { t: "符文库", u: "runes.html", c: "页面", d: "符文 系谱 索引 物质 能量 空间 生命 意识 因果 时间 解构 奇迹", g: false },
    { t: "符文库 · 奇迹", u: "runes/奇迹.html", c: "符文库 · 讲述者", d: "奇迹 奇迹符文 虚构观想 定界幻灭 逆灵转生 灵魂记忆 继承", g: true },
    { t: "基因", u: "genes.html", c: "页面", d: "基因 可选系统 稀有度 普通 罕见 稀有 负面 属性 专精 扮演提示 角色创建", g: false },
    { t: "海德里斯语", u: "hydris.html", c: "语言 · 需解锁", d: "海德里斯 太阳之子 hyderisi 语言 简介 特点 语法 词典", g: false, l: "hyderisi" },
    { t: "海德里斯语 · 语法", u: "hydris/grammar.html", c: "语言 · 需解锁", d: "语法指南 语序 时态 情态 否定 疑问 被动 使动 比较 定语 状语 黏着 数词 感叹", g: false, l: "hyderisi" },
    { t: "海德里斯语 · 词典", u: "hydris/translate.html", c: "语言 · 需解锁", d: "词典 查找 词汇 翻译 互译 海德里斯语 中文", g: false, l: "hyderisi" },
    { t: "关于", u: "about.html", c: "页面", d: "版权 开源 声明 讲述者 免责 使用说明 更新记录", g: false }
  ];

  function buildIndex() {
    var entries = STATIC_INDEX.map(function (e) {
      return { t: e.t, u: BASE + e.u, c: e.c, d: e.d, g: e.g, l: e.l || null };
    });

    var lib = window.RUNE_LIBRARY;
    if (lib) {
      lib.forEach(function (f) {
        entries.push({
          t: f.name,
          u: BASE + "runes/" + encodeURIComponent(f.name) + ".html",
          c: "系谱",
          d: f.core + " " + f.runes.map(function (r) { return r.name; }).join(" "),
          g: false
        });
        f.runes.forEach(function (r) {
          entries.push({
            t: r.name,
            u: BASE + "runes/" + encodeURIComponent(r.name) + ".html",
            c: "符文 · " + f.name + (r.miracle ? " · 奇迹" : ""),
            d: r.summary + " 算力消耗 " + r.cost,
            // 奇迹条目：需要对应解锁码或讲述者模式
            g: false,
            l: r.lock || null
          });
        });
      });
    }
    return entries;
  }

  var INDEX = buildIndex();

  /* ---------- UI ---------- */

  var box, input, results;

  function createUI() {
    var col = document.querySelector(".page-col");
    if (!col) return;

    var toolbar = document.createElement("div");
    toolbar.className = "search-toolbar";
    toolbar.innerHTML =
      '<div class="search-box">' +
      '<input type="text" id="search-input" placeholder="搜索站内条目…" autocomplete="off">' +
      '<div class="search-results" id="search-results"></div>' +
      '</div>';
    col.insertBefore(toolbar, col.firstChild);

    input = toolbar.querySelector("#search-input");
    results = toolbar.querySelector("#search-results");
    box = toolbar.querySelector(".search-box");
  }

  function visibleEntries() {
    var narrator = window.NARRATOR && window.NARRATOR.isOn();
    var unlocks = window.UNLOCKS;
    return INDEX.filter(function (e) {
      if (e.g && !narrator) return false;
      if (e.l && !narrator && !(unlocks && unlocks.isOpen(e.l))) return false;
      return true;
    });
  }

  function render(query) {
    query = (query || "").trim().toLowerCase();
    var list = visibleEntries();
    if (!query) {
      list = list.slice(0, 10); // 空查询：展示前 10 条，便于发现
    } else {
      list = list.filter(function (e) {
        return (e.t + " " + e.d + " " + e.c).toLowerCase().indexOf(query) !== -1;
      }).slice(0, 12);
    }

    results.innerHTML = "";
    if (list.length === 0) {
      var empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = query ? "未找到相关条目。" : "暂无条目。";
      results.appendChild(empty);
      results.classList.add("open");
      return;
    }

    list.forEach(function (e) {
      var a = document.createElement("a");
      a.className = "sr-item";
      a.href = e.u;
      a.innerHTML = '<span class="sr-top"><span class="sr-title"></span><span class="sr-cat"></span></span>' +
        '<span class="sr-desc"></span>';
      a.querySelector(".sr-title").textContent = e.t;
      a.querySelector(".sr-cat").textContent = e.c;
      a.querySelector(".sr-desc").textContent = e.d.replace(/\s+/g, " ").slice(0, 60);
      results.appendChild(a);
    });
    results.classList.add("open");
  }

  function close() { results.classList.remove("open"); }

  function bind() {
    if (!input) return;

    input.addEventListener("focus", function () { render(input.value); });
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); input.blur(); }
      if (e.key === "Enter") {
        var first = results.querySelector(".sr-item");
        if (first) { window.location.href = first.getAttribute("href"); }
      }
    });

    // 点击结果前延迟关闭，保证链接可点
    input.addEventListener("blur", function () {
      setTimeout(close, 150);
    });

    document.addEventListener("click", function (e) {
      if (!box.contains(e.target)) close();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    createUI();
    bind();
  });
})();
