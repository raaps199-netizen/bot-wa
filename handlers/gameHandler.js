if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const rawText = text.trim();
  const lowerText = rawText.toLowerCase();

  // Ambil sesi game aktif dari database global
  const session = global.db.game[remoteJid];

  // ==========================================
  // OPSI MENYERAH (.nyerah / .menyerah)
  // ==========================================
  if (['.nyerah', 'nyerah', '.menyerah', 'menyerah'].includes(lowerText)) {
    if (session) {
      clearTimeout(session.timer);
      delete global.db.game[remoteJid];

      const teksJawaban = session.jawabanTeks || session.jawabanBenar || session.jawaban;
      await sock.sendMessage(remoteJid, {
        text: `🏳️ *Kamu menyerah!*\nJawaban yang benar adalah: *${teksJawaban}*`
      }, { quoted: msg });
      return true;
    }

    await sock.sendMessage(remoteJid, {
      text: '⚠️ Tidak ada game yang sedang berlangsung di chat ini.'
    }, { quoted: msg });
    return true;
  }

  // Jika tidak ada game aktif di room ini, lewati
  if (!session) return false;

  // ==========================================
  // PENANGANAN JAWABAN (Trivia, Math, dll)
  // ==========================================
  let inputJawaban = lowerText;

  // Bersihkan prefix jika pengguna mengetik .jawab / /jawab / .
  if (inputJawaban.startsWith('.jawab')) {
    inputJawaban = inputJawaban.slice(6).trim();
  } else if (inputJawaban.startsWith('/') || inputJawaban.startsWith('.')) {
    inputJawaban = inputJawaban.slice(1).trim();
  }

  if (!inputJawaban) return false;

  // Ambil opsi target dari sesi
  const targetJawabanOpsi = session.jawabanOpsi ? String(session.jawabanOpsi).toLowerCase() : '';
  const targetJawabanBenar = session.jawabanBenar ? String(session.jawabanBenar).toLowerCase() : '';
  const targetJawabanTeks = session.jawaban ? String(session.jawaban).toLowerCase() : '';

  // Validasi Jawaban (Match Opsi A/B/C/D atau Angka/Teks Murni)
  const isCorrect = (targetJawabanOpsi && inputJawaban === targetJawabanOpsi) ||
                    (targetJawabanBenar && inputJawaban === targetJawabanBenar) ||
                    (targetJawabanTeks && inputJawaban === targetJawabanTeks);

  if (isCorrect) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    const teksJawaban = session.jawabanTeks || session.jawabanBenar || session.jawaban;

    await sock.sendMessage(remoteJid, {
      text: `🎉 *SELAMAT! Jawaban kamu benar!*\n\n✨ *Jawaban:* ${teksJawaban}`
    }, { quoted: msg });

    return true;
  }

  // Jika jawaban salah (batasi panjang karakter agar pesan biasa tidak memicu notif salah)
  if (inputJawaban.length <= 30) {
    await sock.sendMessage(remoteJid, { 
      text: `❌ *Jawaban Kamu Salah!* Coba tebak/hitung lagi atau ketik *.nyerah* jika ingin menyerah.` 
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
    
