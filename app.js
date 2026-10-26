(() => {
  const CFG = window.HQ_CONFIG || {};
  const AGENTS = window.HQ_AGENTS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const STATUSES = [
    { id: "baru", label: "Baru" },
    { id: "dihubungi", label: "Dihubungi" },
    { id: "tertarik", label: "Tertarik" },
    { id: "nego", label: "Negosiasi" },
    { id: "deal", label: "Deal" },
    { id: "tolak", label: "Tidak tertarik" }
  ];
  const STATE_KEY = "hq.leadState.v1";
  const LOG_KEY = "hq.log.v1";

  let leads = [];
  let isDemo = true;
  let lastSync = null;
  let backupDate = "";   // terisi kalau data diambil dari cadangan (n8n mati)
  const ui = { city: "", status: "", cat: "", q: "", sort: "score", mode: "board" };

  /* ---------- storage (wrapped: may be blocked) ---------- */
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let leadState = load(STATE_KEY, {});
  let userLog = load(LOG_KEY, []);
  ui.mode = load("hq.mode", "board");
  let seenIds = new Set(load("hq.seen", []));
  let freshIds = new Set();
  function markFresh() {
    if (isDemo) return;
    const first = seenIds.size === 0;
    freshIds = first ? new Set() : new Set(leads.filter(l => !seenIds.has(l.id)).map(l => l.id));
    if (freshIds.size) {
      toast(`🔔 Raka menemukan ${freshIds.size} bisnis baru — sudah masuk Ruang Data`);
      logUser(`menerima ${freshIds.size} lead baru dari Raka`);
    }
    leads.forEach(l => seenIds.add(l.id));
    save("hq.seen", [...seenIds]);
  }
  // kunci Ruang Kerja (disimpan di browser ini saja, tidak ada di file website)
  let accessKey = load("hq.key", "");
  function askKey(msg) {
    const k = prompt(msg || "Masukkan kunci Ruang Kerja (dari workflow n8n):", accessKey || "");
    if (k !== null) { accessKey = k.trim(); save("hq.key", accessKey); }
    return accessKey;
  }

  /* ---------- helpers ---------- */
  // Skor "maju" 0–100: 40% dari rating (3.5→0, 5.0→penuh), 60% dari jumlah ulasan (skala log, 3000+ = penuh)
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
  function waText(l) { return fill(CFG.waTemplate, l); }
  function waLink(l, text) {
    const n = waNumber(l.phone);
    return n ? `https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(text ?? waText(l))}` : "";
  }
  const mapsLink = l => l.maps_url || `https://www.google.com/maps/search/${encodeURIComponent(l.name + " " + (l.address || l.city))}`;
  const fmtTime = d => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = d => new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const initials = n => String(n).split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const statusOf = l => leadState[l.id]?.status || l.status || "baru";
  const NEGO = CFG.negotiator || {};
  const NEGO_NAME = NEGO.name || "Tim Negosiasi";
  const PICS = [{ id: "bima", label: "Bima (AI)" }, { id: "nego", label: `${NEGO_NAME} (manusia)` }, { id: "you", label: "Kamu (Founder)" }];
  const picOf = l => leadState[l.id]?.pic || (["nego", "deal"].includes(statusOf(l)) ? "nego" : "bima");
  const followOf = l => leadState[l.id]?.followup || "";
  const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const fill = (tpl, l) => (tpl || "").replaceAll("{brand}", CFG.brand || "").replaceAll("{nama}", l.name).replaceAll("{kota}", l.city);
  function fuState(l) {
    const d = followOf(l); if (!d) return "";
    return d < todayStr() ? "late" : d === todayStr() ? "today" : "later";
  }
  function handoffText(l) {
    const note = leadState[l.id]?.note;
    return `Halo ${NEGO_NAME}, ada lead untuk di-follow up & negosiasi 🙏\n\n` +
      `🏪 ${l.name} (${l.category})\n📍 ${l.address || l.city}\n📞 ${l.phone || "-"}\n⭐ ${l.rating.toFixed(1)} dari ${l.reviews} ulasan · skor ${l.score}\n` +
      `🗺️ ${mapsLink(l)}\n` + (followOf(l) ? `📅 Follow-up: ${followOf(l)}\n` : "") + (note ? `📝 Catatan: ${note}\n` : "") +
      `\nTolong kabari hasilnya ya.`;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  /* ---------- normalize data from n8n (also accepts Apify / Places-style field names) ---------- */
  function normalize(raw, i) {
    const city = raw.city || raw.kota || "";
    const l = {
      id: String(raw.id ?? raw.place_id ?? raw.placeId ?? `lead-${i}`),
      name: raw.name || raw.title || raw.nama || "Tanpa nama",
      category: raw.category || raw.categoryName || raw.kategori || "Lainnya",
      city: /jakarta/i.test(city) ? "Jakarta" : /jambi/i.test(city) ? "Jambi" : city || "—",
      address: raw.address || raw.alamat || "",
      phone: raw.phone || raw.phoneUnformatted || raw.telepon || "",
      rating: +(raw.rating ?? raw.totalScore ?? 0),
      reviews: +(raw.reviews ?? raw.reviewsCount ?? raw.userRatingCount ?? 0),
      maps_url: raw.maps_url || raw.url || raw.googleMapsUri || "",
      instagram: raw.instagram || raw.social || "",
      status: raw.status || "",
      found_at: raw.found_at || raw.scrapedAt || raw.created_at || new Date().toISOString(),
      agent: raw.agent || "Raka",
      demo: !!raw.demo
    };
    l.score = raw.score != null ? +raw.score : score(l);
    return l;
  }

  async function fetchLeads() {
    if (!CFG.leadsUrl) {
      isDemo = true;
      leads = (window.HQ_DEMO_LEADS || []).map(normalize);
      lastSync = new Date();
      return;
    }
    try {
      if (!accessKey) askKey();
      let json;
      try {
        const url = CFG.leadsUrl + (CFG.leadsUrl.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(accessKey);
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        json = await res.json();
        if (Array.isArray(json) && json.length === 1 && json[0].leads) json = json[0];
        backupDate = "";
      } catch (err) {
        // n8n mati / trial habis -> pakai data cadangan terenkripsi
        const snap = window.HQ_loadSnapshot && await window.HQ_loadSnapshot(accessKey);
        if (!snap) throw err;
        json = { leads: snap.leads }; backupDate = snap.saved_at;
      }
      if (json.summary) {   // kunci salah -> n8n hanya kirim ringkasan
        accessKey = ""; save("hq.key", "");
        throw new Error("kunci salah");
      }
      const arr = Array.isArray(json) ? json : json.leads || json.data || json.items || [];
      leads = arr.map(normalize);
      // status/PIC/jadwal/catatan dari Google Sheet (lebih baru menang)
      arr.forEach((raw, i) => {
        const id = leads[i].id, srv = +raw.updated || 0, loc = (leadState[id] && leadState[id].updated) || 0;
        if (srv && srv >= loc) leadState[id] = { status: raw.status || undefined, pic: raw.pic || undefined, followup: raw.followup || undefined, note: raw.note || undefined, updated: srv };
      });
      save(STATE_KEY, leadState);
      isDemo = false;
      lastSync = new Date();
    } catch (err) {
      console.error("[HQ] gagal ambil leads:", err);
      toast(err.message === "kunci salah" ? "Kunci Ruang Kerja salah — klik Sinkron untuk coba lagi" : "Belum tersambung ke n8n (workflow belum aktif?) — menampilkan data demo");
      isDemo = true;
      leads = (window.HQ_DEMO_LEADS || []).map(normalize);
    }
  }

  function setStatus(id, status, note, extra = {}) {
    const prev = leadState[id] || {};
    leadState[id] = { ...prev, ...extra, status: status ?? prev.status, note: note ?? prev.note, updated: Date.now() };
    save(STATE_KEY, leadState);
    if (status && status !== prev.status) {
      const l = leads.find(x => x.id === id);
      logUser(`menandai ${l ? l.name : id} → ${STATUSES.find(s => s.id === status)?.label}`);
    }
    if (CFG.statusWebhook) {
      fetch(CFG.statusWebhook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...leadState[id], key: accessKey })
      }).catch(() => toast("Status tersimpan lokal, tapi gagal kirim ke n8n"));
    }
  }
  function logUser(text) {
    userLog.push({ t: Date.now(), who: "kamu", text });
    userLog = userLog.slice(-40);
    save(LOG_KEY, userLog);
    renderTerm(true);
  }

  /* ---------- connection UI ---------- */
  function renderConn() {
    const dot = $("#connDot");
    if (isDemo) {
      dot.className = "pulse-dot is-gold";
      $("#connTitle").textContent = "Mode demo";
      $("#connText").textContent = CFG.leadsUrl ? "Gagal tersambung ke n8n. Menampilkan data contoh." : "Belum tersambung ke n8n. Data di bawah hanya contoh.";
      $("#demoChip").innerHTML = `<span class="chip chip--warn"><span class="pulse-dot is-gold"></span>DATA DEMO — sambungkan n8n</span>`;
    } else if (backupDate) {
      const tgl = new Date(backupDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      dot.className = "pulse-dot is-gold";
      $("#connTitle").textContent = "Mode cadangan";
      $("#connText").textContent = `n8n sedang mati. Data salinan per ${tgl} · ${leads.length} leads. Perubahan status tersimpan di browser ini saja.`;
      $("#demoChip").innerHTML = `<span class="chip chip--warn"><span class="pulse-dot is-gold"></span>CADANGAN · ${tgl}</span>`;
    } else {
      dot.className = "pulse-dot";
      $("#connTitle").textContent = "Terhubung n8n";
      $("#connText").textContent = `Sinkron terakhir ${fmtTime(lastSync)} · ${leads.length} leads`;
      $("#demoChip").innerHTML = `<span class="chip chip--ok"><span class="pulse-dot"></span>LIVE · ${fmtTime(lastSync)}</span>`;
    }
    $("#navBadge").textContent = leads.filter(l => statusOf(l) === "baru").length;
  }

  /* ---------- agents ---------- */
  function agentState(a) {
    if (a.human) return { cls: "state--human", label: "Manusia", working: true };
    if (a.soon) return { cls: "state--soon", label: "Segera", working: false };
    if (a.needsN8n && isDemo) return { cls: "state--demo", label: "Menunggu n8n", working: false };
    return { cls: "state--on", label: "Aktif", working: true };
  }
  function agentStats(a) {
    const today = leads.filter(l => new Date(l.found_at).toDateString() === new Date().toDateString()).length;
    const contacted = leads.filter(l => statusOf(l) !== "baru").length;
    const hot = leads.filter(l => l.score >= 70).length;
    switch (a.id) {
      case "raka": return [[leads.length, "lead ditemukan"], [today, "hari ini"], [2, "kota dipantau"]];
      case "nadia": return [[leads.length, "dinilai"], [hot, "skor ≥ 70"], [avg(leads.map(l => l.score)), "rata-rata skor"]];
      case "nego": return [[leads.filter(l => picOf(l) === "nego").length, "ditangani"], [leads.filter(l => statusOf(l) === "nego").length, "negosiasi"], [leads.filter(l => fuState(l) === "today" || fuState(l) === "late").length, "follow-up hari ini"]];
      case "bima": return [[leads.filter(l => waNumber(l.phone)).length, "punya WA"], [contacted, "sudah dihubungi"], [leads.filter(l => statusOf(l) === "deal").length, "deal"]];
      default: return [["—", "mockup"], ["—", "dikirim"], ["—", "disetujui"]];
    }
  }
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  function agentTask(a) {
    const st = agentState(a);
    if (a.soon) return "Sedang disiapkan — fitur mockup otomatis.";
    if (!st.working) return "Menunggu workflow n8n disambungkan.";
    const latest = [...leads].sort((x, y) => new Date(y.found_at) - new Date(x.found_at))[0];
    if (a.id === "raka") return latest ? `Terakhir menemukan ${latest.name} (${latest.city})` : "Menyisir Google Maps…";
    if (a.id === "nadia") return latest ? `Memberi skor ${latest.score} untuk ${latest.name}` : "Menunggu lead baru…";
    if (a.id === "bima") return `${leads.filter(l => statusOf(l) === "baru").length} pesan siap dikirim`;
    if (a.id === "nego") { const due = leads.filter(l => fuState(l) === "today" || fuState(l) === "late").length; return due ? `${due} follow-up jatuh tempo hari ini` : `${leads.filter(l => statusOf(l) === "nego").length} klien sedang dinegosiasikan`; }
    return "";
  }

  function renderCrew() {
    $("#crewList").innerHTML = AGENTS.map(a => {
      const st = agentState(a);
      return `<div class="crew__row">
        <div class="avatar ${st.working ? "is-working" : ""}" data-tone="${a.tone}">${a.initial}</div>
        <div class="crew__info"><b>${a.name}</b>${a.human ? ` <span class="human-tag">MANUSIA</span>` : ""}<small>${a.role}</small><span class="crew__task">${esc(agentTask(a))}</span></div>
        <span class="state ${st.cls}">${st.label}</span>
      </div>`;
    }).join("");
  }
  function renderAgents() {
    $("#agentGrid").innerHTML = AGENTS.map(a => {
      const st = agentState(a);
      return `<article class="agent" data-tone="${a.tone}">
        <div class="agent__head">
          <div class="avatar avatar--lg ${st.working ? "is-working" : ""}" data-tone="${a.tone}">${a.initial}</div>
          <div><h3>${a.name} ${a.human ? `<span class="human-tag">MANUSIA</span>` : ""}</h3><small>${a.role}</small></div>
          <span class="state ${st.cls}">${st.label}</span>
        </div>
        <p>${a.desc}</p>
        <div class="agent__stats">${agentStats(a).map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>
        <div class="agent__now"><span class="pulse-dot ${st.working ? "" : st.cls === "state--demo" ? "is-gold" : "is-off"}"></span><span>${esc(agentTask(a))}</span></div>
        <div class="agent__tools">${a.tools.map(t => `<span>${t}</span>`).join("")}</div>
        ${a.human && NEGO.whatsapp ? `<a class="btn btn--sm btn--wa" href="https://api.whatsapp.com/send?phone=${NEGO.whatsapp}" target="_blank" rel="noopener">${ICON.wa} Chat ${esc(a.name)}</a>` : ""}
      </article>`;
    }).join("");
  }

  /* ---------- terminal log ---------- */
  function buildLog() {
    const lines = [];
    [...leads].sort((a, b) => new Date(a.found_at) - new Date(b.found_at)).slice(-14).forEach(l => {
      const t = new Date(l.found_at).getTime();
      lines.push({ t, who: "raka", text: `menemukan <b>${esc(l.name)}</b> · ${esc(l.city)} · ${l.reviews} ulasan · tanpa website` });
      lines.push({ t: t + 40000, who: "nadia", text: `skor “maju” ${esc(l.name)} = <b>${l.score}</b>` });
    });
    userLog.forEach(u => lines.push({ t: u.t, who: "kamu", text: esc(u.text) }));
    if (isDemo) lines.push({ t: Date.now(), who: "sys", text: "mode demo — sambungkan n8n untuk data asli" });
    return lines.sort((a, b) => a.t - b.t).slice(-26);
  }
  let termTimer;
  function renderTerm(instant) {
    const term = $("#term");
    const lines = buildLog();
    const name = { raka: "Raka", nadia: "Nadia", kamu: "Kamu", sys: "sistem", nego: NEGO_NAME };
    const row = l => `<p><time>${fmtTime(l.t)}</time><span class="who who--${l.who}">${name[l.who]}</span>${l.text}</p>`;
    clearInterval(termTimer);
    if (instant) { term.innerHTML = lines.map(row).join("") + `<p><span class="caret"></span></p>`; term.scrollTop = term.scrollHeight; return; }
    term.innerHTML = "";
    let i = 0;
    termTimer = setInterval(() => {
      if (i >= lines.length) { clearInterval(termTimer); term.insertAdjacentHTML("beforeend", `<p><span class="caret"></span></p>`); return; }
      term.insertAdjacentHTML("beforeend", row(lines[i++]));
      term.scrollTop = term.scrollHeight;
    }, 90);
  }

  /* ---------- overview ---------- */
  function countUp(el, to) {
    const from = +el.textContent || 0, dur = 900, t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function renderOverview() {
    const c = { total: leads.length, baru: 0, contacted: 0, deal: 0 };
    leads.forEach(l => { const s = statusOf(l); if (s === "baru") c.baru++; if (s === "dihubungi" || s === "tertarik" || s === "nego") c.contacted++; if (s === "deal") c.deal++; });
    $$("[data-kpi]").forEach(el => countUp(el, c[el.dataset.kpi]));

    const due = leads.filter(l => followOf(l) && !["deal", "tolak"].includes(statusOf(l))).sort((a, b) => followOf(a).localeCompare(followOf(b))).slice(0, 6);
    $("#fuList").innerHTML = due.length ? due.map(l => `
      <div class="toplist__row" data-open="${esc(l.id)}">
        <span class="fu-date fu-date--${fuState(l)}">${fuLabel(l)}</span>
        <div class="toplist__name"><b>${esc(l.name)}</b><small>${esc(STATUSES.find(s => s.id === statusOf(l))?.label)} · ${esc(PICS.find(p => p.id === picOf(l))?.label.split(" ·")[0])}</small></div>
        <span></span><span class="mono" style="font-size:.7rem;color:var(--muted)">${esc(l.city)}</span>
      </div>`).join("") : `<p class="empty">Belum ada jadwal follow-up. Buka detail lead → “Follow-up &amp; Negosiasi”.</p>`;

    const top = leads.filter(l => statusOf(l) === "baru").sort((a, b) => b.score - a.score).slice(0, 6);
    $("#topList").innerHTML = top.length ? top.map((l, i) => `
      <div class="toplist__row" data-open="${esc(l.id)}">
        <span class="toplist__rank">${String(i + 1).padStart(2, "0")}</span>
        <div class="toplist__name"><b>${esc(l.name)}</b><small>${esc(l.category)} · ${esc(l.city)}</small></div>
        <span class="stars">★ <b>${l.rating.toFixed(1)}</b><small>(${l.reviews})</small></span>
        ${scoreHtml(l.score)}
      </div>`).join("") : `<p class="empty">Semua lead sudah dihubungi 🎉</p>`;

    const jm = leads.filter(l => l.city === "Jambi").length, jk = leads.filter(l => l.city === "Jakarta").length, tot = Math.max(1, jm + jk);
    $("#citySplit").innerHTML = `
      <div class="split__bar"><span></span><span></span></div>
      <div class="split__legend"><div><b>${jm}</b><i></i>Jambi</div><div class="r"><b>${jk}</b><i></i>Jakarta</div></div>`;
    requestAnimationFrame(() => {
      const [a, b] = $$("#citySplit .split__bar span");
      a.style.width = (jm / tot * 100) + "%"; b.style.width = (jk / tot * 100) + "%";
    });

    const cats = {};
    leads.forEach(l => { cats[l.category] = (cats[l.category] || 0) + 1; });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] || 1;
    $("#catList").innerHTML = sorted.map(([k, v]) => `<div class="cat"><span>${esc(k)}</span><span>${v}</span><div class="cat__bar"><i data-w="${v / max * 100}"></i></div></div>`).join("");
    requestAnimationFrame(() => $$("#catList i").forEach(i => { i.style.width = i.dataset.w + "%"; }));
  }
  function fuLabel(l) { const st = fuState(l); if (!st) return ""; if (st === "today") return "Hari ini"; if (st === "late") return "Telat"; return new Date(followOf(l) + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" }); }
  const scoreHtml = s => `<span class="score ${s >= 70 ? "score--hot" : ""}"><span class="score__bar"><i style="width:${s}%"></i></span><b>${s}</b></span>`;

  /* ---------- leads table ---------- */
  function filtered() {
    const q = ui.q.toLowerCase();
    let arr = leads.filter(l =>
      (!ui.city || l.city === ui.city) &&
      (!ui.status || statusOf(l) === ui.status) &&
      (!ui.cat || l.category === ui.cat) &&
      (!q || [l.name, l.category, l.address, l.city].join(" ").toLowerCase().includes(q)));
    const by = {
      score: (a, b) => b.score - a.score,
      reviews: (a, b) => b.reviews - a.reviews,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      new: (a, b) => new Date(b.found_at) - new Date(a.found_at)
    }[ui.sort];
    return arr.sort(by);
  }
  const ICON = {
    wa: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.2Z"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6l6 6-6 6"/></svg>`
  };
  const statusSelect = l => `<select class="pill" data-status="${esc(l.id)}" data-s="${statusOf(l)}" aria-label="Status ${esc(l.name)}">
    ${STATUSES.map(s => `<option value="${s.id}" ${s.id === statusOf(l) ? "selected" : ""}>${s.label}</option>`).join("")}</select>`;

  function renderLeads() {
    const rows = filtered();
    $("#leadRows").innerHTML = rows.map(l => {
      const wa = waLink(l);
      return `<tr>
        <td><div class="biz" data-open="${esc(l.id)}"><span class="biz__ico">${esc(initials(l.name))}</span><div><b>${esc(l.name)}${freshIds.has(l.id) ? ` <span class="new-badge new-badge--inline">BARU</span>` : ""}</b><small>${esc(l.category)}</small></div></div></td>
        <td><span class="city ${l.city === "Jakarta" ? "city--jakarta" : ""}">${esc(l.city)}</span></td>
        <td><span class="stars">★ <b>${l.rating.toFixed(1)}</b><small>(${l.reviews.toLocaleString("id-ID")})</small></span></td>
        <td>${scoreHtml(l.score)}</td>
        <td>${statusSelect(l)}</td>
        <td class="t-right"><div class="acts">
          <a class="icon-btn icon-btn--wa" ${wa ? `href="${wa}" target="_blank" rel="noopener" data-wa="${esc(l.id)}"` : `aria-disabled="true" data-nowa="${esc(l.id)}"`} title="WhatsApp">${ICON.wa}</a>
          <a class="icon-btn" href="${esc(mapsLink(l))}" target="_blank" rel="noopener" title="Google Maps">${ICON.map}</a>
          <button class="icon-btn" type="button" data-open="${esc(l.id)}" title="Detail">${ICON.more}</button>
        </div></td>
      </tr>`;
    }).join("");
    $("#emptyState").hidden = rows.length > 0;
    renderBoard(rows);
    $("#tblFoot").textContent = `${rows.length} dari ${leads.length} leads${isDemo ? " · DATA DEMO" : ""}${lastSync ? " · sinkron " + fmtTime(lastSync) : ""} · status tersimpan ${CFG.statusWebhook ? "ke n8n" : "di browser ini"}`;
  }

  /* ---------- papan kanban (drag & drop antar status) ---------- */
  function renderBoard(rows) {
    const cols = STATUSES.filter(s => !ui.status || s.id === ui.status);
    $("#board").innerHTML = cols.map(s => {
      const items = rows.filter(l => statusOf(l) === s.id);
      return `<section class="col" data-col="${s.id}">
        <header class="col__head"><span class="col__dot" data-s="${s.id}"></span><b>${s.label}</b><em>${items.length}</em></header>
        <div class="col__body" data-drop="${s.id}">
          ${items.map(l => {
            const wa = waLink(l);
            return `<article class="kcard" draggable="true" data-id="${esc(l.id)}">
              ${freshIds.has(l.id) ? `<span class="new-badge">BARU</span>` : ""}
              <div class="kcard__top"><span class="biz__ico">${esc(initials(l.name))}</span>
                <div class="kcard__name"><b data-open="${esc(l.id)}">${esc(l.name)}</b><small>${esc(l.category)} · ${esc(l.city)}</small></div></div>
              <div class="kcard__chips"><span class="pic pic--${picOf(l)}">${picOf(l) === "nego" ? "👤 " + esc(NEGO_NAME) : picOf(l) === "you" ? "★ Kamu" : "🤖 Bima"}</span>${fuState(l) ? `<span class="fu-date fu-date--${fuState(l)}">📅 ${fuLabel(l)}</span>` : ""}</div>
              <div class="kcard__meta"><span class="stars">★ <b>${l.rating.toFixed(1)}</b><small>(${l.reviews.toLocaleString("id-ID")})</small></span>${scoreHtml(l.score)}</div>
              <div class="kcard__acts">
                <a class="icon-btn icon-btn--wa" ${wa ? `href="${wa}" target="_blank" rel="noopener" data-wa="${esc(l.id)}"` : `aria-disabled="true" data-nowa="${esc(l.id)}"`} title="WhatsApp">${ICON.wa}</a>
                <a class="icon-btn" href="${esc(mapsLink(l))}" target="_blank" rel="noopener" title="Google Maps">${ICON.map}</a>
                <button class="icon-btn" type="button" data-open="${esc(l.id)}" title="Detail">${ICON.more}</button>
              </div>
            </article>`;
          }).join("") || `<p class="col__empty">Seret kartu ke sini</p>`}
        </div>
      </section>`;
    }).join("");
  }
  function applyMode() {
    $("#board").hidden = ui.mode !== "board";
    $("#tableWrap").hidden = ui.mode !== "table";
    $$("#viewToggle button").forEach(b => b.classList.toggle("is-on", b.dataset.mode === ui.mode));
  }

  function fillFilters() {
    $("#statusFilter").innerHTML = `<option value="">Semua status</option>` + STATUSES.map(s => `<option value="${s.id}">${s.label}</option>`).join("");
    const cats = [...new Set(leads.map(l => l.category))].sort();
    $("#catFilter").innerHTML = `<option value="">Semua kategori</option>` + cats.map(c => `<option>${esc(c)}</option>`).join("");
    $("#statusFilter").value = ui.status; $("#catFilter").value = ui.cat;
  }

  /* ---------- drawer ---------- */
  function openLead(id) {
    const l = leads.find(x => x.id === id);
    if (!l) return;
    const note = leadState[id]?.note || "";
    const hasWa = !!waNumber(l.phone);
    $("#drawerBody").innerHTML = `
      <div class="d-head"><span class="biz__ico">${esc(initials(l.name))}</span>
        <div><h2 id="dName">${esc(l.name)}</h2><p>${esc(l.category)} · ${esc(l.city)}</p></div></div>
      <div class="d-grid">
        <div><span>Rating</span><b>★ ${l.rating.toFixed(1)} · ${l.reviews.toLocaleString("id-ID")} ulasan</b></div>
        <div><span>Skor maju</span><b>${l.score} / 100</b></div>
        <div><span>Telepon</span><b>${esc(l.phone) || "—"}</b></div>
        <div><span>Status</span>${statusSelect(l)}</div>
        <div style="grid-column:1/-1"><span>Alamat</span><b>${esc(l.address) || "—"}</b></div>
      </div>
      <div class="d-sec"><h4>Kenapa Nadia menandai ini</h4><div class="d-why">
        <div>Rating ${l.rating.toFixed(1)} dari ${l.reviews.toLocaleString("id-ID")} ulasan — ${l.score >= 70 ? "bisnis ramai & disukai" : "cukup aktif"}</div>
        <div>Tidak ditemukan website di profil Google Maps</div>
        <div>Ditemukan oleh ${esc(l.agent)} · ${fmtDate(l.found_at)}</div>
      </div></div>
      <div class="d-sec"><h4>Pesan WhatsApp dari Bima (bisa diedit)</h4>
        <textarea class="d-msg" id="dMsg">${esc(waText(l))}</textarea>
        <div class="d-acts">
          <button class="btn btn--wa btn--sm" type="button" id="dSend" ${hasWa ? "" : "disabled"}>${ICON.wa} Kirim via WhatsApp</button>
          <button class="btn btn--sm" type="button" id="dCopy">Salin pesan</button>
          <a class="btn btn--sm btn--ghost" href="${esc(mapsLink(l))}" target="_blank" rel="noopener">Buka Maps</a>
        </div>
        ${hasWa ? "" : `<p class="tbl__foot">${l.demo ? "Data demo tidak punya nomor." : "Nomor telepon tidak tersedia di Google Maps."}</p>`}
      </div>
      <div class="d-sec d-nego"><h4>Follow-up &amp; Negosiasi</h4>
        <div class="d-row">
          <label><span>Ditangani oleh</span><select class="sel" id="dPic">${PICS.map(p => `<option value="${p.id}" ${p.id === picOf(l) ? "selected" : ""}>${esc(p.label)}</option>`).join("")}</select></label>
          <label><span>Jadwal follow-up</span><input class="sel" type="date" id="dFu" value="${followOf(l)}"></label>
        </div>
        <div class="d-acts">
          <button class="btn btn--sm btn--orange" type="button" id="dHand">${ICON.wa} Serahkan ke ${esc(NEGO_NAME)}</button>
          <button class="btn btn--sm" type="button" id="dFuMsg" ${hasWa ? "" : "disabled"}>Kirim pesan follow-up ke klien</button>
        </div>
        <p class="tbl__foot">“Serahkan” mengirim detail lead ini ke WhatsApp ${esc(NEGO_NAME)}${NEGO.whatsapp ? "" : " (nomor belum diisi di config.js)"} dan memindahkan status ke Negosiasi.</p>
      </div>
      <div class="d-sec"><h4>Catatan</h4><textarea class="d-note" id="dNote" placeholder="mis. sudah chat, minta dihubungi lagi Senin…">${esc(note)}</textarea></div>`;
    $("#dSend").onclick = () => {
      const url = waLink(l, $("#dMsg").value);
      if (!url) return;
      window.open(url, "_blank", "noopener");
      if (statusOf(l) === "baru") { setStatus(l.id, "dihubungi"); refresh(); }
    };
    $("#dPic").onchange = e => { setStatus(l.id, undefined, undefined, { pic: e.target.value }); refresh(); toast("Penanggung jawab diperbarui"); };
    $("#dFu").onchange = e => { setStatus(l.id, undefined, undefined, { followup: e.target.value }); if (e.target.value) logUser(`jadwalkan follow-up ${l.name} → ${e.target.value}`); refresh(); toast(e.target.value ? "Jadwal follow-up disimpan" : "Jadwal dihapus"); };
    $("#dHand").onclick = () => {
      if (!followOf(l)) { const d = new Date(); d.setDate(d.getDate() + 1); setStatus(l.id, undefined, undefined, { followup: new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) }); }
      const next = ["deal", "tolak"].includes(statusOf(l)) ? statusOf(l) : "nego";
      setStatus(l.id, next, undefined, { pic: "nego" });
      const text = handoffText(l);
      logUser(`serahkan ${l.name} ke ${NEGO_NAME} untuk negosiasi`);
      if (NEGO.whatsapp) window.open(`https://api.whatsapp.com/send?phone=${NEGO.whatsapp}&text=${encodeURIComponent(text)}`, "_blank", "noopener");
      else navigator.clipboard?.writeText(text).then(() => toast("Nomor belum diisi — detail lead disalin"));
      refresh(); openLead(l.id);
    };
    $("#dFuMsg").onclick = () => { const url = waLink(l, fill(CFG.followupTemplate, l)); if (url) window.open(url, "_blank", "noopener"); };
    $("#dCopy").onclick = () => navigator.clipboard?.writeText($("#dMsg").value).then(() => toast("Pesan disalin"), () => toast("Tidak bisa menyalin"));
    $("#dNote").oninput = e => { clearTimeout(openLead._n); openLead._n = setTimeout(() => setStatus(l.id, undefined, e.target.value), 500); };
    $("#drawer").classList.add("is-open");
    $("#drawer").setAttribute("aria-hidden", "false");
  }
  function closeDrawer() { $("#drawer").classList.remove("is-open"); $("#drawer").setAttribute("aria-hidden", "true"); }

  /* ---------- CSV ---------- */
  function exportCsv() {
    const cols = ["name", "category", "city", "address", "phone", "rating", "reviews", "score", "status", "pic", "followup", "maps_url"];
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(",")].concat(filtered().map(l => cols.map(c => q(c === "status" ? statusOf(l) : c === "pic" ? picOf(l) : c === "followup" ? followOf(l) : c === "maps_url" ? mapsLink(l) : l[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  /* ---------- routing ---------- */
  const TITLES = { overview: "Ringkasan", agents: "Tim", leads: "Ruang Data" };
  function route() {
    const v = (location.hash.slice(1) || "overview");
    const view = TITLES[v] ? v : "overview";
    $$(".view").forEach(s => { s.hidden = s.dataset.view !== view; });
    $$("[data-nav]").forEach(a => a.classList.toggle("is-on", a.dataset.nav === view));
    $("#viewTitle").textContent = TITLES[view];
    $("#crumb").textContent = "Ruang Kerja / " + TITLES[view];
    window.scrollTo(0, 0);
  }

  function refresh() {
    renderConn(); renderCrew(); renderAgents(); renderOverview(); renderLeads();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    if (open) { openLead(open.dataset.open); return; }
    if (e.target.closest("[data-close]")) { closeDrawer(); return; }
    const nowa = e.target.closest("[data-nowa]");
    if (nowa) { e.preventDefault(); toast(leads.find(l => l.id === nowa.dataset.nowa)?.demo ? "Data demo — belum ada nomor WhatsApp" : "Nomor WhatsApp tidak tersedia"); return; }
    const wa = e.target.closest("[data-wa]");
    if (wa) { const l = leads.find(x => x.id === wa.dataset.wa); if (l && statusOf(l) === "baru") { setStatus(l.id, "dihubungi"); setTimeout(refresh, 50); } }
    const modeBtn = e.target.closest("[data-mode]");
    if (modeBtn) { ui.mode = modeBtn.dataset.mode; save("hq.mode", ui.mode); applyMode(); return; }
    const cityBtn = e.target.closest("[data-city]");
    if (cityBtn) { ui.city = cityBtn.dataset.city; $$("#cityFilter button").forEach(b => b.classList.toggle("is-on", b === cityBtn)); renderLeads(); }
  });
  document.addEventListener("change", e => {
    const sel = e.target.closest("[data-status]");
    if (sel) {
      setStatus(sel.dataset.status, sel.value);
      sel.dataset.s = sel.value;
      renderConn(); renderOverview(); renderCrew(); renderAgents(); renderLeads();
      toast("Status diperbarui");
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  let dragId = null;
  document.addEventListener("dragstart", e => { const c = e.target.closest?.(".kcard"); if (!c) return; dragId = c.dataset.id; c.classList.add("is-drag"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); });
  document.addEventListener("dragend", e => { e.target.closest?.(".kcard")?.classList.remove("is-drag"); $$(".col__body.is-over").forEach(c => c.classList.remove("is-over")); });
  document.addEventListener("dragover", e => { const z = e.target.closest?.("[data-drop]"); if (!z || !dragId) return; e.preventDefault(); $$(".col__body.is-over").forEach(c => c !== z && c.classList.remove("is-over")); z.classList.add("is-over"); });
  document.addEventListener("drop", e => {
    const z = e.target.closest?.("[data-drop]"); if (!z || !dragId) return;
    e.preventDefault();
    const l = leads.find(x => x.id === dragId); dragId = null;
    if (l && statusOf(l) !== z.dataset.drop) { setStatus(l.id, z.dataset.drop); refresh(); toast(`${l.name} → ${STATUSES.find(s => s.id === z.dataset.drop).label}`); }
  });
  $("#q").addEventListener("input", e => { ui.q = e.target.value; renderLeads(); });
  $("#statusFilter").addEventListener("change", e => { ui.status = e.target.value; renderLeads(); });
  $("#catFilter").addEventListener("change", e => { ui.cat = e.target.value; renderLeads(); });
  $("#sortBy").addEventListener("change", e => { ui.sort = e.target.value; renderLeads(); });
  $("#exportBtn").addEventListener("click", exportCsv);
  $("#syncBtn").addEventListener("click", async () => {
    const b = $("#syncBtn"); b.classList.add("is-spinning");
    await fetchLeads(); markFresh(); fillFilters(); refresh(); renderTerm();
    b.classList.remove("is-spinning");
    if (!freshIds.size) toast(isDemo ? "Mode demo — isi leadsUrl di config.js" : `${leads.length} leads tersinkron · tidak ada bisnis baru`);
  });
  addEventListener("hashchange", route);

  const tick = () => { $("#clock").textContent = new Date().toLocaleString("id-ID", { weekday: "short", hour: "2-digit", minute: "2-digit" }); };
  tick(); setInterval(tick, 30000);

  /* ---------- boot ---------- */
  (async () => {
    route(); applyMode();
    await fetchLeads(); markFresh();
    fillFilters(); refresh(); renderTerm();
    // cek data baru dari Raka tiap 5 menit selama Ruang Kerja terbuka
    if (!isDemo) setInterval(async () => { await fetchLeads(); markFresh(); fillFilters(); refresh(); }, 5 * 60 * 1000);
  })();
})();
