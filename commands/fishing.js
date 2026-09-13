// File: commands/fishing.js

const { getRandomCatch, rarityEmoji } = require('../utils/fishingData');
const {
  addItem,
  getInventory,
  getInventorySummary,
  sellItem,
  sellAllItems,
  getUserStats
} = require('../utils/inventoryManager');

// Fungsi pembantu untuk membuat delay (jeda waktu)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
        // Jika hanya memanggil `.fish` tanpa argumen tambahan
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
  
  // 1. Kirim pesan awal (Melempar kail)
  const initialMessage = await sock.sendMessage(remoteJid, { 
    text: '🎣 *Melempar kail ke air...*\n_Mohon tunggu 5 detik..._' 
  }, { quoted: msg });
  
  // 2. Jeda waktu 5 detik
  await delay(5000);
  
  // 3. Proses tangkapan ikan
  const catch_item = getRandomCatch();
  addItem(sender, catch_item);
  
  const rarityEmoji_map = rarityEmoji[catch_item.rarity] || '⚪';
  const resultText = `
╭─ 🎣 *FISHING SUCCESS* 🎣 ─╮
│
│ ${rarityEmoji_map} *${catch_item.rarity}* Catch
│ 🐟 Item: ${catch_item.name}
│ ⚖️  Berat: ${catch_item.weight}
│ 💰 Harga: Rp ${catch_item.price.toLocaleString('id-ID')}
│
│ ✅ Sudah masuk ke inventory!
│
╰────────────────────────╯`;

  // 4. Edit pesan awal menjadi hasil tangkapan
  await sock.sendMessage(remoteJid, { 
    text: resultText,
    edit: initialMessage.key // Ini yang membuat bot meng-edit pesan sebelumnya
  });
}

async function inventoryCommand(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;
  const inventory = getInventory(sender);
  const summary = getInventorySummary(sender);
  
  if (inventory.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: '🎣 *INVENTORY KOSONG*\n\nMulai mancing dengan `.fish cast` atau `.mancing` untuk mendapatkan item!'
    }, { quoted: msg });
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
    message += `│ ${index + 1}. ${emoji} ${item.name} - Rp ${item.price}\n`;
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
│ 💵 Harga: Rp ${result.priceReceived.toLocaleString('id-ID')}
│
│ Total Points: Rp ${result.totalPoints.toLocaleString('id-ID')}
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
│ 💵 Total Earnings: Rp ${result.totalEarnings.toLocaleString('id-ID')}
│
│ Total Points: Rp ${result.totalPoints.toLocaleString('id-ID')}
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

  await sock.sendMessage(remoteJid, { text: message }, { quoted: msg });
}

// ... di dalam file commands/fishing.js ...

async function fishingHelpCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const helpText = `
╭─ 🎣 *FISHING SYSTEM HELP* 🎣 ─╮
│
│ 📌 *COMMANDS:*
│
│ *.mancing* - Mulai memancing langsung
│ *.fish cast* - Mulai memancing
│ *.fish inventory* / *.fish tas* - Lihat tas
│ *.fish sell [no]* - Jual item tertentu
│ *.fish sellall* - Jual semua item
│ *.fish stats* - Lihat statistik
│ *.fish help* - Tampilkan bantuan
│
│ 📊 *RARITY LEVELS:*
│
│ ⚪ Common (50%) - 10-30 Poin
│ 🟢 Uncommon (30%) - 40-70 Poin
│ 🔵 Rare (12%) - 80-120 Poin
│ 🟣 Epic (6%) - 130-160 Poin
│ 🟡 Legendary (2%) - 170-220 Poin
│
│ 💡 *TIPS:*
│ • Tunggu 5 detik saat kail dilempar!
│ • Semakin langka, semakin besar harga jualnya
│ • Jual item untuk menambah Poin Global kamu
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
  fishingHelpCommand
};
              
