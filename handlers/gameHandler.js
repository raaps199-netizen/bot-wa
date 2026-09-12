const { getUserData, addPoints } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function handleGameAnswer(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const game = global.db?.game?.[remoteJid];

    if (!game) return false;

    // Unwrap pesan dari berbagai wadah (ephemeral, viewOnce, dll)
    const innerMsg = msg.message?.ephemeralMessage?.message || 
                     msg.message?.viewOnceMessage?.message || 
                     msg.message?.viewOnceMessageV2?.message || 
                     msg.message?.documentWithCaptionMessage?.message || 
                     msg.message;

    const body = innerMsg?.conversation || 
                 innerMsg?.extendedTextMessage?.text || 
                 innerMsg?.imageMessage?.caption || 
                 innerMsg?.videoMessage?.caption || '';

    // Konversi string eksplisit agar tipe data angka tidak bikin crash
    const cleanBody = String(body).trim().toLowerCase();
    if (!cleanBody) return false;

    const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

    // 1. Logika Menyerah (.nyerah / nyerah)
    if (cleanBody === '.nyerah' || cleanBody === 'nyerah') {
      if (['math', 'trivia', 'reme', 'qq'].includes(game.type)) {
        if (game.timer) clearTimeout(game.timer);
        
        const answerText = game.type === 'trivia' && game.jawabanTeks 
          ? `${String(game.jawabanBenar).toUpperCase()}. ${game.jawabanTeks}`
          : String(game.jawaban || game.jawabanBenar).toUpperCase();

        delete global.db.game[remoteJid];
        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        await sock.sendMessage(remoteJid, { 
          text: `🏳️ *Menyerah!* Game ${game.type.toUpperCase()} dihentikan.\nJawaban yang benar adalah: *${answerText}*` 
        }, { quoted: msg });
        return true;
      }
    }

    // 2. Logika Math (+ Poin & + mathCount)
    if (game.type === 'math') {
      if (cleanBody === String(game.jawabanBenar).toLowerCase()) {
        if (game.timer) clearTimeout(game.timer);
        delete global.db.game[remoteJid];

        const user = getUserData(global.db, senderId);
        addPoints(global.db, senderId, game.reward);
        user.mathCount = (user.mathCount || 0) + 1;

        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        const senderName = senderId.split('@')[0];
        await sock.sendMessage(remoteJid, {
          text: `🎉 *SELAMAT @${senderName}!* Jawaban kamu benar.\n💰 Poin Bertambah: *+${game.reward} Poin*\n🧮 Total Math Selesai: *${user.mathCount} soal*`,
          mentions: [senderId]
        }, { quoted: msg });
        return true;
      }
    }

    // 3. Logika Trivia (+ Poin & + triviaCount)
    if (game.type === 'trivia') {
      const isCorrectOption = game.jawabanBenar ? cleanBody === String(game.jawabanBenar).toLowerCase() : false;
      const isCorrectText = game.jawabanTeks ? cleanBody === String(game.jawabanTeks).toLowerCase() : false;

      if (isCorrectOption || isCorrectText) {
        if (game.timer) clearTimeout(game.timer);
        delete global.db.game[remoteJid];

        const user = getUserData(global.db, senderId);
        addPoints(global.db, senderId, game.points);
        user.triviaCount = (user.triviaCount || 0) + 1;

        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        const senderName = senderId.split('@')[0];
        await sock.sendMessage(remoteJid, {
          text: `🎉 *BENAR @${senderName}!* Jawaban yang tepat.\n💰 Poin Bertambah: *+${game.points} Poin*\n🧠 Total Trivia Selesai: *${user.triviaCount} soal*`,
          mentions: [senderId]
        }, { quoted: msg });
        return true;
      } else if (['a', 'b', 'c', 'd'].includes(cleanBody)) {
        await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
      }
    }

    // 4. Logika Reme & QQ (Cuma + Poin ke Score Utama)
    if (['reme', 'qq'].includes(game.type)) {
      const targetAnswer = String(game.jawaban || game.jawabanBenar).toLowerCase();

      if (cleanBody === targetAnswer) {
        if (game.timer) clearTimeout(game.timer);
        delete global.db.game[remoteJid];

        const reward = game.poin || game.points || game.reward || 15;
        addPoints(global.db, senderId, reward);

        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        const senderName = senderId.split('@')[0];
        await sock.sendMessage(remoteJid, {
          text: `🎉 *SELAMAT @${senderName}!* Jawaban kamu benar.\n💰 Poin Bertambah: *+${reward} Poin*`,
          mentions: [senderId]
        }, { quoted: msg });
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error di handleGameAnswer:', err);
    return false;
  }
}

module.exports = handleGameAnswer;
