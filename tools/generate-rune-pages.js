/* ==========================================================================
 * 符文库页面生成器
 * 从 ../js/rune-data.js 读取数据，生成：
 *   runes.html                  —— 符文库总览（8 个系谱的全部表格）
 *   runes/<系谱>.html           —— 每个系谱的单页（仅该系谱表格）
 *   runes/<符文>.html           —— 每个符文的独立 wiki 条目（详细说明）
 * 用法：node tools/generate-rune-pages.js
 * ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const RUNE_LIBRARY = require("../js/rune-data.js");

const OUT_DIR = path.join(__dirname, "..", "runes");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ---------- 工具函数 ---------- */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 将 **加粗** 标记转为 <strong>
function fmt(s) {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// 字段值：字符串或字符串数组（数组按原文分行渲染）
function val(v) {
  if (Array.isArray(v)) return v.map(fmt).join("<br>");
  return fmt(v);
}

function enc(name) {
  return encodeURIComponent(name);
}

/* ---------- 页面骨架 ---------- */

function shell(opts) {
  const { title, base, sub, content, bodyClass, articleClass } = opts;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} - 远梦之光 · 规则 Wiki</title>
<link rel="stylesheet" href="${base}css/style.css">
<link rel="stylesheet" href="${base}css/night.css">
</head>
<body${bodyClass ? ' class="' + bodyClass + '"' : ""}>
<div class="layout">
  <aside class="sidebar"></aside>
  <main class="content">
    <article class="page${articleClass ? ' ' + articleClass : ""}">
${content}
    </article>
    <footer class="page-footer">
      <a href="${base}index.html">远梦之光 · 规则 Wiki</a> · 内容基于《远梦之光》规则文档 v0.1 整理 · <a href="${base}about.html">关于</a>
    </footer>
  </main>
</div>
<script>window.NAV = { base: "${base}", page: "runes", sub: "${sub || ""}" };</script>
<script src="${base}js/rune-data.js"></script>
<script src="${base}js/nav.js"></script>
<script src="${base}js/narrator.js"></script>
<script src="${base}js/unlock.js"></script>
<script src="${base}js/toc.js"></script>
<script src="${base}js/search.js"></script>
<script src="${base}js/settings.js"></script>
</body>
</html>
`;
}

/* ---------- 系谱表格 ---------- */

function familyTable(family, base) {
  let html = `<table class="wiki-table">
<thead><tr><th>符文名</th><th>算力消耗</th><th>基础效果简述</th></tr></thead>\n<tbody>\n`;

  family.runes.forEach((r) => {
    // 奇迹条目：讲述者模式或对应解锁码解锁后可见
    const lockCls = r.miracle && r.lock ? " gm-only u-" + r.lock : (r.miracle ? " gm-only" : "");
    html += `<tr class="${lockCls.trim()}">`;
    html += `<td><a class="rune-link" href="${base}runes/${enc(r.name)}.html">${escapeHtml(r.name)}</a>`;
    if (r.miracle) html += ' <span class="badge miracle">奇迹</span>';
    html += "</td>";
    html += `<td>${escapeHtml(r.cost)}</td>`;
    html += `<td>${escapeHtml(r.summary)}</td>`;
    html += "</tr>\n";
  });

  html += "</tbody>\n</table>\n";
  return html;
}

function familySection(family, base) {
  return `<h2 id="${escapeHtml(family.name)}">${family.tag}、${escapeHtml(family.name)}</h2>` +
    `\n<p class="family-core">${escapeHtml(family.core)}</p>\n` +
    familyTable(family, base);
}

/* ---------- 符文库总览页（runes.html） ---------- */

const FIELD_TABLE = `<table class="wiki-table">
<thead><tr><th>字段</th><th>说明</th></tr></thead>
<tbody>
<tr><td><strong>学名</strong></td><td>符文的标准名称</td></tr>
<tr><td><strong>系谱分类</strong></td><td>所属的八个系谱之一</td></tr>
<tr><td><strong>平均算力消耗</strong></td><td>维持该符文所需占用的算力值。<span class="gm-only">奇迹标注为「—」</span></td></tr>
<tr><td><strong>伤害类型</strong></td><td>物理/符文/灵魂/混沌/解构 / 无（非攻击型）</td></tr>
<tr><td><strong>基础效果</strong></td><td>符文的核心功能</td></tr>
<tr><td><strong>愿力投入效果</strong></td><td>每额外投入<strong>10</strong>点愿力的具体增幅</td></tr>
<tr><td><strong>判定标准</strong></td><td>使用该符文时需要进行的检定公式与DC</td></tr>
<tr><td><strong>特殊规则</strong></td><td>独有的限制、副作用或附加条件</td></tr>
<tr><td><strong>适用场景</strong></td><td>战斗/侦查/社交/生存等</td></tr>
</tbody>
</table>`;

let runesIndexContent = `<div class="breadcrumb"><a href="index.html">主页</a> / 符文库</div>
<h1>符文库</h1>
<p class="subtitle">按系谱分类整理所有可用符文，点击表格中的符文名可进入该符文的独立条目。</p>

<h2>如何阅读符文库</h2>
<p>本页按<strong>系谱分类</strong>整理所有可用符文。每个系谱以<strong>简要索引表</strong>开头，方便快速查阅；每个符文名链接至<strong>独立条目</strong>，其中包含完整的详细说明（判定标准与数值规则）。</p>

<h3>符文详细条目的字段说明</h3>
${FIELD_TABLE}

<h3>常规符文 vs 奇迹</h3>
<ul>
<li><strong>常规符文</strong>：具有明确的平均算力消耗，可被学习和观想，满足条件即可使用。</li>
<li class="gm-only"><strong>奇迹</strong>：算力消耗标注为「—」，不计入常规算力消耗；具有共同性质：
  <ul>
    <li>一定会作为灵魂记忆出现</li>
    <li>同时只能由一人继承</li>
    <li>无法解析/刻录/脱离灵魂发动</li>
  </ul>
</li>
</ul>
<div class="callout warn gm-only">⚠ 有关「奇迹」的更深层设定、具体资料与名称，仅<strong>讲述者模式</strong>可见。请在侧边栏开启「讲述者模式」查看。</div>
`;

RUNE_LIBRARY.forEach((family) => {
  runesIndexContent += familySection(family, "");
});

fs.writeFileSync(
  path.join(OUT_DIR, "..", "runes.html"),
  shell({
    title: "符文库",
    base: "",
    sub: "",
    content: runesIndexContent,
  }),
  "utf8"
);
console.log("生成 runes.html");

/* ---------- 系谱单页 ---------- */

// 解构系单页附加内容：解构师与解构学（源自“设定扩充2”，属公开背景信息）
const DECONSTRUCTION_EXTRA = `
<h2>解构师与解构学</h2>
<p><strong>符文解构学</strong>是一门专注于<strong>安全解除、干扰和破坏已有符文术式</strong>的学科。解构师所掌握的符文体系独立于其它系谱，被称为<strong>解构符文</strong>。</p>

<h3>起源：炼金术时代</h3>
<p>符文解构学最早脱胎于炼金术鼎盛的时期。炼金术往往需要大量的符文阵法支持，一次构造错误就可能造成极大的资源浪费甚至人员伤亡。因此，一小部分炼金术士开始研究“不用激发已构造的符文术式便能安全解除符文构造”的方法——这便是符文解构学的早期雏形。这一时期的技术尚不稳定，解构手段也远未达到“实战可用”的程度。</p>

<h3>转折：斯图尔特·史密斯与《符文解构概论》</h3>
<p><strong>17世纪末</strong>，时任蔷薇学会会长<strong>斯图尔特·史密斯</strong>在前人研究的基础上，完成了一部划时代的著作——《符文解构概论》。此书不仅系统化了符文解构的理论框架，更提出了将解构技术应用于实战的可行性方案。自此：</p>
<ul>
  <li>符文解构学<strong>正式脱离</strong>符文阵法学，成为一门独立的学科；</li>
  <li>轮回者战斗职业在原有的七大分类之外，新增了第八种：<strong>解构师</strong>。</li>
</ul>
<blockquote>斯图尔特·史密斯因此被后世尊为“符文解构学之父”。</blockquote>

<h3>发展：解构师的诞生</h3>
<p>在《符文解构概论》问世后，解构真正被应用于实战之中，<strong>解构师</strong>这一战斗职业由此诞生。解构师通常具有较强的近身战斗能力，其核心战术为：</p>
<ol>
  <li><strong>先解构</strong>——瓦解对方即将发动或正在维持的符文术式；</li>
  <li><strong>再打击</strong>——以非符文手段（体术、武器等）施以强力攻击。</li>
</ol>

<h3>关于解构符文的学术争论</h3>
<p>一个长期的学术争议在于：解构符文是否属于真正的“符文”？反对者认为大多数解构符文单独使用时没有任何效果，只对特定类型的符文起到干扰和破坏作用，这不符合“符文是客观术式单元”的定义。这场争论持续了数百年，直到<strong>解构系奇迹「<a href="../runes/定界幻灭.html">定界幻灭</a>」的现世</strong>才终结了讨论——奇迹的出现证明了“解构”本身就是一个独立的符文系谱，而非阵法学的一个分支。</p>

<h3>解构师的真实局限性</h3>
<p>尽管解构师在对阵符文使用者时具有明显优势，但其局限性同样明显：</p>
<ul>
  <li><strong>对无符文目标无效</strong>：解构系符文在应对纯粹物理威胁时几乎无用；</li>
  <li><strong>对多重符文同时维持者有压力限制</strong>：一个解构师同时瓦解的符文数量受算力限制，面对“百符齐发”时可能捉襟见肘；</li>
  <li><strong>近身作战要求高</strong>：大多数解构师需要较强的体魄或武器熟练度，因为解构本身不直接造成伤害。</li>
</ul>
<div class="callout info">关于蔷薇学会的更多详情（包括《符文解构概论》与「定界幻灭」持有者的信息），见<a href="../orgs/蔷薇学会.html">组织 · 蔷薇学会</a>。</div>
`;

RUNE_LIBRARY.forEach((family) => {
  const extra = family.name === "解构系" ? DECONSTRUCTION_EXTRA : "";
  const content = `<div class="breadcrumb"><a href="../index.html">主页</a> / <a href="../runes.html">符文库</a> / ${escapeHtml(family.name)}</div>
<h1>${family.tag}、${escapeHtml(family.name)}</h1>
<p class="subtitle">${escapeHtml(family.core)}</p>
${familyTable(family, "../")}
${extra}
<div class="callout info">这是「${escapeHtml(family.name)}」系谱的单页视图。查看全部八个系谱请前往 <a href="../runes.html">符文库总览</a>。</div>
`;
  const file = path.join(OUT_DIR, family.name + ".html");
  fs.writeFileSync(
    file,
    shell({
      title: family.name,
      base: "../",
      sub: family.name,
      content,
    }),
    "utf8"
  );
  console.log("生成 runes/" + family.name + ".html");
});

/* ---------- 符文独立条目 ---------- */

RUNE_LIBRARY.forEach((family) => {
  family.runes.forEach((r) => {
    let rows = "";
    r.detail.forEach((d) => {
      rows += `<tr><td>${fmt(d.f)}</td><td>${val(d.v)}</td></tr>\n`;
    });

    const badges = r.miracle
      ? ' <span class="badge miracle">奇迹</span>'
      : "";

    const detailBody = `<div class="breadcrumb"><a href="../index.html">主页</a> / <a href="../runes.html">符文库</a> / <a href="../runes/${enc(family.name)}.html">${escapeHtml(family.name)}</a> / ${escapeHtml(r.name)}</div>
<h1>${escapeHtml(r.name)}${badges}</h1>
<p class="subtitle">${escapeHtml(r.summary)}</p>

<div class="rune-detail">
<table class="wiki-table">
<tbody>
${rows}</tbody>
</table>
</div>

<div class="btn-row">
<a class="btn small" href="../runes/${enc(family.name)}.html">← 返回${escapeHtml(family.name)}</a>
<a class="btn small" href="../runes.html">返回符文库总览</a>
</div>
`;

    // 奇迹条目：需对应解锁码或讲述者模式
    const content = r.miracle
      ? `<div class="hyd-locked callout warn">该条目已<strong>锁定</strong>：解锁码由讲述者在剧情中发放，输入正确解锁码或开启<strong>讲述者模式</strong>后方可查看。<br><strong>本条目解锁码：${escapeHtml(r.lock)}</strong>（解锁入口位于<strong>主页底部</strong>）</div>\n<div class="hyd-content">\n${detailBody}\n</div>`
      : detailBody;
    const file = path.join(OUT_DIR, r.name + ".html");
    fs.writeFileSync(
      file,
      shell({
        title: r.name,
        base: "../",
        sub: family.name,
        content,
        articleClass: r.miracle && r.lock ? "lock-" + r.lock : undefined,
      }),
      "utf8"
    );
    console.log("生成 runes/" + r.name + ".html");
  });
});

console.log("完成：符文库页面已全部生成。");

/* ---------- 符文库 · 奇迹（仅讲述者模式可见） ---------- */

(function generateMiraclePage() {
  const miracles = [];
  RUNE_LIBRARY.forEach((f) => {
    f.runes.forEach((r) => {
      if (r.miracle) miracles.push({ f: f.name, r });
    });
  });

  const rows = miracles.map((m) =>
    `<tr><td><a class="rune-link" href="../runes/${enc(m.r.name)}.html">${escapeHtml(m.r.name)}</a> <span class="badge miracle">奇迹</span></td>` +
    `<td>${escapeHtml(m.f)}</td><td>${escapeHtml(m.r.cost)}</td><td>${escapeHtml(m.r.summary)}</td></tr>`
  ).join("\n");

  const content = `<div class="breadcrumb gm-only"><a href="../index.html">主页</a> / <a href="../runes.html">符文库</a> / 奇迹</div>
<h1 class="gm-only">奇迹</h1>
<p class="subtitle gm-only">算力消耗标注为「—」的超规格符文 · 讲述者专属信息</p>

<div class="gm-locked callout warn">该条目为<strong>讲述者专属信息</strong>：仅讲述者模式可见。若你不是讲述者，请勿继续查看。</div>

<div class="gm-content">
<p>以下为已知的<strong>奇迹符文</strong>索引。奇迹不计入常规算力消耗，具有共同性质（详见各条目）：</p>
<table class="wiki-table">
<thead><tr><th>符文名</th><th>系谱</th><th>算力消耗</th><th>基础效果简述</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<div class="callout warn">⚠ 奇迹是<strong>双重刃剑</strong>：既是人类对抗审判日的希望，也是可能提前引发审判日的隐患；奇迹本身会吸引堕神的注意。请谨慎向玩家揭示。</div>
</div>
`;
  const file = path.join(OUT_DIR, "奇迹.html");
  fs.writeFileSync(
    file,
    shell({
      title: "奇迹",
      base: "../",
      sub: "奇迹",
      content,
    }),
    "utf8"
  );
  console.log("生成 runes/奇迹.html");
})();
