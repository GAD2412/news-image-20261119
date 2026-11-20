// Builds entry.png from stories.json: writes one HTML page (inline SVG art and map),
// checks the layout in headless Chrome, then screenshots it at 1024x1024.
// Usage: node build.mjs <path to Natural Earth ne_110m_land.geojson>
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const S = JSON.parse(readFileSync(join(ROOT, 'stories.json'), 'utf8'));
const LAND = process.argv[2] || process.env.LAND_GEOJSON;
if (!LAND) throw new Error('pass the path of ne_110m_land.geojson');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BUILD = join(ROOT, 'build');
mkdirSync(BUILD, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const REGIONS = ['Asia', 'Middle East', 'Europe', 'Africa', 'N. America', 'S. America', 'Oceania', 'Global'];
const COLOR = {
  'Asia': '#b4462f', 'Middle East': '#b9822a', 'Europe': '#2f63a3', 'Africa': '#4f8a33',
  'N. America': '#7350a6', 'S. America': '#1f8a80', 'Oceania': '#1f86b0', 'Global': '#5c5c5c',
};

// Number every story: leads 1-3, tiles 4-11, briefs after.
const all = [...S.leads, ...S.tiles, ...S.briefs];
all.forEach((s, i) => { s.n = i + 1; });
const counts = Object.fromEntries(REGIONS.map((r) => [r, all.filter((s) => s.region === r).length]));

// ---------- illustrations (flat SVG scenes, drawn here) ----------
const flagUS = (x, y) => `<g transform="translate(${x},${y})"><rect width="30" height="20" fill="#fff"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect y="${i * 2.86}" width="30" height="1.43" fill="#b22234"/>`).join('')}<rect width="13" height="10" fill="#3c3b6e"/></g>`;
const flagCN = (x, y) => `<g transform="translate(${x},${y})"><rect width="30" height="20" fill="#de2910"/><path d="M6 3l1.2 3.6h3.8l-3 2.2 1.1 3.6-3.1-2.2-3.1 2.2 1.1-3.6-3-2.2h3.8z" fill="#ffde00"/></g>`;
const flagRU = (x, y) => `<g transform="translate(${x},${y})"><rect width="30" height="6.7" fill="#fff" stroke="#ccc" stroke-width=".4"/><rect y="6.7" width="30" height="6.7" fill="#0039a6"/><rect y="13.4" width="30" height="6.6" fill="#d52b1e"/></g>`;
const person = (x, y, c) => `<g transform="translate(${x},${y})"><circle cx="0" cy="-30" r="11" fill="#e9c6a2"/><path d="M-20 10 Q-20 -16 0 -16 Q20 -16 20 10 Z" fill="${c}"/><path d="M-3 -16 L0 -6 L3 -16 Z" fill="#fff"/></g>`;

const ART = {
  summit: () => `<rect width="324" height="104" fill="#e4ecf6"/>
    <rect y="70" width="324" height="34" fill="#c9d6e6"/>
    <g opacity=".9"><line x1="96" y1="18" x2="96" y2="58" stroke="#7d8794" stroke-width="2"/>${flagUS(97, 18)}
    <line x1="160" y1="12" x2="160" y2="52" stroke="#7d8794" stroke-width="2"/>${flagCN(161, 12)}
    <line x1="224" y1="18" x2="224" y2="58" stroke="#7d8794" stroke-width="2"/>${flagRU(225, 18)}</g>
    ${person(110, 82, '#24344f')}${person(162, 78, '#2b2b2b')}${person(214, 82, '#3a3f4a')}
    <ellipse cx="162" cy="92" rx="118" ry="14" fill="#8a5a36"/><ellipse cx="162" cy="89" rx="114" ry="11" fill="#a8744b"/>
    <g transform="translate(270,30)" fill="#fff" stroke="#9aa7b8" stroke-width="1"><path d="M0 10 Q12 -6 26 4 Q34 -2 40 2 Q32 6 30 12 Q20 22 6 16 Z"/><path d="M18 6 Q24 -10 34 -8 Q28 2 24 8 Z"/></g>
    <path d="M300 44 q8 4 14 2" stroke="#4f8a33" stroke-width="2" fill="none"/><circle cx="306" cy="46" r="2" fill="#4f8a33"/>`,
  court: () => `<rect width="324" height="104" fill="#efe8d8"/>
    <g transform="translate(40,14)" fill="#d9ccb0" stroke="#8c7a55" stroke-width="1.2">
      <path d="M0 26 L80 2 L160 26 Z"/><rect x="4" y="26" width="152" height="8"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${12 + i * 26}" y="34" width="10" height="42"/>`).join('')}
      <rect x="0" y="76" width="160" height="8"/></g>
    <g transform="translate(236,14)" stroke="#5b4a2a" stroke-width="2.5" fill="none" stroke-linecap="round">
      <line x1="34" y1="4" x2="34" y2="74"/><line x1="4" y1="18" x2="64" y2="18"/>
      <line x1="4" y1="18" x2="-4" y2="44"/><line x1="4" y1="18" x2="12" y2="44"/>
      <line x1="64" y1="18" x2="56" y2="44"/><line x1="64" y1="18" x2="72" y2="44"/>
      <path d="M-6 44 Q4 54 14 44 Z" fill="#c9a24a"/><path d="M54 44 Q64 54 74 44 Z" fill="#c9a24a"/>
      <rect x="20" y="74" width="28" height="6" fill="#5b4a2a"/></g>`,
  market: () => `<rect width="324" height="104" fill="#10233d"/>
    ${[20, 40, 60, 80].map((y) => `<line x1="0" y1="${y}" x2="324" y2="${y}" stroke="#1f3a5c" stroke-width="1"/>`).join('')}
    ${[[30, 70, 82], [60, 60, 76], [90, 64, 80], [120, 50, 70], [150, 54, 66], [180, 40, 60], [210, 42, 56], [240, 30, 50], [270, 24, 40]].map(([x, a, b]) => `<rect x="${x - 5}" y="${a}" width="10" height="${b - a}" fill="#2fbf71"/><line x1="${x}" y1="${a - 5}" x2="${x}" y2="${b + 5}" stroke="#2fbf71" stroke-width="1.5"/>`).join('')}
    <path d="M10 90 L60 78 L110 72 L160 60 L210 48 L260 32 L300 16" stroke="#7ef0ad" stroke-width="3.5" fill="none"/>
    <path d="M300 16 l-14 0 m14 0 l-4 13" stroke="#7ef0ad" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  bridge: () => `<rect width="244" height="70" fill="#dfe8f2"/><rect y="46" width="244" height="24" fill="#5d8bb5"/>
    <path d="M0 52 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t44 0" stroke="#86acd0" stroke-width="2" fill="none"/>
    <g fill="#6b6f76"><rect x="0" y="34" width="104" height="6"/><rect x="140" y="34" width="104" height="6"/>
    ${[14, 50, 86, 158, 194, 230].map((x) => `<rect x="${x}" y="40" width="6" height="14"/>`).join('')}
    <path d="M104 34 l6 4 -4 3 6 3 -8 -1z M140 34 l-5 5 4 2 -6 3 7-2z"/></g>
    <path d="M114 40 q8 -26 22 -8 q4 -14 -6 -24 q-12 2 -10 14 q-6 -6 -10 2 q-2 8 4 16z" fill="#e4572e"/><path d="M118 40 q6 -14 14 -4 q0 -8 -6 -12 q-6 4 -4 8 q-4 0 -4 8z" fill="#f6bd3b"/>
    ${[[40, 14], [70, 8], [190, 12]].map(([x, y]) => `<g transform="translate(${x},${y})" stroke="#2b2b2b" stroke-width="2"><line x1="-7" y1="-3" x2="7" y2="3"/><line x1="-7" y1="3" x2="7" y2="-3"/><circle r="2.5" fill="#2b2b2b"/></g>`).join('')}`,
  gaza: () => `<rect width="244" height="70" fill="#efe1c4"/><rect y="50" width="244" height="20" fill="#d8c39a"/>
    <line x1="150" y1="0" x2="150" y2="70" stroke="#f2c200" stroke-width="5" stroke-dasharray="9 6"/>
    <g fill="#6b6a4f"><rect x="96" y="34" width="70" height="14" rx="3"/><rect x="112" y="24" width="32" height="12" rx="3"/><rect x="142" y="27" width="40" height="4"/>
    <rect x="92" y="46" width="78" height="9" rx="4.5" fill="#3f3e2e"/></g>
    ${[102, 116, 130, 144, 158].map((x) => `<circle cx="${x}" cy="50.5" r="3" fill="#8b8a6c"/>`).join('')}
    <g fill="#b8a27a"><rect x="196" y="40" width="16" height="12"/><rect x="214" y="44" width="10" height="8"/><path d="M20 52 l10 -14 8 6 6 -4 4 12z"/></g>`,
  tanker: () => `<rect width="244" height="70" fill="#f1e6d6"/><rect y="44" width="244" height="26" fill="#3f7fa8"/>
    <path d="M40 44 L196 44 L184 58 L52 58 Z" fill="#7a2f2a"/><rect x="60" y="36" width="116" height="8" fill="#a0453c"/>
    <rect x="150" y="22" width="22" height="14" fill="#e8e3da"/><rect x="156" y="14" width="6" height="8" fill="#555"/>
    <path d="M96 36 q-10 -20 6 -26 q-2 -12 16 -8 q14 -6 18 10 q12 6 2 18 z" fill="#5a5a5a" opacity=".75"/>
    <path d="M100 38 l6 -12 4 8 6 -14 4 14 6 -6 -2 10z" fill="#f08a24"/>
    <path d="M0 50 q30 -4 60 0 t60 0 t60 0 t64 0" stroke="#78a9cc" stroke-width="2" fill="none"/>`,
  climate: () => `<rect width="244" height="70" fill="#e3efe5"/>
    <g transform="translate(46,6)"><rect width="56" height="60" fill="#fff" stroke="#9aa59c" stroke-width="1.5"/>
    ${[12, 20, 28, 36, 44].map((y) => `<line x1="8" y1="${y}" x2="48" y2="${y}" stroke="#b9c3bb" stroke-width="2"/>`).join('')}</g>
    <g transform="translate(132,10)"><rect width="34" height="48" rx="4" fill="#222"/><rect y="12" width="34" height="4" fill="#555"/><rect y="32" width="34" height="4" fill="#555"/>
    <circle cx="17" cy="24" r="27" fill="none" stroke="#d63b2f" stroke-width="5"/><line x1="-2" y1="5" x2="36" y2="43" stroke="#d63b2f" stroke-width="5"/></g>
`,
  mine: () => `<rect width="244" height="70" fill="#e9f0dc"/><path d="M0 56 Q60 6 130 30 Q180 46 244 40 L244 70 L0 70 Z" fill="#5f9a46"/>
    <path d="M0 62 L244 58 L244 70 L0 70 Z" fill="#b58b5a"/>
    <g transform="translate(18,30)"><rect x="0" y="6" width="44" height="14" fill="#f2b632"/><path d="M0 6 L8 -6 L44 -6 L44 6 Z" fill="#d99a1e"/><rect x="44" y="4" width="16" height="16" fill="#f2b632"/><rect x="48" y="7" width="8" height="6" fill="#bfe1f2"/>
    <circle cx="10" cy="22" r="6" fill="#333"/><circle cx="50" cy="22" r="6" fill="#333"/></g>
    <g transform="translate(118,10)"><path d="M0 12 L8 0 L16 12 L8 22 Z" fill="#7d5fc4"/><path d="M14 16 L20 6 L26 16 L20 24 Z" fill="#c95fa6"/><path d="M-12 18 L-6 10 L0 18 L-6 24 Z" fill="#4fa3c4"/></g>`,
  pacific: () => `<rect width="122" height="70" fill="#f5d9a8"/><rect x="122" width="122" height="70" fill="#bcd6e8"/>
    <circle cx="36" cy="18" r="11" fill="#f39c12"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="36" y1="18" x2="${36 + 17 * Math.cos(a * Math.PI / 180)}" y2="${18 + 17 * Math.sin(a * Math.PI / 180)}" stroke="#f39c12" stroke-width="2"/>`).join('')}
    <rect y="46" width="122" height="24" fill="#c9995a"/><path d="M10 52 l14 6 -6 8 M40 50 l8 10 14 -2 M70 54 l10 8 M90 50 l-6 10 12 4" stroke="#7a5530" stroke-width="1.5" fill="none"/>
    <g transform="translate(184,30)" fill="none" stroke="#2a5d86" stroke-width="3.5" stroke-linecap="round"><path d="M0 0 m-4 0 a4 4 0 1 1 8 0"/><path d="M8 0 a8 8 0 0 1 -16 0 M-8 0 a14 14 0 0 1 24 -10 M16 4 a18 18 0 0 1 -30 10"/></g>
    <path d="M122 60 q30 -6 60 0 t62 0" stroke="#5f97c2" stroke-width="2" fill="none"/>`,
  game: () => `<defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7aa8"/><stop offset="1" stop-color="#ffb24c"/></linearGradient></defs>
    <rect width="244" height="70" fill="url(#gsky)"/><circle cx="122" cy="50" r="22" fill="#ffe08a"/><rect y="52" width="244" height="18" fill="#3b2056"/>
    ${[[24, 52], [214, 52]].map(([x, y]) => `<g transform="translate(${x},${y})" fill="#3b2056"><rect x="-2" y="-34" width="4" height="34"/><path d="M0 -34 q-16 -4 -24 6 q12 -6 24 -6 q-6 -14 -18 -14 q14 0 18 14 q4 -14 18 -14 q-12 2 -18 14 q14 -2 22 6 q-10 -10 -22 -6z"/></g>`).join('')}
    <g transform="translate(92,28)"><path d="M10 0 L50 0 Q62 0 60 16 Q58 30 50 26 L42 20 L18 20 L10 26 Q2 30 0 16 Q-2 0 10 0 Z" fill="#1d1d24"/>
    <rect x="11" y="9" width="10" height="3" fill="#ddd"/><rect x="14.5" y="5.5" width="3" height="10" fill="#ddd"/><circle cx="44" cy="8" r="2.5" fill="#ff5b7f"/><circle cx="49" cy="13" r="2.5" fill="#5bd6ff"/></g>`,
  fifa: () => `<rect width="244" height="70" fill="#3f9a4a"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 44}" width="22" height="70" fill="#47a653"/>`).join('')}
    <circle cx="122" cy="35" r="20" fill="none" stroke="#e8f5e9" stroke-width="2"/><line x1="122" y1="0" x2="122" y2="70" stroke="#e8f5e9" stroke-width="2"/>
    <g transform="translate(58,36)"><circle r="15" fill="#fff" stroke="#222" stroke-width="1.5"/><path d="M0 -6 l6 4 -2 7 h-8 l-2 -7z" fill="#222"/></g>
    <g transform="translate(160,22)"><rect y="12" width="44" height="32" fill="#f5f5f5" stroke="#555" stroke-width="1.5"/><rect x="12" y="10" width="20" height="4" fill="#333"/><rect x="15" y="-6" width="14" height="18" fill="#fff" stroke="#555" stroke-width="1.2"/><path d="M18 2 l3 3 6 -7" stroke="#2f63a3" stroke-width="2" fill="none"/></g>`,
};
const art = (key, w, h) => `<svg class="art" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${ART[key]()}</svg>`;

// ---------- world map ----------
const MAP_W = 306, LAT0 = 80, LAT1 = -58, K = MAP_W / 360, MAP_H = Math.round((LAT0 - LAT1) * K);
const proj = (lon, lat) => [(lon + 180) * K, (LAT0 - Math.max(LAT1, Math.min(LAT0, lat))) * K];
function landPath() {
  const gj = JSON.parse(readFileSync(LAND, 'utf8'));
  let d = '';
  for (const f of gj.features) {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) for (const ring of poly) {
      if (ring.every(([, lat]) => lat < LAT1)) continue; // Antarctica
      d += ring.map(([lon, lat], i) => { const [x, y] = proj(lon, lat); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';
    }
  }
  return d;
}
function mapSvg() {
  const pins = [...S.leads, ...S.tiles].filter((s) => s.lat != null).map((s) => {
    const [x, y] = proj(s.lon, s.lat);
    return { s, x0: x, y0: y, x, y };
  });
  // Collision nudge: push overlapping pins apart, keep them inside the map.
  const R = 8.5, MIN = 2 * R + 1;
  for (let it = 0; it < 200; it++) {
    for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
      const a = pins[i], b = pins[j];
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= MIN) continue;
      if (d < 0.01) { dx = 1; dy = 0.5; d = Math.hypot(dx, dy); }
      const push = (MIN - d) / 2;
      a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
    }
    for (const p of pins) { p.x = Math.max(R, Math.min(MAP_W - R, p.x)); p.y = Math.max(R, Math.min(MAP_H - R, p.y)); }
  }
  const dots = S.briefs.filter((s) => s.lat != null).map((s) => { const [x, y] = proj(s.lon, s.lat); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${COLOR[s.region]}" stroke="#fff" stroke-width=".8"/>`; }).join('');
  const marks = pins.map((p) => `${Math.hypot(p.x - p.x0, p.y - p.y0) > 3 ? `<line x1="${p.x0.toFixed(1)}" y1="${p.y0.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#333" stroke-width=".8"/><circle cx="${p.x0.toFixed(1)}" cy="${p.y0.toFixed(1)}" r="1.6" fill="#333"/>` : ''}
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${R}" fill="${COLOR[p.s.region]}" stroke="#fff" stroke-width="1.2"/>
    <text x="${p.x.toFixed(1)}" y="${(p.y + 3.6).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" font-family="Helvetica Neue, Arial, sans-serif">${p.s.n}</text>`).join('');
  return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}"><rect width="${MAP_W}" height="${MAP_H}" fill="#dbe8f1"/><path d="${landPath()}" fill="#efe9da" stroke="#c4b99d" stroke-width=".5"/>${dots}${marks}</svg>`;
}

