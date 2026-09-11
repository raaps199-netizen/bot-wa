async function handleGameAnswer(sock, msg, userText) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db?.game?.[remoteJid];

  if (!session) return false;

  const cleanAnswer = userText.trim().toLowerCase();

  // 1. Deteksi Menyerah
  if (['.nyerah', 'nyerah', 'menyerah', '/nyerah'].includes(cleanAnswer)) {
    clearTimeout(session.timer);
    const correctAns = session.jawabanTeks || session.jawabanBenar || session.answer || 'Tidak diketahui';
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🏳️ *Menyerah!*\nJawaban yang benar adalah: *${correctAns}*`
    }, { quoted: msg });
    return true;
  }

  // 2. Ambil kunci jawaban yang mungkin disimpan oleh berbagai jenis game (math, trivia, tebak-tebakan)
  const possibleAnswers = [
    session.jawabanBenar,
    session.jawabanTeks,
    session.answer
  ].filter(Boolean).map(ans => String(ans).trim().toLowerCase());

  // Cek apakah jawaban user cocok
  if (possibleAnswers.includes(cleanAnswer)) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🎉 *Benar sekali!*\nJawaban yang benar adalah: *${session.jawabanTeks || session.jawabanBenar || session.answer}*`
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
