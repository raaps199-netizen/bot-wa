async function handleGameAnswer(sock, msg, userText) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db?.game?.[remoteJid];

  if (!session) return false;

  const cleanAnswer = userText.trim();

  // Fitur Menyerah
  if (['.nyerah', 'nyerah', 'menyerah', '/nyerah'].includes(cleanAnswer.toLowerCase())) {
    clearTimeout(session.timer);
    const correctAns = session.jawabanBenar;
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🏳️ *Menyerah!*\nJawaban yang benar adalah: *${correctAns}*`
    }, { quoted: msg });
    return true;
  }

  // Cek Jawaban Benar
  if (cleanAnswer === session.jawabanBenar) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🎉 *Benar sekali!*\nJawaban yang benar adalah: *${session.jawabanBenar}*`
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
