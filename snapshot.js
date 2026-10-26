/* =========================================================
   Data cadangan — dipakai kalau n8n mati.
   data/leads.enc.js berisi salinan leads yang DIENKRIPSI dengan kode akses
   (PBKDF2-SHA256 + AES-GCM). Tanpa kode yang benar, isinya tidak bisa dibaca.
   ========================================================= */
(() => {
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  window.HQ_loadSnapshot = async key => {
    const S = window.HQ_SNAPSHOT;
    if (!S || !key) return null;
    try {
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), "PBKDF2", false, ["deriveKey"]);
      const aes = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64(S.salt), iterations: S.iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(S.iv) }, aes, b64(S.data));
      return { leads: JSON.parse(new TextDecoder().decode(plain)), saved_at: S.saved_at };
    } catch (e) {
      console.error("[cadangan] gagal membuka data:", e);
      return null;
    }
  };
})();
