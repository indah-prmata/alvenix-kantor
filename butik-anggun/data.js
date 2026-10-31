/* Katalog contoh Butik Anggun. bg, tinta, huruf = warna kamar pas saat baju itu dipakai. skala = ukuran model di panggung. */
const KATALOG = [
  { id: "kebaya", g: "w", nama: "Kebaya Brokat Sage", isi: "Kebaya brokat, kain parang, selop", harga: 689000, acara: ["kondangan"], bahan: "Brokat Bandung, kain batik cap", bg: "#26372e", tinta: "#f1efe6", huruf: "#34493e", skala: 1, stok: { S: 2, M: 4, L: 3, XL: 0 } },
  { id: "anggur", g: "w", nama: "Gaun Satin Anggur", isi: "Gaun panjang tali lebar", harga: 749000, acara: ["kondangan"], bahan: "Satin sutra campur, berfuring", bg: "#e7b9b4", tinta: "#3a0a12", huruf: "#dfa6a2", skala: 1, stok: { S: 1, M: 3, L: 2, XL: 1 }, varian: "gaun" },
  { id: "malam", g: "w", nama: "Gaun Satin Malam", isi: "Gaun panjang tali lebar", harga: 749000, acara: ["kondangan"], bahan: "Satin sutra campur, berfuring", bg: "#ecd98f", tinta: "#151b3a", huruf: "#e4cd74", skala: 1, stok: { S: 3, M: 2, L: 0, XL: 2 }, varian: "gaun" },
  { id: "mawar", g: "w", nama: "Dress Satin Mawar", isi: "Dress midi lengan siku", harga: 459000, acara: ["kondangan", "santai"], bahan: "Satin lembut, tidak menerawang", bg: "#6c1f2a", tinta: "#fbe9e4", huruf: "#7d2a35", skala: 1, stok: { S: 4, M: 5, L: 2, XL: 1 } },
  { id: "batikw", g: "w", nama: "Blus Batik & Rok Hitam", isi: "Blus batik lengan panjang, rok payung", harga: 529000, acara: ["kantor", "kondangan"], bahan: "Katun primisima, batik cap", bg: "#d7bd97", tinta: "#2b190e", huruf: "#cdb086", skala: 1, stok: { S: 2, M: 3, L: 3, XL: 2 } },
  { id: "krem", g: "w", nama: "Setelan Blazer Krem", isi: "Blazer, celana lurus, kaus putih", harga: 629000, acara: ["kantor"], bahan: "Crepe tebal, jatuh rapi", bg: "#7b4a31", tinta: "#fbf3e6", huruf: "#8a573c", skala: 1, stok: { S: 3, M: 4, L: 2, XL: 1 }, varian: "blazer" },
  { id: "kremhitam", g: "w", nama: "Blazer Krem Dalaman Hitam", isi: "Blazer, celana lurus, dalaman hitam", harga: 649000, acara: ["kantor"], bahan: "Crepe tebal, jatuh rapi", bg: "#a3a58a", tinta: "#1b1c14", huruf: "#979a7d", skala: 1, stok: { S: 1, M: 2, L: 4, XL: 0 }, varian: "blazer" },
  { id: "hitam", g: "w", nama: "Setelan Blazer Hitam", isi: "Blazer, celana lurus, kaus putih", harga: 649000, acara: ["kantor"], bahan: "Crepe tebal, jatuh rapi", bg: "#d3cdc3", tinta: "#121212", huruf: "#c8c1b6", skala: 1, stok: { S: 2, M: 2, L: 3, XL: 2 }, varian: "blazer" },
  { id: "plisket", g: "w", nama: "Blus Mawar & Rok Plisket", isi: "Blus sutra, rok plisket panjang", harga: 489000, acara: ["kantor", "kondangan"], bahan: "Silky crepe, plisket mesin", bg: "#c9d3c2", tinta: "#1b241c", huruf: "#bcc8b4", skala: 1, stok: { S: 3, M: 3, L: 1, XL: 0 } },
  { id: "indigo", g: "w", nama: "Dress Celup Indigo", isi: "Dress selutut lengan pendek", harga: 399000, acara: ["santai", "kantor"], bahan: "Katun tenun celup tangan", bg: "#d9c7a3", tinta: "#101f3d", huruf: "#cfba92", skala: 1, stok: { S: 2, M: 4, L: 4, XL: 2 } },
  { id: "tunik", g: "w", nama: "Tunik Linen Sage", isi: "Tunik, celana linen, kerudung", harga: 429000, acara: ["ibadah", "santai"], bahan: "Linen rami, adem", bg: "#efe6d6", tinta: "#26332a", huruf: "#e5d9c4", skala: 1, stok: { S: 5, M: 4, L: 3, XL: 3 } },
  { id: "linenw", g: "w", nama: "Kemeja Linen & Kulot", isi: "Kemeja putih, kulot krem", harga: 419000, acara: ["santai"], bahan: "Linen cuci, makin lama makin lemas", bg: "#b5653f", tinta: "#fff5ea", huruf: "#c0724c", skala: .8, stok: { S: 2, M: 3, L: 2, XL: 1 } },
  { id: "biru", g: "w", nama: "Kemeja Biru & Jeans", isi: "Kemeja katun, jeans lurus", harga: 389000, acara: ["santai"], bahan: "Katun oxford, denim 12 oz", bg: "#efd7a3", tinta: "#1a2a44", huruf: "#e7cb8c", skala: 1, stok: { S: 4, M: 5, L: 4, XL: 2 } },
  { id: "track", g: "w", nama: "Jaket Track & Jogger", isi: "Jaket, kaus abu, jogger", harga: 379000, acara: ["santai"], bahan: "Fleece ringan, katun combed", bg: "#c6d5da", tinta: "#101416", huruf: "#b8cad0", skala: 1, stok: { S: 3, M: 4, L: 4, XL: 3 } },

  { id: "jasnavy", g: "p", nama: "Jas Biru Tua", isi: "Jas, celana, kemeja putih", harga: 1290000, acara: ["kondangan", "kantor"], bahan: "Wol campur, dijahit tangan di bahu", bg: "#e6d3a6", tinta: "#101a33", huruf: "#ddc78f", skala: 1, stok: { S: 1, M: 3, L: 3, XL: 2 }, varian: "jas" },
  { id: "jasarang", g: "p", nama: "Jas Arang", isi: "Jas, celana, kemeja putih", harga: 1290000, acara: ["kondangan", "kantor"], bahan: "Wol campur, dijahit tangan di bahu", bg: "#b9c4c4", tinta: "#141616", huruf: "#abb8b8", skala: .84, stok: { S: 2, M: 2, L: 4, XL: 1 }, varian: "jas" },
  { id: "beskap", g: "p", nama: "Beskap & Kain Parang", isi: "Beskap, kain parang, blangkon", harga: 899000, acara: ["kondangan"], bahan: "Drill premium, kain batik cap", bg: "#b58a54", tinta: "#1a120a", huruf: "#a97d48", skala: 1, stok: { S: 1, M: 2, L: 3, XL: 2 } },
  { id: "batikp", g: "p", nama: "Kemeja Batik Malam", isi: "Kemeja batik, celana hitam", harga: 549000, acara: ["kondangan", "kantor"], bahan: "Katun primisima, batik cap", bg: "#d8d0c0", tinta: "#111a30", huruf: "#ccc3b1", skala: 1, stok: { S: 2, M: 4, L: 4, XL: 3 } },
  { id: "koko", g: "p", nama: "Koko Sage", isi: "Koko lengan panjang, celana putih", harga: 429000, acara: ["ibadah", "santai"], bahan: "Linen rami, adem", bg: "#3f5546", tinta: "#f2efe4", huruf: "#4d6555", skala: 1, stok: { S: 3, M: 4, L: 3, XL: 2 } },
  { id: "linenp", g: "p", nama: "Kemeja Linen Krem", isi: "Kemeja linen, celana lipit", harga: 449000, acara: ["santai"], bahan: "Linen cuci, makin lama makin lemas", bg: "#8a3f2b", tinta: "#fff2e6", huruf: "#9a4d38", skala: .82, stok: { S: 2, M: 3, L: 3, XL: 1 } },
  { id: "polo", g: "p", nama: "Polo Biru Tua", isi: "Polo pique, celana chino", harga: 329000, acara: ["santai", "kantor"], bahan: "Katun pique", bg: "#e3c9a0", tinta: "#13203a", huruf: "#d9bb8c", skala: 1, stok: { S: 4, M: 5, L: 5, XL: 3 } },
  { id: "overshirt", g: "p", nama: "Overshirt Hitam", isi: "Overshirt, kaus putih, celana abu", harga: 459000, acara: ["santai", "kantor"], bahan: "Katun kanvas cuci", bg: "#c9c0ae", tinta: "#111", huruf: "#bdb39f", skala: 1, stok: { S: 2, M: 3, L: 4, XL: 2 } },
  { id: "denim", g: "p", nama: "Jaket Denim Pudar", isi: "Jaket denim, kaus abu, jeans hitam", harga: 529000, acara: ["santai"], bahan: "Denim 13 oz, dicuci batu", bg: "#c98a45", tinta: "#1c1208", huruf: "#bd7d39", skala: 1, stok: { S: 1, M: 3, L: 3, XL: 1 } },
  { id: "sweater", g: "p", nama: "Sweater Karamel", isi: "Sweater, kemeja, celana wol", harga: 429000, acara: ["santai", "kantor"], bahan: "Rajut katun tebal", bg: "#2f3a4a", tinta: "#f3e9dc", huruf: "#3c4a5c", skala: .82, stok: { S: 2, M: 2, L: 3, XL: 2 } },
  { id: "hoodie", g: "p", nama: "Hoodie Zaitun", isi: "Hoodie, cargo hitam", harga: 389000, acara: ["santai"], bahan: "Fleece 330 gsm", bg: "#dfd3b8", tinta: "#1e2415", huruf: "#d4c6a6", skala: .7, stok: { S: 3, M: 4, L: 4, XL: 2 } },
];

const ACARA = [["semua", "Semua"], ["kondangan", "Kondangan"], ["kantor", "Kantor"], ["ibadah", "Ibadah"], ["santai", "Santai"]];
const UKURAN = ["S", "M", "L", "XL"];

/* Pasangan kondangan berdua: [wanita, pria, judul] */
const PASANGAN = [
  ["kebaya", "beskap", "Akad"],
  ["anggur", "jasarang", "Resepsi"],
  ["malam", "jasnavy", "Gala"],
  ["batikw", "batikp", "Kondangan"],
  ["tunik", "koko", "Lebaran"],
  ["linenw", "linenp", "Akhir pekan"],
];
