/* Butik Anggun: kamar pas digital, padu padan berdua, adegan putar, cari ukuran, kantong, kasir, lacak.
   shortcut: stok dan status masih contoh di browser; yang asli butuh backend + payment gateway. */
(() => {
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const baca = (k, awal) => { try { return JSON.parse(localStorage.getItem(k)) ?? awal; } catch { return awal; } };
  const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const barang = id => KATALOG.find(b => b.id === id);
  const fotoM = b => `img/m/${b.id}.webp`, fotoF = b => `img/f/${b.id}.webp`, fotoR = b => `img/r/${b.id}.jpg`;

  /* ---------- kamar pas ---------- */
  const P = { g: "w", acara: "semua", id: "kebaya", ukuran: "" };
  let antreGanti = 0;
  const adegan = b => {
    const el = document.createElement("div");
    el.className = "adegan"; el.style.setProperty("--bg", b.bg); el.style.setProperty("--huruf", b.huruf);
    el.innerHTML = `<span class="adegan__huruf">ANGGUN</span><img src="${fotoM(b)}" alt="" style="--skala:${b.skala}">`;
    return el;
  };
  const pasHuruf = () => { // huruf setinggi panggung: lebar tetap penuh, tingginya ditarik
    const p = $("#pas"), hp = innerWidth <= 760, fs = innerWidth * .62;
    const tinggi = hp ? $("#latar").offsetHeight - 92 - 12 : p.offsetHeight - $("#rel").offsetHeight - 28;
    p.style.setProperty("--sy", (tinggi / (fs * .86)).toFixed(3));
  };
  addEventListener("resize", pasHuruf);
  function warnai(b) {
    const s = $("#pas").style; s.setProperty("--tinta", b.tinta); s.setProperty("--bg", b.bg);
  }
  function renderInfo() {
    const b = barang(P.id), adaStok = u => b.stok[u] > 0;
    if (!adaStok(P.ukuran)) P.ukuran = UKURAN.find(u => u === "M" && adaStok(u)) || UKURAN.find(adaStok) || "";
    $("#pAcara").textContent = b.acara.map(a => ACARA.find(x => x[0] === a)[1]).join(", ");
    $("#pNama").textContent = b.nama; $("#pIsi").textContent = b.isi; $("#pHarga").textContent = S.rupiah(b.harga);
    $("#pBahan").textContent = b.bahan + ".";
    $("#pModel").textContent = b.g === "w" ? "Model 168 cm memakai M." : "Model 180 cm memakai L.";
    const kembar = b.varian ? KATALOG.filter(x => x.varian === b.varian) : [];
    $("#pVarian").innerHTML = kembar.map(x => `<button type="button" data-id="${x.id}" aria-pressed="${x.id === b.id}" title="${esc(x.nama)}"><img src="${fotoF(x)}" alt="${esc(x.nama)}" loading="lazy"></button>`).join("");
    $("#pUkur").innerHTML = UKURAN.map(u => `<button type="button" data-u="${u}" aria-pressed="${u === P.ukuran}" ${adaStok(u) ? "" : "disabled"}>${u}</button>`).join("");
    const n = b.stok[P.ukuran] || 0;
    $("#pStok").textContent = !P.ukuran ? "Semua ukuran habis" : n <= 2 ? `Ukuran ${P.ukuran} sisa ${n}` : `Ukuran ${P.ukuran} tersedia`;
    $("#pMasuk").disabled = !P.ukuran;
    $$("#rel button").forEach(x => x.setAttribute("aria-pressed", x.dataset.id === b.id));
  }
  function pakai(id, langsung) {
    const b = barang(id), latar = $("#latar");
    P.id = id; P.g = b.g; renderInfo(); warnai(b); tandaGanti();
    const baru = adegan(b), giliran = ++antreGanti, img = baru.querySelector("img");
    const pasang = () => {
      if (giliran !== antreGanti) return;
      latar.append(baru);
      if (langsung || reduce) { [...latar.children].slice(0, -1).forEach(x => x.remove()); return; }
      const a = baru.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 620, easing: "cubic-bezier(.77,0,.18,1)" });
      img.animate([{ transform: "translateX(-50%) translateX(46px) scale(var(--skala))", opacity: .4 }, { transform: "translateX(-50%) scale(var(--skala))", opacity: 1 }], { duration: 760, easing: "cubic-bezier(.2,.7,.2,1)" });
      a.onfinish = () => { [...latar.children].forEach(x => { if (x !== baru && giliran === antreGanti) x.remove(); }); };
    };
    // tunggu fotonya siap supaya tirai tidak membuka kamar kosong
    (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(pasang);
  }
  const tandaGanti = () => $$(".ganti [data-g]").forEach(x => x.setAttribute("aria-pressed", x.dataset.g === P.g));
  function renderRel() {
    const isi = KATALOG.filter(b => b.g === P.g && (P.acara === "semua" || b.acara.includes(P.acara)));
    $("#rel").innerHTML = isi.map(b => `<button type="button" data-id="${b.id}" aria-pressed="${b.id === P.id}"><img src="${fotoF(b)}" alt="" loading="lazy"><span>${esc(b.nama)}</span></button>`).join("");
    $("#rel").scrollLeft = 0;
    return isi;
  }
  function renderSaring() {
    const ada = ACARA.filter(([k]) => k === "semua" || KATALOG.some(b => b.g === P.g && b.acara.includes(k)));
    $("#saring").innerHTML = ada.map(([k, n]) => `<button type="button" data-a="${k}" aria-pressed="${k === P.acara}">${n}</button>`).join("");
  }
  $(".pas").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.g) { if (t.dataset.g === P.g) return; P.g = t.dataset.g; P.acara = "semua"; tandaGanti(); renderSaring(); pakai(renderRel()[0].id); }
    else if (t.dataset.a) {
      P.acara = t.dataset.a; renderSaring(); const isi = renderRel();
      if (!isi.some(b => b.id === P.id)) pakai(isi[0].id);
    }
    else if (t.dataset.u) { P.ukuran = t.dataset.u; renderInfo(); }
    else if (t.dataset.id) { if (t.dataset.id !== P.id) pakai(t.dataset.id); }
  });
  $("#pMasuk").onclick = () => tambah(P.id, P.ukuran);
  const keKamar = id => {
    const b = barang(id);
    if (b.g !== P.g || (P.acara !== "semua" && !b.acara.includes(P.acara))) { P.g = b.g; P.acara = "semua"; renderSaring(); }
    pakai(id); renderRel();
    $("#pas").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  document.addEventListener("click", e => { const t = e.target.closest("[data-coba]"); if (t) keKamar(t.dataset.coba); });

  /* ---------- berdua ---------- */
  const HEMAT = .1;
  let bIdx = 0;
  const hargaPasang = (w, p) => { const kotor = w.harga + p.harga, potong = Math.round(kotor * HEMAT); return { kotor, potong, bersih: kotor - potong }; };
  const opsiUkur = b => UKURAN.map(u => `<option value="${u}" ${b.stok[u] ? "" : "disabled"}>${u}${b.stok[u] ? "" : " (habis)"}</option>`).join("");
  const pilihan = (b, awal) => (b.stok[awal] ? awal : UKURAN.find(u => b.stok[u]));
  function renderBerdua() {
    const [wi, pi, judul] = PASANGAN[bIdx], w = barang(wi), p = barang(pi), h = hargaPasang(w, p);
    $("#berdua").style.setProperty("--bg", w.bg); $("#berdua").style.setProperty("--tinta", w.tinta); $("#berdua").style.setProperty("--huruf", w.huruf);
    $("#bHuruf").textContent = judul; $("#bHuruf").style.setProperty("--n", judul.length);
    const iW = $("#bW"), iP = $("#bP");
    iW.src = fotoM(w); iW.alt = `Model wanita memakai ${w.nama}`; iW.style.setProperty("--skala", w.skala);
    iP.src = fotoM(p); iP.alt = `Model pria memakai ${p.nama}`; iP.style.setProperty("--skala", p.skala);
    if (!reduce) [iW, iP].forEach((x, i) => x.animate([{ opacity: 0, translate: `${i ? 40 : -40}px 0` }, { opacity: 1, translate: "0 0" }], { duration: 640, easing: "cubic-bezier(.2,.7,.2,1)" }));
    $("#bNW").textContent = w.nama; $("#bHW").textContent = S.rupiah(w.harga);
    $("#bNP").textContent = p.nama; $("#bHP").textContent = S.rupiah(p.harga);
    $("#bHemat").textContent = S.rupiah(h.potong); $("#bTotal").textContent = S.rupiah(h.bersih);
    $("#bUW").innerHTML = opsiUkur(w); $("#bUW").value = pilihan(w, "M");
    $("#bUP").innerHTML = opsiUkur(p); $("#bUP").value = pilihan(p, "L");
    $$("#bPilih button").forEach((x, i) => x.setAttribute("aria-pressed", i === bIdx));
  }
  $("#bPilih").innerHTML = PASANGAN.map(([, , j], i) => `<button type="button" data-i="${i}">${j}</button>`).join("");
  $("#bPilih").onclick = e => { const t = e.target.closest("button"); if (t) { bIdx = +t.dataset.i; renderBerdua(); } };
  $("#bMasuk").onclick = () => {
    const [wi, pi] = PASANGAN[bIdx];
    tambah(wi, $("#bUW").value, pi); tambah(pi, $("#bUP").value, wi);
  };

  /* ---------- lemari ---------- */
  $("#sJumlah").textContent = KATALOG.length;
  $("#lemari").innerHTML = KATALOG.map(b => `<button type="button" class="baju" data-coba="${b.id}"><span class="baju__foto"><img src="${fotoR(b)}" alt="Model memakai ${esc(b.nama)}" loading="lazy"><img class="baju__flat" src="${fotoF(b)}" alt="" loading="lazy"></span><span class="baju__nama">${esc(b.nama)}</span><span class="baju__harga">${S.rupiah(b.harga)}</span></button>`).join("");

  /* ---------- cari ukuran ---------- */
  const TABEL = {
    w: { S: [84, 68, 92], M: [90, 74, 98], L: [96, 80, 104], XL: [104, 88, 112] },
    p: { S: [94, 78, 94], M: [100, 84, 100], L: [106, 90, 106], XL: [114, 98, 114] }
  };
  const U = { g: "w", hasil: "M" };
  function hitungUkuran(g, tinggi, berat) { // patokan indeks massa tubuh, naik satu ukuran kalau tinggi melewati panjang baju
    const imt = berat / (tinggi / 100) ** 2;
    let i = imt < 19 ? 0 : imt < 23 ? 1 : imt < 27 ? 2 : 3;
    if (tinggi >= (g === "w" ? 172 : 184)) i = Math.min(3, i + 1);
    return { u: UKURAN[i], longgar: imt >= 31 };
  }
  console.assert(hitungUkuran("w", 160, 45).u === "S" && hitungUkuran("w", 162, 55).u === "M" && hitungUkuran("p", 170, 70).u === "L" && hitungUkuran("p", 190, 100).u === "XL", "hitungUkuran");
  function renderUkuran() {
    const t = +$("#uTinggi").value, b = +$("#uBerat").value, r = hitungUkuran(U.g, t, b);
    U.hasil = r.u; $("#uHasil").textContent = r.u;
    $("#uTinggiN").textContent = `${t} cm`; $("#uBeratN").textContent = `${b} kg`;
    $("#uKet").textContent = r.longgar ? "Ukuran terbesar kami. Mampir ke toko, kami permak supaya pas." : `Pas di badan ${t} cm, ${b} kg.`;
    $("#uTabel").innerHTML = UKURAN.map(u => `<tr class="${u === r.u ? "aktif" : ""}"><th scope="row">${u}</th>${TABEL[U.g][u].map(n => `<td>${n}</td>`).join("")}</tr>`).join("");
  }
  $("#uTinggi").oninput = $("#uBerat").oninput = renderUkuran;
  $$("[data-ug]").forEach(x => x.onclick = () => {
    U.g = x.dataset.ug; $$("[data-ug]").forEach(y => y.setAttribute("aria-pressed", y === x)); renderUkuran();
  });
  $("#uPakai").onclick = () => {
    P.ukuran = U.hasil;
    if (P.g !== U.g) { const b = KATALOG.find(k => k.g === U.g); keKamar(b.id); return; }
    renderInfo(); $("#pas").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  /* ---------- kantong ---------- */
  const kantong = $("#kantong");
  let isi = baca("ag.kantong", []).filter(c => barang(c.id)); // {id, u, q, pasang}
  const KIRIM = [["ambil", "Ambil di toko", 0], ["kota", "Antar kota Jambi", 15000], ["luar", "Luar kota", 35000]];
  let kirim = "kota";
  const simpan = () => tulis("ag.kantong", isi);
  const sisaStok = (id, u) => barang(id).stok[u] - (isi.find(c => c.id === id && c.u === u)?.q || 0);
  const adaPasangan = c => c.pasang && isi.some(x => x.id === c.pasang);
  const hargaBaris = c => { const h = barang(c.id).harga * c.q; return adaPasangan(c) ? h - Math.round(barang(c.id).harga * HEMAT) : h; };
  const subtotal = () => isi.reduce((n, c) => n + hargaBaris(c), 0);
  const ongkir = () => KIRIM.find(k => k[0] === kirim)[2];
  const total = () => subtotal() + ongkir();
  function tambah(id, u, pasang) {
    if (!u || sisaStok(id, u) <= 0) { $("#pStok").textContent = `Stok ukuran ${u} sudah semuanya di kantongmu`; return; }
    const c = isi.find(x => x.id === id && x.u === u);
    if (c) { c.q++; if (pasang) c.pasang = pasang; } else isi.push({ id, u, q: 1, pasang });
    simpan(); renderKantong();
    const t = $("#bukaKantong"); if (!reduce) t.animate([{ scale: 1 }, { scale: 1.14 }, { scale: 1 }], 380);
  }
  function renderKantong() {
    const n = isi.reduce((a, c) => a + c.q, 0);
    $$("[data-jumlah]").forEach(x => x.textContent = n);
    $("#apungTotal").textContent = S.rupiah(subtotal());
    $("#kKosong").hidden = n > 0; $("#formPesan").hidden = !n;
    $("#kIsi").innerHTML = isi.map((c, i) => { const b = barang(c.id); return `<li><img src="${fotoF(b)}" alt=""><div><b>${esc(b.nama)}</b><span>Ukuran ${c.u}${adaPasangan(c) ? ", hemat sepasang" : ""}</span><span>${S.rupiah(hargaBaris(c))}</span></div><div class="jumlah"><button type="button" data-k="${i}" data-d="-1" aria-label="Kurangi ${esc(b.nama)}">−</button><b>${c.q}</b><button type="button" data-k="${i}" data-d="1" aria-label="Tambah ${esc(b.nama)}" ${sisaStok(c.id, c.u) <= 0 ? "disabled" : ""}>+</button></div></li>`; }).join("");
    $("#kirim").innerHTML = KIRIM.map(([k, l]) => `<label><input type="radio" name="kirim" value="${k}" ${k === kirim ? "checked" : ""}><span>${l}</span></label>`).join("");
    $("#alamatBox").hidden = kirim === "ambil"; $("#fAlamat").required = kirim !== "ambil";
    $("#kNota").innerHTML = `<div><dt>Baju</dt><dd>${S.rupiah(subtotal())}</dd></div><div><dt>Ongkir</dt><dd>${ongkir() ? S.rupiah(ongkir()) : "Gratis"}</dd></div><div class="total"><dt>Total</dt><dd>${S.rupiah(total())}</dd></div>`;
    gerak();
  }
  $("#kIsi").onclick = e => {
    const t = e.target.closest("[data-k]"); if (!t) return;
    const c = isi[+t.dataset.k]; c.q += +t.dataset.d; if (c.q < 1) isi.splice(+t.dataset.k, 1);
    simpan(); renderKantong();
  };
  $("#kirim").onchange = e => { kirim = e.target.value; renderKantong(); };
  $("#bukaKantong").onclick = $("#apungBuka").onclick = () => { renderKantong(); kantong.showModal(); };
  $("#kantongTutup").onclick = () => kantong.close();
  $("#formPesan").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNama").value.trim(), alamat = kirim === "ambil" ? "Ambil di toko" : $("#fAlamat").value.trim();
    if (!nama || !isi.length) return;
    kantong.close(); bukaKasir(nama, alamat);
  });

  /* ---------- kasir: WhatsApp hanya terbuka dari layar berhasil ---------- */
  const CATAT = "Sudah membayar? Tekan Cek pembayaran. WhatsApp baru terbuka kalau pembayaran berhasil. Mode contoh: pembayaran selalu dianggap berhasil dan tidak ada uang yang diproses.";
  const kasir = $("#kasir"); let kode = "", detik = 0, timer = 0, K = null;
  const akun = rows => `<ul class="akun">${rows.map(([n, no]) => `<li><span>${n}</span><b>${no}</b><button type="button" data-salin="${no.replace(/\s/g, "")}">Salin</button></li>`).join("")}</ul><p class="kecil">a.n. Butik Anggun. Nomor ini contoh. Transfer tepat ${S.rupiah(K.nilai)}.</p>`;
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
    "QRIS": () => `<div class="qris"><svg viewBox="0 0 21 21" role="img" aria-label="Contoh kode QRIS">${qr()}</svg><div><b>Butik Anggun</b><p>Pindai dengan aplikasi bank atau e-wallet apa pun, lalu masukkan ${S.rupiah(K.nilai)}.</p><p>Kode ini contoh. Di website asli diganti QRIS milik butik.</p></div></div>`,
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
    const baris = isi.map(c => `${c.q}x ${barang(c.id).nama} (${c.u}) = ${S.rupiah(hargaBaris(c))}`), hp = $("#fHp").value.trim(), ong = ongkir(), t = total(), cara = KIRIM.find(k => k[0] === kirim)[1];
    K = { nilai: t, ket: isi.map(c => `${barang(c.id).nama} (${c.u})`).join(", "), teks: (k, lewat) => `Halo Butik Anggun, saya sudah bayar pesanan ini.\n\nKode: *${k}*\nNama: ${nama}\nHP: ${hp}\nTerima: ${cara}\nAlamat: ${alamat}\n\n${baris.join("\n")}\nOngkir = ${S.rupiah(ong)}\n\n*Total dibayar: ${S.rupiah(t)}*\nLewat: ${lewat}\n\nMohon konfirmasi.` };
    kode = S.kode("AG", 4); detik = 900;
    $("#kasirJudul").textContent = "Bayar lunas";
    $("#kasirKode").textContent = kode; $("#kasirNilai").textContent = S.rupiah(t); $("#kasirCatat").textContent = CATAT;
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
    const riwayat = baca("ag.riwayat", {}); riwayat[kode] = { ket: K.ket, t: Date.now() }; tulis("ag.riwayat", riwayat);
    isi = []; simpan(); renderKantong();
  };
  $("#keWa").onclick = () => {
    // contoh: tanpa nomor tujuan, di website asli diganti nomor butik
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(K.teks(kode, K.lewat))}`, "_blank", "noopener");
    kasir.close();
  };
  $("#keLacak").onclick = () => { kasir.close(); $("#fLacak").value = kode; lacak(kode); $("#lacak").scrollIntoView(); };

  /* ---------- lacak ---------- */
  const TAHAP = ["Pesanan diterima", "Baju diperiksa dan disetrika", "Dikemas", "Dikirim", "Sampai"];
  const CONTOH = "AG-CONTOH"; let tLacak = 0;
  function lacak(k) {
    const id = k.trim().toUpperCase(), w = $("#hasilLacak"); clearInterval(tLacak);
    const r = id === CONTOH ? { ket: "Kebaya Brokat Sage (M)", t: Date.now() - 130000 } : baca("ag.riwayat", {})[id];
    if (!r) { w.innerHTML = `<p>Kode <b>${esc(id)}</b> tidak ditemukan. Cek lagi penulisannya.</p>`; return; }
    const gambar = () => {
      const i = Math.min(TAHAP.length - 1, Math.floor((Date.now() - r.t) / 60000));
      w.innerHTML = `<h3>${esc(id)}</h3><p>${esc(r.ket)}</p><ol class="tahap">${TAHAP.map((l, n) => `<li class="${n < i ? "lewat" : n === i ? "kini" : ""}"${n === i ? ' aria-current="step"' : ""}>${l}</li>`).join("")}</ol><p class="kecil">Mode contoh: status maju sendiri tiap satu menit.</p>`;
    };
    gambar(); tLacak = setInterval(gambar, 15000);
  }
  $("#formLacak").addEventListener("submit", e => { e.preventDefault(); if ($("#fLacak").value.trim()) lacak($("#fLacak").value); });

  /* ---------- putar: frame gaun mengikuti scroll ---------- */
  const FRAME = 95, kanvas = $("#kanvas"), kuas = kanvas.getContext("2d"), bingkai = [], putar = $("#putar");
  const lukis = i => { // kalau frame belum sampai, tampilkan frame terdekat sebelumnya
    for (let k = i; k >= 0; k--) if (bingkai[k]?.complete && bingkai[k].naturalWidth) { kuas.drawImage(bingkai[k], 0, 0, 1280, 720); return; }
  };
  const muatFrame = i => {
    if (bingkai[i]) return;
    const f = new Image(); f.src = `img/putar/${String(i + 1).padStart(3, "0")}.webp`; bingkai[i] = f;
    f.onload = () => { if (i === mauFrame) lukis(i); };
  };
  let mauFrame = reduce ? 30 : 0, antre = false;
  muatFrame(mauFrame);
  if (!reduce) new IntersectionObserver((es, o) => { // frame baru diunduh saat bagian ini mendekat
    if (es[0].isIntersecting) { o.disconnect(); for (let i = 1; i < FRAME; i++) muatFrame(i); }
  }, { rootMargin: "120% 0px" }).observe(putar);
  function gerak() {
    antre = false;
    const r = putar.getBoundingClientRect(), jarak = r.height - innerHeight;
    if (!reduce && r.bottom > 0 && r.top < innerHeight) {
      mauFrame = Math.round(Math.max(0, Math.min(1, -r.top / jarak)) * (FRAME - 1)); lukis(mauFrame);
    }
    const lewatPas = $("#pas").getBoundingClientRect().bottom < innerHeight * .4;
    $("#apung").classList.toggle("sembunyi", !isi.length || !lewatPas);
  }
  addEventListener("scroll", () => { if (!antre) { antre = true; requestAnimationFrame(gerak); } }, { passive: true });
  addEventListener("resize", gerak);

  /* ---------- muncul saat di-scroll ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("tampak"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".berdua__panel, .semua__kepala, .baju, .cariukur__isi, .toko > *, .lacak > div").forEach(el => { el.classList.add("muncul"); io.observe(el); });
  }

  renderSaring(); renderRel(); pasHuruf(); pakai(P.id, true); renderBerdua(); renderUkuran(); renderKantong(); lacak(CONTOH);
})();
