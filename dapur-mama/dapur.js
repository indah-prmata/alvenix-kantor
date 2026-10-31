/* Dapur Mama: susun rantang, paket, hitung porsi acara, langganan kantor, tanggal antar, kasir, lacak.
   shortcut: stok, jadwal, dan status masih contoh di browser; yang asli butuh backend + payment gateway. */
(() => {
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const baca = (k, awal) => { try { return JSON.parse(localStorage.getItem(k)) ?? awal; } catch { return awal; } };
  const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---------- data ---------- */
  const TINGKAT = [
    { id: "nasi", n: "Tingkat 1, nasi", isi: [
      { id: "nasi-putih", n: "Nasi putih", h: 6000 }, { id: "nasi-uduk", n: "Nasi uduk", h: 10000 }, { id: "nasi-kuning", n: "Nasi kuning", h: 12000 }] },
    { id: "lauk", n: "Tingkat 2, lauk", isi: [
      { id: "rendang", n: "Rendang", h: 38000 }, { id: "ayam-bakar", n: "Ayam bakar", h: 30000 }, { id: "semur", n: "Semur daging", h: 34000 }, { id: "gabus-pucung", n: "Gabus pucung", h: 36000 }, { id: "soto-betawi", n: "Soto Betawi", h: 32000 }] },
    { id: "sayur", n: "Tingkat 3, pendamping", isi: [
      { id: "sayur-asem", n: "Sayur asem", h: 9000 }, { id: "kangkung", n: "Tumis kangkung", h: 9000 }, { id: "tempe-orek", n: "Tempe orek", h: 8000 }] }
  ];
  const PAKET = [
    { id: "box", n: "Nasi box kantor", f: "Nasi uduk, ayam bakar, bihun, sambal, lalapan. Minimal 10 box.", h: 42000, min: 10, hari: 1, foto: "nasi-box", w: 500, t: 650 },
    { id: "kuning", n: "Nasi kuning syukuran", f: "Nasi kuning, ayam, kering kentang, telur. Minimal 20 porsi.", h: 45000, min: 20, hari: 2, foto: "nasi-kuning", w: 720, t: 720 },
    { id: "tumpeng", n: "Tumpeng", f: "Satu tumpeng untuk 15 orang, lengkap tujuh lauk.", h: 750000, min: 1, hari: 3, foto: "tumpeng", w: 720, t: 720, satuan: "tumpeng" },
    { id: "cicip", n: "Paket cicip", f: "Empat lauk untuk dua orang, supaya yakin sebelum pesan acara.", h: 95000, min: 1, hari: 1, foto: "meja-atas", w: 1500, t: 1125, satuan: "paket" }
  ];
  const ACARA = [
    { id: "rapat", n: "Rapat", faktor: 1, saran: "Nasi box per orang, lebih rapi untuk meja rapat.", h: 42000, hari: 1, paket: "Nasi box acara" },
    { id: "arisan", n: "Arisan", faktor: 1.1, saran: "Prasmanan kecil tiga lauk, dengan satu sayur.", h: 65000, hari: 2, paket: "Prasmanan kecil" },
    { id: "syukuran", n: "Syukuran", faktor: 1.1, saran: "Nasi kuning porsi ditambah satu tumpeng utama.", h: 58000, hari: 3, paket: "Paket syukuran" },
    { id: "ulang-tahun", n: "Ulang tahun", faktor: 1.1, saran: "Prasmanan dengan menu anak dan orang dewasa.", h: 72000, hari: 3, paket: "Prasmanan ulang tahun" },
    { id: "nikah", n: "Pernikahan kecil", faktor: 1.2, saran: "Prasmanan lengkap dengan meja, pelayan, dan peralatan.", h: 95000, hari: 7, paket: "Prasmanan pernikahan" }
  ];
  const MINGGU = [
    { h: "Senin", n: "Ayam bakar", s: "Sayur asem, sambal", foto: "ayam-bakar" },
    { h: "Selasa", n: "Semur daging", s: "Tumis kangkung", foto: "semur" },
    { h: "Rabu", n: "Soto Betawi", s: "Emping, acar", foto: "soto-betawi" },
    { h: "Kamis", n: "Gabus pucung", s: "Tempe orek", foto: "gabus-pucung" },
    { h: "Jumat", n: "Rendang", s: "Sayur asem, sambal", foto: "rendang" }
  ];
  const LAMA = [{ id: "minggu", n: "1 minggu", hari: 5, diskon: 0 }, { id: "bulan", n: "1 bulan", hari: 20, diskon: .1 }];
  const WILAYAH = [["Jakarta Selatan", 0], ["Jakarta Pusat", 15000], ["Jakarta Timur", 25000], ["Jakarta Barat", 25000], ["Jakarta Utara", 35000]];
  const LANGGANAN_HARGA = 38000;
  const nasi = (t, id) => TINGKAT.find(x => x.id === t).isi.find(x => x.id === id);

  /* ---------- pesanan ---------- */
  let cart = baca("dm.cart", []);
  const simpan = () => { tulis("dm.cart", cart); renderPesan(); };
  const subtotal = () => cart.reduce((s, c) => s + c.h * c.q, 0);
  const P = { tanggal: "", jam: "", wilayah: 0 };
  const ongkir = () => cart.length ? WILAYAH[P.wilayah][1] : 0;
  const total = () => subtotal() + ongkir();
  const lunas = () => $('[name="jenis"]:checked').value === "lunas";
  const kini = () => lunas() ? total() : Math.ceil(total() * .5 / 1000) * 1000;
  function tambah(item) {
    const c = cart.find(x => x.k === item.k);
    if (c) c.q += item.q; else cart.push(item);
    simpan();
  }
  const kilat = (b, t = "Masuk pesanan") => { const a = b.textContent; b.textContent = t; b.disabled = true; setTimeout(() => { b.textContent = a; b.disabled = false; }, 1100); };

  /* ---------- susun rantang ---------- */
  const R = { nasi: "nasi-uduk", lauk: "rendang", sayur: "sayur-asem", q: 1 };
  const hargaSatu = () => TINGKAT.reduce((s, t) => s + nasi(t.id, R[t.id]).h, 0);
  $("#pilihan").innerHTML = TINGKAT.map(t => `<div class="pilihan__baris"><p>${t.n}</p><div>${t.isi.map(i => `<button type="button" data-t="${t.id}" data-i="${i.id}"><img src="img/${i.id}.jpg" alt="" loading="lazy" width="96" height="96"><span>${i.n}</span><small>${S.rupiah(i.h)}</small></button>`).join("")}</div></div>`).join("");
  $("#tingkat").innerHTML = TINGKAT.map((t, i) => `<figure class="cincin" id="cincin-${t.id}"><img alt="" width="720" height="720"><figcaption></figcaption></figure>`).join("");
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    R[b.dataset.t] = b.dataset.i; renderRantang(b.dataset.t);
  });
  function renderRantang(ganti) {
    TINGKAT.forEach(t => {
      const w = $(`#cincin-${t.id}`), i = nasi(t.id, R[t.id]), im = w.querySelector("img");
      if (!im.src.endsWith(`/${i.id}.jpg`)) { im.src = `img/${i.id}.jpg`; im.alt = i.n; }
      w.querySelector("figcaption").textContent = i.n;
      if (t.id === ganti) { w.classList.remove("isi"); void w.offsetWidth; w.classList.add("isi"); }
    });
    $$("[data-t]").forEach(b => b.setAttribute("aria-pressed", R[b.dataset.t] === b.dataset.i));
    $("#jumlahR").textContent = R.q;
    $("#hargaR").textContent = S.rupiah(hargaSatu() * R.q);
  }
  $("#kurangR").onclick = () => { R.q = Math.max(1, R.q - 1); renderRantang(); };
  $("#tambahR").onclick = () => { R.q = Math.min(100, R.q + 1); renderRantang(); };
  $("#masukR").onclick = e => {
    const n = TINGKAT.map(t => nasi(t.id, R[t.id]).n), sambal = $("#fSambal").checked;
    tambah({ k: `rantang:${R.nasi}:${R.lauk}:${R.sayur}:${sambal}`, n: `Rantang ${n[1].toLowerCase()}`, ket: `${n[0]}, ${n[2].toLowerCase()}${sambal ? ", sambal" : ""}`, h: hargaSatu(), q: R.q, hari: 1 });
    kilat(e.currentTarget);
  };

  /* ---------- paket ---------- */
  $("#daftarPaket").innerHTML = PAKET.map(p => `<li><img src="img/${p.foto}.jpg" alt="${p.n}" loading="lazy" width="${p.w}" height="${p.t}"><div><h3>${p.n}</h3><p>${p.f}</p><p class="paket__harga">${S.rupiah(p.h)} <span>per ${p.satuan || "porsi"}</span></p><button class="tombol tombol--garis-merah" type="button" data-paket="${p.id}">Pesan${p.min > 1 ? ` ${p.min} porsi` : ""}</button></div></li>`).join("");
  $("#daftarPaket").onclick = e => {
    const b = e.target.closest("[data-paket]"); if (!b) return;
    const p = PAKET.find(x => x.id === b.dataset.paket);
    tambah({ k: `paket:${p.id}`, n: p.n, ket: p.satuan ? "" : `Minimal ${p.min} porsi`, h: p.h, q: p.min, hari: p.hari, min: p.min });
    kilat(b);
  };

  /* ---------- hitung porsi acara ---------- */
  let acara = "rapat";
  $("#jenisAcara").innerHTML = ACARA.map(a => `<button type="button" data-acara="${a.id}">${a.n}</button>`).join("");
  $("#jenisAcara").onclick = e => { const b = e.target.closest("[data-acara]"); if (b) { acara = b.dataset.acara; renderAcara(); } };
  $("#fTamu").oninput = renderAcara;
  const porsiAcara = () => { const a = ACARA.find(x => x.id === acara); return { a, tamu: +$("#fTamu").value, porsi: Math.ceil(+$("#fTamu").value * a.faktor) }; };
  function renderAcara() {
    const { a, tamu, porsi } = porsiAcara();
    $("#tamuNilai").textContent = `${tamu} orang`; $("#acaraPorsi").textContent = porsi;
    $("#acaraSaran").textContent = `${a.saran} Pesan paling lambat ${a.hari === 1 ? "sehari" : `${a.hari} hari`} sebelumnya.`;
    $("#acaraHarga").textContent = `${S.rupiah(a.h)} per porsi, total ${S.rupiah(a.h * porsi)}`;
    $$("[data-acara]").forEach(b => b.setAttribute("aria-pressed", b.dataset.acara === acara));
  }
  $("#masukA").onclick = e => {
    const { a, tamu, porsi } = porsiAcara();
    tambah({ k: `acara:${a.id}:${tamu}`, n: a.paket, ket: `${tamu} tamu, ${porsi} porsi`, h: a.h, q: porsi, hari: a.hari, min: porsi });
    kilat(e.currentTarget);
  };

  /* ---------- langganan ---------- */
  let lama = "bulan";
  $("#minggu").innerHTML = MINGGU.map(m => `<li><img src="img/${m.foto}.jpg" alt="${m.n}" loading="lazy" width="720" height="720"><p class="minggu__hari">${m.h}</p><h3>${m.n}</h3><p>${m.s}</p></li>`).join("");
  $("#lamaLangganan").innerHTML = LAMA.map(l => `<button type="button" data-lama="${l.id}">${l.n}${l.diskon ? `, hemat ${l.diskon * 100}%` : ""}</button>`).join("");
  $("#lamaLangganan").onclick = e => { const b = e.target.closest("[data-lama]"); if (b) { lama = b.dataset.lama; renderLangganan(); } };
  $("#fOrang").oninput = renderLangganan;
  const hitungL = () => { const l = LAMA.find(x => x.id === lama), o = +$("#fOrang").value, h = Math.round(LANGGANAN_HARGA * (1 - l.diskon) / 1000) * 1000; return { l, o, h, tot: h * o * l.hari }; };
  function renderLangganan() {
    const { l, o, h, tot } = hitungL();
    $("#orangNilai").textContent = `${o} orang`; $("#hargaL").textContent = S.rupiah(tot);
    $("#rinciL").textContent = `${S.rupiah(h)} per orang per hari, ${l.hari} hari kerja`;
    $$("[data-lama]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lama === lama));
  }
  $("#masukL").onclick = e => {
    const { l, o, h } = hitungL();
    tambah({ k: `langganan:${l.id}:${o}`, n: `Langganan ${l.n}`, ket: `${o} orang, ${l.hari} hari kerja`, h: h * l.hari, q: o, hari: 1 });
    kilat(e.currentTarget);
  };

  /* ---------- pesanan: tanggal terlalu dekat ditutup sesuai waktu masak ---------- */
  const kunci = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtHari = t => new Date(t + "T12:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const TANGGAL = (() => { const out = [], d = new Date(); d.setHours(12); for (let i = 0; i < 14; i++) { out.push(new Date(d)); d.setDate(d.getDate() + 1); } return out; })();
  const JAM = ["10.00", "11.00", "12.00", "16.00", "18.00"];
  const paling = () => cart.reduce((m, c) => Math.max(m, c.hari), 1);
  function renderPesan() {
    const ada = cart.length, lambat = paling(), bisa = TANGGAL.slice(lambat).map(kunci);
    if (!bisa.includes(P.tanggal)) P.tanggal = "";
    $("#daftarPesan").innerHTML = ada ? cart.map(c => `<li><div><b>${esc(c.n)}</b>${c.ket ? `<span>${esc(c.ket)}</span>` : ""}<span>${S.rupiah(c.h)} per item</span></div><p class="qty"><button type="button" data-q="${esc(c.k)}|-1" aria-label="Kurangi ${esc(c.n)}">−</button><b>${c.q}</b><button type="button" data-q="${esc(c.k)}|1" aria-label="Tambah ${esc(c.n)}">+</button></p></li>`).join("") : `<li class="kosong">Belum ada pesanan. Mulai dari <a href="#rantang">susun rantang</a>.</li>`;
    $("#pilihTanggal").innerHTML = TANGGAL.map(d => { const k = kunci(d), tutup = !bisa.includes(k); return `<button type="button" data-tanggal="${k}" aria-pressed="${k === P.tanggal}"${tutup ? " disabled" : ""}>${d.toLocaleDateString("id-ID", { weekday: "short" })}<b>${d.getDate()}</b></button>`; }).join("");
    $("#catatTanggal").textContent = lambat > 1 ? `Pesanan ini perlu waktu siap ${lambat} hari, jadi tanggal yang lebih dekat ditutup.` : "Pesanan paling lambat sehari sebelumnya.";
    $("#pilihJam").innerHTML = JAM.map(j => `<button type="button" data-jam="${j}" aria-pressed="${j === P.jam}">${j}</button>`).join("");
    $("#pilihWilayah").innerHTML = WILAYAH.map(([n, h], i) => `<button type="button" data-wil="${i}" aria-pressed="${i === P.wilayah}">${n}<small>${h ? S.rupiah(h) : "Gratis ongkir"}</small></button>`).join("");
    const sisa = total() - kini();
    $("#rincian").innerHTML = `<li><span>Pesanan</span><b>${S.rupiah(subtotal())}</b></li><li><span>Ongkir</span><b>${ada ? S.rupiah(ongkir()) : "Rp0"}</b></li><li class="jumlah"><span>Total</span><b>${S.rupiah(total())}</b></li><li><span>Bayar sekarang</span><b>${S.rupiah(kini())}</b></li>${sisa ? `<li><span>Sisa saat pesanan tiba</span><b>${S.rupiah(sisa)}</b></li>` : ""}`;
    $$("[data-jumlah]").forEach(b => b.textContent = cart.reduce((s, c) => s + 1, 0));
    $("#apungTotal").textContent = ada ? S.rupiah(total()) : "";
  }
  $("#daftarPesan").onclick = e => {
    const b = e.target.closest("[data-q]"); if (!b) return;
    const [k, d] = b.dataset.q.split("|"), c = cart.find(x => x.k === k);
    c.q += +d; if (c.q < (c.min || 1)) cart = cart.filter(x => x !== c);
    simpan();
  };
  $("#pilihTanggal").onclick = e => { const b = e.target.closest("[data-tanggal]"); if (b && !b.disabled) { P.tanggal = b.dataset.tanggal; renderPesan(); } };
  $("#pilihJam").onclick = e => { const b = e.target.closest("[data-jam]"); if (b) { P.jam = b.dataset.jam; renderPesan(); } };
  $("#pilihWilayah").onclick = e => { const b = e.target.closest("[data-wil]"); if (b) { P.wilayah = +b.dataset.wil; renderPesan(); } };
  $$('[name="jenis"]').forEach(r => r.onchange = renderPesan);
  $("#formPesan").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNama").value.trim(), alamat = $("#fAlamat").value.trim(), g = $("#galat");
    g.textContent = !cart.length ? "Pesanan masih kosong." : !P.tanggal || !P.jam ? "Pilih tanggal dan jam tiba." : !nama ? "Isi nama dulu." : !alamat ? "Isi alamat dulu." : "";
    if (g.textContent) return;
    bukaKasir(nama, alamat);
  });

  /* ---------- kasir: WhatsApp hanya terbuka dari layar berhasil ---------- */
  const CATAT = "Sudah membayar? Tekan Cek pembayaran. WhatsApp baru terbuka kalau pembayaran berhasil. Mode contoh: pembayaran selalu dianggap berhasil dan tidak ada uang yang diproses.";
  const kasir = $("#kasir"); let kode = "", detik = 0, timer = 0, K = null;
  const akun = rows => `<ul class="akun">${rows.map(([n, no]) => `<li><span>${n}</span><b>${no}</b><button type="button" data-salin="${no.replace(/\s/g, "")}">Salin</button></li>`).join("")}</ul><p class="kecil">a.n. Dapur Mama. Nomor ini contoh. Transfer tepat ${S.rupiah(K.nilai)}.</p>`;
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
    "QRIS": () => `<div class="qris"><svg viewBox="0 0 21 21" role="img" aria-label="Contoh kode QRIS">${qr()}</svg><div><b>Dapur Mama</b><p>Pindai dengan aplikasi bank atau e-wallet apa pun, lalu masukkan ${S.rupiah(K.nilai)}.</p><p>Kode ini contoh. Di website asli diganti QRIS milik katering.</p></div></div>`,
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
  function bukaKasir(nama, alamat) {
    const baris = cart.map(c => `${c.q}x ${c.n}${c.ket ? ` (${c.ket})` : ""} = ${S.rupiah(c.h * c.q)}`), t = total(), n = kini(), tgl = P.tanggal, jam = P.jam, ong = ongkir(), wil = WILAYAH[P.wilayah][0], cat = $("#fCatatan").value.trim(), jenis = lunas() ? "Lunas" : "DP 50%";
    K = { nilai: n, tgl, ket: cart.map(c => c.n).join(", "), teks: (k, lewat) => `Halo Dapur Mama, saya sudah bayar pesanan ini.\n\nKode: *${k}*\nNama: ${nama}\nAntar: ${fmtHari(tgl)}, ${jam} WIB\nAlamat: ${alamat}, ${wil}\n\n${baris.join("\n")}\nOngkir = ${S.rupiah(ong)}\n\n*Total: ${S.rupiah(t)}*\n*Dibayar (${jenis}): ${S.rupiah(n)}*\nLewat: ${lewat}${cat ? `\nCatatan: ${cat}` : ""}\n\nMohon konfirmasi.` };
    kode = S.kode("DM", 4); detik = 900;
    $("#kasirJudul").textContent = lunas() ? "Bayar lunas" : "Bayar DP 50%";
    $("#kasirKode").textContent = kode; $("#kasirNilai").textContent = S.rupiah(n); $("#kasirCatat").textContent = CATAT;
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
    const riwayat = baca("dm.riwayat", {}); riwayat[kode] = { ket: K.ket, tgl: K.tgl, t: Date.now() }; tulis("dm.riwayat", riwayat);
    cart = []; P.tanggal = P.jam = ""; simpan();
  };
  $("#keWa").onclick = () => {
    // contoh: tanpa nomor tujuan, di website asli diganti nomor katering
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(K.teks(kode, K.lewat))}`, "_blank", "noopener");
    kasir.close();
  };
  $("#keLacak").onclick = () => { kasir.close(); $("#fLacak").value = kode; lacak(kode); $("#lacak").scrollIntoView(); };

  /* ---------- lacak ---------- */
  const TAHAP = ["Pesanan diterima", "Belanja dan masak", "Dikemas", "Dalam perjalanan", "Sampai"];
  const CONTOH = "DM-CONTOH"; let tLacak = 0;
  function lacak(k) {
    const id = k.trim().toUpperCase(), w = $("#hasilLacak"); clearInterval(tLacak);
    const r = id === CONTOH ? { ket: "Nasi box kantor, 20 porsi", t: Date.now() - 130000 } : baca("dm.riwayat", {})[id];
    if (!r) { w.innerHTML = `<p>Kode <b>${esc(id)}</b> tidak ditemukan. Cek lagi penulisannya.</p>`; return; }
    const gambar = () => {
      const i = Math.min(TAHAP.length - 1, Math.floor((Date.now() - r.t) / 60000));
      w.innerHTML = `<h3>${esc(id)}</h3><p>${esc(r.ket)}${r.tgl ? `, ${fmtHari(r.tgl)}` : ""}</p><ol class="tahap">${TAHAP.map((l, n) => `<li class="${n < i ? "lewat" : n === i ? "kini" : ""}"${n === i ? ' aria-current="step"' : ""}>${l}</li>`).join("")}</ol><p class="kecil">Mode contoh: status maju sendiri tiap satu menit.</p>`;
    };
    gambar(); tLacak = setInterval(gambar, 15000);
  }
  $("#formLacak").addEventListener("submit", e => { e.preventDefault(); if ($("#fLacak").value.trim()) lacak($("#fLacak").value); });

  /* ---------- tombol bawah HP dan muncul saat di-scroll ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let antre = false;
  const gerak = () => {
    antre = false;
    const p = $("#pesan").getBoundingClientRect();
    $("#apung").classList.toggle("sembunyi", !cart.length || (p.top < innerHeight * .7));
  };
  addEventListener("scroll", () => { if (!antre) { antre = true; requestAnimationFrame(gerak); } }, { passive: true });
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("tampak"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".rantang__kepala, .tingkat, .pilihan, .rantang__kaki, .paket > h2, .paket li, .acara__isi, .acara > img, .langganan__kepala, .minggu li, .langganan__hitung, .dapurnya > *, .pesan__kiri, .nota, .lacak > div").forEach(el => { el.classList.add("muncul"); io.observe(el); });
  }

  renderRantang(); renderAcara(); renderLangganan(); renderPesan(); lacak(CONTOH); gerak();
})();
