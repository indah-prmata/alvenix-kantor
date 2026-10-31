/* Klinik Senyum: peta gigi, rencana perawatan, simulasi warna, cicilan, janji dokter, kasir, cek janji.
   shortcut: jadwal, harga, dan status masih contoh di browser; yang asli butuh backend + payment gateway. */
(() => {
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const baca = (k, awal) => { try { return JSON.parse(localStorage.getItem(k)) ?? awal; } catch { return awal; } };
  const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---------- data ---------- */
  const RAWAT = [
    { id: "scaling", n: "Scaling", f: "Karang gigi hilang, gusi lebih sehat", h: 350000, foto: "alat" },
    { id: "whitening", n: "Whitening", f: "Sekali kunjungan, sekitar 60 menit", h: 1800000, foto: "panduan-warna" },
    { id: "behel", n: "Behel", f: "Termasuk kontrol bulanan pertama", h: 7000000, mulai: 1, foto: "behel" },
    { id: "aligner", n: "Aligner bening", f: "Bisa dilepas saat makan", h: 18000000, mulai: 1, foto: "aligner" },
    { id: "anak", n: "Gigi anak", f: "Sesi kenalan dulu, tanpa buru-buru", h: 200000, foto: "anak" }
  ];
  const BARIS = [
    { id: "periksa", n: "Pemeriksaan dan konsultasi", f: "Termasuk foto kamera mulut", h: 150000 },
    { id: "tambal", n: "Tambal gigi", f: "Sewarna gigi, sekitar 45 menit", h: 300000, mulai: 1 },
    { id: "cabut", n: "Cabut gigi", f: "Dengan bius lokal", h: 400000, mulai: 1 },
    { id: "akar", n: "Perawatan saluran akar", f: "Sekitar 3 kunjungan", h: 1500000, mulai: 1 },
    { id: "veneer", n: "Veneer", f: "Per gigi", h: 2500000, mulai: 1 },
    { id: "bungsu", n: "Operasi gigi bungsu", f: "Dengan foto rontgen", h: 1800000, mulai: 1 }
  ];
  const SEMUA = [...RAWAT, ...BARIS];
  const KELUHAN = [
    { id: "lubang", n: "Berlubang", r: "tambal", ket: "Lubang kecil biasanya selesai sekali datang." },
    { id: "ngilu", n: "Ngilu", r: "periksa", ket: "Bisa karena email menipis atau gusi turun. Dokter mengecek penyebabnya dulu." },
    { id: "nyeri", n: "Sakit berdenyut", r: "akar", ket: "Sering berarti saraf gigi terganggu. Sebaiknya segera diperiksa." },
    { id: "patah", n: "Patah atau retak", r: "tambal", ket: "Bagian kecil bisa ditambal. Bagian besar mungkin perlu mahkota." },
    { id: "karang", n: "Karang atau kuning", r: "scaling", ket: "Membersihkan karang sering sudah membuat gigi lebih cerah." },
    { id: "goyang", n: "Goyang", r: "periksa", ket: "Perlu dicek kondisi gusi dan tulangnya lebih dulu." }
  ];
  const NAMA = ["seri tengah", "seri samping", "taring", "geraham kecil pertama", "geraham kecil kedua", "geraham besar pertama", "geraham besar kedua", "gigi bungsu"];
  const DOKTER = [
    { id: "rania", n: "drg. Rania Putri", p: "Gigi umum dan estetik", j: "Senin sampai Jumat", hari: [1, 2, 3, 4, 5] },
    { id: "arga", n: "drg. Arga Wijaya, Sp.Ort", p: "Behel dan aligner", j: "Selasa, Kamis, Sabtu", hari: [2, 4, 6] },
    { id: "mira", n: "drg. Mira Lestari, Sp.KGA", p: "Gigi anak", j: "Rabu, Jumat, Sabtu", hari: [3, 5, 6] }
  ];
  const WARNA = [
    { k: "A3", c: "#e7d3a6", o: 0, t: "Warna awal" },
    { k: "A2", c: "#efe0bb", o: .33, t: "Naik 1 tingkat, sering cukup dengan scaling" },
    { k: "A1", c: "#f4ebd2", o: .66, t: "Naik 2 tingkat, cerah dan tetap alami" },
    { k: "B1", c: "#faf5e8", o: 1, t: "Naik 3 tingkat, paling banyak dipilih" }
  ];
  const CICIL = [
    { id: "behel", n: "Behel", h: 7000000, foto: "behel", alt: "Model gigi dengan behel" },
    { id: "aligner", n: "Aligner", h: 18000000, foto: "aligner", alt: "Aligner bening dan kotaknya" },
    { id: "veneer", n: "Veneer 6 gigi", h: 15000000, foto: "panduan-warna", alt: "Panduan warna gigi" }
  ];
  const harga = r => (r.mulai ? "mulai " : "") + S.rupiah(r.h);

  /* ---------- rencana perawatan: dipakai peta gigi, kartu, dan janji ---------- */
  let rencana = baca("ks.rencana", []);
  const simpanRencana = () => { tulis("ks.rencana", rencana); renderRencana(); };
  const barisRencana = () => rencana.length ? rencana : [{ kunci: "periksa", n: "Pemeriksaan dan konsultasi", h: 150000 }];
  const totalRencana = () => barisRencana().reduce((s, r) => s + r.h, 0);
  const lunas = () => $('[name="jenis"]:checked').value === "lunas";
  const kini = () => lunas() ? totalRencana() : Math.min(100000, totalRencana());
  function tambahRencana(kunci, n, h) {
    if (!rencana.some(r => r.kunci === kunci)) rencana.push({ kunci, n, h });
    simpanRencana();
  }
  function renderRencana() {
    $("#daftarRencana").innerHTML = barisRencana().map(r => `<li><span>${esc(r.n)}</span><b>${S.rupiah(r.h)}</b>${rencana.length ? `<button type="button" data-hapus="${esc(r.kunci)}" aria-label="Hapus ${esc(r.n)}">×</button>` : ""}</li>`).join("");
    const sisa = totalRencana() - kini();
    $("#hitungRencana").innerHTML = `<li><span>Perkiraan total</span><b>${S.rupiah(totalRencana())}</b></li><li class="jumlah"><span>Bayar sekarang</span><b>${S.rupiah(kini())}</b></li>${sisa ? `<li><span>Sisa di klinik</span><b>${S.rupiah(sisa)}</b></li>` : ""}`;
    $$("[data-jumlah]").forEach(b => b.textContent = rencana.length);
    $$("[data-rencana]").forEach(b => { const ada = rencana.some(r => r.kunci === b.dataset.rencana); b.toggleAttribute("data-ada", ada); if (b.dataset.teks && !b.dataset.sibuk) b.textContent = ada ? "Sudah di rencana" : b.dataset.teks; });
  }
  $("#daftarRencana").onclick = e => { const b = e.target.closest("[data-hapus]"); if (b) { rencana = rencana.filter(r => r.kunci !== b.dataset.hapus); simpanRencana(); renderSaran(); renderPeta(); } };
  $$('[name="jenis"]').forEach(r => r.onchange = renderRencana);
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-rencana]");
    if (!b) return;
    const r = SEMUA.find(x => x.id === b.dataset.rencana);
    tambahRencana(r.id, r.n, r.h);
    if (!b.dataset.teks) { const t = b.textContent; b.textContent = "Sudah di rencana"; setTimeout(() => { b.textContent = t; }, 1300); }
  });

  /* ---------- peta gigi: 32 gigi digambar dari sudut lengkung rahang ---------- */
  const SUDUT = [6, 18, 30, 42, 54, 66, 77, 87];
  const BENTUK = [[32, 34, 9], [30, 32, 9], [30, 38, 13], [32, 33, 13], [32, 33, 13], [39, 39, 14], [37, 38, 14], [33, 35, 13]];
  const CX = 270, A = 196, B = 236, Yatas = 296, Ybawah = 344;
  const G = { pilih: "", keluhan: "" };
  const namaGigi = id => { const [r, s, i] = id.split("-"); return `${NAMA[+i][0].toUpperCase()}${NAMA[+i].slice(1)} ${r} ${s}`; };
  const gambarGigi = (r, s, i) => {
    const q = SUDUT[i] * Math.PI / 180, sx = s === "kanan" ? -1 : 1, sy = r === "atas" ? -1 : 1;
    const x = CX + sx * A * Math.sin(q), y = (r === "atas" ? Yatas : Ybawah) + sy * B * Math.cos(q);
    const rot = Math.atan2(sx * A * Math.sin(q) / (A * A), -sy * B * Math.cos(q) / (B * B)) * 180 / Math.PI;
    const [w, h, rad] = BENTUK[i], alur = i < 3 ? "" : i < 5 ? `<path d="M${-w / 4} 0h${w / 2}"/>` : `<path d="M${-w / 3} -2q${w / 3} 8 ${w * .66} 0M0 ${-h / 3}v${h * .66}"/>`;
    return `<g class="gg" data-gigi="${r}-${s}-${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})" tabindex="0" role="button" aria-label="${namaGigi(`${r}-${s}-${i}`)}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rad}"/><g class="gg__alur">${alur}</g></g>`;
  };
  let isi = "";
  for (const r of ["atas", "bawah"]) for (const s of ["kanan", "kiri"]) for (let i = 7; i >= 0; i--) isi += gambarGigi(r, s, i);
  const busur = (y, sy) => `M${CX - A * Math.sin(1.56)} ${y + sy * B * Math.cos(1.56)} A${A} ${B} 0 1 ${sy < 0 ? 1 : 0} ${CX + A * Math.sin(1.56)} ${y + sy * B * Math.cos(1.56)}`;
  $("#mulut").innerHTML = `<svg viewBox="30 30 480 580" aria-label="Peta 32 gigi"><path class="gusi" d="${busur(Yatas, -1)}"/><path class="gusi" d="${busur(Ybawah, 1)}"/>${isi}<text x="${CX}" y="306" text-anchor="middle">Atas</text><text x="${CX}" y="346" text-anchor="middle">Bawah</text></svg>`;
  const pilihGigi = id => { G.pilih = id; G.keluhan = ""; renderPeta(); renderSaran(); };
  $("#mulut").onclick = e => { const g = e.target.closest("[data-gigi]"); if (g) pilihGigi(g.dataset.gigi); };
  $("#mulut").onkeydown = e => { const g = e.target.closest?.("[data-gigi]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pilihGigi(g.dataset.gigi); } };
  function renderPeta() {
    $$("[data-gigi]").forEach(g => {
      g.classList.toggle("pilih", g.dataset.gigi === G.pilih);
      g.classList.toggle("rencana", rencana.some(r => r.kunci.startsWith(g.dataset.gigi + ":")));
    });
  }
  function saranDari(k) {
    if (k.id === "nyeri" && G.pilih.endsWith("-7")) return { r: BARIS.find(x => x.id === "bungsu"), ket: "Gigi bungsu yang sakit sering tumbuh miring. Dokter mengecek lewat rontgen." };
    return { r: SEMUA.find(x => x.id === k.r), ket: k.ket };
  }
  function renderSaran() {
    const w = $("#saran");
    if (!G.pilih) { w.innerHTML = `<img src="img/senyum.jpg" alt="Pasien tersenyum di kursi periksa" width="1200" height="896"><h3>Mulai dari satu gigi</h3><p>Ketuk gigi di peta. Kamu akan melihat saran perawatan dan perkiraan harganya.</p><button class="tautan" type="button" id="langsungPeriksa">Tidak tahu yang mana? Periksa menyeluruh saja</button>`; $("#langsungPeriksa").onclick = () => { tambahRencana("periksa", "Pemeriksaan dan konsultasi", 150000); $("#janji").scrollIntoView(); }; return; }
    const k = KELUHAN.find(x => x.id === G.keluhan), s = k && saranDari(k), kunci = s && `${G.pilih}:${s.r.id}`;
    w.innerHTML = `<h3>${namaGigi(G.pilih)}</h3><p>Apa yang kamu rasakan?</p><div class="keluhan">${KELUHAN.map(x => `<button type="button" data-keluhan="${x.id}" aria-pressed="${x.id === G.keluhan}">${x.n}</button>`).join("")}</div>
      ${s ? `<div class="saran__hasil"><p>${s.ket}</p><p class="saran__nama">${s.r.n}</p><p class="saran__harga">${harga(s.r)}</p><button class="tombol tombol--penuh" type="button" id="tambahGigi">${rencana.some(r => r.kunci === kunci) ? "Sudah di rencana" : "Tambah ke rencana"}</button><p class="kecil">Saran awal, bukan diagnosis.</p></div>` : ""}`;
    if (s) $("#tambahGigi").onclick = () => { tambahRencana(kunci, `${s.r.n}, ${namaGigi(G.pilih).toLowerCase()}`, s.r.h); renderPeta(); renderSaran(); };
  }
  $("#saran").addEventListener("click", e => { const b = e.target.closest("[data-keluhan]"); if (b) { G.keluhan = b.dataset.keluhan; renderSaran(); } });

  /* ---------- perawatan ---------- */
  $("#kartuRawat").innerHTML = RAWAT.map(r => `<li><img src="img/${r.foto}.jpg" alt="${r.n}" loading="lazy" width="900" height="672"><div><h3>${r.n}</h3><p>${r.f}</p><p class="kartu-rawat__harga">${harga(r)}</p><button class="tombol tombol--garis tombol--penuh" type="button" data-rencana="${r.id}" data-teks="Tambah ke rencana">Tambah ke rencana</button></div></li>`).join("");
  $("#barisRawat").innerHTML = BARIS.map(r => `<li><div><b>${r.n}</b><span>${r.f}</span></div><strong>${harga(r)}</strong><button type="button" data-rencana="${r.id}" aria-label="Tambah ${r.n} ke rencana">Tambah</button></li>`).join("");

  /* ---------- warna gigi ---------- */
  let warna = 3;
  $("#tabWarna").innerHTML = WARNA.map((w, i) => `<button type="button" data-warna="${i}" aria-label="Warna ${w.k}"><i style="background:${w.c}"></i>${w.k}</button>`).join("");
  $("#tabWarna").onclick = e => { const b = e.target.closest("[data-warna]"); if (b) { warna = +b.dataset.warna; renderWarna(); } };
  function renderWarna() {
    $("#fotoSesudah").style.opacity = WARNA[warna].o;
    $("#warnaHasil").textContent = WARNA[warna].t;
    $$("[data-warna]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.warna === warna));
  }

  /* ---------- cicilan ---------- */
  const C = { id: "behel", tenor: 12 };
  $("#pilihCicil").innerHTML = CICIL.map(c => `<button type="button" data-cicil="${c.id}">${c.n}</button>`).join("");
  $("#pilihTenor").innerHTML = [6, 12, 18, 24].map(t => `<button type="button" data-tenor="${t}">${t} bulan</button>`).join("");
  $("#pilihCicil").onclick = e => { const b = e.target.closest("[data-cicil]"); if (b) { C.id = b.dataset.cicil; renderCicil(); } };
  $("#pilihTenor").onclick = e => { const b = e.target.closest("[data-tenor]"); if (b) { C.tenor = +b.dataset.tenor; renderCicil(); } };
  $("#fDp").oninput = renderCicil;
  function renderCicil() {
    const c = CICIL.find(x => x.id === C.id), dp = Math.round(c.h * $("#fDp").value / 100), bln = Math.ceil((c.h - dp) / C.tenor / 1000) * 1000, f = $("#fotoCicil");
    $("#dpNilai").textContent = `${$("#fDp").value}% (${S.rupiah(dp)})`;
    $("#perBulan").textContent = S.rupiah(bln);
    $("#cicilRinci").textContent = `per bulan selama ${C.tenor} bulan, dari harga ${S.rupiah(c.h)}. Tanpa bunga.`;
    if (!f.src.endsWith(`${c.foto}.jpg`)) { f.src = `img/${c.foto}.jpg`; f.alt = c.alt; }
    $$("[data-cicil]").forEach(b => b.setAttribute("aria-pressed", b.dataset.cicil === C.id));
    $$("[data-tenor]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.tenor === C.tenor));
  }
  $("#konsulCicil").onclick = () => {
    const c = CICIL.find(x => x.id === C.id);
    tambahRencana(`konsul-${c.id}`, `Konsultasi ${c.n.toLowerCase()}, cicilan ${C.tenor} bulan`, 150000);
    if (C.id !== "veneer") J.dokter = "arga";
    renderJanji(); $("#janji").scrollIntoView();
  };

  /* ---------- dokter dan janji ---------- */
  const J = { dokter: "", hari: "", jam: "" };
  const kunci = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtHari = t => new Date(t + "T12:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const FOTO = { rania: "drg-rania", arga: "drg-arga", mira: "drg-mira" };
  $("#daftarDokter").innerHTML = DOKTER.map(d => `<li><img src="img/${FOTO[d.id]}.jpg" alt="${d.n}" loading="lazy" width="1000" height="747"><h3>${d.n}</h3><p>${d.p}</p><p class="kecil">${d.j}</p><button class="tautan" type="button" data-pilih-dokter="${d.id}">Pilih dokter ini</button></li>`).join("");
  $("#daftarDokter").onclick = e => { const b = e.target.closest("[data-pilih-dokter]"); if (b) { J.dokter = b.dataset.pilihDokter; J.hari = J.jam = ""; renderJanji(); $("#janji").scrollIntoView(); } };
  const hariBisa = () => { // sepuluh hari ke depan, Minggu tutup, mengikuti jadwal dokter
    const out = [], d = new Date(), dok = DOKTER.find(x => x.id === J.dokter);
    for (let i = 0; i < 14 && out.length < 8; i++) { if (d.getDay() !== 0 && (!dok || dok.hari.includes(d.getDay()))) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  };
  const jamBisa = h => {
    const lewat = h === kunci(new Date()) ? new Date().getHours() : 0, out = [];
    for (let j = 9; j <= 19; j++) if (j > lewat) out.push(`${String(j).padStart(2, "0")}.00`);
    return out;
  };
  function renderJanji() {
    const hari = hariBisa();
    if (!hari.some(d => kunci(d) === J.hari)) J.hari = J.jam = "";
    const jam = J.hari ? jamBisa(J.hari) : [];
    if (!jam.includes(J.jam)) J.jam = "";
    $("#pilihDokter").innerHTML = [{ id: "", n: "Siapa saja" }, ...DOKTER].map(d => `<button type="button" data-dok="${d.id}" aria-pressed="${d.id === J.dokter}">${d.n}</button>`).join("");
    $("#pilihHari").innerHTML = hari.map(d => { const k = kunci(d); return `<button class="hari" type="button" data-hari="${k}" aria-pressed="${k === J.hari}">${d.toLocaleDateString("id-ID", { weekday: "short" })}<b>${d.getDate()}</b></button>`; }).join("");
    $("#pilihJam").innerHTML = !J.hari ? `<p class="kecil">Pilih hari dulu.</p>` : jam.length ? jam.map(j => `<button type="button" data-jam="${j}" aria-pressed="${j === J.jam}">${j}</button>`).join("") : `<p class="kecil">Jam hari ini sudah habis. Pilih hari lain.</p>`;
  }
  $("#pilihDokter").onclick = e => { const b = e.target.closest("[data-dok]"); if (b) { J.dokter = b.dataset.dok; renderJanji(); } };
  $("#pilihHari").onclick = e => { const b = e.target.closest("[data-hari]"); if (b) { J.hari = b.dataset.hari; renderJanji(); } };
  $("#pilihJam").onclick = e => { const b = e.target.closest("[data-jam]"); if (b) { J.jam = b.dataset.jam; renderJanji(); } };
  $("#sakitHariIni").onclick = () => {
    J.dokter = "";
    for (const d of hariBisa()) { const k = kunci(d), jam = jamBisa(k); if (jam.length) { J.hari = k; J.jam = jam[0]; break; } }
    renderJanji();
    $("#sakitPesan").textContent = `Jam terdekat: ${fmtHari(J.hari)}, ${J.jam} WIB. Tinggal isi nama.`;
  };
  $("#formJanji").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNama").value.trim(), g = $("#galat");
    g.textContent = !J.hari || !J.jam ? "Pilih hari dan jam dulu." : !nama ? "Isi nama dulu." : "";
    if (g.textContent) return;
    bukaKasir(nama);
  });

  /* ---------- kasir: WhatsApp hanya terbuka dari layar berhasil ---------- */
  const CATAT = "Sudah membayar? Tekan Cek pembayaran. WhatsApp baru terbuka kalau pembayaran berhasil. Mode contoh: pembayaran selalu dianggap berhasil dan tidak ada uang yang diproses.";
  const kasir = $("#kasir"); let kode = "", detik = 0, timer = 0, K = null;
  const akun = rows => `<ul class="akun">${rows.map(([n, no]) => `<li><span>${n}</span><b>${no}</b><button type="button" data-salin="${no.replace(/\s/g, "")}">Salin</button></li>`).join("")}</ul><p class="kecil">a.n. Klinik Senyum. Nomor ini contoh. Transfer tepat ${S.rupiah(kini())}.</p>`;
  function qr() { // pola tetap, bukan kode yang bisa dipindai
    const kotak = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z" fill-rule="evenodd"/>`;
    let out = kotak(0, 0) + kotak(14, 0) + kotak(0, 14);
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if ((x * 7 + y * 13 + x * y) % 5 < 2) out += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return out;
  }
  const BAYAR = {
    "QRIS": () => `<div class="qris"><svg viewBox="0 0 21 21" role="img" aria-label="Contoh kode QRIS">${qr()}</svg><div><b>Klinik Senyum</b><p>Pindai dengan aplikasi bank atau e-wallet apa pun, lalu masukkan ${S.rupiah(kini())}.</p><p>Kode ini contoh. Di website asli diganti QRIS milik klinik.</p></div></div>`,
    "E-wallet": () => akun([["GoPay", "0812 0000 0000"], ["OVO", "0812 0000 0000"], ["DANA", "0812 0000 0000"], ["ShopeePay", "0812 0000 0000"]]),
    "M-banking": () => akun([["BCA", "000 000 0000"], ["Mandiri", "000 000 000 0000"], ["BRI", "0000 00 000000 00 0"], ["BNI", "000 000 0000"]])
  };
  const renderBayar = () => { $("#bayarBox").innerHTML = BAYAR[$('[name="bayar"]:checked').value](); };
  $$('[name="bayar"]').forEach(r => r.onchange = renderBayar);
  $("#bayarBox").onclick = async e => {
    const b = e.target.closest("[data-salin]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.salin); b.textContent = "Tersalin"; setTimeout(() => { b.textContent = "Salin"; }, 1500); } catch {}
  };
  function tik() {
    const habis = detik <= 0;
    $("#kasirWaktu").textContent = habis ? "Waktu habis" : `Bayar dalam ${String(Math.floor(detik / 60)).padStart(2, "0")}:${String(detik % 60).padStart(2, "0")}`;
    $("#sudahBayar").disabled = habis;
    if (habis) { clearInterval(timer); $("#kasirCatat").textContent = "Waktu bayar habis. Tutup jendela ini, lalu tekan Lanjut bayar lagi."; }
    detik--;
  }
  function bukaKasir(nama) {
    const r = barisRencana(), dok = DOKTER.find(d => d.id === J.dokter)?.n || "Dokter yang bertugas", nilai = kini(), total = totalRencana(), cat = $("#fCatatan").value.trim(), hari = J.hari, jam = J.jam, jenis = lunas() ? "Lunas" : "DP";
    K = { nilai, hari, jam, dok, ket: r.map(x => x.n).join(", "), teks: (k, lewat) => `Halo Klinik Senyum, saya sudah bayar untuk janji ini.\n\nKode: *${k}*\nNama: ${nama}\nHari: ${fmtHari(hari)}\nJam: ${jam} WIB\nDokter: ${dok}\n\n` + r.map(x => `- ${x.n}: ${S.rupiah(x.h)}`).join("\n") + `\n\n*Perkiraan total: ${S.rupiah(total)}*\n*Dibayar (${jenis}): ${S.rupiah(nilai)}*\nLewat: ${lewat}${cat ? `\nCatatan: ${cat}` : ""}\n\nMohon konfirmasi jadwalnya.` };
    kode = S.kode("KS", 4); detik = 900;
    $("#kasirJudul").textContent = lunas() ? "Bayar lunas" : "Bayar DP";
    $("#kasirKode").textContent = kode; $("#kasirNilai").textContent = S.rupiah(nilai); $("#kasirCatat").textContent = CATAT;
    $("#kasirBayar").hidden = false; $("#kasirBerhasil").hidden = true; $("#sudahBayar").textContent = "Cek pembayaran";
    renderBayar(); clearInterval(timer); tik(); timer = setInterval(tik, 1000);
    kasir.showModal();
  }
  kasir.addEventListener("close", () => clearInterval(timer));
  $("#kasirTutup").onclick = () => kasir.close();
  // shortcut: situs statis tidak bisa membaca uang masuk, jadi mode contoh selalu berhasil.
  // Di website asli fungsi ini menanyakan status ke backend payment gateway (Midtrans/Xendit).
  const cekBayar = () => new Promise(ok => setTimeout(() => ok(true), 1500));
  $("#sudahBayar").onclick = async () => {
    const b = $("#sudahBayar"), k = kode;
    clearInterval(timer); b.disabled = true; b.textContent = "Mengecek pembayaran...";
    const berhasil = await cekBayar();
    if (k !== kode || !kasir.open) return;
    if (!berhasil) { b.disabled = false; b.textContent = "Cek pembayaran"; $("#kasirCatat").textContent = "Pembayaran belum masuk. Coba cek lagi sebentar."; return; }
    $("#okNilai").textContent = $("#kasirNilai").textContent; $("#okKode").textContent = kode;
    $("#kasirBayar").hidden = true; $("#kasirBerhasil").hidden = false; $("#kasirWaktu").textContent = "";
    K.lewat = $('[name="bayar"]:checked').value;
    const riwayat = baca("ks.riwayat", {}); riwayat[kode] = { ket: K.ket, hari: K.hari, jam: K.jam, dok: K.dok, t: Date.now() }; tulis("ks.riwayat", riwayat);
    rencana = []; simpanRencana(); renderPeta(); G.pilih = ""; renderSaran(); J.hari = J.jam = ""; renderJanji();
    cek(kode); $("#fCek").value = kode;
  };
  $("#keWa").onclick = () => {
    // contoh: tanpa nomor tujuan, di website asli diganti nomor klinik
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(K.teks(kode, K.lewat))}`, "_blank", "noopener");
    kasir.close();
  };
  $("#keIcs").onclick = () => { // berkas kalender supaya pengingat tetap ada tanpa akun
    const d = new Date(K.hari + "T12:00"); d.setMonth(d.getMonth() + 6);
    const t = kunci(d).replace(/-/g, ""), ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Klinik Senyum//ID", "BEGIN:VEVENT", `UID:${kode}@klinik-senyum`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`, `DTSTART;VALUE=DATE:${t}`, "SUMMARY:Kontrol gigi di Klinik Senyum", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "kontrol-klinik-senyum.ics"; a.click(); URL.revokeObjectURL(a.href);
    $("#keIcs").textContent = "Pengingat tersimpan";
  };

  /* ---------- cek janji ---------- */
  const TAHAP = ["Janji diterima", "Dikonfirmasi admin", "Pengingat H-1 dikirim", "Selesai diperiksa"];
  const CONTOH = "KS-CONTOH"; let tCek = 0;
  function cek(k) {
    const id = k.trim().toUpperCase(), w = $("#hasilCek"); clearInterval(tCek);
    const r = id === CONTOH ? { ket: "Tambal gigi, geraham besar pertama bawah kanan", dok: "drg. Rania Putri", t: Date.now() - 90000 } : baca("ks.riwayat", {})[id];
    if (!r) { w.innerHTML = `<p>Kode <b>${esc(id)}</b> tidak ditemukan. Cek lagi penulisannya.</p>`; return; }
    const gambar = () => {
      const i = Math.min(TAHAP.length - 1, Math.floor((Date.now() - r.t) / 60000));
      w.innerHTML = `<h3>${esc(id)}</h3><p>${esc(r.ket)}</p><p>${esc(r.dok)}${r.hari ? `, ${fmtHari(r.hari)} ${r.jam} WIB` : ""}</p><ol class="tahap">${TAHAP.map((l, n) => `<li class="${n < i ? "lewat" : n === i ? "kini" : ""}"${n === i ? ' aria-current="step"' : ""}>${l}</li>`).join("")}</ol><p class="kecil">Mode contoh: status maju sendiri tiap satu menit.</p>`;
    };
    gambar(); tCek = setInterval(gambar, 15000);
  }
  $("#formCek").addEventListener("submit", e => { e.preventDefault(); if ($("#fCek").value.trim()) cek($("#fCek").value); });

  /* ---------- gerak: video tambal gigi mengikuti scroll ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, potong = v => Math.max(0, Math.min(1, v));
  const FRAME = 95, seksi = $("#gigi"), kanvas = $("#kanvas"), kuas = kanvas.getContext("2d"), bingkai = [];
  let mau = reduce ? FRAME - 1 : 0, antre = false;
  const gambar = i => { // kalau frame belum sampai, tampilkan frame terdekat sebelumnya
    for (let k = i; k >= 0; k--) if (bingkai[k]?.complete && bingkai[k].naturalWidth) { kuas.drawImage(bingkai[k], 0, 0, 1280, 720); return; }
  };
  const muatFrame = i => {
    if (bingkai[i]) return;
    const im = bingkai[i] = new Image();
    im.onload = () => { if (i <= mau) gambar(mau); };
    im.src = `img/gigi/${String(i + 1).padStart(3, "0")}.webp`;
  };
  muatFrame(mau);
  if (!reduce) new IntersectionObserver((es, o) => { // frame baru diunduh saat bagian ini mendekat
    if (es[0].isIntersecting) { o.disconnect(); for (let i = 1; i < FRAME; i++) muatFrame(i); }
  }, { rootMargin: "120% 0px" }).observe(seksi);
  function gerak() {
    antre = false;
    const b = seksi.getBoundingClientRect(), p = potong(-b.top / (b.height - innerHeight));
    if (!reduce) { mau = Math.round(potong((p - .03) / .9) * (FRAME - 1)); gambar(mau); }
    const j = $("#janji").getBoundingClientRect(), l = $("#lokasi").getBoundingClientRect();
    $("#apung").classList.toggle("sembunyi", (j.top < innerHeight * .7 && j.bottom > innerHeight * .3) || l.top < innerHeight * .7);
  }
  addEventListener("scroll", () => { if (!antre) { antre = true; requestAnimationFrame(gerak); } }, { passive: true });

  /* ---------- muncul saat di-scroll ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("tampak"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".peta__mulut, .saran, .perawatan > h2, .kartu-rawat li, .baris-rawat, .warna__foto, .warna__isi, .cicilan__isi, .tenang > *, .dokter > h2, .dokter li, .janji__kiri, .rencana, .cek > div, .lokasi > *").forEach(el => { el.classList.add("muncul"); io.observe(el); });
  }

  renderPeta(); renderSaran(); renderWarna(); renderCicil(); renderJanji(); renderRencana(); cek(CONTOH); gerak();
})();
