/* 探测：海德里斯语.lexc 是否为可解析的 JSON，并统计词条 */
"use strict";
const fs = require("fs");
const path = require("path");

const raw = fs.readFileSync(path.join(__dirname, "..", "lexc", "海德里斯语.lexc"), "utf8");
try {
  const data = JSON.parse(raw);
  const words = Object.keys(data.Lexicon || {});
  console.log("JSON 可解析 ✓");
  console.log("词条总数:", words.length);
  const tags = new Set();
  let withTags = 0;
  words.forEach((w) => {
    const s = data.Lexicon[w];
    (s.Senses || []).forEach((se) => {
      (se.tags || []).forEach((t) => tags.add(t));
      if (se.tags && se.tags.length) withTags++;
    });
  });
  console.log("词性标签集合:", Array.from(tags).join(" / "));
  console.log("含词性标签的词条:", withTags);
  // 抽样
  ["kare", "hyderisi", "de", "go", "mi", "nau", "jvin"].forEach((w) => {
    if (data.Lexicon[w]) {
      const s = data.Lexicon[w];
      const defs = (s.Senses || []).map((x) => x.definition).join("；");
      console.log(`  ${w}: ${defs} [${(s.Senses || []).map((x) => (x.tags || []).join(",")).join(",")}]`);
    } else {
      console.log(`  ${w}: 不在词典中`);
    }
  });
} catch (e) {
  console.log("JSON 解析失败:", e.message);
  process.exit(1);
}
