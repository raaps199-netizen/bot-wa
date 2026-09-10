if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db.game[remoteJid];

  if (!session) return false;

  let inputJawaban = text.trim();

  // Bersihkan prefix jika ada (.jawab / /jawaban)
  if (inputJawaban.toLowerCase().startsWith('.jawab')) {
    inputJawaban = inputJawaban.slice(6).trim();
  } else if (inputJawaban.startsWith('/')) {
    inputJawaban = inputJawaban.slice(1).trim();
  }

  const jawabanUser = inputJawaban.toLowerCase();
  const jawabanBenar = session.jawaban.toLowerCase();
  const jawabanAsli = session.jawabanAsli ? session.jawabanAsli.toLowerCase() : '';

  // Pengecekan Jawaban
  if (jawabanUser === jawabanBenar || (jawabanAsli && jawabanUser === jawabanAsli)) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    await sock.sendMessage(remoteJid, {
      text: `🎉 *SELAMAT!* Jawabannya benar!\n\n✨ *Jawaban:* ${session.jawaban}`
    }, { quoted: msg });
    return true;
  }

  // Respon jika salah (Hanya jika chat tersebut adalah angka/kata tunggal atau pesan ber-prefix agar tidak spam saat obrolan biasa)
  const isSingleWord = !inputJawaban.includes(' ');
  if (isSingleWord) {
    await sock.sendMessage(remoteJid, { text: `salah, gitu aja gabisa` }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
