/* ==========================================================================
 * 移动端增强（mobile.js）
 * - 将 wiki 表格包进可横向滚动的容器（.table-scroll）：
 *   窄屏下大表格（如基因速查表、伤害类型总览）不再被挤压变形，
 *   而是保持内容宽度并支持触摸横向滚动。
 * 仅做渐进增强：桌面端包裹层无任何副作用（无溢出则不出现滚动条）。
 * 依赖：无；在 DOMContentLoaded 时执行一次。
 * ========================================================================== */
(function () {
  "use strict";

  function wrapTables() {
    document.querySelectorAll("table.wiki-table").forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains("table-scroll")) return;
      var wrap = document.createElement("div");
      wrap.className = "table-scroll";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
  }

  document.addEventListener("DOMContentLoaded", wrapTables);
})();
