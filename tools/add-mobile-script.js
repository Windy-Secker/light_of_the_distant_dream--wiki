/* 向所有 HTML 页面插入 js/mobile.js（在 </body> 之前；保留原文件编码与换行） */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (d.name.endsWith(".html")) out.push(p);
  });
}
const files = [];
walk(ROOT, files);

let count = 0;
files.forEach((f) => {
  let c = fs.readFileSync(f, "utf8");
  if (c.indexOf("js/mobile.js") !== -1) return;
  if (c.indexOf("</body>") === -1) return;
  const prefix = c.indexOf('src="../js/') !== -1 ? "../" : "";
  const tag = '<script src="' + prefix + 'js/mobile.js"></script>';
  c = c.replace("</body>", tag + "\n</body>");
  fs.writeFileSync(f, c, "utf8");
  count++;
  console.log("added:", path.relative(ROOT, f));
});
console.log("done, added to", count, "pages");
