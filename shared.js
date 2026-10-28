/* =========================================================
   Alat bersama — dipakai Ruang Kerja dan halaman publik
   (demo, penawaran, portal klien, chat).
   ========================================================= */
(() => {
  const CFG = window.HQ_CONFIG || {};

  // data <-> potongan link (base64url dari JSON, aman untuk huruf Indonesia & emoji)
  const enc = obj => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const dec = str => {
    try {
      const b = atob(String(str).replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(b, c => c.charCodeAt(0))));
    } catch { return null; }
  };
  const base = () => {
    // di file lokal, pakai folder yang sama; online, pakai publicBase
    if (location.protocol === "file:") return location.href.replace(/[^/]*([?#].*)?$/, "");
    return CFG.publicBase || location.href.replace(/[^/]*([?#].*)?$/, "");
  };

  const rupiah = n => "Rp" + Math.round(+n || 0).toLocaleString("id-ID");
  const waNumber = p => {
    let d = String(p || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("0")) d = "62" + d.slice(1);
    else if (d.startsWith("8")) d = "62" + d;
    return d;
  };
  const waLink = (phone, text) => { const n = waNumber(phone); return n ? `https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(text || "")}` : ""; };
  const paket = id => (CFG.paket || []).find(p => p.id === id) || (CFG.paket || [])[0];
  const hemat = p => p.hargaNormal > p.harga ? Math.round((1 - p.harga / p.hargaNormal) * 100) : 0;

  // jenis usaha -> tema demo
  function jenis(category) {
    const c = String(category || "").toLowerCase();
    if (/salon|barber|kecantikan|beauty|spa|nail|makeup|rias/.test(c)) return "salon";
    if (/bengkel|motor|mobil|cuci|otomotif|ban|oli/.test(c)) return "bengkel";
    if (/katering|catering/.test(c)) return "katering";
    if (/makan|kopi|kafe|cafe|resto|kuliner|kue|bakery|roti|warung|bakso|mie|ayam|seafood/.test(c)) return "kuliner";
    if (/butik|fashion|pakaian|baju|jahit|hijab|sepatu|tas/.test(c)) return "butik";
    if (/klinik|dokter|gigi|apotek|optik|kesehatan|bidan|fisio|lab/.test(c)) return "klinik";
    if (/laundry|cuci baju/.test(c)) return "laundry";
    return "umum";
  }

  // nomor unik pendek (penawaran, kode proyek)
  const kode = (prefix, len = 5) => prefix + "-" + [...crypto.getRandomValues(new Uint8Array(len))].map(b => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

  const links = {
    demo: lead => base() + "demo.html#d=" + enc({ n: lead.name, c: lead.category, k: lead.city, a: lead.address, p: lead.phone, r: lead.rating, u: lead.reviews, m: lead.maps_url }),
    penawaran: q => base() + "penawaran.html#q=" + enc(q),
    klien: snap => base() + "klien.html#p=" + enc(snap)
  };

  window.HQ_SHARED = { enc, dec, base, rupiah, waNumber, waLink, paket, hemat, jenis, kode, links };
})();
