// File: commands/rebirth.js
const { getUserData, formatRupiah } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function handleRebirthCommand(sock, msg, senderId) {
  const remoteJid = msg.key.remoteJid;
  const user = getUserData(global.db, senderId);

  user.inventory = user.inventory || {};
  user.inventory.rebirthFragments = user.inventory.rebirthFragments || 0;
  user.rebirthLevel = user.rebirthLevel || 0;

  const REQUIRED_FRAGMENTS = 25; // Syarat minimal fragment dinaikkan jadi 50

  if (user.inventory.rebirthFragments < REQUIRED_FRAGMENTS) {
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ *REBIRTH GAGAL!*\n\n` +
            `Fragment Rebirth kamu belum cukup untuk melakukan transendensi!\n` +
            `• Dimiliki: *${user.inventory.rebirthFragments} Buah*\n` +
            `• Dibutuhkan: *${REQUIRED_FRAGMENTS} Buah*\n\n` +
            `_Kumpulkan Rebirth Fragments lewat World Boss (.event / .serang) sampai 50 buah ya, bre!_`
    }, { quoted: msg });
  }

  // Proses Rebirth
  user.inventory.rebirthFragments -= REQUIRED_FRAGMENTS;
  user.rebirthLevel += 1;

  // Benefit Permanen
  user.moneyMultiplier = (user.moneyMultiplier || 1) + 0.25;
  user.bossDamageMultiplier = (user.bossDamageMultiplier || 1) + 0.25;

  // Reset Uang & Joran
  user.points = 0;
  user.bank = 0;
  user.activeRod = 'training';

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  const userNum = senderId.split('@')[0];

  return await sock.sendMessage(remoteJid, {
    text: `✨ *REBIRTH BERHASIL! LEVEL PRESTIGE NAIK!* ✨\n\n` +
          `👤 Ksatria: @${userNum}\n` +
          `🌟 Tingkat Rebirth: *Tier ${user.rebirthLevel}*\n\n` +
          `🎁 *Benefit Permanen Aktif*:\n` +
          `• 💰 Bonus Uang: *x${user.moneyMultiplier}*\n` +
          `• ⚔️ Bonus Damage Boss: *x${user.bossDamageMultiplier}*\n\n` +
          `⚠️ *Catatan:* Dompet, Bank, dan Joran di-reset ke awal. Cek gelar baru kamu pakai *.title rebirth*!`,
    mentions: [senderId]
  }, { quoted: msg });
}

module.exports = { handleRebirthCommand };
