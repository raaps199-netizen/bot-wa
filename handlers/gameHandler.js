if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db.game[remoteJid];

  // Jika tidak ada game yang aktif di chat ini, lewati
  if (!session) return false;

  let inputJawaban = text.trim();

  // Bersihkan prefix jika user mengetik .jawab, .150, atau /150
  if (inputJawaban.toLowerCase().startsWith('.jawab')) {
    inputJawaban = inputJawaban.slice(6).trim();
  } else if (inputJawaban.startsWith('.') || inputJawaban.startsWith('/')) {
    inputJawaban = inputJawaban.slice(1).trim();
  }

  // Jika input kosong setelah dipotong prefix
  if (!inputJawaban) return false;

  const jawabanUser = inputJawaban.toLowerCase().trim();
  const jawabanBenar = String(session.jawaban).toLowerCase().trim();
  const jawabanAsli = session.jawabanAsli ? String(session.jawabanAsli).toLowerCase().trim() : '';

  // 1. JIKA JAWABAN BENAR
  if (jawabanUser === jawabanBenar || (jawabanAsli && jawabanUser === jawabanAsli)) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    await sock.sendMessage(remoteJid, {
      text: `🎉 *SELAMAT!* Jawaban kamu benar!\n\n✨ *Jawaban:* ${session.jawaban}`
    }, { quoted: msg });
    
    return true; // Tandai bahwa pesan ini adalah jawaban game!
  }

  // 2. JIKA JAWABAN SALAH (Grup/Private Chat)
  // Cek jika input berupa kata/angka tunggal (bukan obrolan kalimat panjang)
  const isSingleWord = !inputJawaban.includes(' ');
  if (isSingleWord) {
    await sock.sendMessage(remoteJid, { 
      text: `❌ Salah! Coba lagi.` 
    }, { quoted: msg });
    
    return true; // Tetap kembalikan true agar tidak dianggap command tidak ditemukan!
  }

  return false;
}

module.exports = { handleGameAnswer };
