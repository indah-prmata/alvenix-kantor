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
      <div class="price">${rp(p.harga)}</div>
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

  const office = $("#office");
  const STEPS = ["hero", "raka", "nadia", "bima", "nego", "sari", "you", "data", "end"];
  const mobile = () => innerWidth < 900;
  // posisi "kamera": geser + zoom kantor supaya titik fokus ada di area yang kosong dari teks
  function cam(step) {
    const w = office.offsetWidth, h = office.offsetHeight, W = innerWidth, H = innerHeight, m = mobile();
    if (step === "hero") return m ? { x: 0, y: H * .2, scale: .92 } : { x: W * .2, y: H * .04, scale: .86 };
    if (step === "end") return m ? { x: 0, y: -H * .08, scale: .9 } : { x: W * .17, y: 0, scale: .92 };
    const p = window.Office.points[step] || [50, 50];
    const s = m ? 2.0 : (step === "data" ? 1.75 : 1.95);
    const offX = m ? 0 : W * .17, offY = m ? -H * .17 : 0;
    return { x: -(p[0] - 50) / 100 * w * s + offX, y: -(p[1] - 50) / 100 * h * s + offY, scale: s };
  }

  gsap.set(office, { ...cam("hero"), transformOrigin: "50% 50%" });
  const caps = $$(".cap"), rail = $$("#rail li"), hero = $("#tourHero");
  let current = -1;
  function setStep(i) {
    if (i === current) return;
    current = i;
    caps.forEach(c => c.classList.toggle("is-on", +c.dataset.step === i));
    rail.forEach(r => r.classList.toggle("is-on", +r.dataset.i === i));
    rail.forEach(r => r.classList.toggle("is-done", +r.dataset.i < i));
    const s = STEPS[i];
    window.Office.focus(s === "hero" || s === "end" ? null : s);
  }

  const N = STEPS.length;
  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: "#tour", start: "top top", end: () => "+=" + innerHeight * N * .85,
      pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: self => {
        $("#tourBar").style.transform = `scaleX(${self.progress})`;
        setStep(Math.max(0, Math.min(N - 1, Math.floor(tl.time() + .35))));
      }
    }
  });
  tl.to(hero, { autoAlpha: 0, y: -60, duration: .45 }, .35);
  for (let i = 1; i < N; i++) {
    const s = STEPS[i];
    tl.to(office, { x: () => cam(s).x, y: () => cam(s).y, scale: () => cam(s).scale, duration: .65 }, i - .65);
  }
  tl.to({}, { duration: .4 }, N - 1);
  setStep(0);

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
