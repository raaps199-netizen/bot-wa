async function handleGameAnswer(sock, msg, userText) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db?.game?.[remoteJid];

  if (!session) return false;

  const cleanAnswer = userText.trim();

  // 1. Cek fitur menyerah (.nyerah)
  if (['.nyerah', 'nyerah', 'menyerah', '/nyerah'].includes(cleanAnswer.toLowerCase())) {
    clearTimeout(session.timer);
    const correctAns = session.jawabanTeks || session.jawabanBenar;
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🏳️ *Menyerah!*\nJawaban yang benar adalah: *${correctAns}*`
    }, { quoted: msg });
    return true;
  }

  // 2. Cek jawaban benar (Support untuk case-insensitive & spasi berlebih)
  const isCorrect = 
    cleanAnswer.toLowerCase() === session.jawabanBenar.toLowerCase() ||
    (session.jawabanTeks && cleanAnswer.toLowerCase() === session.jawabanTeks.toLowerCase());

  if (isCorrect) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🎉 *Benar sekali!*\nJawaban yang benar adalah: *${session.jawabanTeks || session.jawabanBenar}*`
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
