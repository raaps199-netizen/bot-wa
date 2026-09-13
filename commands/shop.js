// File: commands/shop.js
const { deductPoints, getTotalScore, getUserData } = require('../utils/helper');
const { potions } = require('../utils/fishingData');
const { addPotion } = require('../utils/inventoryManager');

async function handleShopCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  
  let shopText = `🛒 *FISHING BLACK MARKET* 🛒\n\n`;
  shopText += `Beli Potion untuk memperbesar peluang tangkapan langka!\nCara Beli: *.beli <id_potion> <jumlah>*\nContoh: *.beli minor 1*\n\n`;
  
  for (const [id, data] of Object.entries(potions)) {
    shopText += `🧪 *${data.name}* (ID: ${id})\n`;
    shopText += `   💰 Harga: ${data.price} Poin\n`;
    shopText += `   ✨ Efek: ${data.desc}\n\n`;
  }
  
  await sock.sendMessage(remoteJid, { text: shopText }, { quoted: msg });
}

async function handleBeliCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const potionId = args[0]?.toLowerCase();
  let amount = parseInt(args[1]);

  if (!potionId || !potions[potionId]) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Barang tidak ditemukan! Ketik *.shop* untuk melihat ID yang benar.` 
    }, { quoted: msg });
  }

  if (isNaN(amount) || amount < 1) amount = 1;

  const item = potions[potionId];
  const totalPrice = item.price * amount;
  const user = getUserData(global.db, senderId);
  const currentScore = getTotalScore(user);

  if (currentScore < totalPrice) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Poin kamu tidak cukup!\n\nHarga ${amount}x ${item.name}: *${totalPrice} Poin*\nPoin kamu saat ini: *${currentScore} Poin*` 
    }, { quoted: msg });
  }

  deductPoints(global.db, senderId, totalPrice);
  addPotion(senderId, potionId, amount);

  await sock.sendMessage(remoteJid, { 
    text: `✅ *PEMBELIAN BERHASIL!*\n\nKamu membeli ${amount}x *${item.name}* seharga ${totalPrice} Poin.\n\nKetik *.fish pakai ${potionId}* sebelum mancing untuk mengaktifkannya!` 
  }, { quoted: msg });
}

module.exports = {
  handleShopCommand,
  handleBeliCommand
};
