/* 逻辑冒烟测试（无 DOM）：验证搜索索引 gm 过滤与角色卡有效消耗计算 */
"use strict";

const LIB = require("../js/rune-data.js");

// ---- 模拟 search.js 的索引构建 ----
function buildIndex() {
  const entries = [
    { t: "主页", g: false },
    { t: "世界观", g: false },
    { t: "世界观 · 审判日", g: true },
    { t: "世界观 · 奇迹符文的深层设定", g: true },
    { t: "战斗规则", g: false }
  ];
  LIB.forEach((f) => {
    entries.push({ t: f.name, g: false });
    // 奇迹符文使用解锁码（l），非奇迹无锁
    f.runes.forEach((r) => entries.push({ t: r.name, g: false, l: r.lock || null }));
  });
  return entries;
}

const INDEX = buildIndex();
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ FAIL: " + name); }
}

function playerVisibleEntries(unlocks) {
  return INDEX.filter((e) => {
    if (e.g) return false;
    if (e.l && !(unlocks || []).includes(e.l)) return false;
    return true;
  });
}

console.log("== 搜索索引 过滤 ==");
const ALL_RUNE_NAMES = [];
LIB.forEach((f) => f.runes.forEach((r) => ALL_RUNE_NAMES.push(r.name)));
const MIRACLE_NAMES = ALL_RUNE_NAMES.filter((n) => {
  const found = LIB.some((f) => f.runes.some((r) => r.name === n && r.miracle));
  return found;
});
check("无解锁码：奇迹条目被过滤", playerVisibleEntries([]).every((e) => MIRACLE_NAMES.indexOf(e.t) === -1));
check("解锁 miracle01：虚构观想可见、定界幻灭仍不可见", (() => {
  const v = playerVisibleEntries(["miracle01"]);
  return v.some((e) => e.t === "虚构观想") && !v.some((e) => e.t === "定界幻灭");
})());
check("解锁 miracle03：逆灵转生可见", playerVisibleEntries(["miracle03"]).some((e) => e.t === "逆灵转生"));
check("非讲述者模式：审判日/奇迹深层设定被过滤", playerVisibleEntries([]).every((e) => e.t.indexOf("审判日") === -1 && e.t.indexOf("奇迹符文的深层设定") === -1));
check("非讲述者模式：常规符文仍可见", playerVisibleEntries([]).some((e) => e.t === "崩坏") && playerVisibleEntries([]).some((e) => e.t === "光束"));
check("讲述者模式：全部符文均可检索", INDEX.filter((e) => ALL_RUNE_NAMES.indexOf(e.t) !== -1).length === ALL_RUNE_NAMES.length);
check("奇迹总数 = 3", LIB.reduce((s, f) => s + f.runes.filter((r) => r.miracle).length, 0) === 3);
check("奇迹解锁码齐全（miracle01/02/03）", (() => {
  const locks = [];
  LIB.forEach((f) => f.runes.forEach((r) => { if (r.miracle) locks.push(r.lock); }));
  return locks.indexOf("miracle01") !== -1 && locks.indexOf("miracle02") !== -1 && locks.indexOf("miracle03") !== -1;
})());
check("符文总数 = 49", ALL_RUNE_NAMES.length === 49);

console.log("== 角色卡有效消耗（灵魂记忆抵扣） ==");
// 复刻 guide.js 中的计算逻辑
function effCost(runeCosts, soulValue) {
  const total = runeCosts.reduce((s, c) => s + c, 0);
  return Math.max(0, total - soulValue);
}
function runeLimit(decon, soul) {
  return (decon ? 1 : 2) + (soul ? 1 : 0);
}
check("无灵魂记忆：总消耗 14 ≤ ACU 14，通过", effCost([6, 8], 0) === 14);
check("有灵魂记忆：总消耗 18 - 抵扣 4 = 14 ≤ ACU 14，通过", effCost([12, 6], 4) === 14);
check("抵扣超过总消耗：取 0", effCost([6], 20) === 0);
check("普通角色上限 2，灵魂记忆后 3", runeLimit(false, false) === 2 && runeLimit(false, true) === 3);
check("解构师上限 1，灵魂记忆后 2", runeLimit(true, false) === 1 && runeLimit(true, true) === 2);

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
