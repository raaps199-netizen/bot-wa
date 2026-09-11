const { getSender } = require('../utils/helper'); // Sesuaikan helper jika ada, atau ambil dari msg

if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  // Cek apakah pengirim sedang dalam game lain atau reme aktif
  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif!' }, { quoted: msg });
  }

  // Ambil target yang di-tag atau dikutip
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length === 0) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tag player yang mau kamu tantang!\nContoh: *.reme @user*' }, { quoted: msg });
  }

  const targetId = mentioned[0];
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Mana bisa main lawan diri sendiri, bro!' }, { quoted: msg });
  }

  // Simpan data tantangan pending
  global.db.remeChallenges[remoteJid] = {
    challenger: senderId,
    challenged: targetId,
    timestamp: Date.now()
  };

  const text = `🎰 *REME DUEL CHALLENGE* 🎰\n\n@${senderId.split('@')[0]} menantang @${targetId.split('@')[0]} buat adu Reme Kasino!\n\nKetik *.terima* buat gas main, atau *.tolak* buat kabur (pengecut).`;

  await sock.sendMessage(remoteJid, {
    text: text,
    mentions: [senderId, targetId]
  }, { quoted: msg });
}

module.exports = remeCommand;

