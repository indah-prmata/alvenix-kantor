(() => {
  const CFG = window.HQ_CONFIG || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wa = text => `https://api.whatsapp.com/send?phone=${CFG.waKantor}&text=${encodeURIComponent(text)}`;

  /* ---------- WhatsApp + form ---------- */
  $$(".js-wa").forEach(a => {
    a.href = wa(a.dataset.waText || `Halo ${CFG.brand || "alvenix"}, saya mau konsultasi bikin website / landing page untuk bisnis saya.`);
    a.target = "_blank"; a.rel = "noopener";
  });
  $("#year").textContent = new Date().getFullYear();
  const NEGO = CFG.negotiator || {};
  $$(".js-nego").forEach(el => el.textContent = NEGO.name || "Tim Negosiasi");
  $$(".js-nego-wa").forEach(a => {
    a.href = NEGO.whatsapp ? `https://api.whatsapp.com/send?phone=${NEGO.whatsapp}&text=${encodeURIComponent(`Halo ${NEGO.name || ""}, saya mau tanya soal harga website / landing page.`)}` : wa("Halo, saya mau tanya soal harga website / landing page.");
    a.target = "_blank"; a.rel = "noopener";
  });
  $("#contactForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    window.open(wa(`Halo ${CFG.brand}, saya ${d.nama} dari ${d.bisnis}${d.kota ? " (" + d.kota + ")" : ""}.\nSaya tertarik: ${d.jenis}.` + (d.pesan ? `\n\n${d.pesan}` : "")), "_blank", "noopener");
  });

  /* ---------- Harga (dari config.js) ---------- */
  const S = window.HQ_SHARED;
  const rp = n => S ? S.rupiah(n) : "Rp" + n;
  const PK = CFG.paket || [];
  $("#pricing").innerHTML = PK.map((p, i) => `
    <article class="svc ${i === 0 ? "svc--featured" : ""} reveal">
      ${i === 0 ? `<span class="svc__tag mono">Paling laris</span>` : ""}
      <h3>${esc(p.nama)}</h3>
      ${p.hargaNormal > p.harga ? `<s class="price__was">${rp(p.hargaNormal)}</s>` : ""}
      <div class="price">${rp(p.harga)}${S && S.hemat(p) ? ` <span class="price__save">Hemat ${S.hemat(p)}%</span>` : ""}</div>
      <p>${esc(p.ringkas)}</p>
      <ul>${p.isi.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <button class="btn btn--sm ${i === 0 ? "btn--gold" : ""}" type="button" data-pick="${esc(p.nama)}">Saya mau paket ini →</button>
    </article>`).join("");
  $("#included").innerHTML = `<span class="mono">Sudah termasuk:</span>` + (CFG.termasuk || []).map(t => `<span>${esc(t)}</span>`).join("");
  $("#renewPrice").textContent = rp(CFG.biayaTahunan || 1500000);
  document.addEventListener("click", e => {
    const pick = e.target.closest("[data-pick]");
    if (pick) { window.HQ_CHAT ? window.HQ_CHAT.ask(`Saya tertarik paket ${pick.dataset.pick}`) : window.open(wa(`Halo ${CFG.brand}, saya tertarik paket ${pick.dataset.pick}.`), "_blank", "noopener"); return; }
    const demo = e.target.closest("[data-demo]");
    if (demo && S) { try { const d = JSON.parse(demo.dataset.demo); window.open(S.links.demo({ name: d.n, category: d.c, city: d.k, rating: d.r, reviews: d.u }), "_blank", "noopener"); } catch {} }
  });
  document.addEventListener("click", e => {
    if (e.target.closest("[data-open-chat]")) window.HQ_CHAT?.open();
    const t = e.target.closest("[data-try]"); if (t) { $("#progCode").value = t.dataset.try; location.href = "klien.html#k=" + t.dataset.try; }
  });
  $("#progForm")?.addEventListener("submit", e => { e.preventDefault(); location.href = "klien.html#k=" + encodeURIComponent($("#progCode").value.trim().toUpperCase()); });

  /* ---------- Reveal (tanpa GSAP juga jalan) ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains("reveal"));
    e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 80 + "ms";
    e.target.classList.add("is-in"); io.unobserve(e.target);
  }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => io.observe(el));
  requestAnimationFrame(() => document.body.classList.add("is-ready"));

  /* ---------- Nav ---------- */
  const nav = $("#nav"); let lastY = 0;
  addEventListener("scroll", () => { const y = scrollY; nav.classList.toggle("is-hidden", y > lastY && y > 300); nav.classList.toggle("is-solid", y > 40); lastY = y; }, { passive: true });

  /* ---------- Spotlight kursor ---------- */
  const spot = $("#spot");
  if (matchMedia("(pointer: fine)").matches && !reduce) {
    let sx = innerWidth / 2, sy = innerHeight / 2, tx = sx, ty = sy;
    addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; });
    (function loop() { sx += (tx - sx) * .12; sy += (ty - sy) * .12; spot.style.transform = `translate(${sx}px, ${sy}px)`; requestAnimationFrame(loop); })();
    $$(".svc, .mock").forEach(c => c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) / r.width * 100 + "%");
      c.style.setProperty("--my", (e.clientY - r.top) / r.height * 100 + "%");
    }));
  } else spot.style.display = "none";

  /* ---------- TUR KANTOR (GSAP) ---------- */
  if (!window.gsap || !window.ScrollTrigger) { document.body.classList.add("no-gsap"); return; }
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ lerp: .1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: id === "#tour" ? 0 : -20 });
    }));
  }

  /* ---------- Hero: kantor 3D melayang + ikut gerak mouse ---------- */
  const office = $("#office");
  window.Office?.focus(null);
  gsap.from(office, { autoAlpha: 0, scale: .8, y: 60, duration: 1.6, ease: "power3.out", delay: .2 });
  if (matchMedia("(pointer: fine)").matches && !reduce) {
    const qx = gsap.quickTo(office, "rotationY", { duration: 1.2, ease: "power3.out" }), qy = gsap.quickTo(office, "rotationX", { duration: 1.2, ease: "power3.out" });
    gsap.set("#tour .tour__stage", { perspective: 1400 });
    addEventListener("pointermove", e => { qx((e.clientX / innerWidth - .5) * 10); qy(-(e.clientY / innerHeight - .5) * 8); }, { passive: true });
  }
  gsap.to(office, { yPercent: 12, ease: "none", scrollTrigger: { trigger: "#tour", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("#tourHero", { yPercent: -18, autoAlpha: .2, ease: "none", scrollTrigger: { trigger: "#tour", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Contoh: scroll horizontal (desktop) ---------- */
  const track = $("#workTrack");
  ScrollTrigger.matchMedia({
    "(min-width: 900px)": () => {
      const dist = () => track.scrollWidth - innerWidth + Math.max(48, (innerWidth - 1240) / 2 + 24);
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: "#karya", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true }
      });
    }
  });

  /* parallax lembut untuk aurora */
  gsap.to(".aurora", { yPercent: -20, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
  addEventListener("load", () => ScrollTrigger.refresh());
})();
