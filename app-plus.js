/* =========================================================
   Ruang Kerja — fitur jualan & proyek:
   • Detail lead: demo personal, penawaran resmi, mulai proyek (1 klik).
   • Proyek: tahap pengerjaan, revisi x/5, pembayaran, kirim update ke klien.
   • Cuan: omzet bulan ini, piutang, potensi, perpanjangan tahunan.
   Data proyek disimpan di browser + n8n (CFG.proyekUrl) kalau aktif.
   ========================================================= */
(() => {
  const CFG = window.HQ_CONFIG || {};
  const S = window.HQ_SHARED;
  const A = window.HQ_APP;               // disediakan app.js
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = S.rupiah;
  const MAX = CFG.maksRevisi || 3;
  const TAHAP = ["Brief & kebutuhan", "Bahan diterima", "Desain dibuat", "Revisi", "Website online", "Selesai"];
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const KEY = "hq.proyek.v1";
  let proyek = load(KEY, {});
  const accessKey = () => load("hq.key", "");
  const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const fmtD = d => d ? new Date(d.length === 10 ? d + "T00:00" : d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const pctOf = p => Math.round(((+p.t + (+p.t === TAHAP.length - 1 ? 1 : .5)) / TAHAP.length) * 100);
  const dibayar = p => (p.bayar || []).reduce((s, b) => s + (+b.j || 0), 0);
  const statusBayar = p => dibayar(p) >= p.harga ? "lunas" : dibayar(p) > 0 ? "dp" : "belum";

  /* ---------------- simpan & sinkron ---------------- */
  let online = !!CFG.proyekUrl;
  function persist(p) {
    p.up = new Date().toISOString();
    proyek[p.kode] = p; save(KEY, proyek);
    if (online) fetch(CFG.proyekUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: accessKey(), proyek: flat(p) }) })
      .catch(() => { online = false; A.toast("Proyek tersimpan di browser ini (n8n belum aktif)"); });
  }
  // baris Google Sheet = kolom datar
  const flat = p => ({ kode: p.kode, usaha: p.n, kontak: p.nm || "", wa: p.wa || "", paket: p.p, harga: p.harga, bayar: JSON.stringify(p.bayar || []), tahap: p.t, revisi: p.rv, preview: p.pv || "", deadline: p.dl || "", catatan: p.cat || "", lead_id: p.lead || "", mulai: p.mulai, online_sejak: p.on || "", progres: JSON.stringify(logPublic(p)), updated: p.up });
  const unflat = r => ({ kode: r.kode, n: r.usaha, nm: r.kontak, wa: r.wa, p: r.paket, harga: +r.harga || S.paket(r.paket).harga, bayar: (() => { try { return JSON.parse(r.bayar || "[]"); } catch { return []; } })(), t: +r.tahap || 0, rv: +r.revisi || 0, pv: r.preview, dl: r.deadline, cat: r.catatan, lead: r.lead_id, mulai: r.mulai, on: r.online_sejak, log: (() => { try { return JSON.parse(r.progres || "[]"); } catch { return []; } })(), up: r.updated });
  async function pull() {
    if (!online) return;
    try {
      const res = await fetch(CFG.proyekUrl + "?key=" + encodeURIComponent(accessKey()), { headers: { Accept: "application/json" } });
      if (!res.ok) throw 0;
      let j = await res.json(); if (Array.isArray(j) && j.length === 1 && j[0].proyek) j = j[0];
      (j.proyek || j || []).forEach(r => { if (!r.kode) return; const p = unflat(r); const old = proyek[p.kode]; if (!old || new Date(p.up || 0) > new Date(old.up || 0)) { (p.log || []).forEach(e => { const o = (old?.log || []).find(x => x.id === e.id); if (o && !e.img && o.img) e.img = o.img; }); proyek[p.kode] = p; } });
      save(KEY, proyek); render();
    } catch { online = false; }
  }

  /* ---------------- pesan WhatsApp ---------------- */
  // update progres yang aman dibagikan: foto hanya yang berupa link (foto unggahan lokal terlalu besar untuk link/Sheet)
  const logPublic = p => (p.log || []).slice(-15).map(e => ({ id: e.id, d: e.d, j: e.j, c: e.c, img: /^https?:/i.test(e.img || "") ? e.img : "", u: e.u || "" }));
  const snap = p => ({ kode: p.kode, n: p.n, nm: p.nm, p: p.p, t: p.t, rv: p.rv, pv: p.pv, dl: p.dl, cat: p.cat, by: statusBayar(p), up: p.up, log: logPublic(p).slice(-8) });
  const lastLog = p => (p.log || [])[(p.log || []).length - 1];
  const msgUpdate = p => `Halo ${p.nm ? "kak " + p.nm : "kak"} 👋\n\nUpdate website *${p.n}*: sekarang di tahap *${TAHAP[p.t]}* (${pctOf(p)}%).` +
    (lastLog(p) ? `\n\n📸 *${lastLog(p).j}*${lastLog(p).c ? "\n" + lastLog(p).c : ""}` : "") +
    (p.pv ? `\nPratinjau: ${p.pv}` : "") + (+p.t === 3 ? `\nRevisi terpakai ${p.rv}/${MAX} — kumpulkan perubahan dalam satu pesan ya 🙏` : "") +
    `\n\nPantau progres kapan saja di sini:\n${S.links.klien(snap(p))}\n(kode proyek: ${p.kode})`;
  const msgTagih = p => { const sisa = p.harga - dibayar(p), dp = Math.round(p.harga * (CFG.dpPersen || 50) / 100); const awal = dibayar(p) === 0;
    return `Halo ${p.nm ? "kak " + p.nm : "kak"} 🙏\n\n${awal ? `Untuk memulai pengerjaan website *${p.n}* (paket ${S.paket(p.p).nama}), mohon uang muka *${R(dp)}*.` : `Website *${p.n}* sudah siap 🎉 Mohon pelunasan *${R(sisa)}* supaya bisa kami online-kan.`}\n\nTerima kasih banyak 😊`; };
  const msgRenew = p => `Halo ${p.nm ? "kak " + p.nm : "kak"} 👋\n\nWebsite *${p.n}* akan masuk masa perpanjangan tahunan pada *${fmtD(renewDate(p))}*.\nBiaya perpanjangan ${R(CFG.biayaTahunan)}/tahun — sudah termasuk domain, hosting, keamanan & perbaikan error.\n\nBoleh kami proses perpanjangannya? 🙏`;
  const renewDate = p => { if (!p.on) return null; const d = new Date(p.on); d.setFullYear(d.getFullYear() + 1); return d.toISOString(); };
  const wa = (phone, text) => S.waLink(phone, text);

  /* ---------------- foto update progres ---------------- */
  // link Google Drive "file/d/ID/view" -> gambar yang bisa ditampilkan
  const driveImg = u => { const m = String(u).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([\w-]{20,})/); return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : u; };
  // kecilkan foto di browser (maks 1200 px, JPEG) supaya ringan
  function shrink(file) {
    return new Promise((ok, no) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1200 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        ok(c.toDataURL("image/jpeg", .72));
      };
      img.onerror = no; img.src = url;
    });
  }
  // unggah ke Google Drive lewat n8n (kalau aktif) -> link publik; kalau gagal, foto tetap disimpan di perangkat ini
  async function uploadFoto(dataUrl, p) {
    if (!CFG.fotoUrl) return "";
    try {
      const res = await fetch(CFG.fotoUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: accessKey(), kode: p.kode, nama: `${p.kode}-${Date.now()}.jpg`, data: dataUrl.split(",")[1] }) });
      if (!res.ok) throw 0;
      let j = await res.json(); if (Array.isArray(j)) j = j[0];
      return j && j.url || "";
    } catch { A.toast("n8n belum aktif — foto disimpan di perangkat ini"); return ""; }
  }

  /* ---------------- buat proyek ---------------- */
  function createProject({ n, nm, wa: phone, p, lead }) {
    const k = S.kode("ALV");
    const pk = S.paket(p);
    const dl = new Date(); dl.setDate(dl.getDate() + (p === "landing" ? 7 : p === "profil" ? 14 : 21));
    const pr = { kode: k, n, nm: nm || "", wa: phone || "", p: pk.id, harga: pk.harga, bayar: [], t: 0, rv: 0, pv: "", dl: dl.toISOString().slice(0, 10), cat: "", lead: lead || "", mulai: new Date().toISOString() };
    persist(pr);
    A.log?.(`memulai proyek ${n} (${pk.nama}) · ${k}`);
    return pr;
  }

  /* ---------------- detail lead: percepat closing ---------------- */
  function drawerExtra(l, host) {
    const pkOpts = (CFG.paket || []).map(p => `<option value="${p.id}">${esc(p.nama)} — ${R(p.harga)}</option>`).join("");
    const existing = Object.values(proyek).find(p => p.lead === l.id);
    const sec = document.createElement("div");
    sec.className = "d-sec plus-sec";
    sec.innerHTML = `
      <h4>🚀 Percepat closing</h4>
      <div class="plus-step"><b>1. Demo personal</b><span>Website contoh dengan nama, kategori, rating & lokasi ${esc(l.name)} — siap dikirim.</span>
        <div class="d-acts"><a class="btn btn--sm btn--gold" target="_blank" rel="noopener" id="pDemo">Buka demo</a><button class="btn btn--sm btn--wa" type="button" id="pDemoWa" ${S.waNumber(l.phone) ? "" : "disabled"}>Kirim demo via WA</button><button class="btn btn--sm" type="button" id="pDemoCopy">Salin link</button></div></div>
      <div class="plus-step"><b>2. Penawaran resmi</b><span>Halaman penawaran bernomor, bisa disimpan PDF, ada tombol “Setuju”.</span>
        <div class="d-acts"><select class="sel" id="pPaket">${pkOpts}</select><button class="btn btn--sm btn--wa" type="button" id="pQuoteWa" ${S.waNumber(l.phone) ? "" : "disabled"}>Kirim penawaran</button><a class="btn btn--sm" target="_blank" rel="noopener" id="pQuote">Lihat</a></div></div>
      <div class="plus-step"><b>3. Deal → mulai proyek</b><span>${existing ? `Sudah jadi proyek <b>${esc(existing.kode)}</b>.` : "Buat kode proyek & portal progres untuk klien."}</span>
        <div class="d-acts">${existing ? `<a class="btn btn--sm btn--orange" href="#proyek" id="pGoProj">Buka proyek</a>` : `<button class="btn btn--sm btn--orange" type="button" id="pStart">Deal! Mulai proyek</button>`}</div></div>`;
    host.appendChild(sec);
    const demoUrl = S.links.demo(l);
    const quote = () => ({ no: S.kode("PNW", 4), n: l.name, k: l.city, p: $("#pPaket", sec).value, d: new Date().toISOString() });
    $("#pDemo", sec).href = demoUrl;
    $("#pDemoWa", sec).onclick = () => {
      window.open(wa(l.phone, (CFG.demoTemplate || "{link}").replaceAll("{nama}", l.name).replaceAll("{kota}", l.city).replaceAll("{brand}", CFG.brand).replaceAll("{link}", demoUrl)), "_blank", "noopener");
      if (["baru", "dihubungi"].includes(A.statusOf(l))) A.setStatus(l.id, "tertarik");
      A.log?.(`kirim demo ke ${l.name}`); A.refresh(); A.toast("Demo dikirim — status jadi Tertarik");
    };
    $("#pDemoCopy", sec).onclick = () => navigator.clipboard?.writeText(demoUrl).then(() => A.toast("Link demo disalin"));
    const syncQuote = () => { $("#pQuote", sec).href = S.links.penawaran(quote()); };
    $("#pPaket", sec).onchange = syncQuote; syncQuote();
    $("#pQuoteWa", sec).onclick = () => {
      const q = quote(), pk = S.paket(q.p);
      window.open(wa(l.phone, `Halo kak 🙏 Berikut penawaran resmi website untuk *${l.name}* — paket *${pk.nama}* (${R(pk.harga)}), sudah termasuk domain, hosting & keamanan tahun pertama:\n\n${S.links.penawaran(q)}\n\nKalau setuju, tinggal tekan tombol “Setuju” di halaman itu ya 😊`), "_blank", "noopener");
      if (["baru", "dihubungi", "tertarik"].includes(A.statusOf(l))) A.setStatus(l.id, "nego");
      A.log?.(`kirim penawaran ${q.no} ke ${l.name}`); A.refresh(); A.toast("Penawaran dikirim — status jadi Negosiasi");
    };
    const st = $("#pStart", sec);
    if (st) st.onclick = () => {
      const pr = createProject({ n: l.name, wa: l.phone, p: $("#pPaket", sec).value, lead: l.id });
      A.setStatus(l.id, "deal"); A.refresh();
      A.toast(`Proyek ${pr.kode} dibuat 🎉`);
      location.hash = "#proyek";
      setTimeout(() => openProject(pr.kode), 300);
    };
  }

  /* ---------------- tampilan: Proyek ---------------- */
  function renderProyek() {
    const host = $("#proyekList"); if (!host) return;
    const list = Object.values(proyek).sort((a, b) => (a.t === 5) - (b.t === 5) || new Date(b.up) - new Date(a.up));
    $("#proyekCount").textContent = `${list.filter(p => p.t < 5).length} berjalan · ${list.filter(p => p.t === 5).length} selesai`;
    host.innerHTML = list.length ? list.map(p => {
      const sb = statusBayar(p), late = p.dl && p.dl < today() && p.t < 4;
      return `<article class="pj" data-pj="${esc(p.kode)}">
        <header><div><b>${esc(p.n)}</b><small>${esc(S.paket(p.p).nama)} · <span class="mono">${esc(p.kode)}</span></small></div><span class="pj__pct">${pctOf(p)}%</span></header>
        <div class="pj__steps">${TAHAP.map((t, i) => `<i class="${i < p.t ? "done" : i === p.t ? "now" : ""}" title="${t}"></i>`).join("")}</div>
        <div class="pj__meta"><span>${esc(TAHAP[p.t])}</span><span class="${late ? "is-late" : ""}">🎯 ${fmtD(p.dl)}${late ? " · telat" : ""}</span><span>✏️ ${p.rv}/${MAX}</span><span class="pay pay--${sb}">${{ lunas: "Lunas", dp: "DP masuk", belum: "Belum bayar" }[sb]}</span></div>
      </article>`;
    }).join("") : `<div class="empty plus-empty"><b>Belum ada proyek.</b><p>Buka detail lead → <b>Deal! Mulai proyek</b>, atau klik <b>+ Proyek baru</b>.</p></div>`;
  }

  function openProject(kode) {
    const p = proyek[kode]; if (!p) return;
    const body = $("#drawerBody");
    const pk = S.paket(p.p), sisa = p.harga - dibayar(p);
    body.innerHTML = `
      <div class="d-head"><span class="biz__ico">${esc(p.n.slice(0, 2).toUpperCase())}</span><div><h2 id="dName">${esc(p.n)}</h2><p>${esc(pk.nama)} · <span class="mono">${esc(p.kode)}</span></p></div></div>
      <div class="d-sec"><h4>Tahap pengerjaan</h4>
        <div class="pj-stage">${TAHAP.map((t, i) => `<button type="button" data-tahap="${i}" class="${i < p.t ? "done" : i === p.t ? "now" : ""}"><span>${i < p.t ? "✓" : i + 1}</span>${t}</button>`).join("")}</div>
      </div>
      <div class="d-sec"><h4>Revisi (${p.rv}/${MAX})</h4>
        <div class="d-acts" style="margin-top:0"><button class="btn btn--sm" type="button" id="rvMin">−</button><div class="rev-bar">${Array.from({ length: MAX }, (_, i) => `<i class="${i < p.rv ? "used" : ""}"></i>`).join("")}</div><button class="btn btn--sm" type="button" id="rvPlus">+ Revisi masuk</button></div>
        ${p.rv >= MAX ? `<p class="tbl__foot">Jatah 3 revisi habis — revisi berikutnya dihitung pekerjaan tambahan.</p>` : ""}
      </div>
      <div class="d-sec"><h4>Data proyek</h4>
        <div class="d-row">
          <label><span>Nama kontak</span><input class="sel" id="fNm" value="${esc(p.nm)}" placeholder="mis. Bu Rina"></label>
          <label><span>WhatsApp klien</span><input class="sel" id="fWa" value="${esc(p.wa)}" placeholder="08…"></label>
          <label><span>Target selesai</span><input class="sel" type="date" id="fDl" value="${esc(p.dl)}"></label>
        </div>
        <label class="plus-full"><span>🌐 Link website yang kamu buat — tampil langsung di Portal Klien (Laptop &amp; HP)</span>
          <div class="pv-row"><input class="sel" id="fPv" value="${esc(p.pv)}" placeholder="mis. https://kopisenja.vercel.app">${p.pv ? `<a class="btn btn--sm" href="${esc(p.pv)}" target="_blank" rel="noopener">Buka</a>` : ""}</div></label>
        <label class="plus-full"><span>Catatan untuk klien (tampil di portal)</span><textarea class="d-note" id="fCat" placeholder="mis. Menunggu foto menu dari klien">${esc(p.cat)}</textarea></label>
      </div>
      <div class="d-sec"><h4>Pembayaran — ${R(dibayar(p))} dari ${R(p.harga)}</h4>
        <div class="pay-list">${(p.bayar || []).map((b, i) => `<div><span>${fmtD(b.d)}</span><b>${R(b.j)}</b><button type="button" class="icon-btn" data-delpay="${i}" title="Hapus">✕</button></div>`).join("") || `<p class="tbl__foot">Belum ada pembayaran.</p>`}</div>
        <div class="d-acts">
          ${dibayar(p) === 0 ? `<button class="btn btn--sm btn--gold" type="button" data-pay="${Math.round(p.harga * (CFG.dpPersen || 50) / 100)}">+ Uang muka ${R(p.harga * (CFG.dpPersen || 50) / 100)}</button>` : ""}
          ${sisa > 0 ? `<button class="btn btn--sm" type="button" data-pay="${sisa}">+ Lunas ${R(sisa)}</button>` : ""}
          <button class="btn btn--sm btn--ghost" type="button" id="payOther">+ Jumlah lain</button>
          ${sisa > 0 && p.wa ? `<button class="btn btn--sm btn--wa" type="button" id="tagih">Tagih via WA</button>` : ""}
        </div>
      </div>
      <div class="d-sec"><h4>📸 Update progres — tampil di portal klien</h4>
        <div class="up-form">
          <input class="sel" id="uJ" placeholder="Judul, mis. Desain halaman utama selesai">
          <textarea class="d-note" id="uC" placeholder="Keterangan singkat untuk klien (opsional)"></textarea>
          <div class="up-foto">
            <label class="btn btn--sm">📷 Pilih foto / screenshot<input type="file" accept="image/*" id="uF" hidden></label>
            <input class="sel" id="uL" placeholder="atau tempel link gambar / Google Drive">
          </div>
          <img class="up-prev" id="uPrev" alt="" hidden>
          <label class="up-chk"><input type="checkbox" id="uSend" ${p.wa ? "checked" : "disabled"}> Langsung kabari klien via WhatsApp</label>
          <button class="btn btn--sm btn--gold" type="button" id="uAdd">+ Tambah update</button>
        </div>
        <div class="up-list">${(p.log || []).slice().reverse().map(e => `
          <div class="up-item">
            ${e.img ? `<img src="${esc(e.img)}" alt="" loading="lazy">` : `<span class="up-noimg">📝</span>`}
            <div><small>${fmtD(e.d)}${/^data:/.test(e.img || "") ? " · foto tersimpan di perangkat ini" : ""}</small><b>${esc(e.j)}</b>${e.c ? `<p>${esc(e.c)}</p>` : ""}</div>
            <button type="button" class="icon-btn" data-dellog="${esc(e.id)}" title="Hapus">✕</button>
          </div>`).join("") || `<p class="tbl__foot">Belum ada update. Tambahkan foto hasil kerja tiap tahap supaya klien ikut merasa progresnya.</p>`}</div>
      </div>
      <div class="d-sec"><h4>Kabari klien</h4>
        <div class="d-acts" style="margin-top:0">
          <button class="btn btn--sm btn--wa" type="button" id="sendUpd" ${p.wa ? "" : "disabled"}>Kirim update progres</button>
          <a class="btn btn--sm" target="_blank" rel="noopener" href="${esc(S.links.klien(snap(p)))}">Lihat portal klien</a>
          <button class="btn btn--sm btn--ghost" type="button" id="copyPortal">Salin link portal</button>
        </div>
        ${p.wa ? "" : `<p class="tbl__foot">Isi WhatsApp klien dulu untuk mengirim update.</p>`}
      </div>
      <div class="d-sec"><button class="btn btn--sm btn--ghost plus-del" type="button" id="delPj">Hapus proyek</button></div>`;
    const re = () => { persist(p); render(); openProject(p.kode); };
    $$("[data-tahap]", body).forEach(b => b.onclick = () => {
      p.t = +b.dataset.tahap;
      if (p.t >= 4 && !p.on) p.on = new Date().toISOString();
      A.log?.(`proyek ${p.n} → ${TAHAP[p.t]}`); re(); A.toast(`Tahap: ${TAHAP[p.t]}`);
    });
    $("#rvPlus", body).onclick = () => { if (p.rv < MAX) { p.rv++; if (p.t < 3) p.t = 3; re(); } else A.toast("Jatah revisi sudah habis"); };
    $("#rvMin", body).onclick = () => { if (p.rv > 0) { p.rv--; re(); } };
    const field = (id, k) => { $(id, body).onchange = e => { p[k] = e.target.value.trim(); persist(p); render(); A.toast("Tersimpan"); }; };
    field("#fNm", "nm"); field("#fWa", "wa"); field("#fDl", "dl"); field("#fPv", "pv"); field("#fCat", "cat");
    $$("[data-pay]", body).forEach(b => b.onclick = () => { (p.bayar ||= []).push({ d: today(), j: +b.dataset.pay }); A.log?.(`terima pembayaran ${R(b.dataset.pay)} dari ${p.n}`); re(); A.toast("Pembayaran dicatat 💰"); });
    $("#payOther", body).onclick = () => { const v = +String(prompt("Jumlah pembayaran (angka saja):", "") || "").replace(/\D/g, ""); if (v > 0) { (p.bayar ||= []).push({ d: today(), j: v }); re(); } };
    $$("[data-delpay]", body).forEach(b => b.onclick = () => { if (confirm("Hapus catatan pembayaran ini?")) { p.bayar.splice(+b.dataset.delpay, 1); re(); } });
    $("#tagih", body) && ($("#tagih", body).onclick = () => window.open(wa(p.wa, msgTagih(p)), "_blank", "noopener"));
    $("#sendUpd", body).onclick = () => { window.open(wa(p.wa, msgUpdate(p)), "_blank", "noopener"); A.log?.(`kirim update progres ke ${p.n}`); };
    $("#copyPortal", body).onclick = () => navigator.clipboard?.writeText(S.links.klien(snap(p))).then(() => A.toast("Link portal disalin"));
    let foto = "";
    const setPrev = src => { foto = src; const im = $("#uPrev", body); im.hidden = !src; if (src) im.src = src; };
    $("#uF", body).onchange = async e => { const f = e.target.files[0]; if (!f) return; A.toast("Mengecilkan foto…"); try { setPrev(await shrink(f)); } catch { A.toast("Foto tidak bisa dibaca"); } };
    $("#uL", body).oninput = e => { const u = driveImg(e.target.value.trim()); setPrev(/^https?:/i.test(u) ? u : ""); };
    $("#uAdd", body).onclick = async () => {
      const j = $("#uJ", body).value.trim(); if (!j) { A.toast("Isi judul update dulu"); return; }
      const btn = $("#uAdd", body); btn.disabled = true; btn.textContent = "Menyimpan…";
      let img = foto;
      if (/^data:/.test(img)) img = await uploadFoto(img, p) || img;
      (p.log ||= []).push({ id: S.kode("UP", 4), d: new Date().toISOString(), j, c: $("#uC", body).value.trim(), img });
      const kirim = $("#uSend", body).checked && p.wa;
      A.log?.(`update progres ${p.n}: ${j}`); re(); A.toast("Update progres ditambahkan 📸");
      if (kirim) window.open(wa(p.wa, msgUpdate(p)), "_blank", "noopener");
    };
    $$("[data-dellog]", body).forEach(b => b.onclick = () => { if (confirm("Hapus update ini?")) { p.log = (p.log || []).filter(e => e.id !== b.dataset.dellog); re(); } });
    $("#delPj", body).onclick = () => { if (confirm(`Hapus proyek ${p.n}? Tidak bisa dibatalkan.`)) { delete proyek[p.kode]; save(KEY, proyek); render(); A.closeDrawer(); } };
    A.openDrawer();
  }

  function newProjectDialog() {
    const body = $("#drawerBody");
    body.innerHTML = `
      <div class="d-head"><span class="biz__ico">+</span><div><h2 id="dName">Proyek baru</h2><p>Untuk klien yang datang langsung (bukan dari Raka)</p></div></div>
      <div class="d-sec"><div class="d-row">
        <label><span>Nama usaha</span><input class="sel" id="nN" placeholder="mis. Salon Bunga"></label>
        <label><span>Nama kontak</span><input class="sel" id="nNm" placeholder="mis. Bu Rina"></label>
        <label><span>WhatsApp klien</span><input class="sel" id="nWa" placeholder="08…"></label>
        <label><span>Paket</span><select class="sel" id="nP">${(CFG.paket || []).map(p => `<option value="${p.id}">${esc(p.nama)} — ${R(p.harga)}</option>`).join("")}</select></label>
      </div><div class="d-acts"><button class="btn btn--gold" type="button" id="nGo">Buat proyek</button></div></div>`;
    $("#nGo", body).onclick = () => {
      const n = $("#nN", body).value.trim(); if (!n) return A.toast("Isi nama usaha dulu");
      const pr = createProject({ n, nm: $("#nNm", body).value.trim(), wa: $("#nWa", body).value.trim(), p: $("#nP", body).value });
      render(); openProject(pr.kode); A.toast(`Proyek ${pr.kode} dibuat 🎉`);
    };
    A.openDrawer();
  }

  /* ---------------- tampilan: Cuan ---------------- */
  function renderCuan() {
    if (!$("#cuanKpi")) return;
    const list = Object.values(proyek);
    const ym = today().slice(0, 7);
    const omzet = list.reduce((s, p) => s + (p.bayar || []).filter(b => String(b.d).startsWith(ym)).reduce((x, b) => x + (+b.j || 0), 0), 0);
    const piutang = list.reduce((s, p) => s + Math.max(0, p.harga - dibayar(p)), 0);
    const leads = A.getLeads();
    const hangat = leads.filter(l => ["tertarik", "nego"].includes(A.statusOf(l)));
    const potensi = hangat.length * ((CFG.paket || [])[0]?.harga || 0);
    const aktif = list.filter(p => p.on).length;
    const target = CFG.targetOmzet || 10000000;
    const pct = Math.min(100, Math.round(omzet / target * 100));
    $("#cuanKpi").innerHTML = `
      <article class="kpi kpi--gold"><span class="kpi__label">Masuk bulan ini</span><strong class="kpi__val">${R(omzet)}</strong><span class="kpi__sub">${pct}% dari target ${R(target)}</span><div class="cuan-bar"><i style="width:${pct}%"></i></div></article>
      <article class="kpi"><span class="kpi__label">Belum dibayar (piutang)</span><strong class="kpi__val">${R(piutang)}</strong><span class="kpi__sub">${list.filter(p => statusBayar(p) !== "lunas").length} proyek</span></article>
      <article class="kpi"><span class="kpi__label">Potensi dari lead hangat</span><strong class="kpi__val">${R(potensi)}</strong><span class="kpi__sub">${hangat.length} lead tertarik / negosiasi</span></article>
      <article class="kpi"><span class="kpi__label">Pemasukan tahunan berulang</span><strong class="kpi__val">${R(aktif * (CFG.biayaTahunan || 0))}</strong><span class="kpi__sub">${aktif} website online × ${R(CFG.biayaTahunan)}</span></article>`;

    const tagih = list.filter(p => statusBayar(p) !== "lunas" && p.wa);
    $("#cuanTagih").innerHTML = tagih.length ? tagih.map(p => `<div class="toplist__row"><span class="pay pay--${statusBayar(p)}">${statusBayar(p) === "dp" ? "Pelunasan" : "Uang muka"}</span><div class="toplist__name" data-pj="${esc(p.kode)}"><b>${esc(p.n)}</b><small>sisa ${R(p.harga - dibayar(p))}</small></div><span></span><a class="btn btn--xs btn--wa" target="_blank" rel="noopener" href="${esc(wa(p.wa, msgTagih(p)))}">Tagih</a></div>`).join("") : `<p class="empty">Tidak ada tagihan tertunda 🎉</p>`;

    const soon = list.filter(p => p.on && p.wa).map(p => ({ p, d: renewDate(p) })).filter(x => (new Date(x.d) - Date.now()) / 864e5 <= 60).sort((a, b) => a.d.localeCompare(b.d));
    $("#cuanRenew").innerHTML = soon.length ? soon.map(({ p, d }) => `<div class="toplist__row"><span class="fu-date ${new Date(d) < new Date() ? "fu-date--late" : "fu-date--today"}">${fmtD(d)}</span><div class="toplist__name" data-pj="${esc(p.kode)}"><b>${esc(p.n)}</b><small>${R(CFG.biayaTahunan)}/tahun</small></div><span></span><a class="btn btn--xs btn--wa" target="_blank" rel="noopener" href="${esc(wa(p.wa, msgRenew(p)))}">Ingatkan</a></div>`).join("") : `<p class="empty">Belum ada perpanjangan dalam 60 hari ke depan.</p>`;

    const hot = hangat.sort((a, b) => b.score - a.score).slice(0, 6);
    $("#cuanHot").innerHTML = hot.length ? hot.map(l => `<div class="toplist__row" data-open="${esc(l.id)}"><span class="pay pay--dp">${A.statusOf(l) === "nego" ? "Negosiasi" : "Tertarik"}</span><div class="toplist__name"><b>${esc(l.name)}</b><small>${esc(l.category)} · ${esc(l.city)}</small></div><span></span><span class="mono" style="font-size:.72rem;color:var(--muted)">buka →</span></div>`).join("") : `<p class="empty">Kirim demo ke lead dengan skor tertinggi untuk mulai mengisi daftar ini.</p>`;
  }

  function render() { renderProyek(); renderCuan(); const b = $("#navProyek"); if (b) b.textContent = Object.values(proyek).filter(p => p.t < 5).length; }

  /* ---------------- events ---------------- */
  document.addEventListener("click", e => {
    const pj = e.target.closest("[data-pj]");
    if (pj && !e.target.closest("a")) { openProject(pj.dataset.pj); return; }
    if (e.target.closest("#newProj")) newProjectDialog();
  });

  window.HQ_PLUS = { drawerExtra, render, openProject };
  render(); pull();
})();
