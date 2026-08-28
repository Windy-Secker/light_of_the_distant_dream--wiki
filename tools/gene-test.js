/* 基因系统逻辑冒烟测试（无 DOM）：数值聚合 / 互斥 / 随机抽取 */
"use strict";

const G = require("../js/gene-data.js");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ FAIL: " + name); }
}

// ---- 复刻 guide.js 的基因数值聚合 ----
function geneMods(genes) {
  const m = { phy: 0, acu: 0, wil: 0, phyCap: 0, acuCap: 0, wilCap: 0, res: 0, hp: 0, specPoints: 0, attrPoints: 0, resHalf: false, minPhy: 0, minAcu: 0, minWil: 0, specs: {} };
  (genes || []).forEach((g) => {
    const x = g.mods || {};
    m.phy += x.phy || 0; m.acu += x.acu || 0; m.wil += x.wil || 0;
    m.phyCap += x.phyCap || 0; m.acuCap += x.acuCap || 0; m.wilCap += x.wilCap || 0;
    m.res += x.res || 0; m.hp += x.hp || 0;
    m.specPoints += x.specPoints || 0;
    m.attrPoints += x.attrPoints || 0;
    if (x.resHalf) m.resHalf = true;
    m.minPhy = Math.max(m.minPhy, x.minPhy || 0);
    m.minAcu = Math.max(m.minAcu, x.minAcu || 0);
    m.minWil = Math.max(m.minWil, x.minWil || 0);
    if (x.specs) Object.keys(x.specs).forEach((k) => { m.specs[k] = (m.specs[k] || 0) + x.specs[k]; });
  });
  return m;
}

function effAttrs(allocated, genes) {
  const m = geneMods(genes);
  const eff = { phy: allocated.phy + m.phy, acu: allocated.acu + m.acu, wil: allocated.wil + m.wil };
  if (m.minPhy && eff.phy < m.minPhy) eff.phy = m.minPhy;
  if (m.minAcu && eff.acu < m.minAcu) eff.acu = m.minAcu;
  if (m.minWil && eff.wil < m.minWil) eff.wil = m.minWil;
  return eff;
}

const byName = {};
G.nonNegative.concat(G.negative).forEach((g) => { byName[g.name] = g; });

console.log("== 数值聚合 ==");
check("蛮力Lv3：体魄 +3（14 → 17）", effAttrs({ phy: 14, acu: 12, wil: 12 }, [byName["蛮力 Lv.3"]]).phy === 17);
check("脆弱：体魄 -2 且不低于 3（4 → 3）", effAttrs({ phy: 4, acu: 12, wil: 12 }, [byName["脆弱"]]).phy === 3);
check("脆弱：物理抗性减半（体质15 → 抗性5 → 2）", (() => {
  const m = geneMods([byName["脆弱"]]);
  const res = Math.floor(effAttrs({ phy: 15, acu: 10, wil: 10 }, [byName["脆弱"]]).phy / 3) + m.res;
  return Math.floor(res / 2) === 2;
})());
check("贫血：生命上限 -10", geneMods([byName["贫血"]]).hp === -10);
check("好奇 Lv.1：神秘学 +1", geneMods([byName["好奇 Lv.1"]]).specs["神秘学"] === 1);
check("万事通 Lv.2：专精点数 +2", geneMods([byName["万事通 Lv.2"]]).specPoints === 2);
check("三好学生 Lv.1：属性点数 +1", geneMods([byName["三好学生 Lv.1"]]).attrPoints === 1);
check("单科生 Lv.2：专精点数 -2", geneMods([byName["单科生 Lv.2"]]).specPoints === -2);
check("均衡：三项各 +1", (() => {
  const m = geneMods([byName["均衡"]]);
  return m.phy === 1 && m.acu === 1 && m.wil === 1;
})());
check("自闭：公共场合或人数超过5人时检定劣势", (() => {
  const g = byName["自闭"];
  return g.effect.indexOf("公共场合或人数超过5人") !== -1 && g.effect.indexOf("劣势") !== -1 && g.effect.indexOf("请」") === -1;
})());

