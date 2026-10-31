/* Tombol WhatsApp mengambang untuk halaman contoh: hanya di HP, laptop tidak berubah.
   Tanpa nomor (halaman contoh tidak memakai nomor pribadi): WhatsApp membuka pilihan kontak. */
(() => {
  const nama = document.currentScript.dataset.nama || "kakak";
  const css = document.createElement("style");
  // bottom 80px: di atas bar bawah tiap halaman, yang tingginya sampai 66px
  css.textContent = `.wa-apung { display: none; position: fixed; right: 14px; bottom: calc(80px + env(safe-area-inset-bottom)); z-index: 24; width: 56px; height: 56px; border-radius: 50%; place-items: center; background: #25d366; color: #04240f; box-shadow: 0 12px 30px -6px rgba(37, 211, 102, .6); }
.wa-apung svg { width: 28px; height: 28px; fill: currentColor; }
@media (max-width: 860px) { .wa-apung { display: grid; } }`;
  document.head.appendChild(css);
  const a = document.createElement("a");
  a.className = "wa-apung"; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label", "Chat WhatsApp");
  a.href = "https://wa.me/?text=" + encodeURIComponent(`Halo ${nama}, saya mau tanya.`);
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.8.9c.3.1.4.2.5.3.1.2.1.6-.1 1.2Z"/></svg>';
  document.body.appendChild(a);
})();
