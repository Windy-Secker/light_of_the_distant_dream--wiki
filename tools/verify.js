const fs = require("fs");
const path = require("path");
const LIB = require("../js/rune-data.js");
const ROOT = path.join(__dirname, "..");
let total = 0;
LIB.forEach((f) => {
  console.log(f.tag + "、" + f.name + " : " + f.runes.length + " 个符文");
  total += f.runes.length;
});
console.log("系谱数: " + LIB.length + ", 符文总数: " + total);
const html = fs.readFileSync(path.join(ROOT, "runes.html"), "utf8");
LIB.forEach((f) => {
  if (!html.includes(f.tag + "、" + f.name)) console.log("缺少系谱节: " + f.name);
});
const linkCount = (html.match(/runes\/%[^"']+\.html/g) || []).length;
console.log("runes.html 中符文链接数: " + linkCount);
const detailFiles = fs.readdirSync(path.join(ROOT, "runes")).filter((x) => x.endsWith(".html"));
console.log("runes/ 目录 html 文件数: " + detailFiles.length);
