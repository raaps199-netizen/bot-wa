// File: commands/shop.js
const { deductPoints, getTotalScore, getUserData } = require('../utils/helper');
const { baits, potions, rods } = require('../utils/fishingData');
const { addBait, addPotion } = require('../utils/inventoryManager');

async function handleShopCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const division = args[0]?.toLowerCase();

  // 1. Divisi Umpan (Bait)
  if (division === 'umpan' || division === 'bait') {
    let text = `🪱 *SHOP - DIVISI UMPAN* 🪱\n\n`;
    text += `Mempercepat waktu tunggu ikan menyambar (*timer*).\nCara Beli: *.beli <id> <jumlah>*\n\n`;
    for (const [id, data] of Object.entries(baits)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n`;
      text += `  💰 Harga: ${data.price} Poin | ⏱️ Timer: *${data.timer} Detik*\n`;
    }
    text += `\n_Ketik *.shop joran* atau *.shop potion* untuk melihat divisi lain._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // 2. Divisi Potion
  if (division === 'potion' || division === 'buff') {
    let text = `🧪 *SHOP - DIVISI POTION* 🧪\n\n`;
    text += `Meningkatkan hoki (*luck*) untuk dapet ikan langka.\nCara Beli: *.beli <id> <jumlah>*\n\n`;
    for (const [id, data] of Object.entries(potions)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n`;
      text += `  💰 Harga: ${data.price} Poin | ⏳ Durasi: *3-5 Menit*\n`;
    }
    text += `\n_Ketik *.shop umpan* atau *.shop joran* untuk melihat divisi lain._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // 3. Divisi Joran (Rods)
  if (division === 'joran' || division === 'rod' || division === 'rods') {
    let text = `🎣 *SHOP - DIVISI JORAN (ROD)* 🎣\n\n`;
    text += `Tingkatkan Tier joran untuk hoki brutal & timer kilat!\nCara Beli: *.beli <id_joran>*\n\n`;
    for (const [id, data] of Object.entries(rods)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n`;
      text += `  💰 Harga: ${data.price} Poin\n`;
      text += `  🍀 Luck: *${data.luck}x* | ⏱️ Timer: *${data.timer}s*\n`;
    }
    text += `\n_Ketik *.shop umpan* atau *.shop potion* untuk melihat divisi lain._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // 4. Menu Utama Shop (Jika tidak ketik divisinya)
  let mainText = `🛒 *FISHING RPG - SHOP CENTER* 🛒\n\n`;
  mainText += `Selamat datang di pusat perbelanjaan perlengkapan mancing! Silakan pilih divisi toko di bawah ini:\n\n`;
  mainText += `📦 *.shop umpan* - Beli berbagai jenis umpan cepat.\n`;
  mainText += `🧪 *.shop potion* - Beli ramuan penambah hoki.\n`;
  mainText += `🎣 *.shop joran* - Beli joran pancing dari Training s/d Aurora.\n\n`;
  mainText += `💡 *Cara Beli:* \n`.concat(`• Item/Pond: *.beli <id> <jumlah>*\n• Joran: *.beli <id_joran>*`);

  await sock.sendMessage(remoteJid, { text: mainText }, { quoted: msg });
}

async function handleBeliCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const itemId = args[0]?.toLowerCase();
  let amount = parseInt(args[1]);

  if (!itemId) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan ID barang yang ingin dibeli!\nContoh: *.beli cacing 5* atau *.beli crystal*\nKetik *.shop* untuk melihat katalog.` }, { quoted: msg });
  }

  let item = null;
  let type = null;

  if (baits[itemId]) {
    item = baits[itemId];
    type = 'bait';
    if (isNaN(amount) || amount < 1) amount = 1;
  } else if (potions[itemId]) {
    item = potions[itemId];
    type = 'potion';
    if (isNaN(amount) || amount < 1) amount = 1;
  } else if (rods[itemId]) {
    item = rods[itemId];
    type = 'rod';
    amount = 1; // Joran cuma bisa dibeli 1 satuan
  } else {
    return await sock.sendMessage(remoteJid, { text: `❌ Barang atau Joran dengan ID *${itemId}* tidak ditemukan di shop!` }, { quoted: msg });
  }

  const totalPrice = item.price * amount;
  const user = getUserData(global.db, senderId);
  const currentScore = getTotalScore(user);

  if (currentScore < totalPrice) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Poin kamu tidak cukup!\n\nHarga ${amount > 1 ? amount + 'x ' : ''}${item.name}: *${totalPrice} Poin*\nPoin kamu saat ini: *${currentScore} Poin*` 
    }, { quoted: msg });
  }

  // Khusus Joran: Cek apakah user sudah punya atau joran lebih rendah/sama
  if (type === 'rod') {
    user.activeRod = user.activeRod || 'training';
    // Simpan joran yang dibeli ke inventory kepemilikan joran user
    user.ownedRods = user.ownedRods || ['training'];
    
    if (user.ownedRods.includes(itemId)) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Kamu sudah memiliki joran *${item.name}* di tas!` }, { quoted: msg });
    }
  }

  // Potong Poin & Proses Item
  deductPoints(global.db, senderId, totalPrice);

  if (type === 'bait') {
    addBait(senderId, itemId, amount);
  } else if (type === 'potion') {
    addPotion(senderId, itemId, amount);
  } else if (type === 'rod') {
    user.ownedRods.push(itemId);
    user.activeRod = itemId; // Otomatis pakai joran baru yang dibeli
  }

  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  let successText = `✅ *PEMBELIAN BERHASIL!*\n\nKamu sukses membeli *${item.name}* seharga ${totalPrice} Poin.`;
  if (type === 'rod') {
    successText += `\n🔱 Joran utama kamu sekarang otomatis berganti ke *${item.name}*!`;
  }
  successText += `\n\nSisa Poin: *${getTotalScore(getUserData(global.db, senderId))}*`;

  await sock.sendMessage(remoteJid, { text: successText }, { quoted: msg });
}

module.exports = {
  handleShopCommand,
  handleBeliCommand
};
