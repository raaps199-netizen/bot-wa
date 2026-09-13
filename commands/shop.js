// File: commands/shop.js
const { deductPoints, getTotalScore, getUserData } = require('../utils/helper');
const { baits } = require('../utils/fishingData');
const { addBait } = require('../utils/inventoryManager');

async function handleShopCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const command = args[0]?.toLowerCase();

  // 1. Tampilkan Katalog Shop
  if (!command || command === 'list') {
    let shopText = `🛒 *FISHING SHOP* 🛒\n\n`;
    shopText += `Beli umpan untuk memancing ikan langka!\nCara Beli: *.beli <id_umpan> <jumlah>*\nContoh: *.beli cacing 5*\n\n`;
    
    for (const [id, data] of Object.entries(baits)) {
      shopText += `🔖 *${data.name}* (ID: ${id})\n`;
      shopText += `   💰 Harga: ${data.price} Poin\n`;
      shopText += `   ✨ Efek: ${data.desc}\n\n`;
    }
    
    return await sock.sendMessage(remoteJid, { text: shopText }, { quoted: msg });
  }

  // 2. Logika Pembelian (bisa dipanggil dari .beli umpan 1)
}

async function handleBeliCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const baitId = args[0]?.toLowerCase();
  let amount = parseInt(args[1]);

  if (!baitId || !baits[baitId]) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Umpan tidak ditemukan! Ketik *.shop* untuk melihat daftar ID umpan yang benar.` 
    }, { quoted: msg });
  }

  if (isNaN(amount) || amount < 1) amount = 1;

  const item = baits[baitId];
  const totalPrice = item.price * amount;

  // Cek Poin User
  const user = getUserData(global.db, senderId);
  const currentScore = getTotalScore(user);

  if (currentScore < totalPrice) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Poin kamu tidak cukup!\n\nHarga ${amount}x ${item.name}: *${totalPrice} Poin*\nPoin kamu saat ini: *${currentScore} Poin*` 
    }, { quoted: msg });
  }

  // Potong Poin dan Tambah Umpan
  deductPoints(global.db, senderId, totalPrice);
  addBait(senderId, baitId, amount);

  await sock.sendMessage(remoteJid, { 
    text: `✅ *PEMBELIAN BERHASIL!*\n\nKamu membeli ${amount}x *${item.name}* seharga ${totalPrice} Poin.\n\nSisa Poin: *${getTotalScore(user)}*\nKetik *.mancing ${baitId}* untuk langsung menggunakannya!` 
  }, { quoted: msg });
}

module.exports = {
  handleShopCommand,
  handleBeliCommand
};
      
