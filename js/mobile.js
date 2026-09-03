/* ==========================================================================
 * 移动端增强（mobile.js）
 * - 将 wiki 表格包进可横向滚动的容器（.table-scroll）：
 *   窄屏下大表格（如基因速查表、伤害类型总览）不再被挤压变形，
 *   而是保持内容宽度并支持触摸横向滚动。
 * - 移动端顶栏：≤860px 时把「菜单按钮 + 搜索框」并入一条固定顶栏（.topbar），
 *   网页主体从顶栏下方开始，避免悬浮控件压住正文/侧边栏文本；
 *   视口变宽时自动还原为桌面布局（搜索框浮动、菜单隐藏）。
 * 仅做渐进增强：桌面端包裹层无副作用（无溢出则不出现滚动条）。
 * 依赖：无；在 DOMContentLoaded 时执行一次。
 * ========================================================================== */
(function () {
  "use strict";

  /* ---------- 表格横向滚动 ---------- */

  function wrapTables() {
    document.querySelectorAll("table.wiki-table").forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains("table-scroll")) return;
      var wrap = document.createElement("div");
      wrap.className = "table-scroll";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
  }

  /* ---------- 移动端顶栏（菜单 + 搜索） ---------- */

  var topbar = null;
  var mqNarrow = (typeof window.matchMedia === "function") ? window.matchMedia("(max-width: 860px)") : null;

  function findEls() {
    return {
      menu: document.querySelector(".menu-toggle"),
      search: document.querySelector(".search-toolbar")
    };
  }

  function moveIntoTopbar() {
    var els = findEls();
    if (!topbar && !els.menu && !els.search) return;
    if (!topbar) {
      topbar = document.createElement("div");
      topbar.className = "topbar";
      document.body.insertBefore(topbar, document.body.firstChild);
    }
    // 记住原始位置以便宽屏还原
    ["menu", "search"].forEach(function (k) {
      var el = els[k];
      if (!el) return;
      if (!el.hasAttribute("data-topbar-home")) {
        el.setAttribute("data-topbar-home", el.parentElement === document.body ? "body" : "page-col");
      }
      topbar.appendChild(el);
    });
  }

  function restoreFromTopbar() {
    if (!topbar) return;
    var els = findEls();
    ["menu", "search"].forEach(function (k) {
      var el = els[k];
      if (!el || !el.getAttribute("data-topbar-home")) return;
      var home = el.getAttribute("data-topbar-home");
      if (home === "body") {
        document.body.appendChild(el);
      } else {
        var col = document.querySelector(".page-col");
        if (col) col.appendChild(el);
        else document.body.appendChild(el);
      }
      el.removeAttribute("data-topbar-home");
    });
    topbar.remove();
    topbar = null;
  }

  function syncTopbar() {
    if (mqNarrow && mqNarrow.matches) moveIntoTopbar();
    else restoreFromTopbar();
  }

  function bindTopbar() {
    syncTopbar();
    if (mqNarrow) {
      // 监听视口跨越 860px（旋转 / 窗口缩放）
      mqNarrow.addEventListener("change", function () { syncTopbar(); });
      // 讲述者/解锁状态重建侧边栏后不影响顶栏内容，但保险起见再同步一次
      document.addEventListener("narratorchange", syncTopbar);
    }
  }

  /* ---------- 启动 ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    wrapTables();
    bindTopbar();
  });
})();
