/* alvenix — halaman depan */
(() => {
  const CFG = window.HQ_CONFIG || {};
  const S = window.HQ_SHARED;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rb = n => n >= 1e6 ? `Rp${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })}<small>jt</small>` : `Rp${Math.round(n / 1e3)}<small>rb</small>`;

  /* ---------- portofolio: screenshot demo sungguhan, klik = buka demo ---------- */
  const WORK = [
    ["kopi", "Kopi Senja", "Kedai Kopi", "Jambi", 4.8, 640, "Landing page"],
    ["salon", "Salon Ayu", "Salon Kecantikan", "Jakarta", 4.9, 812, "Landing page"],
    ["bengkel", "Bengkel Maju Jaya", "Bengkel Sepeda Motor", "Jambi", 4.8, 359, "Landing page"],
    ["klinik", "Klinik Senyum", "Klinik Gigi", "Jakarta", 4.9, 410, "Website"],
    ["katering", "Dapur Mama", "Katering", "Jambi", 4.8, 275, "Website"],
    ["butik", "Butik Anggun", "Butik", "Jambi", 4.7, 188, "Website"]
  ];
  $("#porto").innerHTML = WORK.map(([k, n, c, city, r, u, jenis]) => `
    <a class="work rise" data-j="${esc(jenis)}" target="_blank" rel="noopener" href="${esc(S.links.demo({ name: n, category: c, city, rating: r, reviews: u }))}">
      <div class="work__img"><img src="contoh/porto-${k}.jpg" alt="Tampilan website ${esc(n)}" loading="lazy"></div>
      <div class="work__meta"><div><b>${esc(n)}</b><small>${esc(c)} · ${esc(jenis)}</small></div><em>Lihat demo →</em></div>
    </a>`).join("");

  /* ---------- harga (dari config.js) ---------- */
  const PK = CFG.paket || [];
  $("#prices").innerHTML = PK.map((p, i) => {
    const dark = i === PK.length - 1;
    return `<article class="price ${dark ? "price--dark" : ""} rise">
      <div class="price__top"><span class="price__name">${esc(p.nama)}</span>${S.hemat(p) ? `<span class="price__save">Hemat ${S.hemat(p)}%</span>` : ""}</div>
      ${p.hargaNormal > p.harga ? `<p class="price__was">${S.rupiah(p.hargaNormal)}</p>` : ""}
      <div class="price__now">${rb(p.harga)}</div>
      <p class="price__desc">${esc(p.ringkas)}</p>
      <ul>${p.isi.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <button class="btn ${dark ? "btn--blue" : "btn--line"}" type="button" data-pick="${esc(p.nama)}">Pilih ${esc(p.nama)}</button>
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
    const f = e.target.closest("[data-f]");
    if (f) { $$("[data-f]").forEach(x => x.classList.toggle("is-on", x === f)); $$(".work").forEach(w => { w.hidden = !!f.dataset.f && w.dataset.j !== f.dataset.f; }); return; }
    const t = e.target.closest("[data-try]");
    if (t) location.href = "klien.html#k=" + t.dataset.try;
  });
  $("#progForm").addEventListener("submit", e => {
    e.preventDefault();
    location.href = "klien.html#k=" + encodeURIComponent($("#progCode").value.trim().toUpperCase());
  });

  /* ---------- navigasi & animasi muncul ---------- */
  const nav = $("#nav");
  addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 8), { passive: true });
  $$(".head, .steps li, .terms div, .facts__in div, .progress > *, .final, .vs__card, .feat").forEach(el => el.classList.add("rise"));
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  $$(".rise").forEach(el => io.observe(el));
})();
