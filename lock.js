/* =========================================================
   Layar kunci — website hanya untuk kamu & tim.
   Kode akses dicek oleh n8n (workflow "API Leads"), bukan oleh file ini,
   jadi melihat kode sumber di GitHub tidak membuka apa pun.
   Setelah kode benar, script halaman (data-load) baru dimuat.
   Pakai: <script src="lock.js" data-load="a.js b.js"></script> setelah config.js
   ========================================================= */
(() => {
  const me = document.currentScript;
  const toLoad = (me.dataset.load || "").split(/\s+/).filter(Boolean);
  const CFG = window.HQ_CONFIG || {};
  const KEY = "hq.key";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || ""; } catch { return ""; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  document.documentElement.classList.add("is-locked");
  const css = document.createElement("style");
  css.textContent = `
    html.is-locked body > :not(#lock) { visibility: hidden !important; }
    html.is-locked body { overflow: hidden; }
    #lock { position: fixed; inset: 0; z-index: 999; display: grid; place-items: center; padding: 16px;
      background: radial-gradient(60vw 50vh at 80% 0%, rgba(34,184,198,.18), transparent 70%),
                  radial-gradient(40vw 40vh at 0% 100%, rgba(239,106,58,.10), transparent 70%), #020608;
      font-family: var(--f-body, system-ui); color: var(--text, #eef5f6); transition: opacity .6s, visibility 0s .6s; }
    #lock.is-off { opacity: 0; visibility: hidden; }
    #lock .lk { width: min(100%, 380px); display: grid; justify-items: center; gap: 18px; text-align: center; }
    #lock .lk__logo { width: 64px; height: 64px; filter: drop-shadow(0 0 22px rgba(34,184,198,.55)); }
    #lock h1 { margin: 0; font-family: var(--f-display, system-ui); font-weight: 500; font-size: 1.5rem; letter-spacing: -.03em; }
    #lock p { margin: -8px 0 0; color: var(--muted, #84959b); font-size: .92rem; }
    #lock form { width: 100%; display: grid; gap: 10px; margin-top: 6px; }
    #lock input { height: 52px; padding: 0 20px; border-radius: 999px; text-align: center; letter-spacing: .14em;
      border: 1px solid var(--line-2, rgba(255,255,255,.14)); background: rgba(255,255,255,.04); color: inherit;
      font: 500 1rem var(--f-mono, monospace); outline: none; transition: border-color .3s, box-shadow .3s; }
    #lock input:focus { border-color: #22b8c6; box-shadow: 0 0 0 4px rgba(34,184,198,.15); }
    #lock button { height: 52px; border: 0; border-radius: 999px; cursor: pointer; font: 600 .95rem var(--f-body, system-ui);
      color: #021417; background: linear-gradient(120deg, #9ff6ff, #3fd3e2 35%, #22b8c6 65%, #7fe3ee);
      box-shadow: 0 10px 40px -10px rgba(34,184,198,.6); }
    #lock button:disabled { opacity: .6; cursor: wait; }
    #lock .lk__msg { min-height: 1.4em; font-size: .85rem; color: #ff7a7a; }
    #lock .lk__foot { font: .66rem var(--f-mono, monospace); letter-spacing: .2em; text-transform: uppercase; color: var(--dim, #52636a); }
    #lock.is-shake .lk { animation: lkShake .45s; }
    @keyframes lkShake { 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }`;
  document.head.appendChild(css);

  const box = document.createElement("div");
  box.id = "lock";
  box.innerHTML = `
    <div class="lk">
      <img class="lk__logo" src="logo.svg" alt="">
      <h1>Kantor alvenix</h1>
      <p>Khusus tim. Masukkan kode akses untuk masuk.</p>
      <form autocomplete="off">
        <input type="password" placeholder="kode akses" aria-label="Kode akses" required>
        <button type="submit">Masuk</button>
      </form>
      <span class="lk__msg" role="status"></span>
      <span class="lk__foot">akses terbatas</span>
    </div>`;
  const mount = () => document.body.appendChild(box);
  document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);
  const form = box.querySelector("form"), input = box.querySelector("input"), btn = box.querySelector("button"), msg = box.querySelector(".lk__msg");

  async function check(key) {
    if (!key || !CFG.leadsUrl) return false;
    const url = CFG.leadsUrl + (CFG.leadsUrl.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(key);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    let j = await res.json();
    if (Array.isArray(j) && j.length === 1) j = j[0];
    return !j.summary;   // kode salah -> n8n hanya mengirim ringkasan
  }

  function unlock() {
    (function next(i) {
      if (i >= toLoad.length) {
        document.documentElement.classList.remove("is-locked");
        box.classList.add("is-off");
        return;
      }
      const s = document.createElement("script");
      s.src = toLoad[i]; s.onload = s.onerror = () => next(i + 1);
      document.body.appendChild(s);
    })(0);
  }

  async function attempt(key, silent) {
    btn.disabled = true; msg.textContent = silent ? "" : "memeriksa…"; msg.style.color = "var(--muted, #84959b)";
    try {
      if (await check(key)) { save(key); unlock(); return; }
      save("");
      if (!silent) { msg.style.color = ""; msg.textContent = "Kode salah. Coba lagi."; box.classList.remove("is-shake"); void box.offsetWidth; box.classList.add("is-shake"); }
    } catch {
      msg.style.color = ""; msg.textContent = "Server n8n tidak bisa dihubungi. Cek internet / workflow n8n.";
    }
    btn.disabled = false; input.value = ""; input.focus();
  }

  form.addEventListener("submit", e => { e.preventDefault(); attempt(input.value.trim()); });
  const saved = load();
  if (saved) attempt(saved, true); else setTimeout(() => input.focus(), 50);

  // keluar: hapus kode dari browser ini lalu kunci lagi
  window.HQ_LOGOUT = () => { save(""); location.reload(); };
})();