console.log("== 稀有度分配 ==");
check("三档齐全（普通16/罕见25/稀有18）", (() => {
  const c = G.nonNegative.filter((g) => g.rarity === "common").length;
  const r = G.nonNegative.filter((g) => g.rarity === "rare").length;
  const e = G.nonNegative.filter((g) => g.rarity === "epic").length;
  return c === 16 && r === 25 && e === 18;
})());
check("非负面 59 / 负面 28", G.nonNegative.length === 59 && G.negative.length === 28);
check("负面基因无稀有度字段", G.negative.every((g) => !g.rarity));
check("所有基因都有扮演提示", G.nonNegative.every((g) => g.hint) && G.negative.every((g) => g.hint));
check("代价型归入非负面（双刃剑/易燃/赌徒）", (() => {
  const names = G.nonNegative.map((g) => g.name);
  return names.indexOf("双刃剑") !== -1 && names.indexOf("易燃") !== -1 && names.indexOf("赌徒") !== -1;
})());
check("西格玛带属性修正但属机制类（名称归属优先）", (() => {
  const g = G.nonNegative.find((x) => x.name === "西格玛");
  return !!g && !!g.mods && g.mods.acu === 1 && g.mods.wil === -1;
})());
check("专精增强类均有二级版本（12 个 Lv.2 罕见）", (() => {
  const lv2 = G.nonNegative.filter((g) => g.rarity === "rare" && / Lv\.2$/.test(g.name) && g.mods && g.mods.specs);
  return lv2.length === 12;
})());
check("互斥组完整（10 组）", (() => {
  const groups = new Set();
  G.nonNegative.concat(G.negative).forEach((g) => { if (g.exclusive) groups.add(g.exclusive); });
  return groups.size === 10;
})());
check("Ⅰ/Ⅱ/Ⅲ型极端：同组三选一 + uncap 修正", (() => {
  const extreme = G.nonNegative.filter((g) => g.exclusive === "extreme");
  if (extreme.length !== 3) return false;
  const uncaps = extreme.map((g) => g.mods && g.mods.uncap).sort();
  return uncaps.join(",") === "acu,phy,wil";
})());

console.log("== 随机抽取（含互斥） ==");
function randomSelectGenes(pcount, ncount) {
  const availP = G.nonNegative.slice();
  const availN = G.negative.slice();
  const used = {};
  const usedGroup = {};
  const picksP = [];
  for (let i = 0; i < pcount; i++) {
    const pool = availP.filter((g) => !used[g.name] && !(g.exclusive && usedGroup[g.exclusive]));
    if (!pool.length) break;
    const w = G.randomWeight;
    let rarity = null;
    for (let t = 0; t < 12; t++) {
      const r = Math.random() * 100;
      rarity = r < w.common ? "common" : (r < w.common + w.rare ? "rare" : "epic");
      if (pool.some((g) => g.rarity === rarity)) break;
    }
    if (!pool.some((g) => g.rarity === rarity)) rarity = pool[0].rarity;
    const candidates = pool.filter((g) => g.rarity === rarity);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    used[pick.name] = true;
    if (pick.exclusive) usedGroup[pick.exclusive] = true;
    picksP.push(pick);
  }
  const picksN = [];
  for (let j = 0; j < ncount && availN.length; j++) {
    const candidates = availN.filter((g) => !(g.exclusive && usedGroup[g.exclusive]));
    if (!candidates.length) break;
    const idx = Math.floor(Math.random() * candidates.length);
    const pick = candidates[idx];
    availN.splice(availN.indexOf(pick), 1);
    if (pick.exclusive) usedGroup[pick.exclusive] = true;
    picksN.push(pick);
  }
  return { p: picksP, n: picksN };
}
let dup = 0, over = 0, groupDup = 0;
for (let i = 0; i < 500; i++) {
  const r = randomSelectGenes(2, 2);
  const names = r.p.map((g) => g.name).concat(r.n.map((g) => g.name));
  if (new Set(names).size !== names.length) dup++;
  if (r.p.length > 2 || r.n.length > 2) over++;
  const groups = new Set();
  r.p.concat(r.n).forEach((g) => { if (g.exclusive && groups.has(g.exclusive)) groupDup++; groups.add(g.exclusive); });
}
check("500 次随机：无重复、数量不超限、互斥组不冲突", dup === 0 && over === 0 && groupDup === 0);

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
