// File: commands/shop.js
const { deductPoints, getTotalScore, getUserData } = require('../utils/helper'); // BENAR

const { baits, potions } = require('./fishingData');
const { addBait, addPotion } = require('./inventoryManager');

async function handleShopCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  
  let shopText = `🛒 *FISHING & POTION SHOP* 🛒\n\n`;
  shopText += `Beli Umpan untuk mempercepat timer mancing, atau Potion untuk hoki ikan langka!\n`;
  shopText += `Cara Beli: *.beli <id_barang> <jumlah>*\nContoh: *.beli cacing 10* atau *.beli minor 1*\n\n`;
  
  shopText += `🪱 *--- KATALOG UMPAN (KECEPATAN) ---*\n`;
  for (const [id, data] of Object.entries(baits)) {
    shopText += `• *${data.name}* (ID: \`${id}\`)\n`;
    shopText += `  💰 Harga: ${data.price} Poin | ⏱️ Timer: *${data.timer} Detik*\n`;
  }
  
  shopText += `\n🧪 *--- KATALOG POTION (LUCK BUFF) ---*\n`;
  for (const [id, data] of Object.entries(potions)) {
    shopText += `• *${data.name}* (ID: \`${id}\`)\n`;
    shopText += `  💰 Harga: ${data.price} Poin | ✨ ${data.desc}\n`;
  }
  
  await sock.sendMessage(remoteJid, { text: shopText }, { quoted: msg });
}

async function handleBeliCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const itemId = args[0]?.toLowerCase();
  let amount = parseInt(args[1]);

  if (!itemId) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan ID barang yang ingin dibeli!\nContoh: *.beli cacing 5*\nKetik *.shop* untuk melihat list.` }, { quoted: msg });
  }

  if (isNaN(amount) || amount < 1) amount = 1;

  let item = null;
  let type = null;

  if (baits[itemId]) {
    item = baits[itemId];
    type = 'bait';
  } else if (potions[itemId]) {
    item = potions[itemId];
    type = 'potion';
  } else {
    return await sock.sendMessage(remoteJid, { text: `❌ Barang dengan ID *${itemId}* tidak ditemukan di shop!` }, { quoted: msg });
  }

  const totalPrice = item.price * amount;
  const user = getUserData(global.db, senderId);
  const currentScore = getTotalScore(user);

  if (currentScore < totalPrice) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Poin kamu tidak cukup!\n\nHarga ${amount}x ${item.name}: *${totalPrice} Poin*\nPoin kamu saat ini: *${currentScore} Poin*` 
    }, { quoted: msg });
  }

  // Potong Poin & Tambahkan Item ke Inventory
  deductPoints(global.db, senderId, totalPrice);

  if (type === 'bait') {
    addBait(senderId, itemId, amount);
  } else {
    addPotion(senderId, itemId, amount);
  }

  await sock.sendMessage(remoteJid, { 
    text: `✅ *PEMBELIAN BERHASIL!*\n\nKamu membeli ${amount}x *${item.name}* seharga ${totalPrice} Poin.\n\nSisa Poin: *${getTotalScore(getUserData(global.db, senderId))}*` 
  }, { quoted: msg });
}

module.exports = {
  handleShopCommand,
  handleBeliCommand
};
