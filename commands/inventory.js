// File: commands/inventory.js
const { getUserData, formatRupiah } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function handleInventoryCommand(sock, msg, senderId) {
  const remoteJid = msg.key.remoteJid;
  const user = getUserData(global.db, senderId);

  // Pastikan struktur inventory aman & terinisialisasi
  user.inventory = user.inventory || {};
  user.inventory.materials = user.inventory.materials || {};
  user.inventory.rebirthFragments = user.inventory.rebirthFragments || 0;

  const userNum = senderId.split('@')[0];
  const materials = user.inventory.materials;

  let text = `🎒 *INVENTORY KEKAYAAN & MATERIAL* 🎒\n`;
  text += `👤 Pemilik: @${userNum}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✨ *Rebirth Fragments*: *${user.inventory.rebirthFragments} Buah*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📦 *Koleksi Material Boss*:\n`;

  const matKeys = Object.keys(materials);
  if (matKeys.length === 0) {
    text += `_Belum punya material. Ayo ikut buru World Boss!_\n`;
  } else {
    matKeys.forEach(matName => {
      text += `• ${matName} : *${materials[matName]}x*\n`;
    });
  }

  return await sock.sendMessage(remoteJid, { text, mentions: [senderId] }, { quoted: msg });
}

module.exports = { handleInventoryCommand };

