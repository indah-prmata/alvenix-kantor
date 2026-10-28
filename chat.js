/* =========================================================
   Dina — chat otomatis untuk konsumen.
   • Menjawab pertanyaan (harga, revisi, domain, dll.) dan mengikuti konteks obrolan.
   • Kalau CFG.chatUrl (n8n + AI) aktif, jawaban dari AI; kalau tidak, dari basis jawaban di bawah.
   • Begitu konsumen berminat → tanya nama/usaha/paket → langsung pindah ke WhatsApp Tim Negosiasi.
   Pasang: config.js + shared.js + chat.js. Konteks halaman opsional: window.HQ_CHAT_CTX = { usaha, jenis, halaman }.
   ========================================================= */
(() => {
  const CFG = window.HQ_CONFIG || {};
  const S = window.HQ_SHARED;
  const PAGE = window.HQ_CHAT_CTX || {};
  const NEGO = (CFG.negotiator && CFG.negotiator.whatsapp) || CFG.waKantor;
  const R = S.rupiah;
  const PK = CFG.paket || [];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- tampilan ---------------- */
  const css = document.createElement("style");
  css.textContent = `
  .dn-fab{position:fixed;right:18px;bottom:18px;z-index:900;display:flex;align-items:center;gap:10px;padding:8px 18px 8px 8px;border:0;border-radius:999px;cursor:pointer;
    background:#0b1a20;color:#eef5f6;font:600 14px/1 "Manrope",system-ui,sans-serif;box-shadow:0 14px 40px -10px rgba(0,0,0,.55),0 0 0 1px rgba(34,184,198,.45);transition:transform .3s}
  .dn-fab:hover{transform:translateY(-2px)}
  .dn-fab__av{position:relative;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font:700 15px "Outfit",system-ui;color:#fff;
    background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.5),transparent 40%),linear-gradient(140deg,#7ff0fb,#22b8c6 55%,#0a4f5a)}
  .dn-fab__av::after{content:"";position:absolute;right:0;bottom:1px;width:11px;height:11px;border-radius:50%;background:#5ee69a;border:2px solid #0b1a20}
  .dn-fab small{display:block;font-weight:500;font-size:11px;color:#84959b;margin-top:3px}
  .dn-fab__dot{position:absolute;top:2px;left:34px;min-width:18px;height:18px;border-radius:9px;background:#ef6a3a;color:#fff;font:700 10px/18px system-ui;text-align:center}
  .dn{position:fixed;right:18px;bottom:18px;z-index:901;width:min(380px,calc(100vw - 24px));height:min(600px,calc(100dvh - 36px));display:flex;flex-direction:column;
    border-radius:22px;overflow:hidden;background:#071116;color:#e8f2f4;font:14px/1.5 "Manrope",system-ui,sans-serif;
    box-shadow:0 30px 80px -20px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08);transform-origin:bottom right;transition:transform .35s cubic-bezier(.2,.7,.1,1),opacity .3s}
  .dn[hidden]{display:flex;opacity:0;transform:scale(.85);pointer-events:none}
  .dn__head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(120deg,rgba(34,184,198,.22),rgba(239,106,58,.1));border-bottom:1px solid rgba(255,255,255,.07)}
  .dn__head b{display:block;font-size:15px}
  .dn__head span{font-size:12px;color:#8fd9a8}
  .dn__x{margin-left:auto;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:transparent;color:#cfe;cursor:pointer;font-size:16px}
  .dn__log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
  .dn__m{max-width:86%;padding:10px 13px;border-radius:16px;white-space:pre-line;animation:dnIn .3s ease both}
  .dn__m--bot{align-self:flex-start;background:rgba(255,255,255,.06);border-bottom-left-radius:5px}
  .dn__m--me{align-self:flex-end;background:linear-gradient(140deg,#22b8c6,#13879a);color:#021417;font-weight:500;border-bottom-right-radius:5px}
  .dn__m b{color:#fff}.dn__m--me b{color:#021417}
  .dn__m a.dn__wa{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;padding:11px 14px;border-radius:12px;background:#1faa59;color:#fff;font-weight:700;text-decoration:none}
  .dn__typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06)}
  .dn__typing i{width:6px;height:6px;border-radius:50%;background:#84959b;animation:dnDot 1s infinite}
  .dn__typing i:nth-child(2){animation-delay:.15s}.dn__typing i:nth-child(3){animation-delay:.3s}
  .dn__chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}
  .dn__chips button{border:1px solid rgba(34,184,198,.45);background:rgba(34,184,198,.08);color:#bff4fa;border-radius:999px;padding:7px 12px;font:600 12.5px "Manrope",system-ui;cursor:pointer}
  .dn__chips button:hover{background:rgba(34,184,198,.2)}
  .dn__form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.07)}
  .dn__form input{flex:1;min-width:0;height:44px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;font:inherit;outline:none}
  .dn__form input:focus{border-color:#22b8c6}
  .dn__form button{width:44px;height:44px;border-radius:50%;border:0;background:#22b8c6;color:#021417;cursor:pointer;display:grid;place-items:center}
  .dn__form svg{width:18px;height:18px}
  .dn__foot{padding:0 0 10px;text-align:center;font-size:10.5px;color:#52636a}
  @keyframes dnIn{from{opacity:0;transform:translateY(6px)}}
  @keyframes dnDot{50%{opacity:.25;transform:translateY(-2px)}}`;
  document.head.appendChild(css);

  const fab = document.createElement("button");
  fab.className = "dn-fab"; fab.type = "button";
  fab.innerHTML = `<span class="dn-fab__av">D</span><span>Tanya Dina<small>biasanya membalas langsung</small></span><span class="dn-fab__dot">1</span>`;
  const box = document.createElement("section");
  box.className = "dn"; box.hidden = true; box.setAttribute("aria-label", "Chat dengan Dina");
  box.innerHTML = `
    <header class="dn__head"><span class="dn-fab__av">D</span><div><b>Dina · alvenix</b><span>● online — asisten otomatis</span></div><button class="dn__x" type="button" aria-label="Tutup">✕</button></header>
    <div class="dn__log" role="log" aria-live="polite"></div>
    <div class="dn__chips"></div>
    <form class="dn__form" autocomplete="off"><input placeholder="Tulis pertanyaan…" aria-label="Pesan"><button type="submit" aria-label="Kirim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form>
    <div class="dn__foot">Dina asisten otomatis · bisa langsung disambungkan ke tim kami</div>`;
  document.body.append(fab, box);
  const log = box.querySelector(".dn__log"), chipsEl = box.querySelector(".dn__chips"), form = box.querySelector("form"), input = form.querySelector("input");

  const history = [];   // {role:"user"|"bot", text}
  const ctx = { paket: "", nama: "", usaha: PAGE.usaha || "", step: "", wantYes: "" };
  let aiDown = !CFG.chatUrl;

  function add(role, html, text) {
    const m = document.createElement("div");
    m.className = "dn__m dn__m--" + (role === "user" ? "me" : "bot");
    m.innerHTML = html;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
    history.push({ role, text: text ?? m.textContent });
  }
  function chips(list) { chipsEl.innerHTML = (list || []).map(c => `<button type="button">${esc(c)}</button>`).join(""); }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function say(html, list, delay = 650) {
    chips([]);
    const t = document.createElement("div"); t.className = "dn__typing"; t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t); log.scrollTop = log.scrollHeight;
    await wait(delay); t.remove();
    add("bot", html); chips(list);
  }

  /* ---------------- pemahaman bahasa ---------------- */
  const SLANG = { brp: "berapa", brapa: "berapa", hrg: "harga", hrga: "harga", gmn: "gimana", gimana: "bagaimana", bs: "bisa", bsa: "bisa", gk: "tidak", ga: "tidak", gak: "tidak", nggak: "tidak", engga: "tidak", tdk: "tidak",
    web: "website", webset: "website", websitenya: "website", lp: "landing", landingpage: "landing", yg: "yang", dgn: "dengan", sy: "saya", aku: "saya", gw: "saya", gua: "saya", kak: "", min: "", mas: "", mba: "", mbak: "", bu: "", pak: "",
    tq: "terima kasih", makasih: "terima kasih", thx: "terima kasih", ok: "oke", okey: "oke", sip: "oke", gas: "mau", cuss: "mau", jd: "jadi", udh: "sudah", udah: "sudah", sdh: "sudah", blm: "belum", hp: "hp", ig: "instagram" };
  // buang akhiran -nya/-kah/-lah ("domainnya" -> "domain", "berapakah" -> "berapa")
  const stem = w => { const m = w.match(/^(.{4,}?)(nya|kah|lah)$/); return m ? m[1] : w; };
  const norm = s => " " + String(s).toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s.]/gu, " ").split(/\s+/).map(w => SLANG[w] ?? SLANG[stem(w)] ?? stem(w)).join(" ").replace(/\s+/g, " ") + " ";
  const has = (t, re) => re.test(t);

  const minatRe = /\b(minat|tertarik|mau (bikin|buat|pesan|order|ambil|website|landing|paket)|pesan|order|ambil paket|jadi (bikin|buat|ambil)|deal|setuju|lanjut|daftar|bikinin|buatin|saya mau)\b/;
  const negoRe = /\b(diskon|promo|nego|kurang(in)?|murah(in)?|potongan|harga (khusus|teman))\b/;
  const humanRe = /\b(admin|manusia|orang|cs|customer service|telepon|telpon|hubungi|kontak|nomor wa|whatsapp)\b/;

  function paketFrom(t) {
    if (/\blanding\b/.test(t)) return "landing";
    if (/\b(profil|company|5 halaman|lima halaman)\b/.test(t)) return "profil";
    if (/\b(lengkap|katalog|toko|10 halaman)\b/.test(t)) return "lengkap";
    return "";
  }
  const pkLine = p => `• <b>${esc(p.nama)}</b> — ${R(p.harga)}\n   ${esc(p.ringkas)}`;
  const saranJenis = { salon: "landing", bengkel: "landing", laundry: "landing", kuliner: "profil", katering: "profil", klinik: "profil", butik: "lengkap", umum: "landing" };

  // basis jawaban: [pola, fungsi jawaban -> [html, chips]]
  const KB = [
    [/\b(halo|hai|hi|hello|pagi|siang|sore|malam|assalamualaikum|permisi|salam)\b/, () => [`Halo! 👋 Saya Dina dari ${esc(CFG.brand)}. Ada yang bisa saya bantu soal website ${ctx.usaha ? "untuk <b>" + esc(ctx.usaha) + "</b>" : "untuk usaha Ibu/Bapak"}?`, ["Berapa harganya?", "Apa bedanya paket?", "Saya tertarik"]]],
    [/\b(terima kasih)\b/, () => ["Sama-sama 😊 Kalau nanti ada yang ingin ditanyakan lagi, Dina ada di sini ya.", ["Saya tertarik", "Lihat paket"]]],
    [/\b(beda|bedanya|perbedaan|pilih|cocok|sarankan|rekomendasi|mana yang)\b/, () => {
      const s = PK.find(p => p.id === saranJenis[PAGE.jenis || "umum"]) || PK[0];
      return [`Singkatnya:\n• <b>Landing page</b> = 1 halaman seperti brosur yang bisa diklik, fokus ke tombol WhatsApp. Paling hemat & cepat.\n• <b>Website profil</b> = beberapa halaman (layanan, galeri, kontak), lebih lengkap & resmi.\n• <b>Website lengkap</b> = ditambah katalog/menu & form pesan.\n\nUntuk ${PAGE.jenis && PAGE.jenis !== "umum" ? "usaha seperti ini" : "kebanyakan UMKM"}, Dina sarankan <b>${esc(s.nama)}</b> (${R(s.harga)}).`, [`Ambil ${s.nama}`, "Biaya per tahun?", "Bisa revisi?"]];
    }],
    [/\b(tahun|tahunan|perpanjang|perpanjangan|bulanan|per bulan|langganan|tiap tahun)\b/, () => [`Tahun pertama sudah termasuk di harga paket. Mulai tahun ke-2 cukup <b>${R(CFG.biayaTahunan)}/tahun</b> — itu sudah mencakup domain, hosting, keamanan, cadangan data, dan perbaikan error. Tidak ada biaya bulanan.`, ["Ada biaya tersembunyi?", "Saya tertarik"]]],
    [/\b(tersembunyi|tambahan|hidden)\b/, () => ["Tidak ada 🙏 Semua biaya disampaikan di awal: biaya pembuatan, lalu biaya tahunan mulai tahun ke-2. Kalau nanti ada fitur tambahan yang Ibu/Bapak minta sendiri, harganya kami sampaikan dulu sebelum dikerjakan.", ["Saya tertarik", "Bisa revisi?"]]],
    [/\b(revisi|ubah|ganti desain|perbaiki desain|tidak suka|kurang suka)\b/, () => [`Bisa, <b>maksimal ${CFG.maksRevisi || 5} kali revisi</b> selama website dibuat — ganti warna, teks, foto, susunan. Tipsnya: kumpulkan semua perubahan dalam <b>satu pesan</b>, karena satu pesan dihitung satu revisi walau isinya banyak.`, ["Kalau ada error?", "Berapa lama jadinya?"]]],
    [/\b(error|eror|bug|rusak|tidak bisa dibuka|down|garansi|bermasalah)\b/, () => ["Error atau bug <b>apa pun itu</b> — tombol tidak jalan, tampilan berantakan di HP, website tidak bisa dibuka — <b>langsung kami kerjakan tanpa biaya</b>, dan tidak mengurangi jatah revisi. Berlaku selama website aktif bersama kami.", ["Biaya per tahun?", "Saya tertarik"]]],
    [/\b(lama|berapa hari|kapan jadi|durasi|waktu pengerjaan|cepat|selesai kapan)\b/, () => ["Tergantung paket dan kelengkapan bahan (logo, foto, daftar harga). Landing page yang paling cepat jadi. Begitu bahan lengkap, tim kami langsung mulai dan Ibu/Bapak bisa <b>memantau progresnya online</b> lewat kode proyek 😊", ["Saya harus siapkan apa?", "Saya tertarik"]]],
    [/\b(siapkan|bahan|persiapan|butuh apa|perlu apa|kirim apa)\b/, () => ["Cukup kirim lewat WhatsApp:\n• Logo (kalau ada)\n• Foto usaha / produk (dari HP pun bisa)\n• Daftar layanan/menu + harga\n• Alamat, jam buka & nomor WA\n\nBelum lengkap juga tidak apa-apa, nanti kami bantu arahkan.", ["Saya gaptek, ribet?", "Saya tertarik"]]],
    [/\b(gaptek|ribet|susah|tidak ngerti|bingung|awam)\b/, () => ["Sama sekali tidak ribet 😊 Ibu/Bapak cukup kirim foto & info lewat WhatsApp seperti biasa. Semua urusan teknis kami yang kerjakan. Setelah jadi, tinggal bagikan link-nya.", ["Berapa harganya?", "Saya tertarik"]]],
    [/\b(domain|alamat website|com|\.id|nama website)\b/, () => ["Domain itu <b>alamat website</b>, misalnya <i>namausaha.com</i> — bisa pakai nama usaha sendiri selama belum dipakai orang. <b>.com atau .id sudah termasuk</b> di semua paket, kami bantu cek & pilihkan.", ["Hosting itu apa?", "Biaya per tahun?"]]],
    [/\b(hosting|server|tempat simpan)\b/, () => ["Hosting itu <b>tempat website disimpan</b> supaya bisa dibuka 24 jam. Kalau domain alamatnya, hosting tanah & bangunannya. Sudah termasuk dan kami yang urus semuanya.", ["Aman tidak?", "Biaya per tahun?"]]],
    [/\b(aman|hack|hacker|keamanan|ssl|virus|dibobol)\b/, () => ["Website kami pakai <b>SSL (tanda gembok)</b> dan perlindungan dari serangan, plus cadangan data. Kalau ada masalah, langsung kami tangani tanpa biaya.", ["Bisa dibuka di HP?", "Saya tertarik"]]],
    [/\b(hp|handphone|mobile|android|iphone|tablet)\b/, () => ["Bisa — justru dibuat <b>utama untuk HP</b>, karena kebanyakan pelanggan membuka dari HP. Tampilannya otomatis rapi di HP, tablet, dan laptop.", ["Muncul di Google?", "Saya tertarik"]]],
    [/\b(google|seo|halaman 1|halaman pertama|ranking|muncul|dicari)\b/, () => ["Jujur ya: tidak ada yang bisa <b>menjamin</b> halaman 1 Google. Yang kami lakukan: website disusun supaya mudah dibaca Google (nama usaha, kota, layanan) dan dihubungkan dengan Google Maps. Biasanya butuh beberapa minggu sampai muncul di pencarian.", ["Sudah ada Instagram, perlu?", "Saya tertarik"]]],
    [/\b(instagram|facebook|tiktok|medsos|sosmed|media sosial|sudah ada maps|google maps|marketplace|shopee|tokopedia)\b/, () => ["Media sosial bagus untuk pengikut yang sudah ada. Website untuk <b>orang baru yang mencari di Google</b>, dan jadi “rumah sendiri” yang tidak bisa kena blokir atau turun jangkauan. Keduanya saling melengkapi — link website bisa dipasang di bio Instagram.", ["Berapa harganya?", "Saya tertarik"]]],
    [/\b(dp|uang muka|cicil|cicilan|transfer|pembayaran|bayarnya|rekening|qris|lunas)\b/, () => ["Pembayarannya <b>bertahap</b>: uang muka di awal, pelunasan setelah website jadi & Ibu/Bapak setujui. Detail & cara bayarnya dibantu langsung oleh Tim Negosiasi kami.", ["Sambungkan ke tim", "Berapa harganya?"]]],
    [/\b(contoh|demo|portofolio|hasil|lihat dulu|sample)\b/, () => PAGE.halaman === "demo"
      ? [`Halaman yang sedang Ibu/Bapak lihat ini adalah <b>contoh demo</b>${ctx.usaha ? " untuk <b>" + esc(ctx.usaha) + "</b>" : ""} 😊 Foto, warna, dan isinya nanti disesuaikan dengan usaha asli.`, ["Berapa harganya?", "Saya tertarik"]]
      : ["Bisa! Kami buatkan <b>demo gratis khusus untuk usaha Ibu/Bapak</b>, tanpa kewajiban. Boleh saya sambungkan ke tim supaya demonya disiapkan?", ["Ya, buatkan demo", "Berapa harganya?"], "demo"]],
    [/\b(progres|progress|sampai mana|status proyek|cek proyek|kode proyek|sudah sampai)\b/, () => [`Progres pengerjaan bisa dipantau di <b>Portal Klien</b>: <a href="${S.base()}klien.html" style="color:#7ff0fb">buka portal</a> lalu masukkan kode proyek dari tim kami.`, ["Sambungkan ke tim"]]],
    [/\b(ganti isi|update|ubah harga|ganti foto|edit sendiri|perubahan nanti)\b/, () => ["Setelah online, cukup kirim perubahan (harga, foto, info) lewat WhatsApp — tim kami yang bantu ubahkan.", ["Biaya per tahun?", "Saya tertarik"]]],
    [/\b(siapa|alvenix|kantor|alamat kantor|penipuan|tipu|percaya|amanah|terpercaya)\b/, () => [`${esc(CFG.brand)} adalah jasa pembuatan website & landing page untuk usaha di Jambi dan Jakarta. Ibu/Bapak bisa lihat <b>demo gratis dulu</b>, dan pembayarannya bertahap — pelunasan setelah website jadi & disetujui.`, ["Berapa harganya?", "Sambungkan ke tim"]]],
    [/\b(email|toko online|checkout|keranjang|booking|reservasi|dua bahasa|inggris|fitur)\b/, () => ["Bisa, sebagai tambahan atau lewat paket Website Lengkap (katalog + form pesan ke WhatsApp). Untuk fitur khusus seperti toko online, email bisnis, atau dua bahasa, tim kami yang hitungkan — mau saya sambungkan?", ["Sambungkan ke tim", "Lihat paket"], "tim"]],
    // paling umum — ditaruh terakhir supaya pertanyaan yang lebih spesifik menang
    [/\b(harga|biaya|berapa|tarif|price|budget|paket|mahal|bayar berapa)\b/, () => [`Ini paket kami:\n${PK.map(pkLine).join("\n")}\n\nSemua sudah <b>termasuk domain, hosting & keamanan untuk tahun pertama</b>, revisi sampai ${CFG.maksRevisi || 5} kali, dan perbaikan error tanpa biaya.`, ["Apa bedanya paket?", "Biaya per tahun?", "Saya tertarik"]]]
  ];

  /* ---------------- alur serah ke Tim Negosiasi ---------------- */
  function startHandoff(reason) {
    ctx.step = ctx.nama && ctx.usaha ? (ctx.paket ? "konfirmasi" : "paket") : "nama";
    if (ctx.step === "nama") return say(`Siap, dengan senang hati! ${reason === "nego" ? "Soal harga khusus akan dibantu langsung Tim Negosiasi kami. " : ""}Boleh tahu <b>nama Ibu/Bapak dan nama usahanya</b>?\n(contoh: Rina, Salon Bunga)`, []);
    if (ctx.step === "paket") return askPaket();
    return confirmHandoff();
  }
  function askPaket() {
    ctx.step = "paket";
    return say(`Terima kasih, ${esc(ctx.nama || "Kak")}! Paket mana yang paling menarik untuk <b>${esc(ctx.usaha)}</b>?`, [...PK.map(p => `${p.nama} (${R(p.harga)})`), "Belum tahu, minta saran"]);
  }
  function summary() {
    const p = S.paket(ctx.paket);
    const asked = history.filter(h => h.role === "user").map(h => h.text).slice(-6);
    return `Halo Tim ${CFG.brand} 👋\n\nSaya *${ctx.nama || "-"}* dari *${ctx.usaha || "-"}*.\nSaya tertarik dengan ${ctx.paket ? "paket *" + p.nama + "* (" + R(p.harga) + ")" : "website / landing page"}.` +
      (PAGE.halaman === "demo" ? `\n(Saya sudah lihat demonya: ${location.href.split("#")[0]}#…)` : "") +
      (asked.length ? `\n\nYang saya tanyakan ke Dina:\n- ${asked.join("\n- ")}` : "") + "\n\nMohon info langkah selanjutnya 🙏";
  }
  async function confirmHandoff() {
    ctx.step = "selesai";
    const text = summary();
    const url = S.waLink(NEGO, text);
    // catat ke n8n (kalau aktif) — supaya masuk Ruang Data sebagai lead "tertarik"
    if (CFG.minatUrl) fetch(CFG.minatUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama: ctx.nama, usaha: ctx.usaha, paket: ctx.paket, halaman: PAGE.halaman || "", sumber: location.href.split("#")[0], ringkasan: text }) }).catch(() => {});
    await say(`Sip! Saya sambungkan ke <b>Tim Negosiasi</b> kami di WhatsApp. Ringkasan obrolan kita sudah saya tuliskan, tinggal tekan kirim ya 😊<a class="dn__wa" href="${url}" target="_blank" rel="noopener">💬 Lanjut ke WhatsApp Tim Negosiasi</a>`, ["Ada pertanyaan lain"]);
    setTimeout(() => { try { window.open(url, "_blank", "noopener"); } catch {} }, 400);
  }

  /* ---------------- AI (n8n) ---------------- */
  async function askAI(text) {
    if (aiDown) return null;
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(CFG.chatUrl, { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-12), page: PAGE }) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      let j = await res.json(); if (Array.isArray(j)) j = j[0];
      if (!j || !j.reply) throw new Error("kosong");
      return j;
    } catch { aiDown = true; return null; }
  }

  /* ---------------- otak percakapan ---------------- */
  async function handle(raw) {
    const text = raw.trim(); if (!text) return;
    add("user", esc(text), text);
    const t = norm(text);

    // sedang mengisi data serah-terima
    if (ctx.step === "nama") {
      const parts = text.split(/,|\bdari\b|\-|\//).map(s => s.trim()).filter(Boolean);
      ctx.nama = parts[0] || text; ctx.usaha = ctx.usaha || parts[1] || "";
      if (!ctx.usaha) { ctx.step = "usaha"; return say(`Salam kenal, ${esc(ctx.nama)}! Nama usahanya apa?`, []); }
      return ctx.paket ? confirmHandoff() : askPaket();
    }
    if (ctx.step === "usaha") { ctx.usaha = text; return ctx.paket ? confirmHandoff() : askPaket(); }
    if (ctx.step === "paket") {
      const p = paketFrom(t) || (/belum|saran|bingung|terserah/.test(t) ? "" : "");
      ctx.paket = p; return confirmHandoff();
    }

    // jawaban "ya" untuk tawaran sebelumnya
    if (ctx.wantYes && /\b(ya|iya|boleh|oke|mau|bisa|silakan|lanjut|buatkan|sambungkan)\b/.test(t)) { ctx.wantYes = ""; return startHandoff(); }

    const p = paketFrom(t);
    if (p) ctx.paket = p;
    if (has(t, negoRe)) return startHandoff("nego");
    if (has(t, minatRe) || /\b(ambil|pilih)\b/.test(t) && p) return startHandoff();
    if (has(t, humanRe) || /\bsambungkan\b/.test(t)) return startHandoff();

    // tanya satu paket tertentu
    if (p && !/\b(beda|bedanya|banding)\b/.test(t)) {
      const k = S.paket(p);
      ctx.wantYes = "ambil";
      return say(`<b>${esc(k.nama)} — ${R(k.harga)}</b>\n${esc(k.ringkas)}\n${k.isi.map(x => "• " + esc(x)).join("\n")}\n\nSudah termasuk domain, hosting & keamanan tahun pertama. Mau ambil paket ini?`, [`Ya, ambil ${k.nama}`, "Biaya per tahun?", "Bisa revisi?"]);
    }

    // AI kalau aktif
    const ai = await askAI(text);
    if (ai) {
      const handoff = /\[\[SERAHKAN\]\]/.test(ai.reply);
      await say(esc(ai.reply.replace(/\[\[SERAHKAN\]\]/g, "").trim()).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"), handoff ? [] : ["Berapa harganya?", "Saya tertarik"], 200);
      if (handoff) return startHandoff();
      return;
    }

    // basis jawaban lokal: pilih pola yang paling banyak cocok
    // jawaban harga umum (entri terakhir) hanya dipakai kalau tidak ada topik lain yang cocok
    let best = null, bestScore = 0;
    KB.forEach(([re, fn], i) => {
      if (i === KB.length - 1) return;
      const m = t.match(new RegExp(re.source, "g"));
      if (m && m.length > bestScore) { best = fn; bestScore = m.length; }
    });
    if (!best && KB[KB.length - 1][0].test(t)) best = KB[KB.length - 1][1];
    if (best) {
      const [html, list, yes] = best();
      if (yes) ctx.wantYes = yes;
      return say(html, list);
    }
    ctx.wantYes = "tim";
    return say("Hmm, Dina belum yakin paham maksudnya 🙏 Mau saya sambungkan langsung ke tim kami di WhatsApp supaya dijawab lebih tepat?", ["Ya, sambungkan", "Berapa harganya?", "Apa bedanya paket?"]);
  }

  /* ---------------- events ---------------- */
  let opened = false;
  function open() {
    box.hidden = false; fab.style.display = "none";
    if (!opened) {
      opened = true;
      const pembuka = PAGE.halaman === "demo" && ctx.usaha
        ? `Halo! 👋 Saya Dina dari ${esc(CFG.brand)}. Ini contoh website yang kami siapkan untuk <b>${esc(ctx.usaha)}</b>. Ada yang ingin ditanyakan?`
        : PAGE.halaman === "klien" ? `Halo! 👋 Saya Dina. Ada yang bisa dibantu soal proyek website Ibu/Bapak?`
        : `Halo! 👋 Saya Dina dari ${esc(CFG.brand)}. Mau tanya soal website atau landing page untuk usaha Ibu/Bapak?`;
      say(pembuka, PAGE.halaman === "klien" ? ["Bisa revisi?", "Kalau ada error?", "Sambungkan ke tim"] : ["Berapa harganya?", "Apa bedanya paket?", "Saya tertarik"], 400);
    }
    setTimeout(() => input.focus(), 300);
  }
  fab.addEventListener("click", open);
  box.querySelector(".dn__x").addEventListener("click", () => { box.hidden = true; fab.style.display = ""; fab.querySelector(".dn-fab__dot").remove?.(); });
  form.addEventListener("submit", e => { e.preventDefault(); const v = input.value; input.value = ""; handle(v); });
  chipsEl.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const v = b.textContent;
    if (v === "Ada pertanyaan lain") { ctx.step = ""; add("user", esc(v)); return say("Silakan, tanya saja 😊", ["Berapa harganya?", "Bisa revisi?"]); }
    if (v === "Lihat paket") return handle("berapa harganya");
    handle(v);
  });
  // buka chat lalu kirim pesan atas nama konsumen (dipakai tombol "Saya mau paket ini")
  function ask(text) {
    const first = !opened;
    open();
    setTimeout(() => handle(text), first ? 1300 : 100);
  }
  window.HQ_CHAT = { open, ask };
  // buka otomatis sekali setelah 12 detik di halaman demo (menarik perhatian, tidak mengganggu)
  if (PAGE.halaman === "demo") setTimeout(() => { if (!opened && box.hidden) open(); }, 12000);
})();
