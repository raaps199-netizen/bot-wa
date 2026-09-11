async function handleGameAnswer(sock, msg, userText) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db?.game?.[remoteJid];

  if (!session) return false;

  const cleanAnswer = userText.trim();

  // Cek apakah ini game math atau trivia/tebak-tebakan lain
  if (cleanAnswer.toLowerCase() === session.jawabanBenar.toLowerCase()) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🎉 *Benar sekali!*\nJawaban yang benar adalah: *${session.jawabanBenar}*`
    }, { quoted: msg });
    return true;
  }

  // Jika user mengetik jawaban salah saat game math aktif, abaikan atau beri tahu tipis
  if (session.type === 'math') {
    // Opsional: Diamkan atau beritahu salah jika mau
    return false; 
  }

  return false;
}

module.exports = { handleGameAnswer };
