/* DATA DEMO — contoh fiktif agar tampilan dashboard bisa dicoba.
   Otomatis tidak dipakai begitu HQ_CONFIG.leadsUrl diisi (data asli dari n8n).
   Format satu lead (n8n harus mengirim field yang sama):
   { id, name, category, city, address, phone, rating, reviews,
     maps_url, instagram, has_website, found_at, agent } */
(function () {
  const rows = [
    ["Kopi Senja Contoh", "Kedai Kopi", "Jambi", "Jl. Contoh Telanaipura", 4.8, 612],
    ["Ayam Geprek Contoh", "Rumah Makan", "Jambi", "Jl. Contoh Kotabaru", 4.6, 1240],
    ["Bengkel Motor Contoh", "Bengkel", "Jambi", "Jl. Contoh Jelutung", 4.7, 318],
    ["Salon Cantik Contoh", "Salon & Kecantikan", "Jambi", "Jl. Contoh Pasar", 4.9, 205],
    ["Toko Bangunan Contoh", "Toko Bangunan", "Jambi", "Jl. Contoh Alam Barajo", 4.5, 433],
    ["Laundry Kilat Contoh", "Laundry", "Jambi", "Jl. Contoh Sipin", 4.7, 157],
    ["Klinik Gigi Contoh", "Klinik", "Jambi", "Jl. Contoh Broni", 4.8, 289],
    ["Pempek Contoh", "Rumah Makan", "Jambi", "Jl. Contoh Danau Teluk", 4.6, 876],
    ["Martabak Contoh", "Kuliner", "Jakarta", "Jl. Contoh Tebet", 4.7, 2310],
    ["Barbershop Contoh", "Barbershop", "Jakarta", "Jl. Contoh Kemang", 4.9, 742],
    ["Bakmi Contoh", "Rumah Makan", "Jakarta", "Jl. Contoh Kelapa Gading", 4.6, 3105],
    ["Studio Foto Contoh", "Fotografi", "Jakarta", "Jl. Contoh Menteng", 4.8, 198],
    ["Gym Contoh", "Fitness", "Jakarta", "Jl. Contoh Cempaka Putih", 4.5, 520],
    ["Toko Kue Contoh", "Toko Kue", "Jakarta", "Jl. Contoh Rawamangun", 4.8, 964],
    ["Bengkel Mobil Contoh", "Bengkel", "Jakarta", "Jl. Contoh Pancoran", 4.6, 411],
    ["Pet Shop Contoh", "Pet Shop", "Jakarta", "Jl. Contoh Cilandak", 4.7, 367],
    ["Coffee Roastery Contoh", "Kedai Kopi", "Jakarta", "Jl. Contoh Senopati", 4.8, 1580],
    ["Butik Contoh", "Fashion", "Jakarta", "Jl. Contoh Tanah Abang", 4.4, 289],
    ["Katering Contoh", "Katering", "Jambi", "Jl. Contoh Paal Merah", 4.7, 134],
    ["Optik Contoh", "Optik", "Jakarta", "Jl. Contoh Grogol", 4.6, 245]
  ];
  const now = Date.now();
  window.HQ_DEMO_LEADS = rows.map((r, i) => ({
    id: "demo-" + (i + 1),
    name: r[0],
    category: r[1],
    city: r[2],
    address: r[3] + ", " + r[2],
    phone: "",                       // demo: sengaja kosong
    rating: r[4],
    reviews: r[5],
    maps_url: "",
    instagram: "",
    has_website: false,
    found_at: new Date(now - i * 1000 * 60 * 47).toISOString(),
    agent: "Raka",
    demo: true
  }));
})();
