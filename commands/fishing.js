// File: commands/fishing.js
const { getRandomCatch, rarityEmoji, baits, potions, rods } = require('../utils/fishingData');
const {
  addItem, getInventory, getInventorySummary, sellItem, sellAllItems, getUserStats,
  getActiveBuff, usePotion, getBaitCount, consumeBait
} = require('../utils/inventoryManager');
const { getUserData, getTotalScore, addPoints, deductPoints } = require('../utils/helper');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function handleFishingCommand(sock, msg, primaryCommand, args, sender) {
  let subCmd = args[0]?.toLowerCase();
  let subArgs = args.slice(1);

  try {
    if (primaryCommand === 'mancing') {
      if (!subCmd) {
        return await sock.sendMessage(msg.key.remoteJid, { 
          text: `⚠️ *KAMU HARUS PAKAI UMPAN BARU BISA MANCING!*\n\nFormat: *.mancing <nama_umpan>*\nContoh: *.mancing roti* atau *.mancing pelet*\n\nCek stok umpan di *.fish tas* atau beli di *.shop*` 
        }, { quoted: msg });
      }

      if (['lnj', 'lanjut', 'tas', 'inv', 'inventory', 'sell', 'sellall', 'stats', 'pakai', 'rod', 'joran', 'pakaijoran', 'help'].includes(subCmd)) {
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

async function fishCommand(sock, msg, sender, isLnj = false, inputBait = null) {
  const remoteJid = msg.key.remoteJid;
  const user = global.db.users[sender] || {};

  // 1. Cek Joran Aktif User (Default: Training Rod)
  const activeRodId = user.activeRod || 'training';
  const currentRod = rods[activeRodId] || rods['training'];

  // 2. Tentukan umpan yang dipakai
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
  
  // Gunakan Timer dari Joran Aktif!
  const timerDuration = currentRod.timer;

  const startingText = `🎣 *Melempar kail dengan ${currentRod.name}* (${baits[baitId].name})...${buffText}\n⏱️ Menunggu ikan menyambar: *${timerDuration} detik*`;
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
    await delay(1000);
    await sock.sendMessage(remoteJid, {
      text: `🎣 *Melempar kail dengan ${currentRod.name}* (${baits[baitId].name})...${buffText}\n⏱️ Menunggu ikan menyambar: *${i} detik*`,
      edit: sentMsg.key
    });
  }
  await delay(1000);
  
  // 3. Tangkap Ikan Berdasarkan Potion & Joran Aktif (Luck & Mutasi)
  const catch_item = getRandomCatch(activeBuffId || 'normal', activeRodId);
  addItem(sender, catch_item);
  
  const rarityEmoji_map = rarityEmoji[catch_item.rarity] || '⚪';
  const mutationText = catch_item.mutation ? `\n✨ *Mutasi:* ${catch_item.name.split(' ')[0]} (Bonus Harga!)` : '';
  
  const resultText = `
╭─ 🎣 *FISHING SUCCESS* 🎣 ─╮
│
│ ${rarityEmoji_map} *${catch_item.rarity}* Catch
│ 🐟 Item: ${catch_item.name} ${mutationText}
│ 💰 Harga: ${catch_item.price} Poin
│ 🔱 Joran: ${currentRod.name}
│ 🪱 Sisa Umpan: ${getBaitCount(sender, baitId)}x
│
╰────────────────────────╯
_Ketik *.lnj* untuk lanjut mancing cepat!_`;

  await sock.sendMessage(remoteJid, { text: resultText, edit: sentMsg.key });
  
  user.lastFishKey = sentMsg.key;
  user.lastBait = baitId;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
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
  
  let message = `╭─ 🎣 *INVENTORY ANDA* 🎣 ─╮
│
│ 📊 Total Ikan: ${summary.totalItems}
│ 💰 Total Nilai: ${summary.totalValue} Poin
│
│ ⚪ Common: ${summary.byRarity.COMMON || 0}
│ 🟢 Uncommon: ${summary.byRarity.UNCOMMON || 0}
│ 🔵 Rare: ${summary.byRarity.RARE || 0}
│ 🟣 Epic: ${summary.byRarity.EPIC || 0}
│ 🟡 Legendary: ${summary.byRarity.LEGENDARY || 0}
│ 🔴 Mythic: ${summary.byRarity.MYTHIC || 0}
│ 🌟 Divine: ${summary.byRarity.DIVINE || 0}
│
├────────────────────────┤
│ ${baitList.replace(/\n/g, '\n│ ')}
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
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
    await sock.sendMessage(remoteJid, { text: `✅ Terjual: ${result.itemName} (+${result.priceReceived} Poin)\nTotal Poin Global: ${result.totalPoints}` }, { quoted: msg });
  }
}

async function sellAllCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const result = sellAllItems(sender);
  if (result.success) {
    await sock.sendMessage(remoteJid, { text: `✅ Semua ikan terjual!\n💵 Total Pendapatan: +${result.totalEarnings} Poin\nTotal Poin Global: ${result.totalPoints}` }, { quoted: msg });
  } else {
    await sock.sendMessage(remoteJid, { text: result.message }, { quoted: msg });
  }
}

async function statsCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const stats = getUserStats(sender);
  let bestCatchText = stats.bestCatch ? `${stats.bestCatch.name} (${stats.bestCatch.price} Poin)` : 'Belum ada';
  
  const message = `
╭─ 📊 *FISHING STATISTICS* 📊 ─╮
│
│ 💰 Poin Global: ${stats.totalPoints}
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
│ 📌 *ATURAN UTAMA:*
│ *Wajib pakai umpan baru bisa mancing!*
│
│ 📌 *COMMANDS:*
│ *.mancing <umpan>* - Mulai mancing
│ *.lnj* - Lanjut mancing cepat
│ *.fish rod* - Cek & ganti joran aktif
│ *.shop joran* - Beli joran baru
│ *.fish tas* - Lihat isi tas
│ *.fish sellall* - Jual semua ikan
│ *.shop* - Buka pusat toko
│
╰────────────────────────╯`;
  await sock.sendMessage(msg.key.remoteJid, { text: helpText }, { quoted: msg });
}

module.exports = {
  handleFishingCommand, fishCommand, inventoryCommand, sellCommand,
  sellAllCommand, statsCommand, fishingHelpCommand, pakaiPotionCommand, rodCommand, switchRodCommand
};
  
