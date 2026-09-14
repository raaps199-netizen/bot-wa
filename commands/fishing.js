// File: commands/fishing.js
const { getRandomCatch, rarityEmoji, baits, potions, rods } = require('../utils/fishingData');
const {
  addItem, getInventory, getInventorySummary, sellItem, sellAllItems, getUserStats,
  getActiveBuff, usePotion, getBaitCount, consumeBait
} = require('../utils/inventoryManager');
const { getUserData, getTotalScore, addPoints, deductPoints, formatRupiah } = require('../utils/helper');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
global.activeAutoFish = global.activeAutoFish || {};

async function handleFishingCommand(sock, msg, primaryCommand, args, sender) {
  let subCmd = args[0]?.toLowerCase();
  let subArgs = args.slice(1);

  try {
    // 1. Perintah Direct: .lnj / .lanjut
    if (['lnj', 'lanjut'].includes(primaryCommand)) {
      return await fishCommand(sock, msg, sender, true, subCmd);
    }

    // 2. Perintah Direct: .favorit <nomor>
    if (['favorit', 'fav', 'favorite'].includes(primaryCommand)) {
      return await favoritCommand(sock, msg, sender, args);
    }

    // 3. Perintah Direct: .start auto & .stop auto / .autofish
    if (primaryCommand === 'autofish') {
      if (subCmd === 'stop') return await stopAutoFish(sock, msg, sender);
      return await startAutoFish(sock, msg, sender, subCmd);
    }

    if (primaryCommand === 'start' && subCmd === 'auto') {
      return await startAutoFish(sock, msg, sender, subArgs[0]);
    }

    if (primaryCommand === 'stop' && subCmd === 'auto') {
      return await stopAutoFish(sock, msg, sender);
    }

    if (primaryCommand === 'mancing') {
      if (!subCmd) {
        return await sock.sendMessage(msg.key.remoteJid, { 
          text: `⚠️ *KAMU HARUS PAKAI UMPAN BARU BISA MANCING!*\n\nFormat: *.mancing <nama_umpan>*\nContoh: *.mancing roti* atau *.mancing pelet*\n\nCek stok umpan di *.fish tas* atau beli di *.shop*` 
        }, { quoted: msg });
      }

      if (['lnj', 'lanjut', 'tas', 'inv', 'inventory', 'sell', 'sellall', 'stats', 'pakai', 'rod', 'joran', 'pakaijoran', 'favorit', 'fav', 'help'].includes(subCmd)) {
        primaryCommand = 'fish';
      } else {
        return await fishCommand(sock, msg, sender, false, subCmd);
      }
    }

    if (primaryCommand === 'fish') {
      if (!subCmd) subCmd = 'help';
      
      if (baits[subCmd]) {
        return await fishCommand(sock, msg, sender, false, subCmd);
      }

      switch (subCmd) {
        case 'cast':
        case 'mancing':
          return await fishCommand(sock, msg, sender, false, subArgs[0]);
        
        case 'lnj':
        case 'lanjut':
          return await fishCommand(sock, msg, sender, true, subArgs[0]);
          
        case 'inv':
        case 'inventory':
        case 'tas':
          return await inventoryCommand(sock, msg, sender);
        
        case 'favorit':
        case 'fav':
          return await favoritCommand(sock, msg, sender, subArgs);

        case 'sell':
          return await sellCommand(sock, msg, sender, subArgs);
        
        case 'sellall':
          return await sellAllCommand(sock, msg, sender);
        
        case 'stats':
          return await statsCommand(sock, msg, sender);

        case 'pakai':
          return await pakaiPotionCommand(sock, msg, sender, subArgs);

        case 'rod':
        case 'joran':
          return await rodCommand(sock, msg, sender);

        case 'pakaijoran':
        case 'setrod':
          return await switchRodCommand(sock, msg, sender, subArgs);

        case 'autofish':
        case 'auto':
          if (subArgs[0] === 'stop') {
            return await stopAutoFish(sock, msg, sender);
          }
          return await startAutoFish(sock, msg, sender, subArgs[0]);
        
        case 'help':
        case 'bantuan':
        default:
          return await fishingHelpCommand(sock, msg);
      }
    }
  } catch (error) {
    console.error('Fishing command error:', error);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${error.message}` });
  }
}

async function startAutoFish(sock, msg, sender, baitInput) {
  const remoteJid = msg.key.remoteJid;
  const user = global.db.users[sender] || {};
  const now = Date.now();

  if (!user.autoFishingUntil || user.autoFishingUntil <= now) {
    return await sock.sendMessage(remoteJid, {
      text: `❌ *Kamu belum memiliki Auto-Fish Pass aktif!*\n\nBeli durasi terlebih dahulu di shop:\n👉 *.shop auto*\n👉 *.beli auto5m*`
    }, { quoted: msg });
  }

  if (global.activeAutoFish[sender]) {
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ *Auto-Fish kamu sudah berjalan!*\nKetik *.stop auto* untuk menghentikan.`
    }, { quoted: msg });
  }

  let baitId = baitInput?.toLowerCase() || user.lastBait || 'roti';
  if (!baits[baitId]) baitId = 'roti';

  if (getBaitCount(sender, baitId) < 1) {
    return await sock.sendMessage(remoteJid, {
      text: `❌ Stok umpan *${baits[baitId].name}* kamu habis!\nSilakan beli terlebih dahulu di *.shop*`
    }, { quoted: msg });
  }

  global.activeAutoFish[sender] = true;
  const sisaMenit = Math.ceil((user.autoFishingUntil - now) / 60000);

  let sentMsg = await sock.sendMessage(remoteJid, {
    text: `🤖 ⚙️ *AUTO-FISH STARTED!*\n\n🪱 Umpan: *${baits[baitId].name}*\n⏱️ Sisa Durasi Pass: *~${sisaMenit} Menit*\n\n_Memulai pancingan..._`
  }, { quoted: msg });

  user.lastFishKey = sentMsg.key;
  user.lastBait = baitId;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  runAutoFishLoop(sock, msg, sender, baitId);
}

