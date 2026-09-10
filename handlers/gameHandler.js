if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db.game[remoteJid];

  if (!session) return false;

  // 1. CEK APAKAH PESAN INI HASIL REPLY KE SOAL GAME
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsgId = contextInfo?.stanzaId;

  // Jika game memiliki sistem reply (seperti Trivia) dan user TIDAK mereply soal tersebut, abaikan!
  if (session.msgId && quotedMsgId !== session.msgId) {
    return false;
  }

  let inputJawaban = text.trim().toLowerCase();

  // Bersihkan prefix jika ada (/a, .a, .jawab a)
  if (inputJawaban.startsWith('.jawab')) {
    inputJawaban = inputJawaban.slice(6).trim();
  } else if (inputJawaban.startsWith('/') || inputJawaban.startsWith('.')) {
    inputJawaban = inputJawaban.slice(1).trim();
  }

  if (!inputJawaban) return false;

  const targetJawabanOpsi = session.jawabanOpsi ? session.jawabanOpsi.toLowerCase() : '';
  const targetJawabanTeks = session.jawaban ? String(session.jawaban).toLowerCase() : '';

  // 2. PENGECEKAN JAWABAN (Opsi A/B/C/D/E atau Teks Jawaban)
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

  // 3. JIKA SALAH (Hanya merespon jika pesan tersebut adalah reply ke soal)
  if (quotedMsgId && quotedMsgId === session.msgId) {
    await sock.sendMessage(remoteJid, { 
      text: `❌ Salah! Coba tebak opsi yang lain.` 
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
