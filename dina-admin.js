/* =========================================================
   Ruang Kerja — Chat Dina: riwayat chat konsumen, saklar AI, ambil alih balasan.
   Data di tab "Chat" Google Sheet lewat workflow n8n "5 Dina Monitor".
   ========================================================= */
(() => {
  const CFG = window.HQ_CONFIG || {};
  const A = window.HQ_APP;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const key = () => { try { return JSON.parse(localStorage.getItem("hq.key")) || ""; } catch { return ""; } };
  const json = s => { try { return JSON.parse(s || "[]"); } catch { return []; } };
  const waktu = d => d ? new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
  const NAMA = { user: "Konsumen", bot: "Dina", admin: "Tim" };

  let list = [], ai = true, pilih = "", siap = false;

  async function muat() {
    if (!CFG.dinaCekUrl) return;
    try {
      const res = await fetch(CFG.dinaCekUrl + "?key=" + encodeURIComponent(key()), { headers: { Accept: "application/json" } });
      if (!res.ok) throw 0;
      let j = await res.json(); if (Array.isArray(j)) j = j[0];
      if (!j || j.error) throw 0;
      list = j.sesi || []; ai = j.ai !== false; siap = true;
    } catch { siap = false; }
    render();
  }

  async function kirim(body) {
    const res = await fetch(CFG.dinaAdminUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: key(), ...body }) });
    if (!res.ok) throw 0;
  }

  // balasan Tim yang belum masuk riwayat konsumen tetap ditampilkan di akhir
  function pesanOf(s) {
    const p = json(s.pesan), balas = json(s.balas), sudah = p.filter(m => m.role === "admin").length;
    return [...p, ...balas.slice(sudah).map(b => ({ role: "admin", text: b.text }))];
  }

  function renderList() {
    $("#dnCount").textContent = siap ? `${list.length} percakapan` : "";
    const hari = new Date().toDateString(), b = $("#navDina");
    if (b) b.textContent = list.filter(s => new Date(s.updated).toDateString() === hari).length;
    $("#dnList").innerHTML = !siap ? `<p class="empty">Belum tersambung. Pasang workflow "5 Dina Monitor" di n8n.</p>`
      : list.length ? list.map(s => {
        const akhir = json(s.pesan).filter(m => m.role === "user").pop();
        return `<button type="button" class="dn-row ${s.sesi === pilih ? "is-on" : ""}" data-sesi="${esc(s.sesi)}">
          <span><b>${esc(s.usaha || s.nama || "Pengunjung")}</b>${s.mode === "manual" ? `<em>Ditangani tim</em>` : ""}<time>${waktu(s.updated)}</time></span>
          <small>${esc(akhir ? akhir.text : "—")}</small>
        </button>`;
      }).join("") : `<p class="empty">Belum ada chat. Riwayat muncul setelah konsumen bertanya ke Dina.</p>`;
  }

  function renderDetail() {
    const s = list.find(x => x.sesi === pilih), host = $("#dnDetail");
    if (!s) { host.innerHTML = `<p class="empty">Pilih percakapan untuk membaca isinya.</p>`; return; }
    const manual = s.mode === "manual";
    host.innerHTML = `
      <header class="dn-head"><div><b>${esc(s.usaha || s.nama || "Pengunjung")}</b><small>${esc([s.nama, s.halaman || "halaman depan", waktu(s.mulai)].filter(Boolean).join(" · "))}</small></div>
        <button type="button" class="btn btn--sm ${manual ? "" : "btn--orange"}" id="dnTake">${manual ? "Kembalikan ke Dina" : "Ambil alih"}</button></header>
      <div class="dn-log">${pesanOf(s).map(m => `<div class="dn-msg dn-msg--${esc(m.role)}"><small>${NAMA[m.role] || "Dina"}</small>${esc(m.text)}</div>`).join("")}</div>
      ${manual ? `<form class="dn-reply" id="dnReply"><input class="sel" placeholder="Tulis balasan ke konsumen…" aria-label="Balasan" required><button class="btn btn--sm btn--gold" type="submit">Kirim</button></form>`
        : `<p class="tbl__foot">Dina yang menjawab. Tekan Ambil alih untuk membalas sendiri.</p>`}`;
    const log = $(".dn-log", host); log.scrollTop = log.scrollHeight;
  }

  function render() {
    if (!$("#dnList")) return;
    const sw = $("#dnAi");
    sw.checked = ai; sw.disabled = !siap;
    $("#dnAiText").textContent = ai ? "Dina AI aktif" : "Dina AI mati — pakai jawaban bawaan";
    renderList(); renderDetail();
  }

  $("#dnList").addEventListener("click", e => {
    const b = e.target.closest("[data-sesi]"); if (!b) return;
    pilih = b.dataset.sesi; renderList(); renderDetail();
  });
  $("#dnAi").addEventListener("change", async e => {
    const on = e.target.checked;
    try { await kirim({ sesi: "_pengaturan", mode: on ? "on" : "off" }); ai = on; A.toast(on ? "Dina AI dinyalakan" : "Dina AI dimatikan"); }
    catch { A.toast("Gagal menyimpan, coba lagi"); }
    render();
  });
  $("#dnDetail").addEventListener("click", async e => {
    if (!e.target.closest("#dnTake")) return;
    const s = list.find(x => x.sesi === pilih), mode = s.mode === "manual" ? "dina" : "manual";
    try { await kirim({ sesi: s.sesi, mode }); s.mode = mode; A.toast(mode === "manual" ? "Percakapan diambil alih" : "Dina menjawab lagi"); }
    catch { A.toast("Gagal menyimpan, coba lagi"); }
    render();
  });
  $("#dnDetail").addEventListener("submit", async e => {
    e.preventDefault();
    const input = $("#dnReply input"), text = input.value.trim(), s = list.find(x => x.sesi === pilih);
    if (!text) return;
    const balas = [...json(s.balas), { t: new Date().toISOString(), text }];
    try { await kirim({ sesi: s.sesi, balas: JSON.stringify(balas) }); s.balas = JSON.stringify(balas); render(); }
    catch { A.toast("Balasan gagal terkirim"); }
  });

  // segarkan hanya saat menu ini terbuka, supaya hemat jatah n8n
  setInterval(() => { if (location.hash === "#dina" && !document.hidden) muat(); }, 30000);
  addEventListener("hashchange", () => { if (location.hash === "#dina") muat(); });
  muat();
})();