async function stopAutoFish(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  if (!global.activeAutoFish[sender]) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Auto-Fish kamu sedang tidak aktif!` 
    }, { quoted: msg });
  }

  global.activeAutoFish[sender] = false;
  await sock.sendMessage(remoteJid, { 
    text: `🛑 *AUTO-FISH BERHASIL DIHENTIKAN!*` 
  }, { quoted: msg });
}

async function runAutoFishLoop(sock, msg, sender, baitId) {
  const remoteJid = msg.key.remoteJid;

  while (global.activeAutoFish[sender]) {
    const user = global.db.users[sender] || {};
    const now = Date.now();

    if (!user.autoFishingUntil || user.autoFishingUntil <= now) {
      global.activeAutoFish[sender] = false;
      await sock.sendMessage(remoteJid, {
        text: `🛑 *AUTO-FISH BERHENTI!*\n\n⏱️ Masa aktif Auto-Fish Pass kamu telah habis. Beli lagi di *.shop auto*!`
      });
      break;
    }

    if (getBaitCount(sender, baitId) < 1) {
      global.activeAutoFish[sender] = false;
      await sock.sendMessage(remoteJid, {
        text: `🛑 *AUTO-FISH BERHENTI!*\n\n🪱 Stok umpan *${baits[baitId].name}* kamu habis. Beli lagi di *.shop*!`
      });
      break;
    }

    try {
      await fishCommand(sock, msg, sender, true, baitId, true);
    } catch (e) {
      console.error('Error during auto fish step:', e);
    }

    await delay(2000);
  }
}

async function fishCommand(sock, msg, sender, isLnj = false, inputBait = null, isAutoLoop = false) {
  const remoteJid = msg.key.remoteJid;
  const user = global.db.users[sender] || {};

  const activeRodId = user.activeRod || 'training';
  const currentRod = rods[activeRodId] || rods['training'];

  let baitId = inputBait?.toLowerCase();
  if (!baitId && isLnj && user.lastBait) {
    baitId = user.lastBait;
  }

  if (!baitId || !baits[baitId]) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ *KAMU HARUS PAKAI UMPAN BARU BISA MANCING!*\n\nFormat: *.mancing <nama_umpan>*\nContoh: *.mancing roti* atau *.mancing cacing*` 
    }, { quoted: msg });
  }

  const stock = getBaitCount(sender, baitId);
  if (stock < 1) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Umpan *${baits[baitId].name}* kamu habis!\nSilakan beli terlebih dahulu di *.shop*` 
    }, { quoted: msg });
  }

  consumeBait(sender, baitId);

  let editKey = null;
  if (isLnj && user.lastFishKey) {
    editKey = user.lastFishKey;
  }

  const activeBuffId = getActiveBuff(sender);
  const buffText = activeBuffId ? `\n🧪 *Potion:* ${potions[activeBuffId].name}` : '';
  
  const serverLuck = (global.serverAuroraEvent && global.serverAuroraEvent.active) 
    ? global.serverAuroraEvent.multiplier 
    : 1.0;
  const serverLuckText = serverLuck > 1 ? `\n🔥 *Server Luck:* ${serverLuck}x` : '';

  const timerDuration = currentRod.timer;
  const startingText = `🎣 *Melempar kail dengan ${currentRod.name}* (${baits[baitId].name})...${buffText}${serverLuckText}\n⏱️ Menunggu ikan menyambar: *${timerDuration} detik*`;
  let sentMsg;
  
  if (editKey) {
    try {
      await sock.sendMessage(remoteJid, { text: startingText, edit: editKey });
      sentMsg = { key: editKey };
    } catch (e) {
      sentMsg = await sock.sendMessage(remoteJid, { text: startingText }, { quoted: msg });
    }
  } else {
    sentMsg = await sock.sendMessage(remoteJid, { text: startingText }, { quoted: msg });
  }

  for (let i = timerDuration - 1; i >= 1; i--) {
    if (isAutoLoop && !global.activeAutoFish[sender]) return;
    await delay(1000);
    await sock.sendMessage(remoteJid, {
      text: `🎣 *Melempar kail dengan ${currentRod.name}* (${baits[baitId].name})...${buffText}${serverLuckText}\n⏱️ Menunggu ikan menyambar: *${i} detik*`,
      edit: sentMsg.key
    });
  }
  await delay(1000);
  
  const catch_item = getRandomCatch(activeBuffId || 'normal', activeRodId);
  addItem(sender, catch_item);
  
  const rarityEmoji_map = rarityEmoji[catch_item.rarity] || '⚪';
  const mutationText = catch_item.mutation ? `\n✨ *Mutasi:* ${catch_item.name.split(' ')[0]} (Bonus Harga!)` : '';
  
  const resultText = `
