async function cekkhodamCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const nama = args.join(' ');

  if (!nama) {
    await sock.sendMessage(remoteJid, { text: '⚠️ *Harap sertakan nama!*\nContoh: `.cekkhodam Asep`' }, { quoted: msg });
    return;
  }

  const listKhodam = [
    'Macan Tutul Keriting', 'Kura-Kura Ninja', 'Ayam Kampus', 'Bebek Nyasar',
    'Naga Hitam Indosiar', 'Kucing Garong', 'Pocong Mini', 'Kuntilanak Merah',
    'Genderuwo Slebew', 'Tuyul Racing', 'Singa Depresi', 'Gajah Terbang',
    'Buaya Darat', 'Katak Bhizer', 'Semut Merah Patah Hati', 'Lalat Hijau',
    'Cacing Besar Alaska', 'Kancil Cerdik', 'Laba-Laba Sunda', 'Kecoa Terbang',
    'Babi Ngepet 2.0', 'Kambing Hitam', 'Musang King', 'Kijang Satu',
    'Kera Sakti', 'Garuda Pancasila', 'Raja Jin', 'Ratu Pantai Selatan',
    'Pangeran Kodok', 'Putri Duyung Nyangkut', 'Kuda Lumping', 'Banteng Merah',
    'Gorila Santuy', 'Ikan Lele Terbang', 'Cenderawasih Emas', 'Elang Jawa',
    'Srigala Terakhir', 'Beruang Madu', 'Tapir Kayang', 'Panda Begadang',
    'Sapi Peras', 'Anjing Galak', 'Kuda Nil Sariawan', 'Kadal Bintit',
    'Tokek Pemasok Wafer', 'Kadal Gurun', 'Kura-Kura Turbo', 'Kura-Kura Ninja'
  ];

  const randomKhodam = listKhodam[Math.floor(Math.random() * listKhodam.length)];

  const teks = `🔮 *CEK KHODAM*\n\n` +
    `👤 *Nama:* ${nama}\n` +
    `✨ *Khodam Kamu:* *${randomKhodam}*`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
}

module.exports = cekkhodamCommand;
