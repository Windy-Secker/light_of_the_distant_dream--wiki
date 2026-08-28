/* ==========================================================================
 * 页内目录（右侧）
 * - 将 .content 重组为 正文列 + 右侧目录列
 * - 扫描 .page 内的 h2/h3 生成目录，滚动高亮当前章节
 * - 讲述者模式关闭时，隐藏于 .gm-only 区块内的标题
 * ========================================================================== */
(function () {
  "use strict";

  var scrollHandler = null;

  function wrapLayout() {
    var content = document.querySelector(".content");
    if (!content || content.querySelector(".page-col")) return;

    var col = document.createElement("div");
    col.className = "page-col";
    content.insertBefore(col, content.firstChild);

    var article = content.querySelector("article.page");
    var footer = content.querySelector(".page-footer");
    if (article) col.appendChild(article);
    if (footer) col.appendChild(footer);

    var panel = document.createElement("aside");
    panel.className = "toc-panel";
    panel.id = "toc-panel";
    content.appendChild(panel);
  }

  function isGmHeading(h) {
    if (window.NARRATOR && window.NARRATOR.isOn()) return false;
    // 检查标题自身及其所有祖先是否处于 gm-only 区块内（含 display:none 的隐藏标题）
    var el = h;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains("gm-only")) return true;
      el = el.parentElement;
    }
    return false;
  }

  function pageName() {
    var page = document.querySelector(".page");
    if (page) {
      var h1 = page.querySelector("h1");
      if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    }
    return document.title.replace(/\s*[-·]\s*远梦之光.*$/, "").trim() || "页内目录";
  }

  function build() {
    wrapLayout();

    var panel = document.getElementById("toc-panel");
    if (!panel) return;
    panel.innerHTML = "";

    var page = document.querySelector(".page");
    if (!page) return;

    // 按“全量标题序列（含讲述者隐藏标题）”的位置分配 id，且仅重写本站命名的 sec-N：
    // 讲述者模式切换会使可见标题集合变化，若按过滤后的序号分配，重建目录时序号错位，
    // 两个标题会共用同一 id → 目录中两条链接同时高亮。
    var all = Array.prototype.slice.call(page.querySelectorAll("h2, h3"));
    all.forEach(function (h, i) {
      if (!h.id || /^sec-\d+$/.test(h.id)) h.id = "sec-" + i;
    });
    var heads = all.filter(function (h) {
      return !isGmHeading(h) && h.offsetParent !== null;
    });

    if (heads.length < 2) {
      panel.style.display = "none";
      return;
    }
    panel.style.display = "";

    var title = document.createElement("div");
    title.className = "toc-title";
    title.textContent = pageName();
    panel.appendChild(title);

    var ul = document.createElement("ul");
    heads.forEach(function (h) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      a.setAttribute("data-target", h.id);
      if (h.tagName === "H3") a.className = "toc-h3";
      li.appendChild(a);
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
    scrollHandler = function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var pos = scrollTop + 50;
      var current = null;
      heads.forEach(function (h) {
        var top = h.getBoundingClientRect().top + scrollTop;
        if (top <= pos) current = h.id;
      });
      // 滚动到底部时高亮最后一个标题（短章节不会被漏掉）
      var doc = document.documentElement;
      if (!current && heads.length && scrollTop + window.innerHeight >= doc.scrollHeight - 4) {
        current = heads[heads.length - 1].id;
      }
      ul.querySelectorAll("a").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-target") === current);
      });
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });
    scrollHandler();
  }

  // scrollend 只注册一次，始终调用当前版本的滚动处理器（避免每次重建目录都重复挂载）
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", function () { if (scrollHandler) scrollHandler(); });
  }

  document.addEventListener("DOMContentLoaded", build);
  // narrator.js 切换时已派发 narratorchange 事件，这里只保留事件监听，
  // 不再额外注册 NARRATOR.onChanged，避免同一变更触发两次重建
  document.addEventListener("narratorchange", build);
})();