╭─ 🎣 *FISHING SUCCESS* 🎣 ─╮
│
│ ${rarityEmoji_map} *${catch_item.rarity}* Catch
│ 🐟 Item: ${catch_item.name} ${mutationText}
│ 💰 Harga: ${formatRupiah(catch_item.price)}
│ 🔱 Joran: ${currentRod.name}
│ 🪱 Sisa Umpan: ${getBaitCount(sender, baitId)}x
│
╰────────────────────────╯
_Ketik *.lnj* untuk manual / *.start auto* untuk AFK!_`;

  await sock.sendMessage(remoteJid, { text: resultText, edit: sentMsg.key });
  
  user.lastFishKey = sentMsg.key;
  user.lastBait = baitId;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

async function inventoryCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  const summary = getInventorySummary(sender);
  
  let baitList = `🪱 *STOK UMPAN ANDA:*\n`;
  for (const [id, data] of Object.entries(baits)) {
    baitList += `• ${data.name}: *${getBaitCount(sender, id)}x*\n`;
  }

  if (inventory.length === 0) {
    return await sock.sendMessage(remoteJid, { text: `🎣 *INVENTORY KOSONG*\n\n${baitList}\nMulai mancing wajib pakai umpan, contoh: *.mancing roti*` }, { quoted: msg });
  }

  let fishListText = `📋 *DAFTAR IKAN DI TAS:*\n`;
  inventory.forEach((item, index) => {
    const emoji = rarityEmoji[item.rarity] || '⚪';
    const favTag = item.isFavorite ? ' ⭐ [FAVORIT]' : '';
    fishListText += `${index + 1}. ${emoji} *${item.name}* (${formatRupiah(item.price)})${favTag}\n`;
  });

  let message = `╭─ 🎣 *INVENTORY ANDA* 🎣 ─╮
