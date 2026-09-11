if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};
if (!global.mathGame) global.mathGame = new Map();

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const rawText = text.trim();
  const lowerText = rawText.toLowerCase();

  // ==========================================
  // OPSI MENYERAH (.nyerah / .menyerah)
  // ==========================================
  if (['.nyerah', 'nyerah', '.menyerah', 'menyerah'].includes(lowerText)) {
    // A. Menyerah di Game Math
    if (global.mathGame.has(remoteJid)) {
      const mathSession = global.mathGame.get(remoteJid);
      clearTimeout(mathSession.timer);
      global.mathGame.delete(remoteJid);

      await sock.sendMessage(remoteJid, {
        text: `🏳️ *Kamu menyerah!*\nJawaban kuis matematika tersebut adalah: *${mathSession.answer}*`
      }, { quoted: msg });
      return true;
    }

    // B. Menyerah di Game Umum (Trivia, Tebak Gambar, dll)
    if (global.db.game[remoteJid]) {
      const session = global.db.game[remoteJid];
      clearTimeout(session.timer);
      delete global.db.game[remoteJid];

      const teksJawaban = session.jawabanTeks || session.jawaban;
      await sock.sendMessage(remoteJid, {
        text: `🏳️ *Kamu menyerah!*\nJawaban yang benar adalah: *${teksJawaban}*`
      }, { quoted: msg });
      return true;
    }

    // Jika tidak ada game aktif
    await sock.sendMessage(remoteJid, {
      text: '⚠️ Tidak ada game yang sedang berlangsung di chat ini.'
    }, { quoted: msg });
    return true;
  }

  // ==========================================
  // 1. PENGECEKAN KUIS MATEMATIKA (mathGame)
  // ==========================================
  if (global.mathGame.has(remoteJid)) {
    const mathSession = global.mathGame.get(remoteJid);
    
    let mathInput = rawText;
    if (mathInput.toLowerCase().startsWith('.jawab')) {
      mathInput = mathInput.slice(6).trim();
    } else if (mathInput.startsWith('/') || mathInput.startsWith('.')) {
      mathInput = mathInput.slice(1).trim();
    }

    if (mathInput === mathSession.answer) {
      clearTimeout(mathSession.timer);
      global.mathGame.delete(remoteJid);

      await sock.sendMessage(remoteJid, {
        text: `🎉 *SELAMAT! Jawaban kamu benar!*\n\n✨ *Jawaban:* ${mathSession.answer}`
      }, { quoted: msg });

      return true;
    }

    if (/^-?\d+$/.test(mathInput)) {
      await sock.sendMessage(remoteJid, {
        text: `❌ *Jawaban Matematika Kamu Salah!* Coba hitung lagi atau ketik *.nyerah* untuk menyerah.`
      }, { quoted: msg });
      return true;
    }
  }

  // ==========================================
  // 2. PENGECEKAN GAME UMUM (Trivia, Tebak Gambar, dll)
  // ==========================================
  const session = global.db.game[remoteJid];
  if (!session) return false;

  let inputJawaban = lowerText;

  if (inputJawaban.startsWith('.jawab')) {
    inputJawaban = inputJawaban.slice(6).trim();
  } else if (inputJawaban.startsWith('/') || inputJawaban.startsWith('.')) {
    inputJawaban = inputJawaban.slice(1).trim();
  }

  if (!inputJawaban) return false;

  const targetJawabanOpsi = session.jawabanOpsi ? String(session.jawabanOpsi).toLowerCase() : '';
  const targetJawabanTeks = session.jawaban ? String(session.jawaban).toLowerCase() : '';

  const isCorrectOption = targetJawabanOpsi && inputJawaban === targetJawabanOpsi;
  const isCorrectText = targetJawabanTeks && inputJawaban === targetJawabanTeks;

  if (isCorrectOption || isCorrectText) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    const teksJawaban = session.jawabanTeks || session.jawaban;

    await sock.sendMessage(remoteJid, {
      text: `🎉 *SELAMAT! Jawaban kamu benar!*\n\n✨ *Jawaban:* ${teksJawaban}`
    }, { quoted: msg });

    return true;
  }

  // Jika jawaban salah
  if (inputJawaban.length <= 30) {
    await sock.sendMessage(remoteJid, { 
      text: `❌ *Jawaban Kamu Salah!* Coba tebak lagi atau ketik *.nyerah* jika ingin menyerah.` 
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
    
