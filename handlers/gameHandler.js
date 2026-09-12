Async function handleGameAnswer(sock, msg, userText) {
  Const remoteJid = msg.key.remoteJid;
  Const session = global.db?.game?.[remoteJid];

  If (!session) return false;

  Const cleanAnswer = userText.trim().toLowerCase();

  // 1. Deteksi Menyerah
  If (['.nyerah', 'nyerah', 'menyerah', '/nyerah'].includes(cleanAnswer)) {
    ClearTimeout(session.timer);
    Const correctAns = session.jawabanTeks || session.jawabanBenar || session.answer || session.jawabanOpsi || 'Tidak diketahui';
    Delete global.db.game[remoteJid];
    If (typeof global.saveDatabase === 'function') global.saveDatabase();
    await sock.sendMessage(remoteJid, {
      Text: `🏳️ *Menyerah!*\nJawaban yang benar adalah: *${correctAns}*`
    }, { quoted: msg });
    Return true;
  }

  // 2. Ambil kunci jawaban yang mungkin disimpan oleh berbagai jenis game
  Const possibleAnswers = [
    Session.jawabanBenar,
    Session.jawabanTeks,
    Session.answer,
    Session.jawabanOpsi
  ].filter(Boolean).map(ans => String(ans).trim().toLowerCase());

  // Cek apakah jawaban user cocok
  If (possibleAnswers.includes(cleanAnswer)) {
    ClearTimeout(session.timer);
    Delete global.db.game[remoteJid];

    // --- SISTEM SKOR OTOMATIS (SUPAYA GA HILANG) ---
    Const senderId = msg.key.participant || remoteJid;
    Const pushName = msg.pushName || 'User';

    If (!global.db.users) global.db.users = {};
    If (!global.db.users[senderId]) {
      Global.db.users[senderId] = { mathScore: 0, triviaScore: 0, name: pushName };
    }

    // Mengambil poin dari reward math atau default 15 jika game lain
    Const earnedPoints = session.reward || session.points || 15;

    If (session.type === 'math') {
      Global.db.users[senderId].mathScore = (global.db.users[senderId].mathScore || 0) + earnedPoints;
    } else {
      Global.db.users[senderId].triviaScore = (global.db.users[senderId].triviaScore || 0) + earnedPoints;
    }
    
    Global.db.users[senderId].name = pushName;
    
    // Simpan permanen ke database.json
    If (typeof global.saveDatabase === 'function') {
      Global.saveDatabase();
    }
    // ----------------------------------------------

    Const displayAnswer = session.jawabanTeks || session.jawabanBenar || session.jawabanOpsi;

    await sock.sendMessage(remoteJid, {
      Text: `🎉 *Benar sekali, ${pushName}!*\nJawaban yang benar adalah: *${displayAnswer}*\n✨ Poin didapat: *+${earnedPoints}*`
    }, { quoted: msg });
    Return true;
  }

  Return false;
}

Module.exports = { handleGameAnswer };
