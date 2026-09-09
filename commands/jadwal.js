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
  
  // Clean command dari titik
  const key = command.toLowerCase().trim().replace('.', '');
  
  const dataMapel = jadwalPelajaran[key];
  const anggotaPiket = daftarPiket[key] || [];

  if (!dataMapel) return;

  // 1. Jadwal Pelajaran
  let pesan = `📅 *JADWAL PELAJARAN — HARI ${dataMapel.hari.toUpperCase()}*\n`;
  pesan += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  dataMapel.mapel.forEach((mapel, index) => {
    pesan += `📖 *Jam ke-${index + 1}:* ${mapel}\n`;
  });

  // 2. Pembagian Tugas Kebersihan Kelas (10 Orang)
  if (anggotaPiket.length >= 10) {
    const piketKelas = acakArray(anggotaPiket);

    pesan += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    pesan += `🧹 *PEMBAGIAN PIKET KELAS (${dataMapel.hari.toUpperCase()})*\n`;
    pesan += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    pesan += `🧹 *Menyapu (2 Orang):*\n  1. ${piketKelas[0]}\n  2. ${piketKelas[1]}\n\n`;
    pesan += `🧽 *Mengepel (2 Orang):*\n  1. ${piketKelas[2]}\n  2. ${piketKelas[3]}\n\n`;
    pesan += `🪟 *Mengelap Kaca (2 Orang):*\n  1. ${piketKelas[4]}\n  2. ${piketKelas[5]}\n\n`;
    pesan += `🪑 *Mengangkat Bangku (2 Orang):*\n  1. ${piketKelas[6]}\n  2. ${piketKelas[7]}\n\n`;
    pesan += `🗑️ *Cek Kolong & Buang Sampah (1 Orang):*\n  1. ${piketKelas[8]}\n\n`;
    pesan += `🖊️ *Isi Spidol & Hapus Papan (1 Orang):*\n  1. ${piketKelas[9]}\n`;

    // 3. Pembagian Tugas Khusus (MBG & HP - Klon/Kocok dari 10 Orang)
    const piketMbg = acakArray(anggotaPiket);
    const pengambilMbg = piketMbg.slice(0, 5);
    const pengembaliMbg = piketMbg.slice(5, 10);

    const piketHp = acakArray(anggotaPiket);
    const petugasHp = piketHp.slice(0, 2);

    pesan += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    pesan += `🍱 *PEMBAGIAN TUGAS KHUSUS (${dataMapel.hari.toUpperCase()})*\n`;
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

  // Mengambil seluruh peserta grup untuk hidetag
  let mentions = [];
  if (remoteJid.endsWith('@g.us')) {
    try {
      const groupMetadata = await sock.groupMetadata(remoteJid);
      mentions = groupMetadata.participants.map(p => p.id);
    } catch (e) {
      console.error('Gagal mengambil anggota grup:', e);
    }
  }

  // Kirim pesan dengan fitur Diteruskan (Forwarded) + Hidetag All Mentions
  await sock.sendMessage(remoteJid, {
    text: pesan,
    mentions: mentions,
    contextInfo: {
      isForwarded: true,
      forwardingScore: 999
    }
  });
}

module.exports = handleJadwalCommand;