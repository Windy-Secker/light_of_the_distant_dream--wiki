/* ==========================================================================
 * 关键字筛选（kwfilter.js）
 * 为条目较多的列表/表格提供实时关键字检索。
 * 用法：给 <input class="kw-filter"> 配置 data 属性：
 *   data-scope      筛选范围（CSS 选择器，可用逗号指定多个容器，必填）
 *   data-items      被筛选的条目选择器（默认 "tbody tr"）
 *   data-hide-empty 条目全部被过滤时隐藏的组元素选择器
 *                   （如 ".table-scroll"、"details.gene-family"）
 *   data-empty      无任何匹配时显示的空状态元素选择器（可选）
 * 行为：匹配不区分大小写；输入内容匹配条目的文本内容（名称/效果/说明等）。
 * 依赖：无；DOMContentLoaded 时自动绑定；
 * 页面动态重渲染（如角色创建器的重建列表）后调用 window.KWFilter.refresh()
 * 重新应用当前关键字。
 * ========================================================================== */
(function () {
  "use strict";

  function norm(s) { return String(s == null ? "" : s).trim().toLowerCase(); }

  function bind(input) {
    var itemsSel = input.getAttribute("data-items") || "tbody tr";
    var scopeSel = input.getAttribute("data-scope");
    var hideEmptySel = input.getAttribute("data-hide-empty");
    var emptySel = input.getAttribute("data-empty");
    if (!scopeSel) return function () {};

    function apply() {
      var kw = norm(input.value);
      var roots = document.querySelectorAll(scopeSel);
      var total = 0, visible = 0;
      roots.forEach(function (root) {
        var items = root.querySelectorAll(itemsSel);
        items.forEach(function (it) {
          var hit = !kw || norm(it.textContent).indexOf(kw) !== -1;
          it.style.display = hit ? "" : "none";
          total++;
          if (hit) visible++;
        });
        if (hideEmptySel) {
          root.querySelectorAll(hideEmptySel).forEach(function (g) {
            var any = Array.prototype.some.call(g.querySelectorAll(itemsSel), function (it) {
              return it.style.display !== "none";
            });
            g.style.display = any ? "" : "none";
          });
        }
      });
      var empty = emptySel ? document.querySelector(emptySel) : null;
      if (empty) empty.style.display = total > 0 && visible === 0 && kw ? "" : "none";
    }

    input.addEventListener("input", apply);
    return apply;
  }

  var appliers = [];

  function bindAll() {
    document.querySelectorAll("input.kw-filter").forEach(function (input) {
      if (input.getAttribute("data-kw-bound")) return; // 防止重复绑定
      input.setAttribute("data-kw-bound", "1");
      appliers.push(bind(input));
    });
    refresh();
  }

  function refresh() {
    appliers.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
  }

  document.addEventListener("DOMContentLoaded", bindAll);
  window.KWFilter = { refresh: refresh };
})();
