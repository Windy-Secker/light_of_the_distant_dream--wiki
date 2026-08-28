/* ==========================================================================
 * 讲述者模式
 * - 侧边栏开关（由 nav.js 生成：#narrator-toggle）
 * - 每次开启前弹出警告，5 秒后方可确认/取消；取消则自动关闭开关
 * - 状态持久化到 localStorage；切换时派发 "narratorchange" 事件
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "huanjing.narrator";
  var WAIT_SECONDS = 5;

  var listeners = [];

  function isOn() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function setState(on) {
    try {
      if (on) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch (e) { /* ignore */ }
    document.body.classList.toggle("narrator-mode", on);
    var sw = document.getElementById("narrator-toggle");
    if (sw) sw.checked = on;
    listeners.forEach(function (fn) { try { fn(on); } catch (e) { /* ignore */ } });
    document.dispatchEvent(new CustomEvent("narratorchange", { detail: { on: on } }));
  }

  function onChanged(fn) { listeners.push(fn); }

  /* ---------- 警告弹窗 ---------- */

  var dialogOpen = false;

  function showWarning(onConfirm) {
    if (dialogOpen) return;
    dialogOpen = true;
    var modal = document.createElement("div");
    modal.className = "narrator-modal";
    modal.innerHTML =
      '<div class="nm-box" role="dialog" aria-modal="true">' +
      '<div class="nm-title">⚠ 警告：讲述者模式</div>' +
      '<div class="nm-text">开启后，本 Wiki 将显示并允许搜索<strong>仅限讲述者（KP/游戏主持人）</strong>可见的内容，' +
      '例如世界观中的剧情机密与「奇迹」符文的具体资料。<br><br>' +
      '<strong>如果你不是讲述者</strong>，开启此模式可能会得知当前阶段不该知道的信息，从而影响游戏体验。</div>' +
      '<div class="nm-count">按钮将在 <strong id="nm-count">' + WAIT_SECONDS + '</strong> 秒后可用，请仔细确认。</div>' +
      '<div class="nm-btns">' +
      '<button type="button" class="btn" id="nm-cancel" disabled>取消</button>' +
      '<button type="button" class="btn primary" id="nm-confirm" disabled>确认开启</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(modal);

    var remain = WAIT_SECONDS;
    var countEl = modal.querySelector("#nm-count");
    var confirmBtn = modal.querySelector("#nm-confirm");
    var cancelBtn = modal.querySelector("#nm-cancel");

    var timer = setInterval(function () {
      remain -= 1;
      if (remain <= 0) {
        clearInterval(timer);
        countEl.textContent = "0";
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
      } else {
        countEl.textContent = String(remain);
      }
    }, 1000);

    function close() {
      clearInterval(timer);
      modal.remove();
      dialogOpen = false;
    }

    confirmBtn.addEventListener("click", function () {
      close();
      onConfirm();
    });
    cancelBtn.addEventListener("click", function () {
      close();
      setState(false);
    });
    // 点击遮罩视为取消
    modal.addEventListener("click", function (e) {
      if (e.target === modal) { close(); setState(false); }
    });
  }

  /* ---------- 绑定开关 ---------- */

  /* ---------- 绑定开关（事件委托，侧边栏重建后依然有效） ---------- */

  document.addEventListener("change", function (e) {
    var sw = e.target;
    if (!sw || sw.id !== "narrator-toggle") return;
    if (sw.checked) {
      // 先回弹为未选中，等确认后才真正开启
      sw.checked = false;
      // 设置中勾选了“不再弹出讲述者警告”则直接开启
      if (window.SETTINGS && window.SETTINGS.noWarn()) {
        setState(true);
        return;
      }
      showWarning(function () {
        setState(true);
      });
    } else {
      setState(false);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    setState(isOn());
  });

  window.NARRATOR = { isOn: isOn, onChanged: onChanged, turnOff: function () { setState(false); } };
})();
