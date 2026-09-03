const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const ROOT = path.resolve(__dirname, "..", "..");
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "genes.html"), "utf8"), {
  url: "http://127.0.0.1/genes.html", runScripts: "outside-only", pretendToBeVisual: true
});
const { window } = dom;
window.NARRATOR = { isOn: function () { return false; }, onChanged: function () {} };
["gene-data.js", "genes.js", "mobile.js", "kwfilter.js"].forEach((s) => window.eval(fs.readFileSync(path.join(ROOT, "js", s), "utf8")));
window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
const doc = window.document;
const allTr = Array.from(doc.querySelectorAll("#g-nonneg tr, #g-neg tr"));
console.log("全部 tr:", allTr.length);
console.log("thead tr:", allTr.filter((t) => t.parentElement && t.parentElement.tagName === "THEAD").length);
console.log("tbody tr:", allTr.filter((t) => t.parentElement && t.parentElement.tagName === "TBODY").length);
const tbRows = allTr.filter((t) => t.parentElement && t.parentElement.tagName === "TBODY");
console.log("tbody 行 display 分布:", tbRows.reduce((m, r) => { const d = r.style.display || "(空)"; m[d] = (m[d] || 0) + 1; return m; }, {}));
const input = doc.querySelector("input.kw-filter");
console.log("input value:", JSON.stringify(input.value));
console.log("table-scroll 数量:", doc.querySelectorAll(".table-scroll").length, "| 可见 table-scroll:", Array.from(doc.querySelectorAll(".table-scroll")).filter((t) => t.style.display !== "none").length);
