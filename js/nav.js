/* ==========================================================================
 * 侧边栏导航（所有页面共用）
 * 每个页面在引入本脚本前声明：
 *   window.NAV = { base: "" 或 "../", page: "home|guide|worldview|orgs|combat|runes|hydris|about", sub: "子页名(可选)" };
 * ========================================================================== */
(function () {
  "use strict";

  var NAV = window.NAV || { base: "", page: "home", sub: "" };
  var B = NAV.base;

  var FAMILIES = [
    "物质系", "能量系", "空间系", "生命系",
    "意识系", "因果系", "时间系", "解构系"
  ];

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) node.innerHTML = html;
    return node;
  }

  function buildSidebar() {
    var aside = document.querySelector(".sidebar");
    if (!aside) return;
    aside.innerHTML = "";

    // 品牌区
    aside.appendChild(el("div", { class: "sidebar-brand" },
      '<div class="brand-title">远梦之光 · 规则 Wiki</div>' +
      '<div class="brand-sub">梦境 · 符文 · 战斗</div>'
    ));

    // 讲述者模式开关（标题部分下方）
    aside.appendChild(el("div", { class: "narrator-switch" },
      '<span class="ns-label">讲述者模式<span class="ns-hint">讲述者专属内容开关</span></span>' +
      '<label class="switch" title="讲述者模式（KP/游戏主持人专用）">' +
      '<input type="checkbox" id="narrator-toggle">' +
      '<span class="slider"></span>' +
      '</label>'
    ));

    var nav = el("nav");
    var ulMain = el("ul", { class: "nav-group" });

    function addMainLink(page, label, href) {
      var li = el("li");
      var a = el("a", { class: "nav-link" + (NAV.page === page ? " active" : ""), href: B + href }, label);
      li.appendChild(a);
      ulMain.appendChild(li);
    }

    addMainLink("home", "主页", "index.html");
    addMainLink("trpg", "关于TRPG", "trpg.html");
    addMainLink("guide", "角色创建指南", "guide.html");

    // 世界观（可展开子菜单：基本法则 / 混沌 / 轮回）
    var liWorldview = el("li");
    var parentWorldview = el("div", { class: "nav-parent" + (NAV.page === "worldview" && !NAV.sub ? " active" : "") });
    var linkWorldview = el("a", { href: B + "worldview.html", class: "nav-link", style: "flex:1;padding:0;" }, "世界观");
    var caretWorldview = el("span", { class: "caret", style: "padding:0 14px;" }, "▶");
    caretWorldview.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      liWorldview.classList.toggle("open");
    });
    parentWorldview.appendChild(linkWorldview);
    parentWorldview.appendChild(caretWorldview);
    liWorldview.appendChild(parentWorldview);

    var ulWorldview = el("ul", { class: "nav-children" });
    [["基本法则", "worldview/基本法则.html"], ["混沌", "worldview/混沌.html"], ["轮回", "worldview/轮回.html"], ["种族", "worldview/种族.html"], ["基因", "genes.html"]].forEach(function (pair) {
      var a = el("a", {
        href: B + pair[1],
        class: NAV.page === "worldview" && NAV.sub === pair[0] ? "active" : ""
      }, pair[0]);
      var li = el("li");
      li.appendChild(a);
      ulWorldview.appendChild(li);
    });
    liWorldview.appendChild(ulWorldview);
    ulMain.appendChild(liWorldview);
    if (NAV.page === "worldview") liWorldview.classList.add("open");

    // 组织（可展开子菜单：各组织子页）
    var liOrgs = el("li");
    var parentOrgs = el("div", { class: "nav-parent" + (NAV.page === "orgs" && !NAV.sub ? " active" : "") });
    var linkOrgs = el("a", { href: B + "orgs.html", class: "nav-link", style: "flex:1;padding:0;" }, "组织");
    var caretOrgs = el("span", { class: "caret", style: "padding:0 14px;" }, "▶");
    caretOrgs.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      liOrgs.classList.toggle("open");
    });
    parentOrgs.appendChild(linkOrgs);
    parentOrgs.appendChild(caretOrgs);
    liOrgs.appendChild(parentOrgs);

    var ulOrgs = el("ul", { class: "nav-children" });
    var orgChildren = [
      ["梦境裁判所", "orgs/梦境裁判所.html"],
      ["蔷薇学会", "orgs/蔷薇学会.html"],
      ["混沌导引学派", "orgs/混沌导引学派.html"]
    ];
    // 失乐园和复乐园仅讲述者模式可见（玩家仅能通过搜索跳转）
    if (window.NARRATOR && window.NARRATOR.isOn()) {
      orgChildren.push(["失乐园和复乐园", "orgs/失乐园和复乐园.html"]);
    }
    orgChildren.forEach(function (pair) {
      var a = el("a", {
        href: B + pair[1],
        class: NAV.page === "orgs" && NAV.sub === pair[0] ? "active" : ""
      }, pair[0]);
      var li = el("li");
      li.appendChild(a);
      ulOrgs.appendChild(li);
    });
    liOrgs.appendChild(ulOrgs);
    ulMain.appendChild(liOrgs);
    if (NAV.page === "orgs") liOrgs.classList.add("open");

    addMainLink("combat", "战斗规则", "combat.html");
    addMainLink("explore", "探索与成长", "explore.html");

    // 符文库（点击文字进入全量页，点击箭头展开/收起子菜单）
    var liRunes = el("li");
    var parent = el("div", { class: "nav-parent" + (NAV.page === "runes" && !NAV.sub ? " active" : "") });
    var linkRunes = el("a", {
      href: B + "runes.html",
      class: "nav-link",
      style: "flex:1;padding:0;"
    }, "符文库");
    var caret = el("span", { class: "caret", style: "padding:0 14px;" }, "▶");
    caret.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      liRunes.classList.toggle("open");
    });
    parent.appendChild(linkRunes);
    parent.appendChild(caret);
    liRunes.appendChild(parent);

    var ulChildren = el("ul", { class: "nav-children" });
    FAMILIES.forEach(function (f) {
      var a = el("a", {
        href: B + "runes/" + encodeURIComponent(f) + ".html",
        class: NAV.page === "runes" && NAV.sub === f ? "active" : ""
      }, f);
      var li = el("li");
      li.appendChild(a);
      ulChildren.appendChild(li);
    });
    // 奇迹（仅讲述者模式可见）
    if (window.NARRATOR && window.NARRATOR.isOn()) {
      var aMiracle = el("a", {
        href: B + "runes/奇迹.html",
        class: NAV.page === "runes" && NAV.sub === "奇迹" ? "active" : ""
      }, "奇迹");
      var liMiracle = el("li");
      liMiracle.appendChild(aMiracle);
      ulChildren.appendChild(liMiracle);
    }
    liRunes.appendChild(ulChildren);
    ulMain.appendChild(liRunes);

    // 海德里斯语（解锁码 hyderisi 或讲述者模式可见，下设 语法 / 词典 子分页）
    var hydrisOpen = (window.UNLOCKS && window.UNLOCKS.isOpen("hyderisi")) ||
      (window.NARRATOR && window.NARRATOR.isOn());
    if (hydrisOpen) {
      var liHyd = el("li");
      var parentHyd = el("div", { class: "nav-parent" + (NAV.page === "hydris" && !NAV.sub ? " active" : "") });
      var linkHyd = el("a", { href: B + "hydris.html", class: "nav-link", style: "flex:1;padding:0;" }, "海德里斯语");
      var caretHyd = el("span", { class: "caret", style: "padding:0 14px;" }, "▶");
      caretHyd.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        liHyd.classList.toggle("open");
      });
      parentHyd.appendChild(linkHyd);
      parentHyd.appendChild(caretHyd);
      liHyd.appendChild(parentHyd);

      var ulHyd = el("ul", { class: "nav-children" });
      [["语法", "hydris/grammar.html"], ["词典", "hydris/translate.html"]].forEach(function (pair) {
        var a = el("a", {
          href: B + pair[1],
          class: NAV.page === "hydris" && NAV.sub === pair[0] ? "active" : ""
        }, pair[0]);
        var li = el("li");
        li.appendChild(a);
        ulHyd.appendChild(li);
      });
      liHyd.appendChild(ulHyd);
      ulMain.appendChild(liHyd);
      if (NAV.page === "hydris") liHyd.classList.add("open");
    }

    // 关于（贴近底部）
    var ulBottom = el("ul", { class: "nav-group nav-bottom" });
    var liAbout = el("li");
    var aAbout = el("a", { class: "nav-link" + (NAV.page === "about" ? " active" : ""), href: B + "about.html" }, "关于");
    liAbout.appendChild(aAbout);
    ulBottom.appendChild(liAbout);

    // 主题快捷切换（太阳 / 设置 / 月亮）——位于“关于”下方，等距一行
    var liTheme = el("li");
    liTheme.appendChild(el("div", { class: "theme-row" },
      '<button type="button" class="theme-btn" id="theme-sun" title="切换到浅色主题">☀</button>' +
      '<button type="button" class="theme-btn" id="theme-gear" title="设置">⚙</button>' +
      '<button type="button" class="theme-btn" id="theme-moon" title="切换到深色主题">☾</button>'
    ));
    ulBottom.appendChild(liTheme);

    nav.appendChild(ulMain);
    nav.appendChild(ulBottom);
    aside.appendChild(nav);

    // 符文库子菜单默认展开（当前处于符文库相关页面时）
    if (NAV.page === "runes") liRunes.classList.add("open");

    // 讲述者开关状态与当前模式保持同步（侧边栏重建后也有效）
    var sw = document.getElementById("narrator-toggle");
    if (sw && window.NARRATOR) sw.checked = window.NARRATOR.isOn();
  }

  // 移动端开关
  function buildToggle() {
    if (document.querySelector(".menu-toggle")) return;
    var btn = el("button", { class: "menu-toggle", type: "button" }, "☰ 菜单");
    btn.addEventListener("click", function () {
      document.body.classList.toggle("sidebar-open");
    });
    document.body.appendChild(btn);
    var scrim = el("div", { class: "sidebar-scrim" });
    scrim.addEventListener("click", function () {
      document.body.classList.remove("sidebar-open");
    });
    document.body.appendChild(scrim);
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildSidebar();
    buildToggle();
  });

  // 讲述者模式 / 解锁状态变化时重建侧边栏（海德里斯语条目显隐等）
  document.addEventListener("narratorchange", buildSidebar);
  document.addEventListener("unlockchange", buildSidebar);
})();
