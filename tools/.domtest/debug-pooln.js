const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const ROOT = path.resolve(__dirname, "..", "..");
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "guide.html"), "utf8"), {
  url: "http://x/guide.html", runScripts: "outside-only", pretendToBeVisual: true
});
const w = dom.window;
w.NARRATOR = { isOn: () => false };
w.UNLOCKS = { isOpen: () => false };
try {
  w.eval(fs.readFileSync(path.join(ROOT, "js", "gene-data.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(ROOT, "js", "rune-data.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(ROOT, "js", "guide.js"), "utf8"));
} catch (e) { console.log("EVAL ERR", e.stack); }
w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
const d = w.document;
console.log("poolP picks:", d.querySelectorAll("#g-gene-pool-p .gene-pick").length);
console.log("poolN picks:", d.querySelectorAll("#g-gene-pool-n .gene-pick").length);
console.log("poolN html:", JSON.stringify(d.getElementById("g-gene-pool-n").innerHTML.slice(0, 150)));
const neg = w.GENE_DATA ? w.GENE_DATA.negative.length : -1;
console.log("GENE_DATA.negative:", neg);
