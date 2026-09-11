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

  // 2. Ambil kunci jawaban yang mungkin disimpan oleh berbagai jenis game
  const possibleAnswers = [
    session.jawabanBenar,
    session.jawabanTeks,
    session.answer
  ].filter(Boolean).map(ans => String(ans).trim().toLowerCase());

  // Cek apakah jawaban user cocok
  if (possibleAnswers.includes(cleanAnswer)) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    // --- SISTEM SKOR OTOMATIS ---
    const senderId = msg.key.participant || remoteJid;
    const pushName = msg.pushName || 'User';

    if (!global.db.users) global.db.users = {};
    if (!global.db.users[senderId]) {
      global.db.users[senderId] = { mathScore: 0, triviaScore: 0, name: pushName };
    }

    const earnedPoints = session.points || 10;

    if (session.type === 'math') {
      global.db.users[senderId].mathScore = (global.db.users[senderId].mathScore || 0) + earnedPoints;
    } else if (session.type === 'trivia') {
      global.db.users[senderId].triviaScore = (global.db.users[senderId].triviaScore || 0) + earnedPoints;
    } else {
      // Default jika tipe game lain, masuk ke mathScore atau buat umum
      global.db.users[senderId].mathScore = (global.db.users[senderId].mathScore || 0) + earnedPoints;
    }
    
    global.db.users[senderId].name = pushName;
    // ----------------------------

    await sock.sendMessage(remoteJid, {
      text: `🎉 *Benar sekali, ${pushName}!*\nJawaban yang benar adalah: *${session.jawabanTeks || session.jawabanBenar || session.answer}*\n✨ Poin didapat: *+${earnedPoints}*`
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
