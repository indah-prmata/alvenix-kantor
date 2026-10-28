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
    "Kalau Ibu/Bapak tertarik, kami akan kirimkan contoh demonya dulu.",

  // Pesan saat mengirim demo personal. {link} = alamat demo untuk usaha itu.
  demoTemplate:
    "Halo kak 🙏 Ini contoh demo website yang kami siapkan khusus untuk {nama}:\n\n{link}\n\n" +
    "Masih contoh ya kak — foto, warna, dan isinya nanti kami sesuaikan. Kalau ada pertanyaan, bisa langsung tanya di chat yang ada di halaman itu atau balas pesan ini 😊",

  /* ---------------- PENJUALAN ---------------- */
  // Alamat website publik (dipakai untuk link demo, penawaran, dan portal klien).
  publicBase: "https://indah-prmata.github.io/alvenix-kantor/",

  // Nomor WhatsApp kantor yang dihubungi konsumen dari demo / chat / penawaran.
  waKantor: "6282264116532",

  // Paket & harga resmi (sama dengan panduan sales). harga dalam rupiah.
  paket: [
    { id: "landing", nama: "Landing Page", harga: 2499000, ringkas: "1 halaman lengkap, fokus mendatangkan chat WhatsApp",
      isi: ["Desain rapi di HP & laptop", "Tombol WhatsApp + Google Maps", "Layanan, harga, galeri, testimoni", "Link siap dipasang di bio Instagram"] },
    { id: "profil", nama: "Website Profil Usaha", harga: 4999000, ringkas: "Hingga 5 halaman: Beranda, Tentang, Layanan, Galeri, Kontak",
      isi: ["Semua isi paket Landing Page", "Halaman terpisah untuk tiap informasi", "Disusun supaya mudah ditemukan Google", "Cocok untuk klinik, katering, salon lengkap"] },
    { id: "lengkap", nama: "Website Lengkap", harga: 7999000, ringkas: "Hingga 10 halaman + katalog/menu online + form pemesanan",
      isi: ["Semua isi paket Profil Usaha", "Katalog produk / menu dengan foto", "Form pesan & booking ke WhatsApp", "Cocok untuk butik & usaha bercabang"] }
  ],
  // Sudah termasuk di semua paket.
  termasuk: ["Domain .com / .id (nama usaha sendiri)", "Hosting tahun pertama", "Keamanan SSL & perlindungan serangan", "Cadangan data", "Maksimal 5 kali revisi", "Perbaikan error/bug tanpa biaya"],
  biayaTahunan: 1500000,   // mulai tahun ke-2
  maksRevisi: 5,
  dpPersen: 50,            // uang muka di penawaran — ubah sesuai kebijakan
  berlakuHari: 7,          // masa berlaku penawaran
  targetOmzet: 10000000,   // target pemasukan per bulan (dasbor Cuan)

  /* ---------------- OTOMATISASI n8n (workflow baru) ----------------
     Kosongkan "" kalau belum dipasang — website tetap jalan dengan cadangan. */
  chatUrl: "https://alvinix.app.n8n.cloud/webhook/alvenix-chat",       // Dina: chat AI
  minatUrl: "https://alvinix.app.n8n.cloud/webhook/alvenix-minat",     // konsumen isi "saya tertarik"
  progresUrl: "https://alvinix.app.n8n.cloud/webhook/alvenix-progres", // portal klien cek progres
  proyekUrl: "https://alvinix.app.n8n.cloud/webhook/alvenix-proyek"    // Ruang Kerja: simpan proyek
};