│
│ 📊 Total Ikan: ${summary.totalItems}
│ 💰 Total Nilai: ${formatRupiah(summary.totalValue)}
│
├────────────────────────┤
${fishListText.split('\n').map(line => line ? `│ ${line}` : '│').join('\n')}
├────────────────────────┤
${baitList.split('\n').map(line => line ? `│ ${line}` : '│').join('\n')}
╰────────────────────────╯
_Ketik *.favorit <nomor>* untuk mengunci ikan agar tak terjual_
_Ketik *.fish sell <nomor>* untuk jual 1 ikan_`;

  await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
}

async function favoritCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  
  if (inventory.length === 0) {
    return await sock.sendMessage(remoteJid, { text: '❌ Inventory kamu kosong!' }, { quoted: msg });
  }

  const index = parseInt(args[0]) - 1;
  if (isNaN(index) || index < 0 || index >= inventory.length) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Nomor ikan tidak valid! Masukkan nomor (1 - ${inventory.length}).\nCek nomor ikan di *.fish tas*` }, { quoted: msg });
  }

  const item = inventory[index];
  item.isFavorite = !item.isFavorite;

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  const statusText = item.isFavorite 
    ? `⭐ *${item.name}* (No. ${index + 1}) berhasil ditandai sebagai *FAVORIT*!\nIkan ini tidak akan ikut terjual saat *.sellall*.`
    : `❌ Tanda favorit pada *${item.name}* (No. ${index + 1}) telah dilepas.`;

  await sock.sendMessage(remoteJid, { text: statusText }, { quoted: msg });
}

async function sellCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  if (inventory.length === 0) return await sock.sendMessage(remoteJid, { text: '❌ Inventory kosong!' }, { quoted: msg });
  
  const itemNumber = parseInt(args[0]) - 1;
  if (isNaN(itemNumber) || itemNumber < 0 || itemNumber >= inventory.length) {
    return await sock.sendMessage(remoteJid, { text: `❌ Nomor item tidak valid (1-${inventory.length})` }, { quoted: msg });
  }
  
  const item = inventory[itemNumber];
  const result = sellItem(sender, item.id);
  if (result.success) {
    await sock.sendMessage(remoteJid, { text: `✅ Terjual: ${result.itemName} (+${formatRupiah(result.priceReceived)})\nTotal Saldo Global: ${formatRupiah(result.totalPoints)}` }, { quoted: msg });
  }
}

async function sellAllCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  
  if (inventory.length === 0) {
    return await sock.sendMessage(remoteJid, { text: '❌ Inventory kosong!' }, { quoted: msg });
  }

  const itemsToSell = inventory.filter(item => !item.isFavorite);
  const itemsToKeep = inventory.filter(item => item.isFavorite);

  if (itemsToSell.length === 0) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Tidak ada ikan yang dijual! Semua ${inventory.length} ikan di tas kamu ditandai sebagai ⭐ *FAVORIT*.` 
    }, { quoted: msg });
  }

  let totalEarnings = 0;
  itemsToSell.forEach(item => {
    totalEarnings += item.price;
  });

  const user = getUserData(global.db, sender);
  user.inventory = itemsToKeep;
  addPoints(global.db, sender, totalEarnings);

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  const totalPoints = getTotalScore(user);
  const keepText = itemsToKeep.length > 0 ? `\n⭐ *${itemsToKeep.length} ikan favorit* tetap tersimpan aman di tas.` : '';

  await sock.sendMessage(remoteJid, { 
    text: `✅ Berhasil menjual *${itemsToSell.length} ikan*!\n💵 Total Pendapatan: *+${formatRupiah(totalEarnings)}*${keepText}\n💰 Total Saldo Global: *${formatRupiah(totalPoints)}*` 
  }, { quoted: msg });
}

// 🟢 BEBAS (Bisa dipakai siapa saja & tidak masuk help menu)
async function handleSetLuckCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const multiplier = parseFloat(args[0]);

  if (isNaN(multiplier) || multiplier < 1) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ *Format Salah!*\n\nGunakan: *.setluck <angka>*\nContoh: *.setluck 2.5* (untuk 2,5x Luck) atau *.setluck 1* (reset normal).` 
    }, { quoted: msg });
  }

  global.serverAuroraEvent = global.serverAuroraEvent || {};
  global.serverAuroraEvent.active = multiplier > 1;
  global.serverAuroraEvent.multiplier = multiplier;
  global.serverAuroraEvent.expiresAt = Date.now() + (24 * 60 * 60 * 1000); 

  const statusText = multiplier > 1 
    ? `🔥 *SERVER LUCK BOOST AKTIF!*\n\nMultiplier server berhasil diubah menjadi *${multiplier}x* hoki!` 
    : `🔄 *SERVER LUCK NORMAL!*\n\nMultiplier server telah di-reset ke *1x* (Normal).`;

  await sock.sendMessage(remoteJid, { text: statusText }, { quoted: msg });
}

