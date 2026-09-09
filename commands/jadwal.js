// Data Jadwal Pelajaran
const jadwalPelajaran = {
  jsn: {
    hari: "Senin",
    mapel: ["MTK TL", "Inggris", "Fisika"]
  },
  jsl: {
    hari: "Selasa",
    mapel: ["Fisika", "Sunda", "Informatika", "PAI"]
  },
  jrb: {
    hari: "Rabu",
    mapel: ["PKN", "PKWU", "Kimia", "B. Indo", "SBK"]
  },
  jkm: {
    hari: "Kamis",
    mapel: ["Kimia", "Penjas", "Sejarah", "MTK U"]
  },
  jjt: {
    hari: "Jumat",
    mapel: ["MTK TL", "MTK U", "BK", "B. Indo", "Informatika"]
  }
};

// Data Anggota Piket per Hari (10 Orang)
const daftarPiket = {
  jsn: ["Khafi", "Arjasena", "Orlen", "Avisha", "Fareal", "Andrian", "Sadam", "Wisnu", "Tania", "Jauharah"],
  jsl: ["Keyla", "Mikaela", "Ridho", "Rizky", "Zyella", "Nishar", "Alvian", "Brella", "Fathian", "Reno"],
  jrb: ["Lutfan", "Rafif", "Kevin", "Arya", "Al Mira", "Elang", "Dzaki N.", "Aisahra", "Satria P", "Putri"],
  jkm: ["Fahri", "Rifqi", "Fadhil", "Yusuf", "Kirana", "Effan", "Dzaki", "Aura", "Reva", "Surya"],
  jjt: ["Dhirgam", "Yoga", "Dude", "Daffa", "Irfan", "Ara", "Anissa", "Meli", "Gibran", "Salsabila"]
};

// Fungsi Acak Array (Fisher-Yates)
function acakArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function handleJadwalCommand(sock, msg, command) {
  const remoteJid = msg.key.remoteJid;
  
  // Bersihkan command dari tanda titik jika ada
  const key = command.toLowerCase().trim().replace('.', '');
  
  const dataMapel = jadwalPelajaran[key];
  const anggotaPiket = daftarPiket[key] || [];

  if (!dataMapel) return;

  // Format Pesan Jadwal Pelajaran
  let pesan = `📅 *JADWAL PELAJARAN — HARI ${dataMapel.hari.toUpperCase()}*\n`;
  pesan += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  dataMapel.mapel.forEach((mapel, index) => {
    pesan += `📖 *Jam ke-${index + 1}:* ${mapel}\n`;
  });

  // Pembagian Tugas Piket
  if (anggotaPiket.length >= 10) {
    // MBG: 5 Pengambil & 5 Pengembali
    const piketMbg = acakArray(anggotaPiket);
    const pengambilMbg = piketMbg.slice(0, 5);
    const pengembaliMbg = piketMbg.slice(5, 10);

    // HP: 2 orang klon/rangkap dari anggota piket hari itu
    const piketHp = acakArray(anggotaPiket);
    const petugasHp = piketHp.slice(0, 2);

    pesan += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    pesan += `🍱 *PETUGAS PIKET & TUGAS (${dataMapel.hari.toUpperCase()})*\n`;
    pesan += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    pesan += `🚚 *Tim Pengambil MBG (5 Orang):*\n`;
    pengambilMbg.forEach((nama, idx) => {
      pesan += `  ${idx + 1}. ${nama}\n`;
    });

    pesan += `\n🔄 *Tim Pengembali MBG (5 Orang):*\n`;
    pengembaliMbg.forEach((nama, idx) => {
      pesan += `  ${idx + 1}. ${nama}\n`;
    });

    pesan += `\n📱 *Tim Kumpul HP ke Ruang Guru (2 Orang):*\n`;
    petugasHp.forEach((nama, idx) => {
      pesan += `  ${idx + 1}. ${nama}\n`;
    });

    pesan += `\n✨ *Catatan:* Diharapkan teman-teman yang bertugas bisa menjalankan kewajibannya tepat waktu ya. Semangat belajar! 🤝`;
  }

  await sock.sendMessage(remoteJid, { text: pesan }, { quoted: msg });
}

module.exports = handleJadwalCommand;