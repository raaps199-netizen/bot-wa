// Fishing Command Handler
const { getRandomCatch, rarityEmoji } = require('../utils/fishingData');
const {
  addItem,
  getInventory,
  getInventorySummary,
  sellItem,
  sellAllItems,
  getUserStats
} = require('../utils/inventoryManager');

async function handleFishingCommand(sock, msg, args, sender) {
  const command = args[0]?.toLowerCase();
  
  try {
    switch (command) {
      case 'cast':
      case 'mancing':
        return await fishCommand(sock, msg, sender);
      
      case 'inv':
      case 'inventory':
      case 'tas':
        return await inventoryCommand(sock, msg, sender);
      
      case 'sell':
        return await sellCommand(sock, msg, sender, args.slice(1));
      
      case 'sellall':
        return await sellAllCommand(sock, msg, sender);
      
      case 'stats':
        return await statsCommand(sock, msg, sender);
      
      case 'help':
      case 'bantuan':
        return await fishingHelpCommand(sock, msg);
      
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

async function fishCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  
  // Cek cooldown (opsional - bisa diganti dengan sistem cooldown real)
  const catch_item = getRandomCatch();
  
  addItem(sender, catch_item);
  
  const rarityEmoji_map = rarityEmoji[catch_item.rarity] || '⚪';
  const message = `
╭─ 🎣 *FISHING SUCCESS* 🎣 ─╮
│
│ ${rarityEmoji_map} *${catch_item.rarity}* Catch
│ 🐟 Item: ${catch_item.name}
│ ⚖️  Berat: ${catch_item.weight}
│ 💰 Harga: Rp ${catch_item.price.toLocaleString('id-ID')}
│
│ Sudah masuk ke inventory!
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: message });
}

async function inventoryCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  const summary = getInventorySummary(sender);
  
  if (inventory.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: '🎣 *INVENTORY KOSONG*\n\nMulai mancing dengan `.fish cast` untuk mendapatkan item!'
    });
    return;
  }
  
  let message = `╭─ 🎣 *INVENTORY ANDA* 🎣 ─╮
│
│ 📊 Total Item: ${summary.totalItems}
│ 💰 Total Nilai: Rp ${summary.totalValue.toLocaleString('id-ID')}
│
│ ⚪ Common: ${summary.byRarity.COMMON}
│ 🟢 Uncommon: ${summary.byRarity.UNCOMMON}
│ 🔵 Rare: ${summary.byRarity.RARE}
│ 🟣 Epic: ${summary.byRarity.EPIC}
│ 🟡 Legendary: ${summary.byRarity.LEGENDARY}
│
├─ *DAFTAR ITEM:*
│`;

  inventory.forEach((item, index) => {
    const emoji = rarityEmoji[item.rarity] || '⚪';
    message += `│ ${index + 1}. ${emoji} ${item.name} - Rp ${item.price}
`;
  });

  message += `│
│ Gunakan \`.fish sell [no]\` untuk jual
│ Gunakan \`.fish sellall\` untuk jual semua
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: message });
}

async function sellCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  
  if (inventory.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: '❌ Inventory kosong! Tidak ada yang bisa dijual.'
    });
    return;
  }
  
  const itemNumber = parseInt(args[0]) - 1;
  
  if (isNaN(itemNumber) || itemNumber < 0 || itemNumber >= inventory.length) {
    await sock.sendMessage(remoteJid, {
      text: `❌ Nomor item tidak valid! Gunakan nomor 1-${inventory.length}`
    });
    return;
  }
  
  const item = inventory[itemNumber];
  const result = sellItem(sender, item.id);
  
  if (result.success) {
    const message = `
╭─ 💰 *SELL SUCCESS* 💰 ─╮
│
│ ✅ Item Terjual: ${result.itemName}
│ 💵 Harga: Rp ${result.priceReceived.toLocaleString('id-ID')}
│
│ Total Points: Rp ${result.totalPoints.toLocaleString('id-ID')}
│
╰────────────────────────╯`;
    
    await sock.sendMessage(remoteJid, { text: message });
  } else {
    await sock.sendMessage(remoteJid, { text: result.message });
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
│ 💵 Total Earnings: Rp ${result.totalEarnings.toLocaleString('id-ID')}
│
│ Total Points: Rp ${result.totalPoints.toLocaleString('id-ID')}
│
╰────────────────────────╯`;
    
    await sock.sendMessage(remoteJid, { text: message });
  } else {
    await sock.sendMessage(remoteJid, { text: result.message });
  }
}

async function statsCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const stats = getUserStats(sender);
  
  let bestCatchText = stats.bestCatch 
    ? `${stats.bestCatch.name} (Rp ${stats.bestCatch.price.toLocaleString('id-ID')})`
    : 'Belum ada catch';
  
  const message = `
╭─ 📊 *FISHING STATISTICS* 📊 ─╮
│
│ 💰 Total Points: Rp ${stats.totalPoints.toLocaleString('id-ID')}
│ 🎣 Total Fish Caught: ${stats.totalFish}
│ 🎒 Inventory: ${stats.inventoryCount} item(s)
│ 🏆 Best Catch: ${bestCatchText}
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: message });
}

async function fishingHelpCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const helpText = `
╭─ 🎣 *FISHING SYSTEM HELP* 🎣 ─╮
│
│ 📌 *COMMANDS:*
│
│ *.fish cast* - Mulai memancing
│ *.fish inventory* - Lihat inventory
│ *.fish sell [no]* - Jual item tertentu
│ *.fish sellall* - Jual semua item
│ *.fish stats* - Lihat statistik
│ *.fish help* - Tampilkan bantuan
│
│ 📊 *RARITY LEVELS:*
│
│ ⚪ Common (50%) - Rp 40-60
│ 🟢 Uncommon (30%) - Rp 140-200
│ 🔵 Rare (12%) - Rp 450-600
│ 🟣 Epic (6%) - Rp 1500-2000
│ 🟡 Legendary (2%) - Rp 5000-8000
│
│ 💡 *TIPS:*
│ • Semakin langka, semakin besar hadiah
│ • Kumpulkan item untuk inventory penuh
│ • Jual item untuk mendapat points
│
╰────────────────────────╯`;

  await sock.sendMessage(remoteJid, { text: helpText });
}

module.exports = {
  handleFishingCommand,
  fishCommand,
  inventoryCommand,
  sellCommand,
  sellAllCommand,
  statsCommand,
  fishingHelpCommand
};
