/* ==========================================================================
 * 海德里斯语互译工具（hydris/translate.html）
 * - 词汇查找：按词形或中文释义子串过滤词典（463 词条）
 * - 互译：双框式——输入整句 → 输出译文句子；匹配不上的词原样保留
 *   · 海→中：逐词最长匹配，输出每个命中词的首个释义片段
 *   · 中→海：按中文片段反向检索，命中输出词形，未命中保留原文
 * 依赖：js/hydris-data.js（window.HYDRIS_DATA，按词长降序排列）
 * ========================================================================== */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var DATA = (typeof window !== "undefined" && window.HYDRIS_DATA) || [];
  var POS_ORDER = { "名词": 1, "动词": 2, "形容词": 3, "代词": 4, "副词": 5, "数词": 6, "介词": 7, "连词": 8, "助词": 9, "转义词": 10, "感叹词": 11 };

  function posText(e) {
    var tags = (e.t || []).slice().sort(function (a, b) {
      return (POS_ORDER[a] || 99) - (POS_ORDER[b] || 99);
    });
    return tags.join(" / ") || "—";
  }

  /* 释义的首个片段（用于译文句子，保持简洁） */
  function shortDef(e) {
    var d = String(e.d);
    var seg = d.split(/[，、；;／/]/)[0].trim();
    return seg || d;
  }

  /* ---------- 一、词汇查找 ---------- */

  function bindDict() {
    var input = $("dict-input"), table = $("dict-results"), count = $("dict-count");
    if (!input) return;
    var tbody = table ? table.querySelector("tbody") : null;
    if (!tbody) return;
    function render() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        count.textContent = "输入词形或中文释义进行查找（共 " + DATA.length + " 词条）";
        tbody.innerHTML = "";
        return;
      }
      var list = DATA.filter(function (e) {
        return e.w.toLowerCase().indexOf(q) !== -1 ||
          String(e.d).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 100);
      count.textContent = "找到 " + list.length + " 条" + (list.length >= 100 ? "（仅显示前 100 条）" : "");
      tbody.innerHTML = list.map(function (e) {
        return "<tr><td><strong>" + esc(e.w) + "</strong></td><td>" + esc(e.ipa) +
          "</td><td>" + esc(posText(e)) + "</td><td>" + esc(e.d) + "</td></tr>";
      }).join("");
    }
    input.addEventListener("input", render);
    render();
  }

  /* ---------- 二、互译（双框整句） ---------- */

  // 海→中：逐词最长匹配（DATA 已按词长降序，优先匹配长词）
  // 若某个单词无法完整拆分为已知词，则整体视为“未匹配”，原文保留
  function glossHydris(text) {
    var lower = text.toLowerCase();
    var out = [];
    var i = 0;
    while (i < lower.length) {
      var ch = lower[i];
      if (!/[a-z]/.test(ch)) {
        out.push({ type: "raw", text: ch });
        i += 1;
        continue;
      }
      var j = i;
      while (j < lower.length && /[a-z]/.test(lower[j])) j += 1;
      var token = lower.slice(i, j);
      var original = text.slice(i, j);
      i = j;

      var parts = [];
      var pos = 0;
      var allMatched = true;
      while (pos < token.length) {
        var matched = null;
        for (var k = 0; k < DATA.length; k++) {
          var w = DATA[k].w;
          if (token.slice(pos, pos + w.length) === w) { matched = DATA[k]; break; }
        }
        if (matched) {
          parts.push({ type: "word", e: matched });
          pos += matched.w.length;
        } else {
          allMatched = false;
          break;
        }
      }
      if (allMatched && parts.length) {
        parts.forEach(function (p) { out.push(p); });
      } else {
        out.push({ type: "unknown", text: original });
      }
    }
    return out;
  }

  // 海→中：译文句子（未匹配的字符原样保留）
  function translateH2Z(text) {
    var parts = glossHydris(text);
    var out = "";
    parts.forEach(function (p) {
      if (p.type === "word") {
        var g = shortDef(p.e);
        if (out && !/\s$/.test(out) && !/^[，。！？；：、,.!?;:]$/.test(g)) out += " ";
        out += g;
      } else {
        out += p.text;
      }
    });
    return out.trim();
  }

  // 中→海：反向检索（优先释义以该片段开头的词，其次包含；均取词长最短者）
  function reverseLookup(seg) {
    function byLength(a, b) { return a.w.length - b.w.length; }
    var starts = DATA.filter(function (e) { return String(e.d).indexOf(seg) === 0; });
    if (starts.length) return starts.slice().sort(byLength)[0];
    var contains = DATA.filter(function (e) { return String(e.d).indexOf(seg) !== -1; });
    if (contains.length) return contains.slice().sort(byLength)[0];
    return null;
  }

  // 中→海：译文句子（未命中的片段保留原文）
  function translateZ2H(text) {
    var parts = text.split(/([，。！？；：、,.!?;:\s]+)/);
    return parts.map(function (seg) {
      if (!seg) return "";
      if (/^[，。！？；：、,.!?;:\s]+$/.test(seg)) return seg;
      var hit = reverseLookup(seg.trim());
      return hit ? hit.w : seg;
    }).join("");
  }

  // 逐词注疏（详细面板）
  function detailH2Z(parts) {
    return parts.map(function (p) {
      if (p.type === "word") {
        return '<div class="tr-token"><span class="tt-hyd">' + esc(p.e.w) + '</span>' +
          '<span class="tt-gloss">' + esc(p.e.d) + '</span></div>';
      }
      if (p.type === "unknown") {
        return '<div class="tr-token unknown"><span class="tt-hyd">' + esc(p.text) + '</span><span class="tt-gloss">（未收录，原样保留）</span></div>';
      }
      return '<div class="tr-raw">' + esc(p.text) + "</div>";
    }).join("");
  }

  function detailZ2H(text) {
    var segs = text.split(/[，。！？；：、,.!?;:\s]+/).filter(function (s) { return s.trim(); });
    return segs.map(function (seg) {
      var hits = DATA.filter(function (e) {
        return String(e.d).indexOf(seg) !== -1;
      }).slice(0, 6);
      var inner;
      if (!hits.length) {
        inner = '<div class="callout warn" style="margin:4px 0">“' + esc(seg) + '” 未在词典中找到对应词条。</div>';
      } else {
        inner = '<table class="wiki-table" style="margin:6px 0 12px"><thead><tr><th>海德里斯语</th><th>发音</th><th>词性</th><th>释义</th></tr></thead><tbody>' +
          hits.map(function (e) {
            return "<tr><td><strong>" + esc(e.w) + "</strong></td><td>" + esc(e.ipa) +
              "</td><td>" + esc(posText(e)) + "</td><td>" + esc(e.d) + "</td></tr>";
          }).join("") + "</tbody></table>";
      }
      return '<div class="tr-seg"><span class="tt-hyd">' + esc(seg) + '</span>' + inner + "</div>";
    }).join("");
  }

  function bindTranslate() {
    var dir = $("tr-dir"), input = $("tr-input"), go = $("tr-go");
    var clear = $("tr-clear"), copy = $("tr-copy"), output = $("tr-output"), detail = $("tr-detail");
    if (!dir || !go || !output) return;

    function run() {
      var text = input.value.trim();
      if (!text) {
        output.value = "";
        if (detail) detail.innerHTML = "";
        return;
      }
      if (dir.value === "h2z") {
        var parts = glossHydris(text);
        output.value = translateH2Z(text);
        if (detail) detail.innerHTML = detailH2Z(parts);
      } else {
        output.value = translateZ2H(text);
        if (detail) detail.innerHTML = detailZ2H(text);
      }
    }

    go.addEventListener("click", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
    });
    if (clear) clear.addEventListener("click", function () {
      input.value = "";
      output.value = "";
      if (detail) detail.innerHTML = "";
    });
    if (copy) copy.addEventListener("click", function () {
      var text = output.value;
      if (!text) return;
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (err) { /* ignore */ }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash("译文已复制"); }, fallback);
      } else { fallback(); flash("译文已复制"); }
    });
    var demo = $("tr-demo");
    if (demo) demo.addEventListener("click", function () {
      if (dir.value === "h2z") {
        input.value = "go mi zy waewe bi gymu";
      } else {
        input.value = "月球人，太阳之子";
      }
      run();
    });
  }

  function flash(msg) {
    var d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#232a35;color:#fff;padding:10px 18px;border-radius:8px;z-index:99;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.25)";
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 1800);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      bindDict();
      bindTranslate();
    });
  }

  // 供 Node 侧测试使用
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { glossHydris: glossHydris, translateH2Z: translateH2Z, translateZ2H: translateZ2H, reverseLookup: reverseLookup };
  }
})();
