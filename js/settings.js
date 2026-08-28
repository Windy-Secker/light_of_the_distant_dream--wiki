/* ==========================================================================
 * 设置：夜间模式 / 不再弹出讲述者警告 / 清空进度
 * - 夜间模式：跟随系统 | 浅色 | 深色，保存在 localStorage，全站生效
 * - “关于”页右上角齿轮按钮打开设置对话框
 * ========================================================================== */
(function () {
  "use strict";

  var THEME_KEY = "huanjing.theme";        // system | light | dark
  var NO_WARN_KEY = "huanjing.noNarratorWarn"; // "1"

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; }
  }

  function setTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
    applyTheme();
  }

  function systemDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function applyTheme() {
    var t = getTheme();
    var dark = t === "dark" || (t === "system" && systemDark());
    document.body.classList.toggle("theme-dark", dark);
    document.body.classList.toggle("theme-light", !dark);
    updateThemeRow();
  }

  function noWarn() {
    try { return localStorage.getItem(NO_WARN_KEY) === "1"; } catch (e) { return false; }
  }

  function setNoWarn(v) {
    try {
      if (v) localStorage.setItem(NO_WARN_KEY, "1");
      else localStorage.removeItem(NO_WARN_KEY);
    } catch (e) { /* ignore */ }
  }

  /* ---------- 清空进度（解锁码 + 讲述者状态） ---------- */

  function clearProgress() {
    if (window.UNLOCKS) window.UNLOCKS.clear();
    if (window.NARRATOR && window.NARRATOR.turnOff) window.NARRATOR.turnOff();
  }

  /* ---------- 侧边栏主题快捷按钮（太阳 / 齿轮 / 月亮） ---------- */

  function updateThemeRow() {
    var t = getTheme();
    var dark = t === "dark" || (t === "system" && systemDark());
    var sun = document.getElementById("theme-sun");
    var moon = document.getElementById("theme-moon");
    if (sun) sun.classList.toggle("active", t === "light" || (t === "system" && !dark));
    if (moon) moon.classList.toggle("active", t === "dark" || (t === "system" && dark));
  }

  function bindThemeRow() {
    document.addEventListener("click", function (e) {
      var id = e.target && e.target.id;
      if (id === "theme-sun") setTheme("light");
      else if (id === "theme-moon") setTheme("dark");
      else if (id === "theme-gear") openDialog();
    });
  }

  function openDialog() {
    if (document.querySelector(".settings-modal")) return;
    var modal = document.createElement("div");
    modal.className = "settings-modal";
    modal.innerHTML =
      '<div class="st-box" role="dialog" aria-modal="true">' +
      '<div class="st-title">设置</div>' +

      '<div class="st-row">' +
      '<div class="st-label">夜间模式</div>' +
      '<div class="st-hint">选择界面配色，保存在本地。</div>' +
      '<select id="st-theme">' +
      '<option value="system">跟随系统</option>' +
      '<option value="light">浅色</option>' +
      '<option value="dark">深色</option>' +
      '</select>' +
      '</div>' +

      '<div class="st-row">' +
      '<label class="st-check">' +
      '<input type="checkbox" id="st-nowarn">' +
      '<span>不再弹出讲述者警告（仅在讲述者模式下可勾选）</span>' +
      '</label>' +
      '</div>' +

      '<div class="st-row">' +
      '<div class="st-label">清空进度</div>' +
      '<div class="st-hint">清除本地保存的所有已验证解锁码，以及当前的讲述者模式状态。</div>' +
      '<button type="button" class="btn" id="st-clear" style="border-color:var(--red);color:var(--red)">清空进度</button>' +
      '</div>' +

      '<div class="st-btns">' +
      '<button type="button" class="btn" id="st-close">关闭</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(modal);

    var themeSel = modal.querySelector("#st-theme");
    themeSel.value = getTheme();
    themeSel.addEventListener("change", function () { setTheme(themeSel.value); });

    var noWarnCb = modal.querySelector("#st-nowarn");
    noWarnCb.checked = noWarn();
    noWarnCb.disabled = !(window.NARRATOR && window.NARRATOR.isOn());
    noWarnCb.addEventListener("change", function () {
      setNoWarn(noWarnCb.checked);
    });

    modal.querySelector("#st-close").addEventListener("click", function () { modal.remove(); });

    modal.querySelector("#st-clear").addEventListener("click", function () {
      showClearConfirm(function () {
        clearProgress();
        modal.remove();
        flash("已清空进度（解锁码与讲述者状态）");
      });
    });

    // 讲述者模式状态变化时同步复选框可用性
    document.addEventListener("narratorchange", function sync() {
      var on = !!(window.NARRATOR && window.NARRATOR.isOn());
      if (noWarnCb) {
        noWarnCb.disabled = !on;
        if (!on) noWarnCb.checked = false;
      }
      document.removeEventListener("narratorchange", sync);
    });
  }

  /* ---------- 清空进度的二次确认（5 秒倒计时） ---------- */

  function showClearConfirm(onConfirm) {
    if (document.querySelector(".narrator-modal")) return;
    var modal = document.createElement("div");
    modal.className = "narrator-modal confirm-top"; // confirm-top 确保置于设置对话框之上
    modal.innerHTML =
      '<div class="nm-box" role="dialog" aria-modal="true">' +
      '<div class="nm-title">⚠ 警告：清空进度</div>' +
      '<div class="nm-text">此操作将<strong>清除本地保存的所有已验证解锁码</strong>，并<strong>关闭讲述者模式</strong>。' +
      '解锁的分页将重新变为不可见，如需再次解锁请重新输入解锁码。</div>' +
      '<div class="nm-count">按钮将在 <strong id="nm-count">5</strong> 秒后可用。</div>' +
      '<div class="nm-btns">' +
      '<button type="button" class="btn" id="nm-cancel" disabled>取消</button>' +
      '<button type="button" class="btn primary" id="nm-confirm" disabled>确认清空</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var remain = 5;
    var countEl = modal.querySelector("#nm-count");
    var cancelBtn = modal.querySelector("#nm-cancel");
    var confirmBtn = modal.querySelector("#nm-confirm");

    var timer = setInterval(function () {
      remain -= 1;
      if (remain <= 0) {
        clearInterval(timer);
        countEl.textContent = "0";
        cancelBtn.disabled = false;
        confirmBtn.disabled = false;
      } else {
        countEl.textContent = String(remain);
      }
    }, 1000);

    function close() {
      clearInterval(timer);
      modal.remove();
    }
    confirmBtn.addEventListener("click", function () { close(); onConfirm(); });
    cancelBtn.addEventListener("click", close);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });
  }

  function flash(msg) {
    var d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#232a35;color:#fff;padding:10px 18px;border-radius:8px;z-index:99;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.25)";
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    bindThemeRow();
    updateThemeRow();
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", applyTheme);
      else if (mq.addListener) mq.addListener(applyTheme);
    }
  });

  window.SETTINGS = { noWarn: noWarn, setNoWarn: setNoWarn, clearProgress: clearProgress, applyTheme: applyTheme };
})();
