/* Salon Ayu: papan harga di cermin, kartu janji, kirim ke WhatsApp salon.
   shortcut: jadwal penata dan DP dicek manual oleh admin; slot real-time butuh backend + payment gateway. */
(() => {
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const LAYANAN = [
    { g: "Rambut", id: "potong", n: "Potong dan blow", f: "Konsultasi bentuk wajah dulu, baru digunting", h: 120000, d: 60, foto: "potong", pos: "62% 50%" },
    { g: "Rambut", id: "creambath", n: "Creambath", f: "Pijat kepala dan bahu, masker rambut", h: 95000, d: 60, foto: "creambath", pos: "58% 50%" },
    { g: "Rambut", id: "warna", n: "Warna rambut", f: "Harga menyesuaikan panjang rambut", h: 450000, d: 150, mulai: true, foto: "warna-cokelat", pos: "54% 50%" },
    { g: "Wajah", id: "facial", n: "Facial", f: "Bersih pori, masker, pijat wajah", h: 180000, d: 60, foto: "facial", pos: "48% 50%" },
    { g: "Wajah", id: "rias", n: "Rias acara", f: "Wisuda, lamaran, kondangan", h: 350000, d: 60, foto: "makeup", pos: "50% 50%" },
    { g: "Wajah", id: "hijab", n: "Tata hijab", f: "Lipit rapi, kuat sampai acara selesai", h: 100000, d: 30, foto: "hijab", pos: "64% 50%" },
    { g: "Pengantin", id: "pengantin", n: "Paket pengantin", f: "Rias, sanggul, dan kebaya fitting sekali", h: 3500000, d: 180, mulai: true, foto: "bridal", pos: "66% 50%" }
  ];
  const PENATA = [
    { id: "sari", n: "Sari", p: "Potong dan warna rambut", foto: "penata-sari", pos: "50% 30%" },
    { id: "raka", n: "Raka", p: "Rias acara dan pengantin", foto: "penata-raka", pos: "62% 30%" }
  ];
  const PASANG = {
    rambut: { a: "sebelum-rambut", b: "sesudah-rambut", z: 1.42, ket: "Rambut lepek dan tipis, keluar dengan gelombang lembut dan kilau yang tahan sampai malam." },
    makeup: { a: "sebelum-makeup", b: "sesudah-makeup", z: 1.12, ket: "Rias tipis yang tetap kelihatan seperti wajahmu sendiri, hanya lebih segar." }
  };
  const BAYAR = {
    "QRIS": () => `<div class="qris"><svg viewBox="0 0 21 21" role="img" aria-label="Contoh kode QRIS">${qr()}</svg><div><b>Salon Ayu</b><p>Pindai dengan aplikasi bank atau e-wallet apa pun, lalu masukkan ${S.rupiah(kini())}.</p><p>Kode ini contoh. Di website asli diganti QRIS milik salon.</p></div></div>`,
    "E-wallet": () => akun([["GoPay", "0812 0000 0000"], ["OVO", "0812 0000 0000"], ["DANA", "0812 0000 0000"], ["ShopeePay", "0812 0000 0000"]]),
    "M-banking": () => akun([["BCA", "000 000 0000"], ["Mandiri", "000 000 000 0000"], ["BRI", "0000 00 000000 00 0"], ["BNI", "000 000 0000"]])
  };
  const akun = rows => `<ul class="akun">${rows.map(([n, no]) => `<li><span>${n}</span><b>${no}</b><button type="button" data-salin="${no.replace(/\s/g, "")}">Salin</button></li>`).join("")}</ul><p class="catat">a.n. Salon Ayu. Nomor ini contoh. Transfer tepat ${S.rupiah(kini())}.</p>`;
  function qr() { // pola tetap, bukan kode yang bisa dipindai
    let out = "";
    const kotak = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z" fill-rule="evenodd"/>`;
    out += kotak(0, 0) + kotak(14, 0) + kotak(0, 14);
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if ((x * 7 + y * 13 + x * y) % 5 < 2) out += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return out;
  }

  /* ---------- kartu janji ---------- */
  const muat = () => { try { return JSON.parse(localStorage.getItem("sa.janji")) || {}; } catch { return {}; } };
  const J = { pilih: [], penata: "", hari: "", jam: "", ...muat() };
  const simpan = () => { try { localStorage.setItem("sa.janji", JSON.stringify(J)); } catch {} };
  const dipilih = () => LAYANAN.filter(l => J.pilih.includes(l.id));
  const total = () => dipilih().reduce((s, l) => s + l.h, 0);
  const dp = () => Math.ceil(total() * .3 / 5000) * 5000;
  const lunas = () => $('[name="jenis"]:checked').value === "lunas";
  const kini = () => lunas() ? total() : dp();
  const durasi = () => dipilih().reduce((s, l) => s + l.d, 0);
  const lama = m => [m >= 60 ? `${Math.floor(m / 60)} jam` : "", m % 60 ? `${m % 60} menit` : ""].filter(Boolean).join(" ");
  const harga = l => (l.mulai ? "mulai " : "") + S.rupiah(l.h);
  const fmtHari = t => new Date(t + "T12:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const kunci = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // delapan hari buka berikutnya, Senin libur
  const HARI = (() => {
    const out = [], d = new Date();
    while (out.length < 8) { if (d.getDay() !== 1) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  })();
  if (!HARI.some(d => kunci(d) === J.hari)) J.hari = J.jam = "";

  const TUTUP = 20;
  function jamBisa() { // jam mulai yang selesai sebelum tutup, dan belum lewat kalau hari ini
    const lewat = J.hari === kunci(new Date()) ? new Date().getHours() : 0, d = durasi() / 60, out = [];
    for (let j = 10; j + Math.max(d, 1) <= TUTUP; j++) if (j > lewat) out.push(`${String(j).padStart(2, "0")}.00`);
    return out;
  }

  function render() {
    const r = dipilih();
    $$("[data-layanan]").forEach(b => {
      const on = J.pilih.includes(b.dataset.layanan);
      b.setAttribute("aria-pressed", on); b.textContent = on ? "Di kartu" : "Tambah";
    });
    $$("[data-penata]").forEach(b => {
      const on = J.penata === b.dataset.penata;
      b.setAttribute("aria-pressed", on); b.lastElementChild.textContent = on ? "Dipilih" : `Pilih ${b.dataset.nama}`;
    });
    $("#hari").innerHTML = HARI.map(d => { const k = kunci(d); return `<button type="button" data-hari="${k}" aria-pressed="${J.hari === k}"><small>${d.toLocaleDateString("id-ID", { weekday: "short" })}</small><b>${d.getDate()}</b></button>`; }).join("");
    const jam = J.hari ? jamBisa() : [];
    if (!jam.includes(J.jam)) J.jam = "";
    $("#jam").innerHTML = !J.hari ? `<p class="catat">Pilih hari dulu.</p>` : jam.length ? jam.map(j => `<button type="button" data-jam="${j}" aria-pressed="${J.jam === j}">${j}</button>`).join("") : `<p class="catat">Hari ini sudah tidak cukup waktu. Pilih hari lain.</p>`;
    $("#kNama").textContent = $("#fNama").value.trim() || "—";
    $("#kHari").textContent = J.hari ? fmtHari(J.hari) : "—";
    $("#kJam").textContent = J.jam ? `${J.jam} WIB${r.length ? ` · ${lama(durasi())}` : ""}` : "—";
    $("#kPenata").textContent = PENATA.find(p => p.id === J.penata)?.n || "Siapa saja";
    $("#kList").innerHTML = r.length ? r.map(l => `<li><span>${esc(l.n)}</span><b>${harga(l)}</b><button type="button" data-layanan="${l.id}" aria-label="Hapus ${esc(l.n)}">×</button></li>`).join("") : `<li class="kosong">Belum ada layanan. <a href="#layanan">Pilih di papan harga</a>.</li>`;
    $("#kTotal").textContent = S.rupiah(total());
    $("#kBayarLabel").textContent = lunas() ? "Bayar lunas" : "DP 30%";
    $("#kDp").textContent = S.rupiah(kini());
    $("#apung").hidden = !r.length;
    $("#apungTeks").textContent = `${r.length} layanan · ${S.rupiah(total())}`;
    bayar(); simpan();
  }
  function bayar() { $("#bayarBox").innerHTML = BAYAR[$('[name="bayar"]:checked').value](); }

  /* ---------- papan harga di cermin ---------- */
  $("#papan").innerHTML = [...new Set(LAYANAN.map(l => l.g))].map(g => `<section><h3>${g}</h3>${LAYANAN.filter(l => l.g === g).map(l => `
    <article class="baris" data-lihat="${l.id}" tabindex="0">
      <div><h4>${esc(l.n)}</h4><p>${esc(l.f)} · ${lama(l.d)}</p></div>
      <b>${harga(l)}</b>
      <button class="tambah" type="button" data-layanan="${l.id}" aria-pressed="false">Tambah</button>
    </article>`).join("")}</section>`).join("");
  const kaca = $("#kaca");
  function lihat(id) {
    const l = LAYANAN.find(x => x.id === id);
    $$(".baris").forEach(b => b.classList.toggle("aktif", b.dataset.lihat === id));
    if (kaca.dataset.id === id) return;
    kaca.dataset.id = id; kaca.classList.add("ganti");
    setTimeout(() => { kaca.src = `img/${l.foto}.jpg`; kaca.alt = l.n; kaca.style.objectPosition = l.pos; $("#kacaKet").textContent = `${l.n}, ${harga(l)}`; kaca.classList.remove("ganti"); }, 180);
  }
  $("#papan").addEventListener("pointerover", e => { const b = e.target.closest("[data-lihat]"); if (b && e.pointerType === "mouse") lihat(b.dataset.lihat); });
  $("#papan").addEventListener("focusin", e => { const b = e.target.closest("[data-lihat]"); if (b) lihat(b.dataset.lihat); });
  // di HP cermin ikut berganti sesuai baris di tengah layar
  const ioBaris = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) lihat(x.target.dataset.lihat); }), { rootMargin: "-55% 0px -35% 0px" });
  if (matchMedia("(max-width: 900px)").matches) $$(".baris").forEach(b => ioBaris.observe(b));

  /* ---------- penata ---------- */
  $("#penataList").innerHTML = PENATA.map(p => `<button type="button" class="orang" data-penata="${p.id}" data-nama="${p.n}" aria-pressed="false">
    <img src="img/${p.foto}.jpg" alt="${p.n}, penata Salon Ayu" width="1000" height="1250" loading="lazy" style="object-position:${p.pos}">
    <span><b>${p.n}</b><small>${p.p}</small></span><em>Pilih ${p.n}</em></button>`).join("");

  /* ---------- sebelum / sesudah ---------- */
  const geser = $("#geser");
  $("#geserIn").addEventListener("input", e => geser.style.setProperty("--x", e.target.value + "%"));
  function pasang(k) {
    const P = PASANG[k];
    $("#sebelum").src = `img/${P.a}.jpg`; $("#sesudah").src = `img/${P.b}.jpg`; $("#hasilKet").textContent = P.ket; geser.style.setProperty("--z", P.z);
    $$("[data-pasang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.pasang === k));
  }

  /* ---------- klik ---------- */
  document.addEventListener("click", e => {
    const t = e.target;
    const l = t.closest("[data-layanan]");
    if (l) { const id = l.dataset.layanan; J.pilih = J.pilih.includes(id) ? J.pilih.filter(x => x !== id) : [...J.pilih, id]; return render(); }
    const b = t.closest("[data-lihat]"); if (b) return lihat(b.dataset.lihat);
    const p = t.closest("[data-penata]"); if (p) { J.penata = J.penata === p.dataset.penata ? "" : p.dataset.penata; return render(); }
    const h = t.closest("[data-hari]"); if (h) { J.hari = h.dataset.hari; return render(); }
    const j = t.closest("[data-jam]"); if (j) { J.jam = j.dataset.jam; return render(); }
    const k = t.closest("[data-pasang]"); if (k) return pasang(k.dataset.pasang);
    const c = t.closest("[data-salin]");
    if (c) navigator.clipboard?.writeText(c.dataset.salin).then(() => { c.textContent = "Tersalin"; setTimeout(() => c.textContent = "Salin", 1500); });
  });
  $$('[name="bayar"]').forEach(r => r.onchange = bayar);
  $$('[name="jenis"]').forEach(r => r.onchange = render);
  $("#fNama").addEventListener("input", () => { $("#kNama").textContent = $("#fNama").value.trim() || "—"; });

  /* ---------- kirim ke salon ---------- */
  $("#form").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNama").value.trim(), r = dipilih(), g = $("#galat");
    g.textContent = !r.length ? "Pilih layanan dulu di papan harga." : !J.hari ? "Pilih hari dulu." : !J.jam ? "Pilih jam dulu." : !nama ? "Isi nama dulu." : "";
    if (g.textContent) return;
    bukaKasir();
  });

  /* ---------- kasir: batas waktu menjaga jam yang dipilih selama membayar ---------- */
  const kasir = $("#kasir"); let kode = "", detik = 0, timer = 0;
  function tik() {
    const habis = detik <= 0;
    $("#kasirWaktu").textContent = habis ? "Waktu habis" : `Bayar dalam ${String(Math.floor(detik / 60)).padStart(2, "0")}:${String(detik % 60).padStart(2, "0")}`;
    $("#sudahBayar").disabled = habis;
    if (habis) { clearInterval(timer); $("#kasirCatat").textContent = "Waktu bayar habis. Tutup jendela ini, lalu tekan Lanjut bayar lagi."; }
    detik--;
  }
  function bukaKasir() {
    kode = S.kode("SA", 4); detik = 900;
    $("#kasirKode").textContent = kode;
    $("#kasirJenis").textContent = lunas() ? "lunas" : "DP 30%";
    $("#kasirNilai").textContent = S.rupiah(kini());
    $("#kasirCatat").textContent = "Lalu kirim bukti bayar di WhatsApp. Admin mengecek pembayaran dan jadwal penata, baru janji dikonfirmasi. Ini contoh, tidak ada uang yang diproses.";
    bayar(); clearInterval(timer); tik(); timer = setInterval(tik, 1000);
    kasir.showModal();
  }
  kasir.addEventListener("close", () => clearInterval(timer));
  $("#kasirTutup").onclick = () => kasir.close();
  $("#sudahBayar").onclick = () => {
    const r = dipilih(), cat = $("#fCatatan").value.trim(), kel = $('[name="bayar"]:checked').value, sisa = total() - kini();
    const teks = `Halo Salon Ayu, saya sudah bayar untuk janji ini.\n\nNo. janji: *${kode}*\nNama: ${$("#fNama").value.trim()}\nHari: ${fmtHari(J.hari)}\nJam: ${J.jam} WIB (${lama(durasi())})\nPenata: ${PENATA.find(p => p.id === J.penata)?.n || "Siapa saja"}\n\n` +
      r.map(l => `- ${l.n}: ${harga(l)}`).join("\n") + `\n\n*Perkiraan total: ${S.rupiah(total())}*\n*Dibayar (${lunas() ? "lunas" : "DP 30%"}): ${S.rupiah(kini())}*\nLewat: ${kel}${sisa ? `\nSisa di salon: ${S.rupiah(sisa)}` : ""}` +
      (cat ? `\nCatatan: ${cat}` : "") + "\n\nBukti bayar saya kirim setelah ini.";
    // contoh: tanpa nomor tujuan, di website asli diganti nomor salon
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(teks)}`, "_blank", "noopener");
    kasir.close();
  };

  /* ---------- cermin membuka saat digulir ---------- */
  const buka = $("#buka"), kecil = matchMedia("(prefers-reduced-motion: reduce)");
  function gulir() {
    const r = buka.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight + 64)));
    buka.style.setProperty("--p", kecil.matches ? 0 : (p * p * (3 - 2 * p)).toFixed(4));
  }
  addEventListener("scroll", gulir, { passive: true }); addEventListener("resize", gulir);

  /* ---------- muncul saat di-scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12 });
  document.documentElement.classList.add("js");
  $$(".baris, .ruang figure, .ruang__teks, .orang, .kartu").forEach((el, i) => { el.style.transitionDelay = (i % 3) * 60 + "ms"; io.observe(el); });

  // tombol apung tidak perlu saat kartu janji dan kontak sudah terlihat
  const ioApung = new IntersectionObserver(es => es.forEach(x => $("#apung").classList.toggle("sembunyi", x.isIntersecting)));
  ioApung.observe($("#janji")); new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) $("#apung").classList.add("sembunyi"); else if ($("#janji").getBoundingClientRect().top > innerHeight) $("#apung").classList.remove("sembunyi"); })).observe($(".lokasi"));

  pasang("rambut"); lihat("potong"); render(); gulir();
})();
