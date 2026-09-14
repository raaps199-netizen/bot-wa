// File: commands/shop.js
const { deductPoints, getTotalScore, getUserData, formatRupiah } = require('../utils/helper');
const { baits, potions, rods, autoPasses } = require('../utils/fishingData');
const { addBait, addPotion } = require('../utils/inventoryManager');

// Fallback aman jika autoPasses belum terdaftar di fishingData.js
const defaultAutoPasses = {
  'auto5m': { name: 'Auto-Fish Pass (5 Menit)', price: 5000, duration: 5 * 60 * 1000, desc: 'Pass untuk mancing otomatis selama 5 menit.' },
  'auto15m': { name: 'Auto-Fish Pass (15 Menit)', price: 12000, duration: 15 * 60 * 1000, desc: 'Pass untuk mancing otomatis selama 15 menit.' },
  'auto1h': { name: 'Auto-Fish Pass (1 Jam)', price: 40000, duration: 60 * 60 * 1000, desc: 'Pass untuk mancing otomatis selama 1 jam.' }
};

async function handleShopCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const division = args[0]?.toLowerCase();
  const passes = autoPasses || defaultAutoPasses;

  // 1. Divisi Umpan
  if (division === 'umpan' || division === 'bait') {
    let text = `🪱 *SHOP - DIVISI UMPAN* 🪱\n\n`;
    text += `Mempercepat waktu tunggu ikan menyambar (*timer*).\nCara Beli: *.beli <id> <jumlah>*\n\n`;
    for (const [id, data] of Object.entries(baits)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n  💰 Harga: ${formatRupiah(data.price)}\n`;
    }
    text += `\n_Ketik *.shop* untuk kembali ke menu utama._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // 2. Divisi Potion
  if (division === 'potion' || division === 'buff') {
    let text = `🧪 *SHOP - DIVISI POTION* 🧪\n\n`;
    text += `Meningkatkan hoki (*luck*) untuk dapet ikan langka.\nCara Beli: *.beli <id> <jumlah>*\n\n`;
    for (const [id, data] of Object.entries(potions)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n  💰 Harga: ${formatRupiah(data.price)} | ⏳ Durasi: *3-5 Menit*\n`;
    }
    text += `\n_Ketik *.shop* untuk kembali ke menu utama._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // 3. Divisi Joran
  if (division === 'joran' || division === 'rod' || division === 'rods') {
    let text = `🎣 *SHOP - DIVISI JORAN (ROD)* 🎣\n\n`;
    text += `Tingkatkan Tier joran untuk hoki brutal & timer kilat!\nCara Beli: *.beli <id_joran>*\n\n`;
    for (const [id, data] of Object.entries(rods)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n  💰 Harga: ${formatRupiah(data.price)}\n  🍀 Luck: *${data.luck}x* | ⏱️ Timer: *${data.timer}s*\n`;
    }
    text += `\n_Ketik *.shop* untuk kembali ke menu utama._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // 4. Divisi Auto-Fish Pass
  if (division === 'auto' || division === 'pass') {
    let text = `⏱️ *SHOP - DIVISI AUTO-FISH PASS* ⏱️\n\n`;
    text += `Beli durasi waktu untuk mengaktifkan fitur mancing otomatis (*AFK*).\nCara Beli: *.beli <id_pass>*\n\n`;
    for (const [id, data] of Object.entries(passes)) {
      text += `• *${data.name}* (ID: \`${id}\`)\n  💰 Harga: ${formatRupiah(data.price)} | ⏳ Durasi: *${data.duration / 60000} Menit*\n  💬 _${data.desc}_\n\n`;
    }
    text += `_Ketik *.shop* untuk kembali ke menu utama._`;
    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }

  // Menu Utama Shop
  let mainText = `🛒 *FISHING RPG - SHOP CENTER* 🛒\n\n`;
  mainText += `Selamat datang di pusat perbelanjaan! Silakan pilih divisi toko di bawah ini:\n\n`;
  mainText += `📦 *.shop umpan* - Beli berbagai jenis umpan cepat.\n`;
  mainText += `🧪 *.shop potion* - Beli ramuan penambah hoki.\n`;
  mainText += `🎣 *.shop joran* - Beli joran pancing berkualitas.\n`;
  mainText += `⏱️ *.shop auto* - Beli pass waktu untuk auto-mancing (AFK).\n\n`;
  mainText += `💡 *Cara Beli:* \n• Item/Potion: *.beli <id> <jumlah>*\n• Joran & Pass: *.beli <id_item>*`;

  await sock.sendMessage(remoteJid, { text: mainText }, { quoted: msg });
}

async function handleBeliCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const itemId = args[0]?.toLowerCase();
  let amount = parseInt(args[1]);
  const passes = autoPasses || defaultAutoPasses;

  if (!itemId) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan ID barang yang ingin dibeli!\nContoh: *.beli cacing 5* atau *.beli auto5m*\nKetik *.shop* untuk melihat katalog.` }, { quoted: msg });
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
    amount = 1;
  } else if (passes[itemId]) {
    item = passes[itemId];
    type = 'autoPass';
    amount = 1;
  } else {
    return await sock.sendMessage(remoteJid, { text: `❌ Barang dengan ID *${itemId}* tidak ditemukan di shop!` }, { quoted: msg });
  }

  const totalPrice = item.price * amount;
  const user = getUserData(global.db, senderId);
  const currentScore = getTotalScore(user);

  if (currentScore < totalPrice) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Saldo kamu tidak cukup[span_3](start_span)[span_3](end_span)!\n\nHarga ${amount > 1 ? amount + 'x ' : ''}${item.name}: *${formatRupiah(totalPrice)}*\nSaldo kamu saat ini: *${formatRupiah(currentScore)}*` 
    }, { quoted: msg });
  }

  if (type === 'rod') {
    user.activeRod = user.activeRod || 'training';
    user.ownedRods = user.ownedRods || ['training'];
    
    if (user.ownedRods.includes(itemId)) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Kamu sudah memiliki joran *${item.name}* di tas!` }, { quoted: msg });
    }
  }

  deductPoints(global.db, senderId, totalPrice);

  if (type === 'bait') {
    addBait(senderId, itemId, amount);
  } else if (type === 'potion') {
    addPotion(senderId, itemId, amount);
  } else if (type === 'rod') {
    user.ownedRods.push(itemId);
    user.activeRod = itemId;
  } else if (type === 'autoPass') {
    const now = Date.now();
    user.autoFishingUntil = (user.autoFishingUntil && user.autoFishingUntil > now ? user.autoFishingUntil : now) + item.duration;
  }

  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  let successText = `✅ *PEMBELIAN BERHASIL!*\n\nKamu sukses membeli *${item.name}* seharga ${formatRupiah(totalPrice)}.`;
  if (type === 'rod') {
    successText += `\n🔱 Joran utama kamu sekarang otomatis berganti ke *${item.name}*!`;
  } else if (type === 'autoPass') {
    const sisaMenit = Math.ceil((user.autoFishingUntil - Date.now()) / 60000);
    successText += `\n⏱️ Masa aktif Auto-Fish kamu sekarang: *~${sisaMenit} Menit* ke depan!`;
  }
  successText += `\n\nSisa Saldo: *${formatRupiah(getTotalScore(getUserData(global.db, senderId)))}*`;

  await sock.sendMessage(remoteJid, { text: successText }, { quoted: msg });
}

module.exports = {
  handleShopCommand,
  handleBeliCommand
};
