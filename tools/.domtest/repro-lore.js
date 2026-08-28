/* 验证：轮回页（认知淡化/公开记忆淡化/编号/警告）与梦境裁判所页（秘密保护科/记忆删除） */
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

function load(rel) {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, rel), "utf8"), { url: "http://x/" + rel, runScripts: "outside-only" });
  return dom.window.document;
}

/* ---------- 轮回页 ---------- */
console.log("== 轮回页：公开部分 ==");
const lun = load(path.join("worldview", "轮回.html"));
const pageText = lun.querySelector(".page").textContent;
const publicText = (() => {
  const locked = lun.querySelector(".hyd-content");
  // 公开文本 = 整页文本去掉锁定内容
  const t = pageText;
  return t.replace(locked ? locked.textContent : "", "");
})();
log("公开部分含 四、普通人的记忆淡化", publicText.indexOf("四、普通人的记忆淡化") !== -1);
log("公开部分描述 记忆快速流失 现象", publicText.indexOf("迅速流失") !== -1 && publicText.indexOf("合乎常理的解释") !== -1);
log("公开部分不透露基耶夏韦", publicText.indexOf("基耶夏韦") === -1 && publicText.indexOf("Kijexawe") === -1);
log("公开部分不透露识觉抑制", publicText.indexOf("识觉抑制") === -1);
log("记忆淡化标题带锚点 mem-fade", !!lun.getElementById("mem-fade"));

console.log("== 轮回页：锁定内容 ==");
const locked = lun.querySelector(".hyd-content");
log("锁定内容存在", !!locked);
const lockedText = locked.textContent;
log("基耶夏韦功能含 认知淡化", lockedText.indexOf("认知淡化") !== -1 && lockedText.indexOf("快速流失") !== -1 && lockedText.indexOf("合理化") !== -1);
log("功能列表为四项", locked.querySelectorAll("ol li").length === 4, "li=" + locked.querySelectorAll("ol li").length);
log("名词对照表含 认知淡化", lockedText.indexOf("认知淡化") !== -1);
log("h3 已编号（一~六）", (() => {
  const h3s = Array.from(locked.querySelectorAll("h3")).map((h) => h.textContent);
  return h3s.length === 6 && h3s.every((t) => /^[一二三四五六]、/.test(t));
})());
log("含讲述者警告（提及基耶夏韦）", lockedText.indexOf("讲述者专属信息") !== -1 && lockedText.indexOf("基耶夏韦 / 轮回巨构") !== -1);

/* ---------- 梦境裁判所页 ---------- */
console.log("== 梦境裁判所页 ==");
const org = load(path.join("orgs", "梦境裁判所.html"));
const orgPublic = org.querySelector(".page").textContent.replace(org.querySelector(".gm-only, section.gm-only") ? "" : "", "");
// 公开部分 = 去掉所有 gm-only 内容
const gmEls = org.querySelectorAll(".gm-only");
let orgPublicText = org.querySelector(".page").textContent;
gmEls.forEach((el) => { orgPublicText = orgPublicText.replace(el.textContent, ""); });
log("3.3 秘密保护科：只处理无法自然淡化的重大影响", orgPublicText.indexOf("自然淡化") !== -1 && orgPublicText.indexOf("过于重大、无法被自然淡化消除") !== -1);
log("3.3 公开部分不透露基耶夏韦", orgPublicText.indexOf("基耶夏韦") === -1 && orgPublicText.indexOf("Kijexawe") === -1);
log("3.3 含指向轮回记忆淡化的链接", (() => {
  const a = Array.from(org.querySelectorAll("a")).find((x) => (x.getAttribute("href") || "").indexOf("轮回.html#mem-fade") !== -1);
  return !!a && !a.closest(".gm-only");
})());
log("GM 2.1 记忆删除已更新（自然淡化之外的最后手段）", gmEls.length > 0 && Array.from(gmEls).some((el) => el.textContent.indexOf("自然淡化之外的最后手段") !== -1));
log("GM 2.1 记忆删除文本未提及基耶夏韦", (() => {
  // 仅检查 2.1 记忆删除所在区块（3.1 信息管控提及基耶夏韦属合法 GM 内容）
  const sec = Array.from(org.querySelectorAll("section.gm-only")).find((s) => s.textContent.indexOf("2.1 记忆删除") !== -1);
  return !!sec && sec.textContent.indexOf("基耶夏韦") === -1 && sec.textContent.indexOf("Kijexawe") === -1;
})());

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
