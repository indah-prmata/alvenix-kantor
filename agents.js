/* Karyawan AI — dipakai di halaman utama & HQ.
   `needsN8n: true` = agen ini baru benar-benar bekerja setelah workflow n8n tersambung. */
window.HQ_AGENTS = [
  {
    id: "raka", name: "Raka", initial: "R", tone: "gold",
    role: "Lead Scout",
    desc: "Menyisir Google Maps di Jambi & Jakarta, mencari bisnis yang ramai tapi belum punya website.",
    tools: ["Google Maps", "n8n", "Filter: tanpa website"],
    needsN8n: true
  },
  {
    id: "nadia", name: "Nadia", initial: "N", tone: "violet",
    role: "Analis Bisnis",
    desc: "Menilai seberapa “maju” sebuah bisnis dari rating & jumlah ulasan, lalu memberi skor prioritas.",
    tools: ["Skor 0–100", "Rating", "Jumlah ulasan"],
    needsN8n: true
  },
  {
    id: "bima", name: "Bima", initial: "B", tone: "green",
    role: "Outreach",
    desc: "Menyiapkan pesan WhatsApp personal untuk tiap calon klien, siap kamu kirim satu klik.",
    tools: ["WhatsApp", "Template pesan"],
    needsN8n: false
  },
  {
    id: "sari", name: "Sari", initial: "S", tone: "rose",
    role: "Desainer",
    desc: "Membuat demo website personal untuk tiap calon klien dalam 1 klik — lengkap dengan nama, rating & lokasi usahanya.",
    tools: ["Demo otomatis", "8 tema usaha", "Penawaran resmi"]
  },
  {
    id: "dina", name: "Dina", initial: "D", tone: "blue",
    role: "CS Chat 24 Jam",
    desc: "Menjawab pertanyaan konsumen di demo, penawaran & portal klien. Begitu konsumen berminat, langsung dioper ke Tim Negosiasi di WhatsApp.",
    tools: ["Chat otomatis", "AI (n8n)", "Serah ke negosiasi"]
  }
];

/* Staf MANUSIA — follow-up & negosiasi. Nama diambil dari HQ_CONFIG.negotiator. */
(() => {
  const n = (window.HQ_CONFIG || {}).negotiator || {};
  const name = n.name || "Tim Negosiasi";
  window.HQ_AGENTS.push({
    id: "nego", name, initial: name.trim()[0].toUpperCase(), tone: "amber",
    role: "Follow-up & Negosiasi",
    desc: "Manusia sungguhan yang melanjutkan obrolan setelah pesan pertama: menjawab soal harga, menyesuaikan paket, sampai deal.",
    tools: ["WhatsApp", "Telepon", "Negosiasi"],
    human: true
  });
})();
