/* =========================================================
   Beranda pribadi — "Selamat bekerja".
   Membaca leads dari n8n (sama dengan Ruang Kerja) dan memakai
   penyimpanan browser yang sama (hq.key, hq.leadState.v1).
   ========================================================= */
(() => {
  const CFG = window.HQ_CONFIG || {};
  const AGENTS = window.HQ_AGENTS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const STATE_KEY = "hq.leadState.v1";
  let accessKey = load("hq.key", "");
  let leadState = load(STATE_KEY, {});
  let leads = [];
  let connected = false;
  let firstRender = true;

  /* ---------- waktu, sapaan, kutipan ---------- */
  const dayKey = d => { d = new Date(d); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const TODAY = dayKey(Date.now());
  function tick() {
    const d = new Date();
    $("#clock").textContent = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    $("#secRing").style.strokeDashoffset = 182.2 * (1 - d.getSeconds() / 60);
  }
  function greet() {
    const h = new Date().getHours();
    const part = h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam";
    const name = (CFG.namaKamu || "").trim();
    $("#greet").textContent = `Selamat ${part}${name ? ", " + name : ""} —`;
    $("#today").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const off = -new Date().getTimezoneOffset() / 60;
    $("#zone").textContent = off === 7 ? "WIB" : off === 8 ? "WITA" : off === 9 ? "WIT" : "GMT" + (off >= 0 ? "+" : "") + off;
  }
  const QUOTES = [
    "Satu pesan hari ini lebih berharga dari seratus rencana besok.",
    "Klien besar datang dari follow-up yang tidak menyerah.",
    "Konsisten mengalahkan sempurna.",
    "Setiap “tidak” mendekatkan kamu ke “deal”.",
    "Bisnis yang bagus pantas punya website yang bagus — tugasmu memberi tahu mereka.",
    "Kerjakan yang penting dulu, sisanya menyusul.",
    "Hubungi, catat, ulangi. Begitu cara kantor ini tumbuh.",
    "Hari yang produktif dimulai dari satu chat pertama.",
    "Bukan soal banyaknya lead, tapi berapa yang kamu sapa hari ini."
  ];
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  $("#quote").textContent = QUOTES[doy % QUOTES.length];

  /* ---------- helpers lead (sama dengan app.js) ---------- */
  function score(l) {
    const r = Math.max(0, Math.min(1, ((+l.rating || 0) - 3.5) / 1.5));
    const v = Math.min(1, Math.log10((+l.reviews || 0) + 1) / Math.log10(3000));
    return Math.round(r * 40 + v * 60);
  }
  function waNumber(p) {
    let d = String(p || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("0")) d = "62" + d.slice(1);
    else if (d.startsWith("8")) d = "62" + d;
    return d;
  }
  const fill = (tpl, l) => (tpl || "").replaceAll("{brand}", CFG.brand || "").replaceAll("{nama}", l.name).replaceAll("{kota}", l.city);
  const waLink = (l, tpl) => { const n = waNumber(l.phone); return n ? `https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(fill(tpl, l))}` : ""; };
  const mapsLink = l => l.maps_url || `https://www.google.com/maps/search/${encodeURIComponent(l.name + " " + (l.address || l.city))}`;
  const statusOf = l => leadState[l.id]?.status || l.status || "baru";
  const followOf = l => leadState[l.id]?.followup || l.followup || "";
  const closed = l => ["deal", "tolak"].includes(statusOf(l));
  const initials = n => String(n).replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const hue = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

  function normalize(raw, i) {
    const city = raw.city || raw.kota || "";
    const l = {
      id: String(raw.id ?? raw.placeId ?? `lead-${i}`),
      name: raw.name || raw.title || "Tanpa nama",
      category: raw.category || raw.categoryName || "Lainnya",
      city: /jakarta/i.test(city) ? "Jakarta" : /jambi/i.test(city) ? "Jambi" : city || "—",
      address: raw.address || "",
      phone: /^#/.test(raw.phone || "") ? "" : raw.phone || "",
      rating: +(raw.rating || 0),
      reviews: +(raw.reviews || 0),
      maps_url: raw.maps_url || raw.url || "",
      status: raw.status || "",
      followup: raw.followup || "",
      found_at: raw.found_at || "",
      updated: +raw.updated || 0
    };
    l.score = raw.score !== "" && raw.score != null ? +raw.score : score(l);
    return l;
  }

  /* ---------- ambil data ---------- */
  let backupDate = "";   // terisi kalau data diambil dari cadangan (n8n mati)
  async function fetchLive() {
    if (!CFG.leadsUrl) throw new Error("leadsUrl kosong");
    const url = CFG.leadsUrl + (CFG.leadsUrl.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(accessKey);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    let json = await res.json();
    if (Array.isArray(json) && json.length === 1 && json[0].leads) json = json[0];
    if (json.summary) { accessKey = ""; save("hq.key", ""); throw new Error("kunci"); }
    return Array.isArray(json) ? json : json.leads || [];
  }
  async function fetchLeads() {
    if (!accessKey) throw new Error("kunci");
    let arr;
    try { arr = await fetchLive(); backupDate = ""; }
    catch (err) {
      if (err.message === "kunci") throw err;
      const snap = window.HQ_loadSnapshot && await window.HQ_loadSnapshot(accessKey);
      if (!snap) throw err;
      arr = snap.leads; backupDate = snap.saved_at;
    }
    leads = arr.map(normalize).filter(l => l.name && l.name.length > 2);
    // status dari Sheet menang kalau lebih baru dari yang tersimpan di browser
    leads.forEach(l => {
      const loc = leadState[l.id]?.updated || 0;
      if (l.updated && l.updated >= loc) leadState[l.id] = { ...leadState[l.id], status: l.status || undefined, followup: l.followup || undefined, updated: l.updated };
    });
    save(STATE_KEY, leadState);
  }

  function markContacted(id) {
    const prev = leadState[id] || {};
    if (prev.status && prev.status !== "baru") return;
    leadState[id] = { ...prev, status: "dihubungi", updated: Date.now() };
    save(STATE_KEY, leadState);
    if (CFG.statusWebhook) {
      fetch(CFG.statusWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...leadState[id], key: accessKey }) }).catch(() => {});
    }
    render();
  }

  /* ---------- angka bergerak ---------- */
  function countTo(el, to) {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (calm || from === to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- tampilan ---------- */
  function setConn(state, text) {
    const dot = state === "ok" ? "pulse-dot" : state === "warn" ? "pulse-dot is-gold" : "pulse-dot is-off";
    $("#conn").innerHTML = `<span class="${dot}"></span><span>${esc(text)}</span>`;
  }
  function ago(iso) {
    if (!iso) return "belum pernah";
    const m = Math.round((Date.now() - new Date(iso)) / 6e4);
    if (m < 60) return `${Math.max(1, m)} menit lalu`;
    if (m < 1440) return `${Math.round(m / 60)} jam lalu`;
    return `${Math.round(m / 1440)} hari lalu`;
  }

  function render() {
    const fresh = leads.filter(l => l.found_at && dayKey(l.found_at) === TODAY);
    const baru = leads.filter(l => statusOf(l) === "baru");
    const fu = leads.filter(l => !closed(l) && followOf(l) && followOf(l) <= TODAY);
    const late = fu.filter(l => followOf(l) < TODAY).length;
    const deal = leads.filter(l => statusOf(l) === "deal");
    const counts = { fresh: fresh.length, baru: baru.length, fu: fu.length, deal: deal.length };
    for (const [k, v] of Object.entries(counts)) countTo($(`[data-k="${k}"]`), v);
    $("#fuSub").textContent = late ? `${late} lewat jadwal` : "sesuai jadwal";

    // kalimat pembuka
    const bits = [];
    if (!connected) bits.push("Belum tersambung ke n8n — data belum bisa dimuat.");
    else {
      bits.push(fresh.length ? `Raka menemukan <b>${fresh.length} bisnis baru</b> hari ini.` : `Ada <b>${baru.length} bisnis</b> yang menunggu kamu sapa.`);
      if (fu.length) bits.push(`<b>${fu.length} follow-up</b> menunggu${late ? `, ${late} di antaranya telat` : ""}.`);
      else if (baru.length) bits.push(`Mulai dari <b>${esc([...baru].sort((a, b) => b.score - a.score)[0].name)}</b> — skornya paling tinggi.`);
      if (!fu.length && !baru.length) bits.push("Semua lead sudah dihubungi — tinggal tunggu Raka mencari lagi.");
    }
    $("#brief").innerHTML = bits.join(" ");

    // target hubungi hari ini
    const target = +CFG.targetHarian || 10;
    const done = Object.values(leadState).filter(s => s && s.status && s.status !== "baru" && s.updated && dayKey(s.updated) === TODAY).length;
    countTo($("#targetNum"), done);
    $("#targetMeta").textContent = `${done} / ${target}`;
    $("#targetPct").textContent = Math.min(100, Math.round(done / target * 100)) + "%";
    $("#ring").style.setProperty("--p", Math.min(1, done / target));
    $("#targetNote").innerHTML = done >= target ? "<b>Target tercapai.</b> Kerja bagus hari ini! 🎉"
      : done ? `<b>${target - done} lagi</b> untuk mencapai target. Teruskan!`
      : `Belum ada yang dihubungi. Klik <b>WhatsApp</b> di daftar prioritas untuk mulai.`;
    if (done >= target && load("hq.confetti", "") !== TODAY) { save("hq.confetti", TODAY); setTimeout(confetti, 900); }

    // daftar kerjakan dulu: follow-up dulu, lalu lead baru dengan skor tertinggi
    const items = [
      ...fu.sort((a, b) => followOf(a).localeCompare(followOf(b))).map(l => ({ l, kind: "fu" })),
      ...[...baru].sort((a, b) => b.score - a.score).map(l => ({ l, kind: "new" }))
    ].slice(0, 6);
    $("#todo").innerHTML = items.length ? items.map(({ l, kind }) => {
      const wa = waLink(l, kind === "fu" ? CFG.followupTemplate : CFG.waTemplate);
      const badge = kind === "fu"
        ? `<span class="tag ${followOf(l) < TODAY ? "tag--late" : ""}">${followOf(l) < TODAY ? "telat" : "follow-up"}</span>`
        : `<span class="score" style="--s:${l.score}" title="Skor maju ${l.score}"><span>${l.score}</span></span>`;
      return `<li class="todo__item">
        <span class="todo__av" style="--h:${hue(l.category)}">${esc(initials(l.name))}</span>
        <div class="todo__main">
          <b>${esc(l.name)}</b>
          <span>${esc(l.category)} · ${esc(l.city)} · <i>★ ${l.rating ? l.rating.toFixed(1) : "–"}</i> (${l.reviews.toLocaleString("id-ID")})</span>
        </div>
        ${badge}
        <div class="todo__act">
          ${wa ? `<a class="btn btn--xs btn--wa" href="${wa}" target="_blank" rel="noopener" data-wa="${esc(l.id)}">WhatsApp</a>` : `<span class="todo__nowa">tanpa WA</span>`}
          <a class="btn btn--xs btn--ghost" href="${esc(mapsLink(l))}" target="_blank" rel="noopener">Maps</a>
        </div>
      </li>`;
    }).join("") : `<li class="todo__empty">${connected ? "Tidak ada yang mendesak. Santai dulu ☕" : "Data akan muncul setelah tersambung ke n8n."}</li>`;

    // grafik 7 hari
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    const per = days.map(d => leads.filter(l => l.found_at && dayKey(l.found_at) === dayKey(d)).length);
    const max = Math.max(1, ...per);
    countTo($("#weekTotal"), per.reduce((a, b) => a + b, 0));
    const chart = $("#chart"); const wasIn = chart.classList.contains("is-in");
    chart.innerHTML = days.map((d, i) => `
      <div class="chart__col ${i === 6 ? "is-today" : ""}">
        <span class="chart__val">${per[i] || ""}</span>
        <div class="chart__bar"><i style="--v:${per[i] / max};transition-delay:${i * 70}ms"></i></div>
        <span class="chart__day">${i === 6 ? "Hari ini" : d.toLocaleDateString("id-ID", { weekday: "short" })}</span>
      </div>`).join("");
    if (wasIn) { chart.classList.remove("is-in"); void chart.offsetWidth; chart.classList.add("is-in"); }

    // sebaran kota + kategori
    const jb = leads.filter(l => l.city === "Jambi").length, jk = leads.filter(l => l.city === "Jakarta").length, tot = Math.max(1, jb + jk);
    $("#split").innerHTML = `
      <div class="split__bar"><i style="width:${jb / tot * 100}%"></i><i style="width:${jk / tot * 100}%"></i></div>
      <div class="split__legend"><span><b>${jb}</b>Jambi</span><span><b>${jk}</b>Jakarta</span></div>`;
    const cat = {}; leads.forEach(l => cat[l.category] = (cat[l.category] || 0) + 1);
    const top = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const cmax = Math.max(1, ...top.map(c => c[1]));
    $("#cats").innerHTML = top.length ? top.map(([k, v]) => `<li><span>${esc(k)}</span><b>${v}</b><i style="--v:${v / cmax}"></i></li>`).join("") : `<li><span>Belum ada data</span></li>`;

    // tim
    const lastFound = leads.map(l => l.found_at).filter(Boolean).sort().pop();
    const info = {
      raka: `Terakhir mencari ${ago(lastFound)}`,
      nadia: `${leads.length} dinilai · ${leads.filter(l => l.score >= 70).length} skor ≥ 70`,
      bima: `${leads.filter(l => waNumber(l.phone)).length} siap di-WA`,
      sari: "Siap membuat demo personal",
      dina: "Menjawab chat konsumen 24 jam",
      nego: `${leads.filter(l => statusOf(l) === "nego").length} dalam negosiasi`
    };
    $("#crew").innerHTML = AGENTS.map(a => {
      const on = !a.soon && (connected || a.human);
      return `<li class="crew__row" data-focus="${a.id}">
        <span class="avatar ${on ? "is-working" : ""}" data-tone="${a.tone}">${esc(a.initial)}</span>
        <div><b>${esc(a.name)} ${a.human ? `<span class="human-tag">manusia</span>` : ""}</b><span>${esc(a.role)} · ${esc(info[a.id] || "")}</span>
        <em class="${on ? "" : "is-off"}">${a.soon ? "○ segera hadir" : on ? "● bekerja" : "○ menunggu n8n"}</em></div>
      </li>`;
    }).join("");

    // ticker temuan terbaru
    const latest = [...leads].filter(l => l.found_at).sort((a, b) => b.found_at.localeCompare(a.found_at)).slice(0, 14);
    const row = latest.length ? latest.map(l => `<span class="ticker__item"><b>${esc(l.name)}</b>${esc(l.category)} · ${esc(l.city)} <i>★ ${l.rating ? l.rating.toFixed(1) : "–"}</i></span>`).join("")
      : `<span class="ticker__item">Menunggu temuan pertama Raka…</span>`;
    const tk = $("#ticker");
    tk.innerHTML = row + row;
    tk.style.setProperty("--dur", Math.max(30, latest.length * 6) + "s");

    if (window.Office) window.Office.setCount(leads.length);
    firstRender = false;
  }

  async function sync() {
    const btn = $("#syncBtn"); btn.classList.add("is-spin");
    if (!connected) setConn("off", "menyambung…");
    try {
      await fetchLeads();
      connected = true;
      $("#keybox").hidden = true;
      if (backupDate) setConn("warn", "mode cadangan · data " + new Date(backupDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" }));
      else setConn("ok", "terhubung n8n");
      $("#syncInfo").textContent = `sinkron ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · ${leads.length} leads`;
    } catch (err) {
      connected = false;
      if (err.message === "kunci") { $("#keybox").hidden = false; setConn("warn", "butuh kunci"); }
      else setConn("warn", "n8n belum tersambung");
      console.error("[beranda]", err);
    }
    btn.classList.remove("is-spin");
    render();
  }

  /* ---------- efek: konfeti ---------- */
  function confetti() {
    if (calm) return;
    const cv = $("#confetti"), ctx = cv.getContext("2d");
    const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
    const C = ["#7ff0fb", "#22b8c6", "#ffb15c", "#ef6a3a", "#ffffff", "#b69cff"];
    const ps = [...Array(160)].map(() => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .55, vx: (Math.random() - .5) * 26, vy: -Math.random() * 30 - 14, r: 4 + Math.random() * 6, c: C[Math.random() * C.length | 0], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
    const t0 = performance.now();
    (function f(t) {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.vy += .8; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (t - t0 < 3500) requestAnimationFrame(f); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  /* ---------- efek: kursor, tilt, magnet ---------- */
  if (fine && !calm) {
    const root = document.documentElement, tilt = $("#tilt");
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("pointermove", e => {
      root.style.setProperty("--mx", e.clientX + "px"); root.style.setProperty("--my", e.clientY + "px");
      tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5);
      $$(".card").forEach(c => { const r = c.getBoundingClientRect(); c.style.setProperty("--cx", e.clientX - r.left + "px"); c.style.setProperty("--cy", e.clientY - r.top + "px"); });
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      tilt.style.transform = `rotateY(${cx * 10}deg) rotateX(${-cy * 8}deg)`;
      requestAnimationFrame(loop);
    })();
    $$(".mag").forEach(b => {
      b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- kartu muncul saat terlihat ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = $$(".card").indexOf(e.target);
    setTimeout(() => { e.target.classList.add("is-in"); const ch = $(".chart", e.target); if (ch) ch.classList.add("is-in"); }, (i % 4) * 90);
    io.unobserve(e.target);
  }), { threshold: .12 });

  /* ---------- events ---------- */
  $("#keybox").addEventListener("submit", e => {
    e.preventDefault();
    accessKey = $("#keyInput").value.trim(); save("hq.key", accessKey);
    sync();
  });
  $("#syncBtn").addEventListener("click", sync);
  $("#todo").addEventListener("click", e => {
    const a = e.target.closest("[data-wa]");
    if (a) setTimeout(() => markContacted(a.dataset.wa), 300);
  });
  const crew = $("#crew");
  crew.addEventListener("mouseover", e => {
    const r = e.target.closest("[data-focus]");
    if (r && window.Office) window.Office.focus(["raka", "nadia", "bima", "sari"].includes(r.dataset.focus) ? r.dataset.focus : "you");
  });
  crew.addEventListener("mouseleave", () => window.Office && window.Office.focus(null));
  addEventListener("keydown", e => {
    if (e.target.closest("input, textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "r" || e.key === "R") sync();
    if (e.key === "d" || e.key === "D") location.href = "app.html#leads";
  });

  /* ---------- mulai ---------- */
  greet(); tick(); setInterval(tick, 1000); setInterval(greet, 60000);
  render();
  const started = performance.now();
  let opened = false;
  function open() {
    if (opened) return; opened = true;
    document.body.classList.remove("is-loading");
    setTimeout(() => { document.body.classList.add("is-ready"); $$(".card").forEach(c => io.observe(c)); }, 250);
  }
  // intro minimal 1,3 detik supaya animasinya selesai; maksimal 4 detik kalau n8n lambat
  sync().finally(() => setTimeout(open, Math.max(0, 1300 - (performance.now() - started))));
  setTimeout(open, 4000);
  setInterval(sync, 5 * 60000);   // sinkron ulang tiap 5 menit
})();
