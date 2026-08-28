/* 海德里斯语互译逻辑冒烟测试（无 DOM）：双框整句翻译 + 未匹配词保留原文 */
"use strict";

// 模拟浏览器环境：先注入词典数据，再加载 hydris.js 的模块导出
global.window = { HYDRIS_DATA: require("../js/hydris-data.js") };
const H = require("../js/hydris.js");
const DATA = require("../js/hydris-data.js");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ FAIL: " + name); }
}

console.log("== 词典数据 ==");
check("词条总数 474", DATA.length === 474);

console.log("== 海→中 整句翻译 ==");
const t1 = H.translateH2Z("go mi zy waewe bi gymu");
check("例句『go mi zy waewe bi gymu』逐词译出", t1 === "敬语 第二人称代词 表进行时 这里 停止 脚步");
const t2 = H.translateH2Z("la jo jota.");
check("『la jo jota.』输出含 吃/食物 且保留句号", t2.indexOf("吃") !== -1 && t2.indexOf("食物") !== -1 && /。|\.$/.test(t2));
const t3 = H.translateH2Z("hugymu");
check("『hugymu』整词翻译为 跑", t3.indexOf("跑") !== -1);
const t4 = H.translateH2Z("kare");
check("『kare』优先整词（月球人）而非 ka+de+re 拆分", t4.indexOf("月球人") !== -1);
check("未知词原样保留", H.translateH2Z("waewexyz") === "waewexyz");
check("混排：已知词翻译、未知词保留", (() => {
  const t = H.translateH2Z("la xyz jota");
  return t.indexOf("第一人称代词") !== -1 && t.indexOf("xyz") !== -1 && t.indexOf("食物") !== -1;
})());

console.log("== 中→海 整句翻译 ==");
const z1 = H.translateZ2H("月球人，太阳之子");
check("『月球人，太阳之子』→ kare，hyderisi", z1.indexOf("kare") !== -1 && z1.indexOf("hyderisi") !== -1);
const z2 = H.translateZ2H("日，太阳");
check("『日，太阳』→ hy", z2.indexOf("hy") !== -1);
check("未命中片段保留原文", H.translateZ2H("完全不存在的东西") === "完全不存在的东西");

console.log(fail === 0 ? "\n全部通过 (" + pass + ")" : "\n存在失败 (" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
