/* Bengkel Maju Jaya: jemput motor mogok, sparepart dari gambar terurai, booking servis, kasir, lacak.
   shortcut: tarif, stok, dan status pesanan masih contoh di browser; yang asli butuh backend + payment gateway. */
(() => {
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const baca = (k, awal) => { try { return JSON.parse(localStorage.getItem(k)) ?? awal; } catch { return awal; } };
  const tulis = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---------- data: harga berurutan matic, bebek, sport; null = motor itu tidak memakainya ---------- */
  const MOTOR = ["Matic", "Bebek", "Sport"];
  let motor = baca("mj.motor", 0);
  if (!MOTOR[motor]) motor = 0;

  const PART = [
    { id: "oli", n: "Oli mesin", f: "Melumasi dan mendinginkan mesin.", t: "Ganti kalau mesin terasa kasar atau sudah lewat jadwal.", h: [58000, 52000, 75000], j: 10000, x: 62, y: 71 },
    { id: "busi", n: "Busi", f: "Memercikkan api di ruang bakar.", t: "Ganti kalau motor susah hidup atau tarikan tersendat.", h: [25000, 22000, 35000], j: 10000, x: 68.2, y: 46.5 },
    { id: "aki", n: "Aki", f: "Sumber listrik saat starter.", t: "Ganti kalau starter lemah atau klakson pelan.", h: [240000, 215000, 320000], j: 15000, x: 69, y: 24 },
    { id: "filter", n: "Filter udara", f: "Menyaring debu sebelum masuk mesin.", t: "Ganti kalau tarikan berat dan bensin boros.", h: [55000, 50000, 70000], j: 15000, x: 75.5, y: 19 },
    { id: "vbelt", n: "V-belt", f: "Meneruskan tenaga mesin ke roda matic.", t: "Ganti tiap sekitar 20.000 km atau kalau ada getaran saat jalan.", h: [135000, null, null], j: 45000, x: 71.5, y: 74 },
    { id: "lampu", n: "Lampu LED", f: "Sorot lebih terang dengan daya kecil.", t: "Ganti kalau cahaya kuning redup atau berkedip.", h: [95000, 85000, 120000], j: 15000, x: 13.5, y: 37.5 },
    { id: "kampas", n: "Kampas rem", f: "Menjepit cakram saat mengerem.", t: "Ganti kalau rem berdecit atau tuas terasa dalam.", h: [45000, 40000, 65000], j: 20000, x: 16.8, y: 75.5 },
    { id: "ban", n: "Ban tubeless", f: "Satu-satunya bagian yang menyentuh jalan.", t: "Ganti kalau alur tinggal setipis tanda aus.", h: [285000, 245000, 395000], j: 25000, x: 85.5, y: 58 },
    { id: "rantai", n: "Rantai dan gir", f: "Meneruskan tenaga ke roda belakang.", t: "Ganti kalau rantai berbunyi atau gigi gir meruncing.", h: [null, 165000, 320000], j: 40000 }
  ];
  const SERVIS = [
    { id: "ganti-oli", n: "Ganti oli dan cek 10 titik", f: "Oli pilihanmu, rem, ban, lampu, aki", h: [20000, 20000, 25000] },
    { id: "ringan", n: "Servis ringan", f: "Busi, filter, setel rem, bersih kaburator atau throttle body", h: [65000, 55000, 85000] },
    { id: "besar", n: "Servis besar", f: "Semua servis ringan, bersih mesin luar, cek kelistrikan, uji jalan", h: [185000, 165000, 250000] },
    { id: "cvt", n: "Servis CVT", f: "Bersih ruang CVT, cek roller dan v-belt", h: [75000, null, null] },
    { id: "rantai", n: "Setel dan lumasi rantai", f: "Kekencangan pas, rantai tidak kering", h: [null, 25000, 35000] },
    { id: "injeksi", n: "Bersih injeksi", f: "Tarikan kembali ringan, bensin lebih irit", h: [80000, 70000, 100000] },
    { id: "cuci", n: "Cuci motor", f: "Bersih setelah servis", h: [20000, 20000, 25000] }
  ];
  const MASALAH = [
    { id: "mesin", n: "Mesin tidak hidup", cara: "Diperiksa di lokasi, diangkut kalau perlu", angkut: true },
    { id: "ban", n: "Ban bocor", cara: "Tambal di lokasi", jasa: 25000 },
    { id: "aki", n: "Aki soak", cara: "Starter dibantu di lokasi", jasa: 20000 },
    { id: "bensin", n: "Bensin habis", cara: "Bensin 2 liter diantar", jasa: 30000 },
    { id: "putus", n: "V-belt atau rantai putus", cara: "Motor diangkut ke bengkel", angkut: true },
    { id: "jatuh", n: "Habis jatuh", cara: "Motor diangkut ke bengkel", angkut: true }
  ];
  const INTERVAL = [2000, 3000, 3000];
  const BENGKEL = { lat: -1.5945, lng: 103.5845 };

  /* ---------- pilih jenis motor: satu pilihan untuk seluruh halaman ---------- */
  $$("[data-pilih-motor]").forEach(w => {
    w.setAttribute("role", "group"); w.setAttribute("aria-label", "Jenis motor");
    w.innerHTML = MOTOR.map((m, i) => `<button type="button" data-motor="${i}">${m}</button>`).join("");
  });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-motor]");
    if (!b) return;
    motor = +b.dataset.motor; tulis("mj.motor", motor); renderMotor();
  });
  function renderMotor() {
    $$("[data-motor]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.motor === motor));
    renderPart(); renderRak(); renderServis(); renderJemput(); renderOli();
  }

  /* ---------- jemput ---------- */
  const J = { masalah: "mesin", lat: null, lng: null };
  $("#masalah").innerHTML = MASALAH.map(m => `<button type="button" data-masalah="${m.id}">${m.n}</button>`).join("");
  $("#masalah").onclick = e => { const b = e.target.closest("[data-masalah]"); if (b) { J.masalah = b.dataset.masalah; renderJemput(); } };
  $("#fKm").oninput = renderJemput;

  function ongkos() {
    const km = +$("#fKm").value, m = MASALAH.find(x => x.id === J.masalah), jam = new Date().getHours(), r = [];
    r.push([`Mobil datang, ${km} km`, 35000 + Math.max(0, km - 3) * 6000]);
    if (m.angkut) r.push(["Angkut motor ke bengkel", motor === 2 ? 60000 : 40000]);
    if (m.jasa) r.push([m.cara, m.jasa]);
    if (jam >= 22 || jam < 5) r.push(["Tambahan tengah malam", 20000]);
    return { km, m, r, total: r.reduce((s, x) => s + x[1], 0), eta: 10 + km * 3 };
  }
  function renderJemput() {
    const o = ongkos();
    $$("[data-masalah]").forEach(b => b.setAttribute("aria-pressed", b.dataset.masalah === J.masalah));
    $("#kmNilai").textContent = `${o.km} km`;
    $("#eta").textContent = `${o.eta} menit`;
    $("#rincianJ").innerHTML = o.r.map(([n, h]) => `<li><span>${esc(n)}</span><b>${S.rupiah(h)}</b></li>`).join("");
    $("#totalJ").textContent = S.rupiah(o.total);
  }
  const jarak = (a, b) => { // haversine dikali 1,3 sebagai perkiraan jalan berkelok
    const r = d => d * Math.PI / 180, s = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(s)) * 1.3;
  };
  $("#pakaiLokasi").onclick = () => {
    const p = $("#lokasiPesan");
    if (!navigator.geolocation) { p.textContent = "Browser ini tidak bisa membaca lokasi. Geser jaraknya secara manual."; return; }
    p.textContent = "Mencari lokasimu...";
    navigator.geolocation.getCurrentPosition(g => {
      J.lat = g.coords.latitude; J.lng = g.coords.longitude;
      const km = Math.ceil(jarak(BENGKEL, J));
      if (km > 25) { p.textContent = `Lokasimu sekitar ${km} km dari bengkel, di luar jangkauan 25 km. Geser jaraknya secara manual untuk mencoba contoh ini.`; return; }
      $("#fKm").value = Math.max(1, km); p.textContent = `Lokasi ditemukan, sekitar ${km} km dari bengkel.`; renderJemput();
    }, () => { p.textContent = "Lokasi tidak bisa dibaca. Izinkan akses lokasi, atau geser jaraknya secara manual."; }, { enableHighAccuracy: true, timeout: 10000 });
  };
  $("#formJemput").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNamaJ").value.trim(), patokan = $("#fPatokan").value.trim(), plat = $("#fPlat").value.trim(), g = $("#galatJ");
    g.textContent = !patokan && J.lat === null ? "Isi patokan lokasi atau pakai lokasi saya dulu." : !nama ? "Isi nama dulu." : "";
    if (g.textContent) return;
    const o = ongkos(), peta = J.lat !== null ? `\nPeta: https://maps.google.com/?q=${J.lat},${J.lng}` : "";
    bukaKasir({
      judul: "Bayar ongkos jemput", nilai: o.total, tipe: "jemput", ket: `${o.m.n}, ${MOTOR[motor]}`,
      teks: k => `Halo Bengkel Maju Jaya, saya sudah bayar jemput motor.\n\nKode: *${k}*\nNama: ${nama}\nMotor: ${MOTOR[motor]}${plat ? ` (${plat})` : ""}\nMasalah: ${o.m.n}\nLokasi: ${patokan || "lihat peta"}${peta}\nJarak: ${o.km} km\n\n*Dibayar: ${S.rupiah(o.total)}*`
    });
  });

  /* ---------- fiche: gambar terurai bergeser ke komponen yang dipilih ---------- */
  const TITIK = PART.filter(p => p.x);
  let aktif = "oli", zoom = false;
  $("#peta").insertAdjacentHTML("beforeend", TITIK.map((p, i) => `<button type="button" class="pin" data-part="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-label="${p.n}">${i + 1}</button>`).join(""));
  $("#daftar").innerHTML = TITIK.map((p, i) => `<button type="button" data-part="${p.id}"><i>${i + 1}</i>${p.n}</button>`).join("");
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-part]");
    if (b) { aktif = b.dataset.part; zoom = true; renderPart(); }
  });
  function renderPart() {
    const p = PART.find(x => x.id === aktif), z = zoom ? 2.3 : 1, h = p.h[motor];
    const geser = c => Math.min(0, Math.max(100 - 100 * z, 50 - c * z));
    $("#peta").style.setProperty("--z", z);
    $("#peta").style.transform = `translate(${geser(p.x)}%, ${geser(p.y)}%) scale(${z})`;
    $("#lihatSemua").hidden = !zoom;
    $$("[data-part]").forEach(b => b.setAttribute("aria-pressed", b.dataset.part === aktif));
    $("#kartuPart").innerHTML = `<img src="img/${p.id}.jpg" alt="${p.n}" width="760" height="567">
      <div><h3>${p.n}</h3><p>${p.f}</p><p class="kecil">${p.t}</p>
      ${h ? `<p class="fiche__harga"><b>${S.rupiah(h)}</b><span>untuk ${MOTOR[motor].toLowerCase()}</span></p><button class="tombol tombol--penuh" type="button" data-beli="${p.id}">Masukkan keranjang</button>`
          : `<p class="fiche__harga"><b>Tidak dipakai</b><span>motor ${MOTOR[motor].toLowerCase()}</span></p>`}</div>`;
  }
  $("#lihatSemua").onclick = () => { zoom = false; renderPart(); };
  function renderRak() {
    $("#rak").innerHTML = PART.map(p => {
      const h = p.h[motor];
      return `<li${h ? "" : ' class="habis"'}><img src="img/${p.id}.jpg" alt="${p.n}" loading="lazy" width="760" height="567"><div><h4>${p.n}</h4><p>${h ? S.rupiah(h) : `Tidak untuk ${MOTOR[motor].toLowerCase()}`}</p></div>${h ? `<button type="button" data-beli="${p.id}" aria-label="Tambah ${p.n} ke keranjang">Tambah</button>` : ""}</li>`;
    }).join("");
  }

  /* ---------- keranjang: harga dikunci ke jenis motor saat barang ditambahkan ---------- */
  let cart = baca("mj.cart", []);
  const simpanCart = () => { tulis("mj.cart", cart); renderCart(); };
  const barisCart = () => cart.map(c => { const p = PART.find(x => x.id === c.id); return { ...c, p, n: p.n, h: p.h[c.m] }; }).filter(c => c.h);
  const terima = () => $('[name="terima"]:checked').value;
  function hitung() {
    const r = barisCart(), sub = r.reduce((s, c) => s + c.h * c.q, 0), jasa = terima() === "pasang" ? r.reduce((s, c) => s + c.p.j * c.q, 0) : 0, kirim = terima() === "kirim" ? 15000 : 0;
    return { r, sub, jasa, kirim, total: sub + jasa + kirim };
  }
  function tambah(id, m = motor) {
    const c = cart.find(x => x.id === id && x.m === m);
    if (c) c.q++; else cart.push({ id, m, q: 1 });
    simpanCart();
    const b = $("#apung .tombol--hitam"); b.classList.remove("denyut"); void b.offsetWidth; b.classList.add("denyut");
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-beli]");
    if (!b) return;
    tambah(b.dataset.beli); b.textContent = "Masuk keranjang"; setTimeout(() => { b.textContent = b.closest(".rak") ? "Tambah" : "Masukkan keranjang"; }, 1200);
  });
  function renderCart() {
    const h = hitung(), jml = h.r.reduce((s, c) => s + c.q, 0);
    $$("[data-jumlah]").forEach(b => b.textContent = jml);
    $("#isiKeranjang").innerHTML = h.r.length ? h.r.map(c => `<li><img src="img/${c.id}.jpg" alt="" width="64" height="48"><div><b>${c.n}</b><span>${MOTOR[c.m]}, ${S.rupiah(c.h)}</span></div>
      <p class="qty"><button type="button" data-q="${c.id}:${c.m}:-1" aria-label="Kurangi ${c.n}">−</button><b>${c.q}</b><button type="button" data-q="${c.id}:${c.m}:1" aria-label="Tambah ${c.n}">+</button></p></li>`).join("") : `<li class="kosong">Belum ada barang. Pilih dari gambar motor atau rak bengkel.</li>`;
    const b = [["Barang", h.sub]]; if (h.jasa) b.push(["Jasa pasang", h.jasa]); if (h.kirim) b.push(["Kirim Kota Jambi", h.kirim]);
    $("#hitungKeranjang").innerHTML = b.map(([n, v]) => `<li><span>${n}</span><b>${S.rupiah(v)}</b></li>`).join("") + `<li class="jumlah"><span>Total</span><b>${S.rupiah(h.total)}</b></li>`;
    $("#wadahAlamat").hidden = terima() !== "kirim";
  }
  $("#isiKeranjang").onclick = e => {
    const b = e.target.closest("[data-q]"); if (!b) return;
    const [id, m, d] = b.dataset.q.split(":"), c = cart.find(x => x.id === id && x.m === +m);
    c.q += +d; if (c.q < 1) cart = cart.filter(x => x !== c);
    simpanCart();
  };
  $$('[name="terima"]').forEach(r => r.onchange = renderCart);
  $$("[data-buka-keranjang]").forEach(b => b.onclick = () => { $("#galatK").textContent = ""; renderCart(); $("#keranjang").showModal(); });
  $("#formKeranjang").addEventListener("submit", e => {
    e.preventDefault();
    const h = hitung(), nama = $("#fNamaK").value.trim(), alamat = $("#fAlamat").value.trim(), cara = terima(), g = $("#galatK");
    g.textContent = !h.r.length ? "Keranjang masih kosong." : !nama ? "Isi nama dulu." : cara === "kirim" && !alamat ? "Isi alamat kirim dulu." : "";
    if (g.textContent) return;
    $("#keranjang").close();
    bukaKasir({
      judul: "Bayar sparepart", nilai: h.total, tipe: "part", ket: h.r.map(c => c.n).join(", "),
      selesai: () => { cart = []; simpanCart(); },
      teks: k => `Halo Bengkel Maju Jaya, saya sudah bayar sparepart.\n\nKode: *${k}*\nNama: ${nama}\nTerima: ${{ ambil: "Ambil di bengkel", kirim: "Dikirim", pasang: "Dipasang di bengkel" }[cara]}${cara === "kirim" ? `\nAlamat: ${alamat}` : ""}\n\n` +
        h.r.map(c => `${c.q}x ${c.n} (${MOTOR[c.m]}) = ${S.rupiah(c.h * c.q)}`).join("\n") + `${h.jasa ? `\nJasa pasang = ${S.rupiah(h.jasa)}` : ""}${h.kirim ? `\nKirim = ${S.rupiah(h.kirim)}` : ""}\n\n*Dibayar: ${S.rupiah(h.total)}*`
    });
  });

  /* ---------- servis ---------- */
  const B = { pilih: ["ringan"], hari: "", jam: "" };
  const kunci = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtHari = t => new Date(t + "T12:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const HARI = (() => { // tujuh hari kerja berikutnya, Minggu tutup
    const out = [], d = new Date();
    while (out.length < 7) { if (d.getDay() !== 0) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  })();
  const jamBisa = () => {
    const lewat = B.hari === kunci(new Date()) ? new Date().getHours() : 0, out = [];
    for (let j = 8; j <= 16; j++) if (j > lewat) out.push(`${String(j).padStart(2, "0")}.00`);
    return out;
  };
  const dipilih = () => SERVIS.filter(s => B.pilih.includes(s.id) && s.h[motor]);
  const totalServis = () => dipilih().reduce((s, x) => s + x.h[motor], 0) + ($("#fAntar").checked ? 25000 : 0);
  function renderServis() {
    $("#daftarServis").innerHTML = SERVIS.filter(s => s.h[motor]).map(s => `<label class="harga__baris"><input type="checkbox" data-servis="${s.id}"${B.pilih.includes(s.id) ? " checked" : ""}><span><b>${s.n}</b><small>${s.f}</small></span><strong>${S.rupiah(s.h[motor])}</strong></label>`).join("");
    renderSpk();
  }
  function renderSpk() {
    const r = dipilih(), jam = jamBisa();
    if (!jam.includes(B.jam)) B.jam = "";
    $("#spkBaris").innerHTML = r.length ? r.map(s => `<li><span>${s.n}</span><b>${S.rupiah(s.h[motor])}</b></li>`).join("") : `<li><span>Belum ada servis dipilih.</span></li>`;
    $("#pilihHari").innerHTML = HARI.map(d => { const k = kunci(d); return `<button type="button" data-hari="${k}" aria-pressed="${k === B.hari}">${d.toLocaleDateString("id-ID", { weekday: "short" })}<b>${d.getDate()}</b></button>`; }).join("");
    $("#pilihJam").innerHTML = !B.hari ? `<p class="kecil">Pilih hari dulu.</p>` : jam.length ? jam.map(j => `<button type="button" data-jam="${j}" aria-pressed="${j === B.jam}">${j}</button>`).join("") : `<p class="kecil">Jam hari ini sudah habis. Pilih hari lain.</p>`;
    $("#totalS").textContent = S.rupiah(totalServis());
  }
  $("#daftarServis").onchange = e => { const c = e.target.dataset.servis; if (c) { B.pilih = e.target.checked ? [...B.pilih, c] : B.pilih.filter(x => x !== c); renderSpk(); } };
  $("#fAntar").onchange = renderSpk;
  $("#pilihHari").onclick = e => { const b = e.target.closest("[data-hari]"); if (b) { B.hari = b.dataset.hari; renderSpk(); } };
  $("#pilihJam").onclick = e => { const b = e.target.closest("[data-jam]"); if (b) { B.jam = b.dataset.jam; renderSpk(); } };
  $("#formServis").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNamaS").value.trim(), plat = $("#fPlatS").value.trim(), r = dipilih(), g = $("#galatS"), antar = $("#fAntar").checked, t = totalServis();
    g.textContent = !r.length ? "Pilih minimal satu servis." : !B.hari || !B.jam ? "Pilih hari dan jam masuk." : !nama ? "Isi nama dulu." : "";
    if (g.textContent) return;
    bukaKasir({
      judul: "Bayar servis", nilai: t, tipe: "servis", ket: r.map(s => s.n).join(", "),
      teks: k => `Halo Bengkel Maju Jaya, saya sudah bayar booking servis.\n\nKode: *${k}*\nNama: ${nama}\nMotor: ${MOTOR[motor]}${plat ? ` (${plat})` : ""}\nHari: ${fmtHari(B.hari)}\nJam: ${B.jam} WIB\n${antar ? "Motor dijemput dari rumah\n" : ""}\n` + r.map(s => `- ${s.n}: ${S.rupiah(s.h[motor])}`).join("\n") + `\n\n*Dibayar: ${S.rupiah(t)}*`
    });
  });

  /* ---------- hitung ganti oli ---------- */
  const angka = el => +el.value.replace(/\D/g, "");
  function renderOli() {
    const jalan = angka($("#kmKini")) - angka($("#kmLama")), batas = INTERVAL[motor], sisa = batas - jalan, h = $("#oliHasil");
    const tampil = String(Math.max(0, Math.abs(sisa))).padStart(5, "0").slice(-5);
    $("#odo").innerHTML = [...tampil].map(c => `<i>${c}</i>`).join("") + "<span>km</span>";
    $("#odo").classList.toggle("lewat", sisa < 0);
    $("#oliBar").style.width = `${Math.max(0, Math.min(100, jalan / batas * 100))}%`;
    h.textContent = jalan < 0 ? "KM sekarang lebih kecil dari KM ganti terakhir. Cek lagi angkanya." : sisa < 0 ? `Sudah lewat ${Math.abs(sisa).toLocaleString("id-ID")} km. Sebaiknya ganti oli minggu ini.` : sisa <= 300 ? `Tinggal ${sisa.toLocaleString("id-ID")} km lagi. Siapkan oli barumu.` : `Masih aman, ganti oli ${sisa.toLocaleString("id-ID")} km lagi. Jadwal ${MOTOR[motor].toLowerCase()}: tiap ${batas.toLocaleString("id-ID")} km.`;
  }
  $("#kmLama").oninput = $("#kmKini").oninput = renderOli;
  $("#beliOli").onclick = () => tambah("oli");

  /* ---------- kasir: WhatsApp hanya terbuka dari layar berhasil ---------- */
  const CATAT = "Sudah membayar? Tekan Cek pembayaran. WhatsApp baru terbuka kalau pembayaran berhasil. Mode contoh: pembayaran selalu dianggap berhasil dan tidak ada uang yang diproses.";
  const kasir = $("#kasir"); let K = null, kode = "", detik = 0, timer = 0;
  const akun = rows => `<ul class="akun">${rows.map(([n, no]) => `<li><span>${n}</span><b>${no}</b><button type="button" data-salin="${no.replace(/\s/g, "")}">Salin</button></li>`).join("")}</ul><p class="kecil">a.n. Bengkel Maju Jaya. Nomor ini contoh. Transfer tepat ${S.rupiah(K.nilai)}.</p>`;
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
    "QRIS": () => `<div class="qris"><svg viewBox="0 0 21 21" role="img" aria-label="Contoh kode QRIS">${qr()}</svg><div><b>Bengkel Maju Jaya</b><p>Pindai dengan aplikasi bank atau e-wallet apa pun, lalu masukkan ${S.rupiah(K.nilai)}.</p><p>Kode ini contoh. Di website asli diganti QRIS milik bengkel.</p></div></div>`,
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
  function bukaKasir(k) {
    K = k; kode = S.kode("MJ", 4); detik = 900;
    $("#kasirJudul").textContent = k.judul; $("#kasirKode").textContent = kode; $("#kasirNilai").textContent = S.rupiah(k.nilai); $("#kasirCatat").textContent = CATAT;
    $("#kasirBayar").hidden = false; $("#kasirBerhasil").hidden = true; $("#sudahBayar").textContent = "Cek pembayaran";
    renderBayar(); clearInterval(timer); tik(); timer = setInterval(tik, 1000);
    kasir.showModal();
  }
  kasir.addEventListener("close", () => clearInterval(timer));
  $$("[data-tutup]").forEach(b => b.onclick = () => b.closest("dialog").close());
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
    const riwayat = baca("mj.riwayat", {}); riwayat[kode] = { tipe: K.tipe, ket: K.ket, t: Date.now() }; tulis("mj.riwayat", riwayat);
    K.bayar = $('[name="bayar"]:checked').value; K.selesai?.();
  };
  $("#keWa").onclick = () => {
    // contoh: tanpa nomor tujuan, di website asli diganti nomor bengkel
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${K.teks(kode)}\nLewat: ${K.bayar}`)}`, "_blank", "noopener");
    kasir.close();
  };
  $("#keLacak").onclick = () => { kasir.close(); $("#fLacak").value = kode; lacak(kode); $("#lacak").scrollIntoView(); };

  /* ---------- lacak ---------- */
  const TAHAP = {
    jemput: ["Pesanan diterima", "Mekanik berangkat", "Tiba di lokasimu", "Motor ditangani", "Selesai"],
    part: ["Pesanan diterima", "Barang disiapkan", "Siap diambil atau dikirim", "Selesai"],
    servis: ["Jadwal diterima", "Motor masuk bengkel", "Sedang dikerjakan", "Uji jalan", "Siap diambil"]
  };
  const CONTOH = "MJ-CONTOH"; let dilacak = "", tLacak = 0;
  function lacak(k) {
    dilacak = k.trim().toUpperCase(); clearInterval(tLacak);
    const w = $("#hasilLacak"), r = dilacak === CONTOH ? { tipe: "jemput", ket: "Ban bocor, Matic", t: Date.now() - 150000 } : baca("mj.riwayat", {})[dilacak];
    if (!r) { w.innerHTML = `<p>Kode <b>${esc(dilacak)}</b> tidak ditemukan. Cek lagi penulisannya.</p>`; return; }
    const gambar = () => {
      const langkah = TAHAP[r.tipe], kini = Math.min(langkah.length - 1, Math.floor((Date.now() - r.t) / 60000));
      w.innerHTML = `<h3>${esc(dilacak)}</h3><p>${esc(r.ket)}</p><ol class="tahap">${langkah.map((l, i) => `<li class="${i < kini ? "lewat" : i === kini ? "kini" : ""}"${i === kini ? ' aria-current="step"' : ""}>${l}</li>`).join("")}</ol><p class="kecil">Mode contoh: status maju sendiri tiap satu menit.</p>`;
    };
    gambar(); tLacak = setInterval(gambar, 15000);
  }
  $("#formLacak").addEventListener("submit", e => { e.preventDefault(); if ($("#fLacak").value.trim()) lacak($("#fLacak").value); });
  lacak(CONTOH);

  /* ---------- gerak: pita dan motor terurai mengikuti scroll ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, bongkar = $("#bongkar"), pita = $$(".pita");
  let antre = false;
  function gerak() {
    antre = false;
    const b = bongkar.getBoundingClientRect(), p = Math.max(0, Math.min(1, -b.top / (b.height - innerHeight)));
    bongkar.style.setProperty("--p", p.toFixed(3));
    pita.forEach(x => { x.style.backgroundPositionX = `${-scrollY * .35}px`; });
    const j = $("#jemput").getBoundingClientRect(), l = $("#lokasi").getBoundingClientRect();
    $("#apung").classList.toggle("sembunyi", (j.top < innerHeight * .6 && j.bottom > innerHeight * .4) || l.top < innerHeight * .7);
  }
  if (reduce) bongkar.style.setProperty("--p", 1);
  addEventListener("scroll", () => { if (!antre) { antre = true; requestAnimationFrame(reduce ? () => { antre = false; } : gerak); } }, { passive: true });
  if (!reduce) gerak();

  /* ---------- muncul saat di-scroll ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("tampak"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".langkah, .taksir, .fiche__kiri, .fiche__kartu, .rak, .servis__kiri > *, .spk, .oli__isi > *, .tim__video, .tim__teks, .tim figure, .garansi > div, .lacak > div, .lokasi > div").forEach(el => { el.classList.add("muncul"); io.observe(el); });
  }

  renderMotor(); renderCart();
})();
