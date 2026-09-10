async function dareCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const listDare = [
    'Kirimkan Voice Note menyanyikan lagu favoritmu selama 15 detik!',
    'Ganti nama profil WhatsApp kamu jadi "Saya Bebek" selama 1 jam!',
    'Chat kontak paling atas di WA kamu dan katakan "Aku suka kamu".',
    'Kirim stiker terlucu atau paling aneh yang kamu punya!',
    'Kirim status WhatsApp tulisan "Aku butuh kasih sayang" selama 30 menit!'
  ];

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    const randomDare = listDare[Math.floor(Math.random() * listDare.length)];
    const teks = `🔥 *DARE*\n\n"${randomDare}"\n\n_Lakukan tantangan ini sekarang!_`;

    await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error Dare:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
  }
}

module.exports = dareCommand;
