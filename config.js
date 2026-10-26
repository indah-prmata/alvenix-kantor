/* =========================================================
   KONFIGURASI — ubah di sini saja.
   ========================================================= */
window.HQ_CONFIG = {
  // Nama brand/kantor kamu. Otomatis dipakai di seluruh website.
  brand: "alvenix",

  // Nama panggilan kamu untuk sapaan di beranda ("Selamat pagi, ..."). Kosongkan "" kalau tidak perlu.
  namaKamu: "",

  // Target jumlah bisnis yang dihubungi per hari (lingkaran target di beranda).
  targetHarian: 10,

  // Webhook n8n (workflow "2 API Leads"). Kosongkan "" untuk kembali ke DATA DEMO.
  leadsUrl: "https://alvinix.app.n8n.cloud/webhook/alvenix-leads",

  // (Opsional) Webhook n8n untuk menyimpan perubahan status lead (POST JSON).
  statusWebhook: "https://alvinix.app.n8n.cloud/webhook/alvenix-status",

  // Staf MANUSIA yang melanjutkan follow-up & negosiasi setelah pesan pertama.
  // Ganti nama & nomornya (format 62...). Tombol "Serahkan" di Ruang Data mengirim detail lead ke nomor ini.
  negotiator: { name: "Tim Negosiasi", whatsapp: "6282264116532" },

  // Pesan follow-up ke calon klien (dipakai staf negosiasi). {brand}, {nama}, {kota} otomatis diganti.
  followupTemplate:
    "Halo kak, saya dari {brand} lagi 🙏\n\n" +
    "Kemarin kami sempat menawarkan website untuk {nama}. Kalau kakak berkenan, kami bisa kirimkan contoh desainnya dulu — gratis, tanpa komitmen.\n\n" +
    "Kira-kira kapan waktu yang enak untuk ngobrol sebentar soal kebutuhan & budgetnya?",

  // Template pesan WhatsApp ke calon klien. {brand}, {nama}, {kota} otomatis diganti.
  waTemplate:
    "Halo kak, saya dari {brand} 👋\n\n" +
    "Saya lihat {nama} di {kota} ulasannya bagus banget di Google Maps, tapi belum punya website. " +
    "Kami bantu bikinkan website / landing page profesional supaya lebih gampang ditemukan pelanggan baru.\n\n" +
    "Boleh saya kirim contoh desainnya gratis untuk {nama}?"
};
