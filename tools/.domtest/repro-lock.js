/* 验证：解锁码仅讲述者可见；未解锁条目页面对玩家为空白 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
let pass = 0, fail = 0;
function log(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name + (extra ? "  [" + extra + "]" : "")); }
  else { fail++; console.log("  ✗ FAIL " + name + (extra ? "  [" + extra + "]" : "")); }
}

/* ---------- CSS 规则检查 ---------- */
console.log("== CSS：锁定提示与空白页规则 ==");
const css = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");
log("玩家默认不显示 hyd-locked（display:none）", /\.hyd-locked\s*\{\s*display:\s*none/.test(css));
log("讲述者模式显示 hyd-locked（含解锁码）", /body\.narrator-mode\s+\.hyd-locked\s*\{\s*display:\s*block/.test(css));
log("完全锁定页整页留白：hyderisi", /body:not\(\.narrator-mode\):not\(\.unlocked-hyderisi\)\s+\.lock-hyderisi/.test(css));
log("完全锁定页整页留白：miracle01/02/03", /\.lock-miracle01/.test(css) && /\.lock-miracle02/.test(css) && /\.lock-miracle03/.test(css));
log("轮回页（kijexawe）不做整页隐藏", css.indexOf(".unlocked-kijexawe") !== -1 && !/body:not\(\.narrator-mode\):not\(\.unlocked-kijexawe\)/.test(css));

/* ---------- 页面标题行为（unlock.js） ---------- */
function loadWithUnlock(rel, narrator) {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, rel), "utf8"), {
    url: "http://127.0.0.1/" + rel,
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  window.NARRATOR = { isOn: function () { return !!narrator; }, onChanged: function () {} };
  window.eval(fs.readFileSync(path.join(ROOT, "js", "unlock.js"), "utf8"));
  document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return document;
}

console.log("== 完全锁定页标题（hydris.html） ==");
let doc = loadWithUnlock(path.join("hydris.html"), false);
log("玩家视角：标题为中性（不提示锁定条目）", doc.title === "远梦之光 · 规则 Wiki", "title=" + doc.title);
doc = loadWithUnlock(path.join("hydris.html"), true);
log("讲述者视角：恢复真实标题", doc.title.indexOf("海德里斯语") !== -1, "title=" + doc.title);

console.log("== 混合页标题（轮回.html，含公开内容） ==");
doc = loadWithUnlock(path.join("worldview", "轮回.html"), false);
log("玩家视角：保留原标题「轮回」", doc.title.indexOf("轮回") !== -1 && doc.title.indexOf("锁定") === -1, "title=" + doc.title);

/* ---------- 锁定提示中的解锁码（应为讲述者专属内容） ---------- */
console.log("== 锁定提示中的解锁码 ==");
["hydris.html", "hydris/grammar.html", "hydris/translate.html", "runes/虚构观想.html", "runes/定界幻灭.html", "runes/逆灵转生.html"].forEach((rel) => {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, rel), "utf8"), { url: "http://x/" + rel, runScripts: "outside-only" });
  const notice = dom.window.document.querySelector(".hyd-locked");
  log(rel + "：解锁码位于 hyd-locked 提示内（仅讲述者可见）", !!notice && /解锁码：/.test(notice.textContent));
});
// 轮回页：无 hyd-locked 提示（玩家/讲述者均无“此处有锁定内容”的提示，锁定内容内部自带讲述者警告）
const lunDom = new JSDOM(fs.readFileSync(path.join(ROOT, "worldview", "轮回.html"), "utf8"), { url: "http://x/", runScripts: "outside-only" });
const lunDoc = lunDom.window.document;
log("轮回页无 hyd-locked 提示（不泄露锁定信息）", !lunDoc.querySelector(".hyd-locked"));
log("轮回页锁定内容内有讲述者警告", /讲述者专属信息/.test(lunDoc.querySelector(".hyd-content").textContent));

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
