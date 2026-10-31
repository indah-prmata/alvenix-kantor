/* Kopi Senja: menu per jam langit, bon pesanan, kirim ke WhatsApp pemilik.
   shortcut: pembayaran dicek manual oleh pemilik; konfirmasi otomatis butuh payment gateway (Midtrans/Xendit) + backend. */
(() => {
  const CFG = window.HQ_CONFIG || {}, S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const WA = CFG.waKantor;

  const LANGIT = {
    sore: { warna: "#F2B24E", tinta: "#1C2430", judul: "Sore, jam tiga", isi: "Panas mulai turun. Kopi seduh dan teh dingin." },
    senja: { warna: "#F0667A", tinta: "#1C2430", judul: "Senja, jam enam", isi: "Langit merah muda di atas sungai. Es kopi andalan kedai." },
    malam: { warna: "#1E3A4C", aksen: "#8FB0BF", foto: "#8FB0BF", tinta: "#FFFFFF", judul: "Malam, jam delapan", isi: "Lampu menyala. Minuman hangat sampai tutup." },
    teman: { warna: "#E9B9A5", tinta: "#1C2430", judul: "Teman kopi", isi: "Kudapan khas Jambi, dibuat setiap hari." }
  };
  const MENU = [
    { id: "kopi-tubruk-kerinci", n: "Kopi Tubruk Kerinci", f: "Arabika Kerinci, panas, tanpa gula", h: 15000, l: "sore", lepas: true },
    { id: "liberika-tungkal", n: "Liberika Tungkal V60", f: "Wangi nangka, seduh manual", h: 28000, l: "sore" },
    { id: "es-teh-serai", n: "Es Teh Serai", f: "Teh hitam, serai, jeruk kunci", h: 14000, l: "sore" },
    { id: "es-kopi-senja", n: "Es Kopi Senja", f: "Kopi susu, gula aren, andalan kedai", h: 24000, l: "senja", besar: true },
    { id: "es-kopi-pandan", n: "Es Kopi Pandan", f: "Kopi susu, sirup pandan asli", h: 25000, l: "senja" },
    { id: "cokelat-aren", n: "Es Cokelat Aren", f: "Cokelat pekat, gula aren", h: 23000, l: "senja" },
    { id: "kopi-malam", n: "Kopi Malam Kerinci", f: "Arabika Kerinci, diseduh lebih pekat", h: 20000, l: "malam", lepas: true },
    { id: "srikayo-pandan", n: "Srikayo Pandan", f: "Kue srikaya khas Jambi", h: 12000, l: "teman" },
    { id: "pisang-goreng-keju", n: "Pisang Goreng Keju", f: "Pisang kepok, keju parut", h: 18000, l: "teman" },
    { id: "nasi-gemuk", n: "Nasi Gemuk Jambi", f: "Nasi santan, teri, sambal", h: 25000, l: "teman" },
    { id: "roti-bakar-srikaya", n: "Roti Bakar Srikaya", f: "Roti tebal, selai srikaya", h: 16000, l: "teman" }
  ];
  const GALERI = [
    ["suasana-sungai", "Sungai Batanghari saat senja dengan perahu kecil", "lebar"], ["suasana-seduh", "Barista menuang kopi di meja beton", ""],
    ["suasana-kettle", "Air panas dituang ke cangkir biru", ""], ["suasana-biji", "Biji kopi Kerinci selesai disangrai", ""],
    ["suasana-dek", "Kursi rotan di dek menghadap sungai", ""], ["suasana-tangan", "Pelanggan memegang cangkir di tepi sungai", "lebar"]
  ];
  const BAYAR = {
    "QRIS": () => `<div class="qris"><svg viewBox="0 0 21 21" role="img" aria-label="Contoh kode QRIS">${qr()}</svg><div><b>Kopi Senja</b><p>Pindai dengan aplikasi bank atau e-wallet apa pun, lalu masukkan ${S.rupiah(total())}.</p><p>Kode ini contoh. Di website asli diganti QRIS milik toko.</p></div></div>`,
    "E-wallet": () => akun([["GoPay", "0812 0000 0000"], ["OVO", "0812 0000 0000"], ["DANA", "0812 0000 0000"], ["ShopeePay", "0812 0000 0000"]]),
    "M-banking": () => akun([["BCA", "000 000 0000"], ["Mandiri", "000 000 000 0000"], ["BRI", "0000 00 000000 00 0"], ["BNI", "000 000 0000"]])
  };
  const akun = rows => `<ul class="akun">${rows.map(([n, no]) => `<li><span>${n}</span><b>${no}</b><button type="button" data-copy="${no.replace(/\s/g, "")}">Salin</button></li>`).join("")}</ul><p class="note">a.n. Kopi Senja. Nomor ini contoh. Transfer tepat ${S.rupiah(total())}.</p>`;
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

  const gambar = m => `<img src="img/${m.id}.jpg" alt="${esc(m.n)}" width="1000" height="1000" loading="lazy">`;

  /* ---------- bon ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem("ks.bon")) || {}; } catch { return {}; } };
  let bon = load();
  const simpan = () => { try { localStorage.setItem("ks.bon", JSON.stringify(bon)); } catch {} };
  const item = id => MENU.find(m => m.id === id);
  const baris = () => Object.entries(bon).filter(([id, q]) => q > 0 && item(id)).map(([id, q]) => ({ ...item(id), q }));
  const total = () => baris().reduce((s, m) => s + m.h * m.q, 0);
  const jumlah = () => baris().reduce((s, m) => s + m.q, 0);

  function ubah(id, d) {
    bon[id] = Math.max(0, (bon[id] || 0) + d);
    if (!bon[id]) delete bon[id];
    simpan(); renderBon();
  }
  function renderBon() {
    const r = baris();
    $("#bonList").innerHTML = r.length ? r.map(m => `<li><span>${esc(m.n)}<small>${S.rupiah(m.h)}</small></span><span class="qty"><button type="button" data-kurang="${m.id}" aria-label="Kurangi ${esc(m.n)}">−</button><b>${m.q}</b><button type="button" data-tambah="${m.id}" aria-label="Tambah ${esc(m.n)}">+</button></span><b>${S.rupiah(m.h * m.q)}</b></li>`).join("") : `<li class="kosong">Bon masih kosong. Pilih dari menu.</li>`;
    $("#bonTotal").textContent = S.rupiah(total());
    $$("[data-qty]").forEach(e => e.textContent = jumlah());
    $$("[data-count]").forEach(e => { const q = bon[e.dataset.count] || 0; e.textContent = q ? `Tambah (${q})` : "Tambah"; });
    const f = $("#floatbon"); f.hidden = !r.length;
    $("#floatText").textContent = `${jumlah()} item · ${S.rupiah(total())}`;
    renderPay();
  }
  function renderPay() { $("#payBox").innerHTML = BAYAR[document.querySelector('[name="bayar"]:checked').value](); }

  /* ---------- menu ---------- */
  $("#menu").innerHTML = `<div class="wrap menu__judul"><h2>Menu, dari sore sampai malam</h2></div>` + Object.entries(LANGIT).map(([k, L]) => `
    <section class="langit" style="--langit:${L.aksen || L.warna}" aria-label="${L.judul}">
      <div class="wrap">
        <div class="jam"><h3>${L.judul}</h3><p>${L.isi}</p></div>
        <div class="tiles tiles--${k}">${MENU.filter(m => m.l === k).map(m => `<article class="tile ${m.besar ? "tile--besar" : ""}">
          <div class="tile__foto ${m.lepas ? "tile__foto--lepas" : ""}" style="background:${L.foto || L.warna}">${gambar(m)}</div>
          <div class="tile__info"><h4>${esc(m.n)}</h4><p>${esc(m.f)}</p><div><b>${S.rupiah(m.h)}</b><button class="btn btn--sm" type="button" data-tambah="${m.id}" data-count="${m.id}">Tambah</button></div></div>
        </article>`).join("")}${k === "malam" ? `<figure class="tile__lebar"><img src="img/suasana-lampu.jpg" alt="Dek kedai saat lampu menyala setelah gelap" width="1600" height="1600" loading="lazy"></figure>` : ""}</div>
      </div>
    </section>`).join("");

  $("#galeri").innerHTML = GALERI.map(([f, alt, c]) => `<figure class="${c}"><img src="img/${f}.jpg" alt="${alt}" width="1200" height="900" loading="lazy"></figure>`).join("");

  /* ---------- hero: menu berjajar di lengkung ---------- */
  const PILIH = ["es-kopi-senja", "es-teh-serai", "es-kopi-pandan", "liberika-tungkal", "srikayo-pandan", "cokelat-aren"].map(item);
  let cur = 0;
  $("#arc").innerHTML = PILIH.map((m, i) => `<button type="button" class="arc__item" data-arc="${i}" aria-label="Lihat ${esc(m.n)}">${gambar(m)}</button>`).join("");
  function hero() {
    const n = PILIH.length, m = PILIH[cur], L = LANGIT[m.l];
    $("#hero").style.setProperty("--langit", L.aksen || L.warna);
    const lebar = innerWidth, langkah = Math.min(250, lebar * .24);
    $$(".arc__item").forEach((el, i) => {
      let d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      const a = Math.abs(d), sk = Math.pow(.7, a);
      el.style.transform = `translate(calc(-50% + ${d * langkah}px), calc(-50% + ${a % 2 ? -18 : 14 * a}px)) scale(${sk}) rotate(${d ? 0 : -4}deg)`;
      el.style.filter = a ? `brightness(${1 - a * .2})` : "";
      el.style.zIndex = 10 - a;
      el.tabIndex = a ? 0 : -1;
    });
    $("#heroName").textContent = m.n;
    $("#heroFact").textContent = `${m.f} · ${S.rupiah(m.h)}`;
    $("#heroAdd").textContent = `Tambah ke bon · ${S.rupiah(m.h)}`;
  }
  const geser = d => { cur = (cur + d + PILIH.length) % PILIH.length; hero(); };
  $("#prev").onclick = () => geser(-1);
  $("#next").onclick = () => geser(1);
  $("#heroAdd").onclick = () => ubah(PILIH[cur].id, 1);
  let x0 = null;
  $("#arc").addEventListener("pointerdown", e => { x0 = e.clientX; });
  addEventListener("pointerup", e => { if (x0 === null) return; const d = e.clientX - x0; x0 = null; if (Math.abs(d) > 40) geser(d < 0 ? 1 : -1); });
  addEventListener("resize", hero);

  /* ---------- klik ---------- */
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-arc]");
    if (a) { cur = +a.dataset.arc; hero(); return; }
    const t = e.target.closest("[data-tambah]"); if (t) return ubah(t.dataset.tambah, 1);
    const k = e.target.closest("[data-kurang]"); if (k) return ubah(k.dataset.kurang, -1);
    const c = e.target.closest("[data-copy]");
    if (c) navigator.clipboard?.writeText(c.dataset.copy).then(() => { c.textContent = "Tersalin"; setTimeout(() => c.textContent = "Salin", 1500); });
  });
  $$('[name="bayar"]').forEach(r => r.onchange = renderPay);
  $$('[name="terima"]').forEach(r => r.onchange = () => { $("#wrapAlamat").hidden = r.value !== "Antar" || !r.checked; });

  /* ---------- kirim ke pemilik ---------- */
  $("#form").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("#fNama").value.trim(), terima = document.querySelector('[name="terima"]:checked').value, alamat = $("#fAlamat").value.trim();
    const bayar = document.querySelector('[name="bayar"]:checked').value, r = baris(), err = $("#err");
    err.textContent = !r.length ? "Bon masih kosong. Pilih menu dulu." : !nama ? "Isi nama dulu." : terima === "Antar" && !alamat ? "Isi alamat antar dulu." : "";
    if (err.textContent) return;
    const teks = `Halo Kopi Senja, saya mau pesan.\n\nNo. pesanan: *${S.kode("KS", 4)}*\nNama: ${nama}\nTerima: ${terima}${terima === "Antar" ? `\nAlamat: ${alamat}` : ""}\n\n` +
      r.map(m => `${m.q}x ${m.n} = ${S.rupiah(m.h * m.q)}`).join("\n") + `\n\n*Total: ${S.rupiah(total())}*\nBayar: ${bayar}` +
      ($("#fCatatan").value.trim() ? `\nCatatan: ${$("#fCatatan").value.trim()}` : "") + "\n\nBukti bayar saya kirim setelah ini.";
    window.open(S.waLink(WA, teks), "_blank", "noopener");
  });

  /* ---------- muncul saat di-scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .1 });
  document.documentElement.classList.add("js");
  $$(".tile, .jam, .masonry figure, .cerita__grid > div:first-child, .struk").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });

  // foto pembuka bergerak pelan saat digulir
  const foto = $(".sampul img");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) addEventListener("scroll", () => { if (scrollY < innerHeight) foto.style.transform = `translateY(${scrollY * .18}px) scale(1.04)`; }, { passive: true });

  hero(); renderBon();
})();
