const { getUserData, addPoints } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function handleGameAnswer(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const game = global.db?.game?.[remoteJid];
    
    if (!game) return false;

    // Unwrap pesan jika terbungkus ephemeral atau viewOnce
    const innerMsg = msg.message?.ephemeralMessage?.message || 
                     msg.message?.viewOnceMessage?.message || 
                     msg.message?.viewOnceMessageV2?.message || 
                     msg.message;

    const body = innerMsg?.conversation || 
                 innerMsg?.extendedTextMessage?.text || 
                 innerMsg?.imageMessage?.caption || 
                 innerMsg?.videoMessage?.caption || '';
                 
    const cleanBody = body.trim().toLowerCase();
    if (!cleanBody) return false;

    const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

    if (cleanBody === '.nyerah' || cleanBody === 'nyerah') {
      if (['math', 'trivia'].includes(game.type)) {
        if (game.timer) clearTimeout(game.timer);
        delete global.db.game[remoteJid];
        if (typeof global.saveDatabase === 'function') global.saveDatabase();
        
        await sock.sendMessage(remoteJid, { 
          text: `🏳️ *Menyerah!* Game ${game.type.toUpperCase()} dihentikan.\nJawaban yang benar adalah: *${game.jawabanBenar}*` 
        }, { quoted: msg });
        return true;
      }
    }

    if (game.type === 'math') {
      if (cleanBody === game.jawabanBenar) {
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

    if (game.type === 'trivia') {
      const isCorrectOption = cleanBody === game.jawabanBenar.toLowerCase();
      const isCorrectText = cleanBody === game.jawabanTeks;

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
      }
    }

    return false;
  } catch (err) {
    console.error('Error di handleGameAnswer:', err);
    return false;
  }
}

module.exports = handleGameAnswer;
