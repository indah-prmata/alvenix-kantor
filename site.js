/* alvenix — halaman depan · Kinetic Luxe */
(() => {
  const CFG = window.HQ_CONFIG || {};
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- karya: susunan asimetris, klik = buka demo ---------- */
  const WORK = [
    ["kopi", "featured", "Kopi Senja", "Kedai Kopi", "Jambi", 4.8, 640, "Landing page"],
    ["salon-hp", "tall", "Salon Ayu", "Salon Kecantikan", "Jakarta", 4.9, 812, "Tampilan HP"],
    ["bengkel", "sq", "Bengkel Maju Jaya", "Bengkel Sepeda Motor", "Jambi", 4.8, 359, "Landing page"],
    ["katering", "wide", "Dapur Mama", "Katering", "Jambi", 4.8, 275, "Website"],
    ["klinik", "half", "Klinik Senyum", "Klinik Gigi", "Jakarta", 4.9, 410, "Website"],
    ["butik", "half", "Butik Anggun", "Butik", "Jambi", 4.7, 188, "Website"]
  ];
  $("#porto").innerHTML = WORK.map(([img, span, n, c, city, r, u, jenis], i) => `
    <a class="work work--${span} reveal" target="_blank" rel="noopener" href="${esc(S.links.demo({ name: n, category: c, city, rating: r, reviews: u }))}">
      <div class="work__img"><img src="contoh/porto-${img}.jpg" alt="Website ${esc(n)}" loading="lazy"></div>
      <div class="work__cap"><span class="work__no">${String(i + 1).padStart(2, "0")}</span><div><b>${esc(n)}</b><small>${esc(c)} · ${esc(jenis)}</small></div><em>${esc(city)}</em></div>
    </a>`).join("");

  /* ---------- harga: Website (unggulan, gelap) lebih lebar ---------- */
  const PK = CFG.paket || [];
  const fmt = n => n >= 1e6 ? `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })}<small>jt</small>` : `${Math.round(n / 1e3)}<small>rb</small>`;
  const TAG = { landing: "Satu halaman yang langsung mengajak pelanggan chat.", profil: "Kantor online lengkap untuk usaha yang ingin tampil resmi." };
  $("#prices").innerHTML = PK.map((p, i) => {
    const feat = i === PK.length - 1;
    return `<article class="plan ${feat ? "plan--featured" : ""} reveal">
      <div class="plan__name">${esc(p.nama)}${S.hemat(p) ? `<span class="plan__save">Hemat ${S.hemat(p)}%</span>` : ""}</div>
      <p class="plan__tag">${esc(TAG[p.id] || p.ringkas)}</p>
      <div class="plan__price"><b>Rp${fmt(p.harga)}</b>${p.hargaNormal > p.harga ? `<s>${S.rupiah(p.hargaNormal)}</s>` : ""}</div>
      <div class="plan__rule"></div>
      <ul>${p.isi.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <button class="pill ${feat ? "pill--light" : "pill--dark"}" type="button" data-pick="${esc(p.nama)}">Pilih ${esc(p.nama)}</button>
    </article>`;
  }).join("");
  if (CFG.promo) $("#promoBadge").textContent = CFG.promo; else $("#promoBadge").remove();
  $("#renew").textContent = S.rupiah(CFG.biayaTahunan || 1500000);
  $("#year").textContent = new Date().getFullYear();

  /* ---------- konsultasi lewat Dina dulu, baru WhatsApp ---------- */
  const waLangsung = text => window.open(S.waLink(CFG.waKantor, text), "_blank", "noopener");
  document.addEventListener("click", e => {
    if (e.target.closest("[data-konsul]")) {
      e.preventDefault();
      window.HQ_CHAT ? window.HQ_CHAT.ask("Halo, saya mau konsultasi dulu") : waLangsung(`Halo ${CFG.brand}, saya mau konsultasi bikin website.`);
      return;
    }
    const pick = e.target.closest("[data-pick]");
    if (pick) { window.HQ_CHAT ? window.HQ_CHAT.ask(`Saya tertarik paket ${pick.dataset.pick}`) : waLangsung(`Halo ${CFG.brand}, saya tertarik paket ${pick.dataset.pick}.`); return; }
    const t = e.target.closest("[data-try]");
    if (t) location.href = "klien.html#k=" + t.dataset.try;
  });
  $("#progForm").addEventListener("submit", e => {
    e.preventDefault();
    location.href = "klien.html#k=" + encodeURIComponent($("#progCode").value.trim().toUpperCase());
  });

  /* ---------- muncul saat terlihat: baris judul satu per satu ---------- */
  const io = new IntersectionObserver(es => es.forEach(x => {
    if (!x.isIntersecting) return;
    const el = x.target;
    if (el.matches("h1, h2, blockquote")) $$(".mask", el).forEach((m, i) => setTimeout(() => m.classList.add("in"), i * 140));
    else el.classList.add("in");
    io.unobserve(el);
  }), { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (el.closest(".works, .index__list, .steps, .numbers__in") ? (i % 3) * 90 : 0) + "ms"; io.observe(el); });
  $$("h1, h2, blockquote").filter(h => h.querySelector(".mask")).forEach(h => io.observe(h));
  // hero langsung tampil saat halaman dibuka
  requestAnimationFrame(() => {
    $$(".hero .mask").forEach((m, i) => setTimeout(() => m.classList.add("in"), 120 + i * 160));
    $$(".hero .reveal").forEach((r, i) => setTimeout(() => r.classList.add("in"), 500 + i * 140));
  });

  /* ---------- gerakan terikat scroll (satu per bagian) ---------- */
  /* kantor 3D: ikut gerak mouse, lembut */
  const tilt = $("#tilt");
  window.Office?.focus(null);
  if (tilt && !calm && matchMedia("(pointer: fine)").matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("pointermove", e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
    (function loop() { cx += (tx - cx) * .05; cy += (ty - cy) * .05; tilt.style.transform = `rotateY(${cx * 12}deg) rotateX(${-cy * 9}deg)`; requestAnimationFrame(loop); })();
  }

  const nav = $("#nav"), heroX = $("#heroX"), show = $("#showcase");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle("is-scrolled", y > 8);
    if (calm) return;
    // huruf "x" raksasa melayang naik pelan
    heroX.style.transform = `translate3d(0, ${y * -0.18}px, 0) rotate(${y * 0.01}deg)`;
    // showcase: bingkai terbuka & gambar mendekat saat di-scroll
    const r = show.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
    show.style.setProperty("--clip", `${(1 - p) * 12}%`);
    show.style.setProperty("--zoom", (1.08 - p * 0.08).toFixed(4));
    show.style.setProperty("--lift", `${(1 - p) * 60}px`);
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
