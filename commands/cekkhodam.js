async function cekkhodamCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const nama = args.join(' ');

  if (!nama) {
    return await sock.sendMessage(remoteJid, { text: '❌ Masukkan nama kamu! Contoh: *.cekkhodam Budi*' }, { quoted: msg });
  }

  // Daftar nama khodam yang lucu dan seru
  const listKhodam = [
    'Macan Ternak', 'Naga Sumbing', 'Kucing Garong', 'Rawa Rontek', 'Kecoa Terbang',
    'Amba Hitam', 'Bebek Pemarah', 'Poci Bakar', 'Genderuwo Pendiam', 'Singa Depresi',
    'Tikus Got', 'Lontong Lumer', 'Tuyul Berambut', 'Cacing Sakti', 'Kaki Seribu',
    'Sepeda Ontel', 'Sendal Capit', 'Kasur Lipat', 'Remote TV', 'Kipas Angin Kosmos',
    'Bakso Beranak', 'Ular Keket', 'Kunti Bergincu', 'Ocong Gowes', 'Tuyul Online'
  ];

  try {
    // Reaksi loading
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    // Pilih khodam secara acak
    const khodam = listKhodam[Math.floor(Math.random() * listKhodam.length)];
    
    // Siapkan teks jawaban
    const teks = `🔮 *CEK KHODAM ONLINE*\n\n` +
      `👤 *Nama:* ${nama}\n` +
      `👻 *Khodam:* *${khodam}*\n\n` +
      `_Khodam ini selalu mengawasimu setiap saat!_`;

    // Kirim jawaban
    await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });

    // Reaksi sukses
    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error Khodam:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
  }
}

module.exports = cekkhodamCommand;