// ---------- page ----------
const by = (s) => ` <i class="by">— ${esc(s.by)}</i>`;
const lead = (s) => `<div class="lead"><div class="pic">${art(s.art, 324, 96)}<span class="num" style="background:${COLOR[s.region]}">${s.n}</span><span class="lab">${esc(s.label)}</span></div>
  <div class="tag" style="color:${COLOR[s.region]}">${esc(s.place)} · ${esc(s.field)}</div><h2 class="hd">${esc(s.head)}</h2><p class="deck">${esc(s.deck)}${by(s)}</p></div>`;
const tile = (s) => `<div class="tile"><div class="pic">${art(s.art, 244, 60)}<span class="num sm" style="background:${COLOR[s.region]}">${s.n}</span><span class="lab sm">${esc(s.label)}</span></div>
  <div class="tag one" style="color:${COLOR[s.region]}">${esc(s.place)} · ${esc(s.field)}</div><h3 class="hd">${esc(s.head)}</h3><p class="deck">${esc(s.deck)}${by(s)}</p></div>`;
const brief = (s) => `<li class="one"><span class="bn" style="background:${COLOR[s.region]}">${s.n}</span><b>${esc(s.place)}</b> ${esc(s.text)}${by(s)}</li>`;
const fig = (f) => `<div class="fig"><b>${esc(f.n)}</b><span class="one">${esc(f.t)} <i class="by">${esc(f.s)}</i></span></div>`;
const half = Math.ceil(S.briefs.length / 2);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1024px;height:1024px;overflow:hidden;background:#f3efe6}
body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:#15171c;position:relative}
.serif{font-family:Georgia,"Times New Roman",serif}
#mast{position:absolute;left:0;top:0;width:1024px;height:118px;background:#13233f;color:#fff;padding:7px 18px 0}
#kick{font-size:13px;letter-spacing:.18em;font-weight:700;color:#f2c94c;display:flex;justify-content:space-between}
#kick span:last-child{color:#c9d3e3;letter-spacing:.06em;font-weight:500}
#date{font-family:Georgia,serif;font-weight:700;white-space:nowrap;line-height:1;margin-top:2px;display:inline-block}
#tagline{font-family:Georgia,serif;font-style:italic;font-size:15px;color:#f3e3b0;margin-top:3px}
#figs{position:absolute;left:12px;top:123px;width:1000px;height:42px;display:flex;gap:6px}
.fig{flex:1 1 0;min-width:0;background:#fffdf8;border:1px solid #d8d0bf;border-top:3px solid #13233f;border-radius:4px;padding:1px 7px;line-height:1}
.fig b{display:block;font-family:Georgia,serif;font-size:19px;color:#13233f;line-height:21px}
.fig span{display:block;font-family:"Avenir Next Condensed","Arial Narrow",sans-serif;font-size:12px;color:#333;line-height:14px}
.by{font-style:italic;color:#7a7465;font-size:.9em;white-space:nowrap}
.pill{font-size:11px;font-weight:700;color:#fff;border-radius:9px;padding:1px 7px;white-space:nowrap;display:inline-block;margin:0 3px 3px 0}
#leads{position:absolute;left:12px;top:171px;width:1000px;display:flex;gap:14px}
.lead{width:324px;height:232px;background:#fffdf8;border:1px solid #d8d0bf;border-radius:6px;overflow:hidden}
.pic{position:relative;line-height:0}
.lab{position:absolute;right:0;bottom:0;background:rgba(19,35,63,.9);color:#fff;font:800 12px/18px "Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;padding:0 8px;border-top-left-radius:5px}
.lab.sm{font-size:10.5px;line-height:15px;padding:0 6px}
.num{position:absolute;left:6px;top:6px;min-width:24px;height:24px;border-radius:12px;color:#fff;font:700 14px/24px "Helvetica Neue",Arial,sans-serif;text-align:center;border:1.5px solid #fff}
.num.sm{min-width:20px;height:20px;line-height:20px;font-size:12px;border-radius:10px}
.tag{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin:6px 10px 0}
.lead .hd{font-family:Georgia,serif;font-size:21px;line-height:24px;letter-spacing:-.2px;margin:2px 10px 0;font-weight:700}
.lead .deck{font-size:13px;line-height:16.5px;margin:4px 10px 0;color:#33363d}
#tiles{position:absolute;left:12px;top:408px;width:1000px;display:grid;grid-template-columns:repeat(4,244px);gap:6px 8.6px}
.tile{width:244px;height:153px;background:#fffdf8;border:1px solid #d8d0bf;border-radius:6px;overflow:hidden}
.tile .tag{margin:4px 8px 0;font-size:10.5px}
.tile .hd{font-family:Georgia,serif;font-size:16.5px;line-height:19px;margin:1px 8px 0;font-weight:700}
.tile .deck{font-size:12.5px;line-height:16px;margin:2px 8px 0;color:#33363d}
.one{white-space:nowrap;overflow:hidden}
#bottom{position:absolute;left:12px;top:725px;width:1000px;height:244px;display:flex;gap:10px}
#mapbox{width:320px;flex:none;background:#fffdf8;border:1px solid #d8d0bf;border-radius:6px;padding:5px 6px}
.h4{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#13233f;margin-bottom:3px}
#legend{font-size:11px;color:#444;margin-top:3px}
#pills{margin-top:4px}
#check{position:absolute;left:12px;top:974px;width:1000px;height:26px;background:#fff4e0;border:1px solid #d9b26a;border-radius:4px;padding:0 8px;font-size:11.5px;line-height:24px;color:#3d3d3d;overflow:hidden;white-space:nowrap}
#check b{color:#8a4b00}
#briefs{flex:1;background:#fffdf8;border:1px solid #d8d0bf;border-radius:6px;padding:6px 8px}
#briefs{min-width:0}
#cols{display:flex;gap:12px}
#cols ul{list-style:none;flex:1 1 0;min-width:0}
#cols li{font-family:"Avenir Next Condensed","Arial Narrow",sans-serif;font-size:14.5px;line-height:26px;height:26px;color:#222;border-bottom:1px solid #eee7d8}
#cols li b{font-weight:700;color:#000;margin-right:2px}
.bn{display:inline-block;min-width:21px;height:18px;border-radius:9px;color:#fff;font:700 11.5px/18px "Helvetica Neue",Arial,sans-serif;text-align:center;margin-right:5px;vertical-align:1px}
#foot{position:absolute;left:12px;right:12px;top:1003px;height:20px;font-size:10.5px;line-height:20px;color:#4a4a4a;white-space:nowrap;overflow:hidden}
#fit{display:none}
</style></head><body>
<div id="mast"><div id="kick"><span>THE WORLD'S NEWS IN ONE IMAGE</span><span>${all.length} stories, all reported this day</span></div>
<div id="datebox"><span id="date">${esc(S.date)}</span></div>
<div id="tagline" class="one">${esc(S.tagline)}</div></div>
<div id="figs">${S.figures.map(fig).join('')}</div>
<div id="leads">${S.leads.map(lead).join('')}</div>
<div id="tiles">${S.tiles.map(tile).join('')}</div>
<div id="bottom">
 <div id="mapbox"><div class="h4">Where it happened</div>${mapSvg()}
  <div id="legend">Pins: stories 1–${S.leads.length + S.tiles.length} · dots: briefs · stories per region:</div>
  <div id="pills">${REGIONS.filter((r) => counts[r]).map((r) => `<span class="pill" style="background:${COLOR[r]}">${r} ${counts[r]}</span>`).join('')}</div></div>
 <div id="briefs"><div class="h4">Also on Thursday 19 November</div><div id="cols"><ul>${S.briefs.slice(0, half).map(brief).join('')}</ul><ul>${S.briefs.slice(half).map(brief).join('')}</ul></div></div>
</div>
<div id="check" class="one"><b>DATE CHECK — left out as earlier news:</b> ${S.dateCheck.map(esc).join(' · ')}</div>
<div id="foot" class="one">Every story was reported on Thursday 19 November 2026 (any time zone); disputed claims are attributed. Sources: ${esc(S.sources)}.</div>
<pre id="fit"></pre>
<script>
document.fonts.ready.then(() => {
  const date = document.getElementById('date'), box = 988;
  let fs = 40; date.style.fontSize = fs + 'px';
  while (date.getBoundingClientRect().width < box && fs < 120) { fs += 0.5; date.style.fontSize = fs + 'px'; }
  while (date.getBoundingClientRect().width > box) { fs -= 0.5; date.style.fontSize = fs + 'px'; }
  const bad = [];
  document.querySelectorAll('.one').forEach((e) => { if (e.scrollWidth > e.clientWidth + 1) bad.push('cut: ' + e.textContent.trim().slice(0, 60)); });
  document.querySelectorAll('.hd').forEach((e) => { const l = Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)); if (l > 2) bad.push('headline ' + l + ' lines: ' + e.textContent); });
  document.querySelectorAll('.lead .deck').forEach((e) => { const l = Math.round(e.getBoundingClientRect().height / 16.5); if (l > 3) bad.push('lead deck ' + l + ' lines: ' + e.textContent.slice(0, 40)); });
  document.querySelectorAll('.lead,.tile,#mapbox,#briefs,#check,.fig,#mast').forEach((e) => { if (e.scrollHeight > e.clientHeight + 1) bad.push('overflow ' + (e.id || e.className) + ' by ' + (e.scrollHeight - e.clientHeight) + 'px: ' + e.textContent.trim().slice(0, 40)); });
  document.querySelectorAll('.tile .deck').forEach((e) => { const l = Math.round(e.getBoundingClientRect().height / 16); if (l > 2) bad.push('tile deck ' + l + ' lines: ' + e.textContent.slice(0, 40)); });
  const order = ['mast', 'figs', 'leads', 'tiles', 'bottom', 'check', 'foot'].map((id) => document.getElementById(id).getBoundingClientRect());
  for (let i = 1; i < order.length; i++) if (order[i].top < order[i - 1].bottom) bad.push('block ' + i + ' overlaps the one above by ' + (order[i - 1].bottom - order[i].top) + 'px');
  if (order[order.length - 1].bottom > 1024) bad.push('footer below 1024');
  if (document.documentElement.scrollHeight > 1024) bad.push('page taller than 1024');
  document.querySelectorAll('#date,#figs,#leads,#tiles,#bottom,#check,#foot').forEach((e) => { if (e.getBoundingClientRect().right > 1014) bad.push('too wide: ' + e.id); });
  document.getElementById('fit').textContent = 'FIT ' + JSON.stringify({ dateFont: fs, bad });
});
</script></body></html>`;

const page = join(BUILD, 'page.html');
writeFileSync(page, html);
const flags = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1024,1024', '--virtual-time-budget=4000'];
const dom = execFileSync(CHROME, [...flags, '--dump-dom', 'file://' + page], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/FIT (\{.*?\})<\/pre>/s);
if (!m) throw new Error('fit script did not run');
const fit = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
console.log('date font', fit.dateFont, 'px');
if (fit.bad.length) { console.error('LAYOUT PROBLEMS:\n- ' + fit.bad.join('\n- ')); process.exit(1); }
execFileSync(CHROME, [...flags, '--screenshot=' + join(ROOT, 'entry.png'), 'file://' + page], { stdio: 'ignore' });
console.log('entry.png', statSync(join(ROOT, 'entry.png')).size, 'bytes');
