if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const session = global.db.game[remoteJid];

  if (!session) return false;

  let inputJawaban = text.trim();

  // Jika member menjawab pakai prefix slash (misal: /jawaban)
  if (inputJawaban.startsWith('/')) {
    inputJawaban = inputJawaban.slice(1).trim();
  } else {
    // Cek apakah pesan ini MEREPLY pesan dari bot
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return false;
  }

  const jawabanUser = inputJawaban.toLowerCase();
  const jawabanBenar = session.jawaban.toLowerCase();
  const jawabanAsli = session.jawabanAsli ? session.jawabanAsli.toLowerCase() : '';

  // Jika jawaban BENAR
  if (jawabanUser === jawabanBenar || (jawabanAsli && jawabanUser === jawabanAsli)) {
    clearTimeout(session.timer);
    delete global.db.game[remoteJid];

    await sock.sendMessage(remoteJid, {
      text: `nice bener\n\n✨ *Jawaban:* ${session.jawaban}`
    }, { quoted: msg });
    return true;
  } 

  // Jika jawaban SALAH (hanya jika dia mereply/pakai slash)
  await sock.sendMessage(remoteJid, {
    text: `salah, gitu aja gabisa`
  }, { quoted: msg });

  return true;
}

module.exports = { handleGameAnswer };
