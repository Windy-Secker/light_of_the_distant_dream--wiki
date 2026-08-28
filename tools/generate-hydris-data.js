/* ==========================================================================
 * 海德里斯语词典数据生成器
 * 数据来源：../lexc/海德里斯语.lexc（单一 JSON 行，含 IPA 发音与词性标签）
 * 说明：选择 .lexc 而非 .csv 作为蓝本，因为它额外包含词性标签（名词/动词/助词等），
 *       便于互译页按词性展示与检索。生成结果为 js/hydris-data.js（纯 JS 数据文件）。
 * 用法：node tools/generate-hydris-data.js
 * ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "lexc", "海德里斯语.lexc");
const OUT = path.join(__dirname, "..", "js", "hydris-data.js");

const raw = fs.readFileSync(SRC, "utf8");
const data = JSON.parse(raw);
const lexicon = data.Lexicon || {};

const words = Object.keys(lexicon).map((w) => {
  const entry = lexicon[w];
  const senses = entry.Senses || [];
  const defs = senses.map((s) => s.definition).filter(Boolean).join("；");
  const tags = [];
  senses.forEach((s) => (s.tags || []).forEach((t) => tags.push(t)));
  const ipa = (entry.pronunciations && entry.pronunciations.General && entry.pronunciations.General.ipa) || "";
  return { w, ipa, d: defs, t: tags };
});

// 按词长降序、字母序升序排序：互译时优先匹配更长的复合词
words.sort((a, b) => b.w.length - a.w.length || (a.w < b.w ? -1 : a.w > b.w ? 1 : 0));

const body =
  "/* ==========================================================================\n" +
  " * 海德里斯语词典数据（由 tools/generate-hydris-data.js 从 海德里斯语.lexc 生成）\n" +
  " * 字段：w=词形 ipa=发音 d=释义 t=词性标签（按词长降序排列，互译时优先匹配长词）\n" +
  " * ========================================================================== */\n" +
  "(function (global) {\n" +
  '  "use strict";\n' +
  "  var HYDRIS_DATA = " + JSON.stringify(words) + ";\n" +
  "  if (typeof module !== \"undefined\" && module.exports) module.exports = HYDRIS_DATA;\n" +
  "  if (global) global.HYDRIS_DATA = HYDRIS_DATA;\n" +
  "})(typeof window !== \"undefined\" ? window : null);\n";

fs.writeFileSync(OUT, body, "utf8");

let withIpa = 0, withTags = 0;
words.forEach((e) => { if (e.ipa) withIpa++; if (e.t.length) withTags++; });
console.log("生成 js/hydris-data.js");
console.log("词条总数:", words.length);
console.log("含发音:", withIpa, "| 含词性标签:", withTags);
