async function truthCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const listTruth = [
    'Apa hal paling memalukan yang pernah kamu alami?',
    'Siapa orang yang diam-diam kamu sukai saat ini?',
    'Pernahkah kamu bohong ke orang tua? Soal apa?',
    'Apa kebiasaan burukmu yang tidak diketahui orang lain?',
    'Kapan terakhir kali kamu menangis dan karena apa?',
    'Apa penyesalan terbesar dalam hidupmu sampai saat ini?'
  ];

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    const randomTruth = listTruth[Math.floor(Math.random() * listTruth.length)];
    const teks = `🎯 *TRUTH*\n\n"${randomTruth}"\n\n_Jawablah dengan jujur!_`;

    await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error Truth:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
  }
}

module.exports = truthCommand;