async function rodCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const user = global.db.users[sender] || {};
  
  const activeRodId = user.activeRod || 'training';
  const ownedRods = user.ownedRods || ['training'];
  
  let text = `🎣 *KOLEKSI JORAN ANDA* 🎣\n\n`;
  text += `🔱 Joran Aktif Saat Ini: *${rods[activeRodId]?.name || 'Training Rod'}*\n\n`;
  text += `📦 *Daftar Joran yang Dimiliki:*\n`;
  
  for (const rodId of ownedRods) {
    const rData = rods[rodId];
    if (rData) {
      const activeMark = rodId === activeRodId ? ' ⭐ [AKTIF]' : '';
      text += `• ${rData.name}${activeMark}\n  🍀 Luck: ${rData.luck}x | ⏱️ Timer: ${rData.timer}s\n`;
    }
  }
  
  text += `\n💡 *Cara Ganti Joran:* Ketik *.fish pakaijoran <id_joran>*\nContoh: *.fish pakaijoran crystal*`;
  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

async function switchRodCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const rodId = args[0]?.toLowerCase();
  const user = global.db.users[sender] || {};
  
  const ownedRods = user.ownedRods || ['training'];

  if (!rodId || !rods[rodId]) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan ID joran yang valid!\nCek joran yang kamu miliki dengan mengetik *.fish rod*` }, { quoted: msg });
  }

  if (!ownedRods.includes(rodId)) {
    return await sock.sendMessage(remoteJid, { text: `❌ Kamu belum memiliki joran *${rods[rodId].name}*!\nBeli terlebih dahulu di *.shop joran*` }, { quoted: msg });
  }

  user.activeRod = rodId;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  await sock.sendMessage(remoteJid, { text: `✅ Berhasil mengganti joran utama menjadi *${rods[rodId].name}*! 🎣` }, { quoted: msg });
}

async function pakaiPotionCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const potionId = args[0]?.toLowerCase();
  
  if (!potionId || !potions[potionId]) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ ID Potion tidak valid!\nPilihan: minor, major, divine.\nContoh: *.fish pakai minor*` }, { quoted: msg });
  }

  const currentBuff = getActiveBuff(sender);
  if (currentBuff) {
    return await sock.sendMessage(remoteJid, { text: `⏳ Kamu masih memiliki efek *${potions[currentBuff].name}* yang aktif!` }, { quoted: msg });
  }

  const item = potions[potionId];
  const success = usePotion(sender, potionId, item.duration);
  
  if (success) {
    await sock.sendMessage(remoteJid, { text: `✅ Berhasil meminum *${item.name}*!\n\n✨ Efek Luck meningkat selama ${item.duration / 60000} Menit.` }, { quoted: msg });
  } else {
    await sock.sendMessage(remoteJid, { text: `❌ Kamu tidak memiliki *${item.name}* di tas. Beli dulu di *.shop*!` }, { quoted: msg });
  }
}

async function statsCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const stats = getUserStats(sender);
  let bestCatchText = stats.bestCatch ? `${stats.bestCatch.name} (${formatRupiah(stats.bestCatch.price)})` : 'Belum ada';
  
  const message = `
╭─ 📊 *FISHING STATISTICS* 📊 ─╮
│
│ 💰 Saldo Global: ${formatRupiah(stats.totalPoints)}
│ 🎣 Total Ikan: ${stats.totalFish}
│ 🎒 Isi Tas: ${stats.inventoryCount} item
│ 🏆 Tangkapan Terbaik: ${bestCatchText}
│
╰────────────────────────╯`;
  await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
}

async function fishingHelpCommand(sock, msg) {
  const helpText = `
╭─ 🎣 *FISHING SYSTEM HELP* 🎣 ─╮
│
│ 📌 *COMMANDS UTAMA:*
│ *.mancing <umpan>* - Mulai mancing
│ *.lnj* - Lanjut mancing manual
│ *.start auto* - Mulai auto-mancing (AFK)
│ *.stop auto* - Hentikan auto-mancing
│ *.favorit <no>* - Kunci/Buka favorit ikan
│ *.fish tas* - Lihat daftar ikan & umpan
│ *.fish sellall* - Jual semua ikan (kecuali favorit)
│ *.shop* - Toko Umpan, Potion, Rod, & Pass Waktu
│
╰────────────────────────╯`;
  await sock.sendMessage(msg.key.remoteJid, { text: helpText }, { quoted: msg });
}

module.exports = {
  handleFishingCommand, fishCommand, inventoryCommand, sellCommand,
  sellAllCommand, statsCommand, fishingHelpCommand, pakaiPotionCommand, rodCommand, switchRodCommand, startAutoFish, stopAu
};
