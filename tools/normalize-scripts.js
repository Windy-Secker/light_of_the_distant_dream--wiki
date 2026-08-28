/* 规范化所有页面的脚本引用顺序（去除重复，统一为规定顺序） */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ORDER = [
  "gene-data.js", "rune-data.js", "guide.js", "genes.js", "nav.js", "narrator.js",
  "unlock.js", "combat.js", "toc.js", "search.js", "settings.js",
  "hydris-data.js", "hydris.js", "mobile.js"
];

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (d.name.endsWith(".html")) out.push(p);
  });
}

const files = [];
walk(ROOT, files);
const re = /<script src="([^"]+)"><\/script>\n?/g;

files.forEach((f) => {
  let c = fs.readFileSync(f, "utf8");
  const srcs = [];
  let m;
  while ((m = re.exec(c))) srcs.push(m[1]);
  if (!srcs.length) return;

  const dir = srcs[0].indexOf("../") !== -1 ? "../" : "";
  const have = new Set(srcs.map((s) => s.replace(/^(\.\.\/)?js\//, "")));
  const ordered = ORDER.filter((n) => have.has(n));
  if (!ordered.length) return;
  const block = ordered.map((n) => `<script src="${dir}js/${n}"></script>`).join("\n");

  // 从 NAV 行之后到 </body> 前的整段脚本区，替换为规范化后的顺序
  const newC = c.replace(
    /(<script>window\.NAV[^\n]*<\/script>\n?)(?:<script src="[^"]*"><\/script>\n?)*/,
    "$1" + block + "\n"
  );
  if (newC !== c) {
    fs.writeFileSync(f, newC, "utf8");
    console.log("normalized:", path.relative(ROOT, f));
  }
});
console.log("done");
