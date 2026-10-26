/* =========================================================
   Kantor alvenix — scene isometrik SVG (tanpa gambar eksternal).
   Mengisi <div id="office"> dan menyediakan API:
     window.Office.points[id] -> [x%, y%]  (titik fokus kamera)
     window.Office.focus(id|null)          (sorot satu meja, null = mode idle)
     window.Office.setCount(n)             (angka di layar Ruang Data)
   id: raka, nadia, bima, sari, you, data, overview
   ========================================================= */
(() => {
  const host = document.getElementById("office");
  if (!host) return;
  const AGENTS = window.HQ_AGENTS || [];

  const S = 40, C = Math.cos(Math.PI / 6), SN = .5;
  const OX = 10 * C * S + 30, OY = 6.2 * S + 20, VW = 820, VH = 730;
  const P = (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * SN * S - z * S];
  const pts = a => a.map(p => P(...p).map(n => n.toFixed(1)).join(",")).join(" ");
  let out = [];
  const poly = (a, fill, extra = "") => out.push(`<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`);
  function box(x, y, z, w, d, h, c) {
    poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], c[1]);
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], c[2]);
    poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c[0]);
  }
  const planeY = (x, y, z) => { const [e, f] = P(x, y, z); return `matrix(${C * S} ${SN * S} 0 ${S} ${e} ${f})`; };
  const planeX = (x, y, z) => { const [e, f] = P(x, y, z); return `matrix(${C * S} ${-SN * S} 0 ${S} ${e} ${f})`; };
  const group = (id, fn) => { out.push(`<g class="o-st" data-id="${id}">`); fn(); out.push(`</g>`); };

  const DESK = ["#2b4049", "#172830", "#20343c"];
  const DARK = ["#1b2c33", "#0f1c21", "#15252b"];
  const WOOD = ["#5a3a24", "#2f1d11", "#432a19"];
  const TONES = { gold: "#22b8c6", violet: "#9b7bff", green: "#3fcf86", rose: "#ff7aa8", blue: "#4f9dff", amber: "#ffb15c" };
  const MARK = `<path d="M52 54 L18 58 M52 54 Q58 34 80 20 M52 54 Q60 72 77 84" stroke="#22b8c6" stroke-width="11" stroke-linecap="round" fill="none"/><g fill="#22b8c6"><circle cx="52" cy="54" r="15"/><circle cx="15" cy="58" r="12"/><circle cx="82" cy="18" r="12"/><circle cx="78" cy="86" r="12"/></g>`;

  out.push(`<defs>
    <linearGradient id="oFloor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#132a33"/><stop offset="1" stop-color="#07141a"/></linearGradient>
    <linearGradient id="oWallA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3640"/><stop offset="1" stop-color="#0f2026"/></linearGradient>
    <linearGradient id="oWallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173039"/><stop offset="1" stop-color="#0b1a1f"/></linearGradient>
    <linearGradient id="oSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1d3a"/><stop offset=".55" stop-color="#3a2350"/><stop offset="1" stop-color="#d0643a"/></linearGradient>
    <linearGradient id="oScreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3442"/><stop offset="1" stop-color="#071820"/></linearGradient>
    <linearGradient id="oBrand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7ff0fb"/><stop offset=".5" stop-color="#22b8c6"/><stop offset="1" stop-color="#ef6a3a"/></linearGradient>
    <radialGradient id="oWarm"><stop offset="0" stop-color="#ffb15c" stop-opacity=".42"/><stop offset="1" stop-color="#ffb15c" stop-opacity="0"/></radialGradient>
    <radialGradient id="oCool"><stop offset="0" stop-color="#22b8c6" stop-opacity=".35"/><stop offset="1" stop-color="#22b8c6" stop-opacity="0"/></radialGradient>
    <filter id="oBlur"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>`);

  /* lantai */
  poly([[0, 0, 0], [12, 0, 0], [12, 10, 0], [0, 10, 0]], "url(#oFloor)");
  for (let i = 1; i < 12; i++) out.push(`<line x1="${P(i, 0)[0]}" y1="${P(i, 0)[1]}" x2="${P(i, 10)[0]}" y2="${P(i, 10)[1]}" stroke="rgba(127,240,251,.05)"/>`);
  for (let j = 1; j < 10; j++) out.push(`<line x1="${P(0, j)[0]}" y1="${P(0, j)[1]}" x2="${P(12, j)[0]}" y2="${P(12, j)[1]}" stroke="rgba(127,240,251,.05)"/>`);
  poly([[1.2, 1.5, .01], [8.6, 1.5, .01], [8.6, 8.9, .01], [1.2, 8.9, .01]], "rgba(34,184,198,.05)", `stroke="rgba(34,184,198,.35)" stroke-dasharray="4 6"`);

  /* dinding */
  poly([[0, 0, 0], [12, 0, 0], [12, 0, 6], [0, 0, 6]], "url(#oWallA)");
  poly([[0, 0, 0], [0, 10, 0], [0, 10, 6], [0, 0, 6]], "url(#oWallB)");
  out.push(`<polyline class="o-led-strip" points="${pts([[0, 10, 6], [0, 0, 6], [12, 0, 6]])}" fill="none" stroke="url(#oBrand)" stroke-width="2.5"/>`);
  out.push(`<polyline points="${pts([[0, 10, .02], [0, 0, .02], [12, 0, .02]])}" fill="none" stroke="rgba(34,184,198,.5)" stroke-width="1.5"/>`);

  /* jendela kota (dinding belakang) */
  const rnd = (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
  [[1.0, 3.0], [4.4, 3.0]].forEach(([wx, ww]) => {
    let city = "", bx = .1;
    while (bx < ww - .2) {
      const bw = .25 + rnd() * .45, bh = .6 + rnd() * 1.6;
      city += `<rect x="${bx}" y="${3.3 - bh}" width="${bw}" height="${bh}" fill="#081019"/>`;
      for (let wy = 3.2 - bh + .12; wy < 3.2; wy += .22)
        for (let wxx = bx + .06; wxx < bx + bw - .06; wxx += .14)
          if (rnd() > .55) city += `<rect class="o-win" x="${wxx}" y="${wy}" width=".06" height=".09" fill="${rnd() > .3 ? "#ffb15c" : "#7ff0fb"}" opacity="${.35 + rnd() * .6}" style="animation-delay:${(rnd() * 6).toFixed(2)}s"/>`;
      bx += bw + .05;
    }
    out.push(`<g transform="${planeY(wx, 0, 5)}">
      <rect x="0" y="0" width="${ww}" height="3.3" fill="url(#oSky)"/>
      <circle cx="${ww * .72}" cy=".75" r=".26" fill="#ffe2c2"/><circle cx="${ww * .72}" cy=".75" r=".55" fill="#ffb15c" opacity=".12"/>
      ${city}
      <rect x="0" y="0" width="${ww}" height="3.3" fill="none" stroke="#2a4650" stroke-width=".1"/>
      <line x1="${ww / 2}" y1="0" x2="${ww / 2}" y2="3.3" stroke="#2a4650" stroke-width=".07"/>
    </g>`);
  });

  /* layar brand (dinding kiri) */
  group("overview", () => {
    out.push(`<g transform="${planeX(0, 8.8, 5.1)}">
      <rect x="0" y="0" width="5.6" height="3.1" rx=".12" fill="#050d11" stroke="#2a4650" stroke-width=".08"/>
      <rect x=".18" y=".18" width="5.24" height="2.74" rx=".06" fill="url(#oScreen)"/>
      <g transform="translate(.42 .42) scale(.0072)">${MARK}</g>
      <text x="1.25" y=".98" font-family="Outfit, sans-serif" font-weight="700" font-size=".52" letter-spacing="-.02" fill="#fff">alveni<tspan fill="#ef6a3a">x</tspan></text>
      <text x="1.27" y="1.27" font-family="JetBrains Mono, monospace" font-size=".17" fill="#7ff0fb" letter-spacing=".04">WEBSITE · LANDING PAGE</text>
      <rect class="o-bar" x=".45" y="1.62" width="4.4" height=".16" rx=".08" fill="url(#oBrand)"/>
      <rect x=".45" y="1.97" width="2.8" height=".12" rx=".06" fill="rgba(255,255,255,.2)"/>
      <rect x=".45" y="2.22" width="3.4" height=".12" rx=".06" fill="rgba(255,255,255,.12)"/>
      <text x="3.85" y="2.64" font-family="JetBrains Mono, monospace" font-size=".16" fill="#5ee69a">● ONLINE</text>
    </g>`);
  });

  /* RUANG DATA: layar + lemari arsip + server */
  group("data", () => {
    out.push(`<g transform="${planeY(8.0, 0, 5.4)}">
      <rect x="0" y="0" width="3.8" height="2.0" rx=".1" fill="#050d11" stroke="#2a4650" stroke-width=".07"/>
      <rect x=".12" y=".12" width="3.56" height="1.76" rx=".05" fill="url(#oScreen)"/>
      <text x=".3" y=".48" font-family="JetBrains Mono, monospace" font-size=".17" fill="#ffb15c" letter-spacing=".06">RUANG DATA</text>
      <text x=".3" y="1.15" font-family="Outfit, sans-serif" font-weight="700" font-size=".62" fill="#fff" id="oCount">0</text>
      <text x=".3" y="1.45" font-family="JetBrains Mono, monospace" font-size=".13" fill="#7ff0fb">bisnis tersimpan</text>
      ${[.5, .8, .45, 1, .7, .9, .6].map((h, i) => `<rect class="o-chart" x="${2.0 + i * .23}" y="${1.65 - h}" width=".14" height="${h}" rx=".03" fill="${i % 3 === 2 ? "#ef6a3a" : "#22b8c6"}" style="animation-delay:${i * .15}s"/>`).join("")}
    </g>`);
    for (let k = 0; k < 2; k++) {
      const cx = 8.2 + k * .95;
      box(cx, .25, 0, .85, .8, 1.9, ["#2f4a54", "#18292f", "#223840"]);
      out.push(`<g transform="${planeY(cx, 1.05, 1.9)}">${[0, 1, 2].map(r => `<rect x=".08" y="${.1 + r * .6}" width=".69" height=".5" rx=".04" fill="#1d3239" stroke="#3a5a64" stroke-width=".02"/><rect x=".33" y="${.3 + r * .6}" width=".2" height=".05" rx=".02" fill="#ffb15c"/>`).join("")}</g>`);
    }
    box(8.35, .4, 1.9, .5, .4, .12, ["#ef6a3a", "#a5431f", "#c9552b"]);
    box(8.38, .42, 2.02, .45, .36, .1, ["#22b8c6", "#0f6f7d", "#13879a"]);
    box(10.4, .25, 0, 1.2, 1, 3.3, ["#2a3f47", "#122128", "#192c33"]);
    out.push(`<g transform="${planeY(10.4, 1.25, 3.2)}">`);
    for (let r = 0; r < 7; r++) {
      out.push(`<rect x=".1" y="${.12 + r * .43}" width="1" height=".33" rx=".04" fill="#081217"/>`);
      for (let k = 0; k < 3; k++) out.push(`<circle class="o-led" cx="${.25 + k * .14}" cy="${.28 + r * .43}" r=".04" fill="${k === 2 ? "#ffb15c" : "#5ee69a"}" style="animation-delay:${(rnd() * 2).toFixed(2)}s"/>`);
    }
    out.push(`<text x=".55" y="3.15" font-family="JetBrains Mono, monospace" font-size=".16" fill="#7ff0fb">n8n</text></g>`);
    out.push(`<path class="o-flow" d="M${P(1.6, 1.45, .03).join(" ")} L${P(8.1, 1.45, .03).join(" ")}" fill="none" stroke="#22b8c6" stroke-width="2" stroke-dasharray="3 9" opacity=".7"/>`);
  });

  /* tanaman */
  function plant(x, y, s = 1) {
    box(x, y, 0, .7 * s, .7 * s, .7 * s, ["#c9552b", "#7a2f14", "#a5431f"]);
    const [cx, cy] = P(x + .35 * s, y + .35 * s, .7 * s + .55 * s);
    out.push(`<g class="o-leaf"><circle cx="${cx}" cy="${cy}" r="${20 * s}" fill="#1c6b47"/><circle cx="${cx - 10 * s}" cy="${cy + 6 * s}" r="${14 * s}" fill="#24875a"/><circle cx="${cx + 11 * s}" cy="${cy - 4 * s}" r="${13 * s}" fill="#34a86f"/></g>`);
  }
  plant(.3, .3, 1.15);

  /* cahaya lampu di lantai */
  [[2.9, 3.6], [6.7, 3.6], [2.9, 7.2], [6.7, 7.2]].forEach(([x, y]) => { const [a, b] = P(x, y); out.push(`<ellipse cx="${a}" cy="${b}" rx="95" ry="48" fill="url(#oWarm)"/>`); });
  { const [a, b] = P(10.2, 6.2); out.push(`<ellipse cx="${a}" cy="${b}" rx="120" ry="60" fill="url(#oWarm)"/>`); }
  { const [a, b] = P(9.6, 1.6); out.push(`<ellipse cx="${a}" cy="${b}" rx="110" ry="50" fill="url(#oCool)"/>`); }

  /* workstation */
  const points = {}, anchors = [];
  const pc = ([x, y]) => [x / VW * 100, y / VH * 100];
  function station(x, y, ag, i, isHuman) {
    const tone = TONES[ag.tone] || "#22b8c6";
    group(ag.id, () => {
      box(x + .1, y + .1, 0, .12, .12, .95, DARK);
      box(x + 2.38, y + .1, 0, .12, .12, .95, DARK);
      box(x + .1, y + 1.08, 0, .12, .12, .95, DARK);
      box(x + 2.38, y + 1.08, 0, .12, .12, .95, DARK);
      box(x, y, .95, 2.6, 1.3, .1, DESK);
      box(x + .15, y + .2, 1.05, .25, .25, .05, ["#3a3a3a", "#222", "#2c2c2c"]);
      box(x + .25, y + .3, 1.1, .05, .05, .55, ["#555", "#333", "#444"]);
      const [lx, ly] = P(x + .3, y + .35, 1.68);
      out.push(`<circle cx="${lx}" cy="${ly}" r="5" fill="#ffd29a"/><circle cx="${lx}" cy="${ly}" r="16" fill="#ffb15c" opacity=".25"/>`);
      box(x + 1.15, y + .35, 1.05, .3, .2, .3, DARK);
      box(x + .55, y + .3, 1.3, 1.5, .1, .9, ["#2a3f47", "#060d10", "#16252b"]);
      const lines = Array.from({ length: 5 }, (_, k) =>
        `<rect class="o-code" x="${.12 + (k % 2) * .15}" y="${.16 + k * .13}" width="${.4 + rnd() * .7}" height=".06" rx=".03" fill="${k === 0 ? tone : "rgba(255,255,255,.4)"}" style="animation-delay:${(i * .7 + k * .35).toFixed(2)}s"/>`).join("");
      out.push(`<g transform="${planeY(x + .6, y + .4, 2.15)}">
        <rect x="0" y="0" width="1.4" height=".8" rx=".04" fill="url(#oScreen)"/>${lines}
        <rect x="0" y="0" width="1.4" height=".8" rx=".04" fill="${tone}" opacity=".1"/></g>`);
      const g = P(x + 1.3, y + .9, 1.06);
      out.push(`<ellipse cx="${g[0]}" cy="${g[1]}" rx="44" ry="15" fill="${tone}" opacity=".25" filter="url(#oBlur)"/>`);
      box(x + .8, y + .75, 1.05, .9, .3, .03, ["#3d5560", "#22343b", "#2c434c"]);
      box(x + 2.05, y + .55, 1.05, .2, .2, .22, ["#ef6a3a", "#a5431f", "#c9552b"]);
      const ax = x + 1.3, ay = y + 2.05;
      box(ax - .4, ay - .35, 0, .08, .08, .5, DARK);
      box(ax - .45, ay - .4, .5, .9, .8, .12, ["#2d4750", "#172a31", "#21363e"]);
      const [bx, by] = P(ax, ay - .05, 1.15), [hx, hy] = P(ax, ay - .05, 1.85);
      out.push(`<g class="o-agent" style="--d:${i * .6}s">
        <path d="M${bx - 19} ${by + 18} Q${bx - 20} ${by - 22} ${bx} ${by - 24} Q${bx + 20} ${by - 22} ${bx + 19} ${by + 18} Z" fill="${tone}"/>
        <path d="M${bx - 19} ${by + 18} Q${bx - 20} ${by - 22} ${bx} ${by - 24} L${bx} ${by + 18} Z" fill="#000" opacity=".2"/>
        <circle cx="${hx}" cy="${hy}" r="14" fill="#f1c9a5"/>
        <path d="M${hx - 14} ${hy} A14 14 0 0 1 ${hx + 14} ${hy} Q${hx} ${hy - 5} ${hx - 14} ${hy} Z" fill="#1a1410"/>
        <circle cx="${hx}" cy="${hy}" r="17" fill="none" stroke="${tone}" stroke-width="1.5" opacity=".7"/>
        ${isHuman ? `<path d="M${hx - 15} ${hy + 2} A15 15 0 0 1 ${hx + 15} ${hy + 2}" fill="none" stroke="#e8edf0" stroke-width="2.5"/><rect x="${hx - 18}" y="${hy - 1}" width="6" height="9" rx="2" fill="#e8edf0"/><rect x="${hx + 12}" y="${hy - 1}" width="6" height="9" rx="2" fill="#e8edf0"/>` : ""}
      </g>`);
      box(ax - .42, ay + .32, .55, .84, .12, .55, ["#2d4750", "#172a31", "#21363e"]);
      anchors.push({ id: ag.id, name: ag.name, at: P(ax, ay, 2.55), tone });
      points[ag.id] = pc(P(x + 1.3, y + 1.3, 1));
    });
  }
  AGENTS.filter(a => !a.human).slice(0, 4).forEach((ag, i) => station([1.6, 5.4, 1.6, 5.4][i], [1.8, 1.8, 5.4, 5.4][i], ag, i));
  // meja staf negosiasi (manusia) — di depan Ruang Data
  const human = AGENTS.find(a => a.human);
  if (human) station(9.0, 1.85, human, 4, true);

  /* meja founder */
  group("you", () => {
    box(9.2, 4.6, 0, 2.2, 3.2, .95, WOOD);
    box(9.1, 4.5, .95, 2.4, 3.4, .1, ["#7a5034", "#3e2716", "#5a3a24"]);
    box(9.5, 5.2, 1.05, .1, 1.6, .9, ["#2a3f47", "#060d10", "#16252b"]);
    out.push(`<g transform="${planeX(9.6, 6.8, 1.9)}"><rect x="0" y="0" width="1.6" height=".8" rx=".04" fill="url(#oScreen)"/><rect class="o-bar" x=".15" y=".2" width="1.2" height=".1" rx=".05" fill="url(#oBrand)"/><rect x=".15" y=".42" width=".8" height=".07" fill="rgba(255,255,255,.3)"/></g>`);
    box(9.9, 7.2, 1.05, .5, .4, .06, ["#22b8c6", "#0f6f7d", "#13879a"]);
    box(10.6, 4.8, 1.05, .9, .25, .3, ["#ef6a3a", "#a5431f", "#c9552b"]);
    box(11.6, 5.9, 0, .9, .9, .5, ["#2d4750", "#172a31", "#21363e"]);
    box(12.35, 5.9, .5, .15, .9, .9, ["#2d4750", "#172a31", "#21363e"]);
  });
  points.you = pc(P(10.3, 6.2, 1));
  points.data = pc(P(9.6, .6, 2.2));
  points.overview = [50, 50];
  plant(10.8, 8.9, .9);
  plant(.3, 8.9, .8);

  host.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Ilustrasi kantor alvenix: karyawan AI bekerja, meja founder, dan Ruang Data">${out.join("")}</svg>`;
  out = null;

  /* gelembung status */
  const TASKS = {
    raka: ["Riset bisnis di Jambi…", "Cek Google Maps Jakarta…", "Lead baru ditemukan ✦"],
    nadia: ["Menilai rating & ulasan…", "Skor prioritas: 87", "Bisnis ini ramai ✦"],
    bima: ["Menyiapkan pesan WA…", "Template personal siap", "Follow-up terjadwal ✦"],
    sari: ["Mendesain landing page…", "Mockup homepage…", "Pilih warna brand ✦"],
    you: ["Tutup deal hari ini", "Review desain Sari", "Kirim penawaran"],
    data: ["Data tersimpan ✦", "Sinkron dengan n8n…", "Arsip rapi"],
    nego: ["Follow-up klien…", "Negosiasi paket & harga", "Klien setuju ✦", "Telepon calon klien…"]
  };
  const pos = ([x, y]) => `left:${(x / VW * 100).toFixed(2)}%;top:${(y / VH * 100).toFixed(2)}%`;
  const bubbles = {};
  const mk = (id, name, at, tone) => {
    const b = document.createElement("div");
    b.className = "o-bubble";
    b.style.cssText = pos(at) + `;--tone:${tone}`;
    b.innerHTML = `<b>${name}</b><span>${TASKS[id][0]}</span>`;
    host.appendChild(b);
    bubbles[id] = { b, i: 0 };
  };
  anchors.forEach(a => mk(a.id, a.name + (a.id === "nego" ? " · manusia" : ""), a.at, a.tone));
  mk("you", "Kamu", P(10.3, 6.6, 2.5), "#ef6a3a");
  mk("data", "Ruang Data", P(9.9, .2, 5.9), "#ffb15c");

  function say(id) {
    Object.values(bubbles).forEach(x => x.b.classList.remove("is-on"));
    const x = bubbles[id]; if (!x) return;
    x.i = (x.i + 1) % TASKS[id].length;
    x.b.querySelector("span").textContent = TASKS[id][x.i];
    x.b.classList.add("is-on");
  }

  const order = Object.keys(bubbles);
  let turn = 0, idle = null, focused;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function startIdle() { stopIdle(); say(order[turn++ % order.length]); if (!reduce) idle = setInterval(() => say(order[turn++ % order.length]), 2600); }
  function stopIdle() { clearInterval(idle); idle = null; }

  window.Office = {
    points,
    focus(id) {
      if (id === focused) return;
      focused = id;
      host.classList.toggle("has-focus", !!id && id !== "overview");
      host.querySelectorAll(".o-st").forEach(g => g.classList.toggle("is-focus", g.dataset.id === id));
      if (!id || id === "overview") startIdle(); else { stopIdle(); say(id); }
    },
    setCount(n) {
      const el = host.querySelector("#oCount");
      if (!el) return;
      const t0 = performance.now(), from = +el.textContent || 0;
      (function step(t) { const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
    }
  };
  window.Office.focus(null);
})();
