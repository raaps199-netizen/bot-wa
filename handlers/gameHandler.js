if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};
if (!global.mathGame) global.mathGame = new Map();

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const rawText = text.trim();

  // ==========================================
  // 1. PENGECEKAN KUIS MATEMATIKA (mathGame)
  // ==========================================
  if (global.mathGame.has(remoteJid)) {
    const mathSession = global.mathGame.get(remoteJid);
    
    // Bersihkan command /jawab atau prefix titik/slash tanpa merusak tanda minus (-)
    let mathInput = rawText;
    if (mathInput.toLowerCase().startsWith('.jawab')) {
      mathInput = mathInput.slice(6).trim();
    } else if (mathInput.startsWith('/') || mathInput.startsWith('.')) {
      mathInput = mathInput.slice(1).trim();
    }

    // Cek jika jawaban matematika cocok
    if (mathInput === mathSession.answer) {
      clearTimeout(mathSession.timer);
      global.mathGame.delete(remoteJid);

      await sock.sendMessage(remoteJid, {
        text: `🎉 *SELAMAT! Jawaban kamu benar!*\n\n✨ *Jawaban:* ${mathSession.answer}`
      }, { quoted: msg });

      return true;
    }
  }

  // ==========================================
  // 2. PENGECEKAN GAME UMUM (Trivia, Tebak Gambar, dll)
  // ==========================================
  const session = global.db.game[remoteJid];
  if (!session) return false;

  // Cek reply pesan ke soal game jika ada msgId
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsgId = contextInfo?.stanzaId;

  if (session.msgId && quotedMsgId !== session.msgId) {
    return false;
  }

  let inputJawaban = rawText.toLowerCase();

  // Bersihkan prefix jika ada (.jawab a, /a, .a)
  if (inputJawaban.startsWith('.jawab')) {
    inputJawaban = inputJawaban.slice(6).trim();
  } else if (inputJawaban.startsWith('/') || inputJawaban.startsWith('.')) {
    inputJawaban = inputJawaban.slice(1).trim();
  }

  if (!inputJawaban) return false;

  const targetJawabanOpsi = session.jawabanOpsi ? String(session.jawabanOpsi).toLowerCase() : '';
  const targetJawabanTeks = session.jawaban ? String(session.jawaban).toLowerCase() : '';

  // Pengecekan Opsi (A/B/C/D) atau Teks Jawaban Langsung
  const isCorrectOption = targetJawabanOpsi && inputJawaban === targetJawabanOpsi;
  const isCorrectText = targetJawabanTeks && inputJawaban === targetJawabanTeks;

  if (isCorrectOption || isCorrectText) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    const teksJawaban = session.jawabanTeks || session.jawaban;

    await sock.sendMessage(remoteJid, {
      text: `🎉 *SELAMAT!* Jawaban kamu benar!\n\n✨ *Jawaban:* ${teksJawaban}`
    }, { quoted: msg });

    return true;
  }

  // Jika jawaban salah & user melakukan reply pesan ke soal game
  if (quotedMsgId && quotedMsgId === session.msgId) {
    await sock.sendMessage(remoteJid, { 
      text: `❌ *Salah!* Coba periksa lagi jawaban kamu.` 
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
