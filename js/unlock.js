/* ==========================================================================
 * 解锁码系统
 * - 解锁码注册表（后续更多条目在此追加）
 * - 已验证的解锁码保存在 localStorage，跨页面保持
 * - 解锁成功后派发 "unlockchange" 事件，并给 <body> 加 unlocked-<code> 类
 * - 若页面存在 #unlock-input（“关于”页），自动绑定解锁输入框
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "huanjing.unlocks";

  // 解锁码注册表：code -> { title, desc }（之后新增条目只需在此追加）
  var REGISTRY = {
    hyderisi: { title: "海德里斯语", desc: "解锁「海德里斯语」分页及其子分页（语法 / 词典）" },
    kijexawe: { title: "轮回（基耶夏韦）", desc: "解锁「世界观 · 轮回」（基耶夏韦）相关设定" },
    miracle01: { title: "奇迹 · 虚构观想", desc: "解锁「虚构观想」条目" },
    miracle02: { title: "奇迹 · 定界幻灭", desc: "解锁「定界幻灭」条目" },
    miracle03: { title: "奇迹 · 逆灵转生", desc: "解锁「逆灵转生」条目" }
  };

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }

  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function applyBodyClasses() {
    Object.keys(REGISTRY).forEach(function (c) {
      document.body.classList.toggle("unlocked-" + c, read().indexOf(c) !== -1);
    });
  }

  function isOpen(code) {
    return read().indexOf(code) !== -1;
  }

  function open(code) {
    code = String(code || "").trim().toLowerCase();
    if (!REGISTRY[code]) return false;
    var list = read();
    if (list.indexOf(code) === -1) {
      list.push(code);
      write(list);
      applyBodyClasses();
      document.dispatchEvent(new CustomEvent("unlockchange", { detail: { code: code } }));
    }
    return true;
  }

  function codes() { return read(); }
  function registry() { return REGISTRY; }

  function clear() {
    write([]);
    applyBodyClasses();
    document.dispatchEvent(new CustomEvent("unlockchange", { detail: { cleared: true } }));
  }

  /* ---------- “关于”页解锁输入框 ---------- */

  var ORIG_TITLE = document.title;

  // 锁定页面：非解锁/非讲述者模式下，页面标题不显示条目名称，也不提示“存在锁定条目”
  function genericizeTitle() {
    var page = document.querySelector(".page");
    if (!page) return;
    var lockedContent = page.querySelector(".hyd-content");
    if (!lockedContent) return;
    var h1 = page.querySelector("h1");
    // 仅当页面内容整体位于锁定区内（h1 也在其中）才是“完全锁定页”，需要泛化标题；
    // 轮回页含公开内容（h1 在锁定区外），保留原标题。
    var h1Locked = !!h1 && lockedContent.contains(h1);
    var narrator = !!(window.NARRATOR && window.NARRATOR.isOn());
    var unlocked = Object.keys(REGISTRY).some(function (c) {
      return document.body.classList.contains("unlocked-" + c);
    });
    if (!narrator && !unlocked && h1Locked) {
      document.title = "远梦之光 · 规则 Wiki";
    } else if (document.title !== ORIG_TITLE) {
      document.title = ORIG_TITLE;
    }
  }

  function bindUnlockUI() {
    var input = document.getElementById("unlock-input");
    var btn = document.getElementById("unlock-btn");
    var msg = document.getElementById("unlock-msg");
    var status = document.getElementById("unlock-status");
    if (!input || !btn) return;

    function renderStatus() {
      if (!status) return;
      var list = read();
      var keys = Object.keys(REGISTRY);
      var narrator = !!(window.NARRATOR && window.NARRATOR.isOn());
      if (keys.length === 0 || (list.length === 0 && !narrator)) {
        // 非讲述者且未解锁任何条目时，不展示任何状态文字（避免暗示存在未解锁内容）
        status.innerHTML = "";
        return;
      }
      // 非讲述者模式：只显示已解锁条目的名称；未解锁条目的名称与解锁码一律不展示
      status.innerHTML = narrator ? "条目状态（讲述者视角，含解锁码）：" : "已解锁条目：";
      keys.forEach(function (c) {
        var open = list.indexOf(c) !== -1;
        if (!open && !narrator) return;
        var span = document.createElement("span");
        span.className = "us-item" + (open ? " done" : "");
        span.textContent = narrator
          ? REGISTRY[c].title + "（解锁码：" + c + "）" + (open ? " ✓" : " 🔒")
          : REGISTRY[c].title + (open ? " ✓" : "");
        status.appendChild(span);
      });
    }

    function tryUnlock() {
      var code = input.value.trim();
      if (!code) return;
      if (open(code)) {
        msg.className = "unlock-msg ok";
        msg.textContent = "解锁成功：" + REGISTRY[code].title + "。";
        input.value = "";
      } else {
        msg.className = "unlock-msg err";
        msg.textContent = "解锁码无效，请检查后重试。";
      }
      renderStatus();
    }

    btn.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryUnlock();
    });
    document.addEventListener("unlockchange", renderStatus);
    document.addEventListener("narratorchange", renderStatus);
    renderStatus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyBodyClasses();
    bindUnlockUI();
    genericizeTitle();
  });

  document.addEventListener("unlockchange", genericizeTitle);
  document.addEventListener("narratorchange", genericizeTitle);

  window.UNLOCKS = {
    isOpen: isOpen,
    open: open,
    codes: codes,
    registry: registry,
    clear: clear
  };
})();
