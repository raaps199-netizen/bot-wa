// File: commands/fishing.js

const { getRandomCatch, rarityEmoji, potions } = require('../utils/fishingData');
const {
  addItem, getInventory, getInventorySummary, sellItem, sellAllItems, getUserStats,
  getActiveBuff, usePotion
} = require('../utils/inventoryManager');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function handleFishingCommand(sock, msg, args, sender) {
  // Menangani berbagai bentuk input command (misal: .mancing, .fish cast, .fish tas, dll)
  let command = args[0]?.toLowerCase();
  let subArgs = args.slice(1);

  if (command === 'fish' || command === 'mancing') {
    command = args[1]?.toLowerCase() || 'cast';
    subArgs = args.slice(2);
  }
  
  try {
    switch (command) {
      case 'cast':
      case 'mancing':
        return await fishCommand(sock, msg, sender, false);
      
      case 'lnj':
      case 'lanjut':
        return await fishCommand(sock, msg, sender, true);
        
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
  } catch (error) {
    console.error('Fishing command error:', error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ Error: ${error.message}`
    });
  }
}

async function fishCommand(sock, msg, sender, isLnj = false) {
  const remoteJid = msg.key.remoteJid;
  const user = global.db.users[sender];
  
  let editKey = null;
  if (isLnj && user && user.lastFishKey) {
    editKey = user.lastFishKey;
  }

  const activeBuffId = getActiveBuff(sender);
  const buffText = activeBuffId ? `\n🧪 *Buff Aktif:* ${potions[activeBuffId].name}` : '';

  const startingText = `🎣 *Melempar kail ke air...*${buffText}\n⏱️ Menunggu ikan menyambar: *5 detik*`;
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

  for (let i = 4; i >= 1; i--) {
    await delay(1000);
    await sock.sendMessage(remoteJid, {
      text: `🎣 *Melempar kail ke air...*${buffText}\n⏱️ Menunggu ikan menyambar: *${i} detik*`,
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
│ 💰 Harga: ${catch_item.price} Poin${activeBuffId ? '\n│ ✨ Luck Boosted!' : ''}
│
╰────────────────────────╯
_Ketik *.lnj* untuk lanjut mancing di pesan ini!_`;

  await sock.sendMessage(remoteJid, { text: resultText, edit: sentMsg.key });
  
  if (user) {
    user.lastFishKey = sentMsg.key;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
  }
}

async function pakaiPotionCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const potionId = args[0]?.toLowerCase();
  
  if (!potionId || !potions[potionId]) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ ID Potion tidak valid!\nContoh: *.fish pakai minor*` }, { quoted: msg });
  }

  const currentBuff = getActiveBuff(sender);
  if (currentBuff) {
    return await sock.sendMessage(remoteJid, { text: `⏳ Kamu masih memiliki efek *${potions[currentBuff].name}* yang aktif!` }, { quoted: msg });
  }

  const item = potions[potionId];
  const success = usePotion(sender, potionId, item.duration);
  
  if (success) {
    await sock.sendMessage(remoteJid, { text: `✅ Berhasil meminum *${item.name}*!\n\n✨ Efek Luck kamu meningkat selama ${item.duration / 60000} Menit.` }, { quoted: msg });
  } else {
    await sock.sendMessage(remoteJid, { text: `❌ Kamu tidak memiliki *${item.name}* di tas. Beli dulu di *.shop*!` }, { quoted: msg });
  }
}

async function inventoryCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  const summary = getInventorySummary(sender);
  
  if (inventory.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: '🎣 *INVENTORY KOSONG*\n\nMulai mancing dengan `.mancing` atau `.fish cast` untuk mendapatkan item!'
    }, { quoted: msg });
    return;
  }
  
  let message = `╭─ 🎣 *INVENTORY ANDA* 🎣 ─╮
│
│ 📊 Total Item: ${summary.totalItems}
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
├─ *DAFTAR ITEM:*
│`;

  inventory.forEach((item, index) => {
    const emoji = rarityEmoji[item.rarity] || '⚪';
    message += `│ ${index + 1}. ${emoji} ${item.name} - ${item.price} Poin\n`;
  });

  message += `│
│ Gunakan \`.fish sell [no]\` untuk jual
│ Gunakan \`.fish sellall\` untuk jual semua
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
}

async function sellCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  
  if (inventory.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: '❌ Inventory kosong! Tidak ada yang bisa dijual.'
    }, { quoted: msg });
    return;
  }
  
  const itemNumber = parseInt(args[0]) - 1;
  
  if (isNaN(itemNumber) || itemNumber < 0 || itemNumber >= inventory.length) {
    await sock.sendMessage(remoteJid, {
      text: `❌ Nomor item tidak valid! Gunakan nomor 1-${inventory.length}`
    }, { quoted: msg });
    return;
  }
  
  const item = inventory[itemNumber];
  const result = sellItem(sender, item.id);
  
  if (result.success) {
    const message = `
╭─ 💰 *SELL SUCCESS* 💰 ─╮
│
│ ✅ Item Terjual: ${result.itemName}
│ 💵 Harga: ${result.priceReceived} Poin
│
│ Total Poin Global: ${result.totalPoints}
│
╰────────────────────────╯`;
    
    await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
  } else {
    await sock.sendMessage(remoteJid, { text: result.message }, { quoted: msg });
  }
}

async function sellAllCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const result = sellAllItems(sender);
  
  if (result.success) {
    const message = `
╭─ 💰 *SELL ALL SUCCESS* 💰 ─╮
│
│ ✅ Items Terjual: ${result.itemsSold}
│ 💵 Total Pendapatan: ${result.totalEarnings} Poin
│
│ Total Poin Global: ${result.totalPoints}
│
╰────────────────────────╯`;
    
    await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
  } else {
    await sock.sendMessage(remoteJid, { text: result.message }, { quoted: msg });
  }
}

async function statsCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const stats = getUserStats(sender);
  
  let bestCatchText = stats.bestCatch 
    ? `${stats.bestCatch.name} (${stats.bestCatch.price} Poin)`
    : 'Belum ada catch';
  
  const message = `
╭─ 📊 *FISHING STATISTICS* 📊 ─╮
│
│ 💰 Poin Global: ${stats.totalPoints}
│ 🎣 Total Ikan Ditangkap: ${stats.totalFish}
│ 🎒 Isi Tas: ${stats.inventoryCount} item(s)
│ 🏆 Tangkapan Terbaik: ${bestCatchText}
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
}

async function fishingHelpCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const helpText = `
╭─ 🎣 *FISHING SYSTEM HELP* 🎣 ─╮
│
│ 📌 *COMMANDS:*
│ *.mancing* - Mulai memancing baru
│ *.lnj* - Lanjut mancing (No Spam Chat)
│ *.fish cast* - Mulai memancing
│ *.fish tas* / *.fish inv* - Lihat isi tas
│ *.fish sell [no]* - Jual item nomor tertentu
│ *.fish sellall* - Jual semua ikan
│ *.fish stats* - Lihat statistik mancing
│ *.fish pakai <id>* - Pakai Luck Potion
│ *.shop* - Beli Potion
│
│ 📊 *RARITY RATES:*
│ ⚪ Common (45%) | 🟢 Uncommon (28%)
│ 🔵 Rare (13%) | 🟣 Epic (7%)
│ 🟡 Legendary (4%) | 🔴 Mythic (2.5%)
│ 🌟 Divine (0.5%)
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: helpText }, { quoted: msg });
}

module.exports = {
  handleFishingCommand,
  fishCommand,
  inventoryCommand,
  sellCommand,
  sellAllCommand,
  statsCommand,
  fishingHelpCommand,
  pakaiPotionCommand
};
                                                        
