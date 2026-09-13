// File: commands/fishing.js

async function handleFishingCommand(sock, msg, primaryCommand, args, sender) {
  let subCmd = args[0]?.toLowerCase();
  let subArgs = args.slice(1);

  try {
    // Jika user mengetik .mancing <nama_umpan> (misal: .mancing pelet)
    if (primaryCommand === 'mancing') {
      if (!subCmd) {
        // Kalau cuma ketik .mancing doang tanpa umpan
        return await sock.sendMessage(msg.key.remoteJid, { 
          text: `⚠️ *KAMU HARUS PAKAI UMPAN BARU BISA MANCING!*\n\nFormat: *.mancing <nama_umpan>*\nContoh: *.mancing roti* atau *.mancing pelet*\n\nCek stok umpan di *.fish tas* atau beli di *.shop*` 
        }, { quoted: msg });
      }

      // Cek apakah argumennya sub-command khusus (seperti tas, sell, lnj, dll)
      if (['lnj', 'lanjut', 'tas', 'inv', 'inventory', 'sell', 'sellall', 'stats', 'pakai', 'help'].includes(subCmd)) {
        primaryCommand = 'fish'; //alihkan ke penanganan sub-command fish
      } else {
        // Jika bukan sub-command, berarti itu adalah NAMA UMPAN! Langsung eksekusi mancing
        return await fishCommand(sock, msg, sender, false, subCmd);
      }
    }

    // Penanganan untuk .fish <subcommand> atau perintah lanjutan
    if (primaryCommand === 'fish') {
      if (!subCmd) subCmd = 'help';
      
      // Jika user ngetik .fish pelet (shorthand langsung pakai umpan)
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
  const user = global.db.users[sender];

  // Tentukan umpan yang dipakai
  let baitId = inputBait?.toLowerCase();
  if (!baitId && isLnj && user && user.lastBait) {
    baitId = user.lastBait;
  }

  // WAJIB PAKAI BAIT: Jika tidak ada input umpan atau tidak valid, tolak langsung!
  if (!baitId || !baits[baitId]) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ *KAMU HARUS PAKAI UMPAN BARU BISA MANCING!*\n\nFormat: *.mancing <nama_umpan>*\nContoh: *.mancing roti* atau *.mancing cacing*\n\nCek stok umpan di *.fish tas* atau beli di *.shop*` 
    }, { quoted: msg });
  }

  // Cek stok umpan user
  const stock = getBaitCount(sender, baitId);
  if (stock < 1) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Umpan *${baits[baitId].name}* kamu habis!\nSilakan beli terlebih dahulu di *.shop*` 
    }, { quoted: msg });
  }

  // Kurangi 1 umpan
  consumeBait(sender, baitId);

  let editKey = null;
  if (isLnj && user && user.lastFishKey) {
    editKey = user.lastFishKey;
  }

  const activeBuffId = getActiveBuff(sender);
  const buffText = activeBuffId ? `\n🧪 *Potion:* ${potions[activeBuffId].name}` : '';
  const timerDuration = baits[baitId].timer;

  const startingText = `🎣 *Melempar kail (${baits[baitId].name})...*${buffText}\n⏱️ Menunggu ikan menyambar: *${timerDuration} detik*`;
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
      text: `🎣 *Melempar kail (${baits[baitId].name})...*${buffText}\n⏱️ Menunggu ikan menyambar: *${i} detik*`,
      edit: sentMsg.key
    });
  }
  await delay(1000);
  
  const catch_item = getRandomCatch(activeBuffId || 'normal');
  addItem(sender, catch_item);
  
  const rarityEmoji_map = rarityEmoji[catch_item.rarity] || '⚪';
  const resultText = `
╭─ 🎣 *FISHING SUCCESS* 🎣 ─╮
│
│ ${rarityEmoji_map} *${catch_item.rarity}* Catch
│ 🐟 Item: ${catch_item.name}
│ 💰 Harga: ${catch_item.price} Poin
│ 🪱 Sisa Umpan: ${getBaitCount(sender, baitId)}x
│
╰────────────────────────╯
_Ketik *.lnj* untuk lanjut mancing cepat!_`;

  await sock.sendMessage(remoteJid, { text: resultText, edit: sentMsg.key });
  
  if (user) {
    user.lastFishKey = sentMsg.key;
    user.lastBait = baitId;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
  }
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
    baitList += `• ${data.name}: *${getBaitCount(sender, id)}x* (${data.timer}s)\n`;
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
│ 🟢 Uncommon: ${summary.byRanimy || summary.byRarity.UNCOMMON || 0}
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
│ *.mancing <umpan>* - Mulai (cth: .mancing roti)
│ *.lnj* - Lanjut mancing cepat (edit pesan)
│ *.fish tas* - Lihat isi tas & stok umpan
│ *.fish sellall* - Jual semua ikan
│ *.fish pakai <id_potion>* - Minum potion luck
│ *.shop* - Beli Umpan & Potion
│
│ 🪱 *DAFTAR UMPAN (Kecepatan Timer):*
│ • Roti: 5 Detik (Dasar)
│ • Cacing: 4 Detik (100 Poin)
│ • Pelet: 3 Detik (300 Poin)
│ • Udang: 2 Detik (800 Poin)
│ • Legenda: 1 Detik (2000 Poin)
│
╰────────────────────────╯`;
  await sock.sendMessage(msg.key.remoteJid, { text: helpText }, { quoted: msg });
}

module.exports = {
  handleFishingCommand, fishCommand, inventoryCommand, sellCommand,
  sellAllCommand, statsCommand, fishingHelpCommand, pakaiPotionCommand
};
    
