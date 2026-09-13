// File: commands/fishing.js
const { getRandomCatch, rarityEmoji, potions } = require('../utils/fishingData');
const {
  addItem, getInventory, getInventorySummary, sellItem, sellAllItems, getUserStats,
  getActiveBuff, usePotion
} = require('../utils/inventoryManager');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function handleFishingCommand(sock, msg, args, sender) {
  const command = args[0]?.toLowerCase();
  
  try {
    switch (command) {
      case 'cast':
      case 'mancing':
        return await fishCommand(sock, msg, sender, false);
      case 'lnj':
        return await fishCommand(sock, msg, sender, true);
      case 'pakai':
        return await pakaiPotionCommand(sock, msg, sender, args.slice(1));
      case 'inv':
      case 'tas':
        return await inventoryCommand(sock, msg, sender);
      case 'sell':
        return await sellCommand(sock, msg, sender, args.slice(1));
      case 'sellall':
        return await sellAllCommand(sock, msg, sender);
      case 'stats':
        return await statsCommand(sock, msg, sender);
      default:
        return await fishingHelpCommand(sock, msg);
    }
  } catch (error) {
    console.error('Fishing command error:', error);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${error.message}` });
  }
}

async function fishCommand(sock, msg, sender, isLnj = false) {
  const remoteJid = msg.key.remoteJid;
  const user = global.db.users[sender];
  
  // 1. Setup Kunci Edit Pesan untuk fitur .lnj
  let editKey = null;
  if (isLnj && user.lastFishKey) {
    editKey = user.lastFishKey;
  }

  // 2. Cek Buff Aktif
  const activeBuffId = getActiveBuff(sender);
  const buffText = activeBuffId ? `\n🧪 *Buff Aktif:* ${potions[activeBuffId].name}` : '';

  // 3. Kirim / Edit Pesan Awal
  const startingText = `🎣 *Melempar kail ke air...*${buffText}\n⏱️ Menunggu ikan menyambar: *5 detik*`;
  let sentMsg;
  
  if (editKey) {
    try {
      await sock.sendMessage(remoteJid, { text: startingText, edit: editKey });
      sentMsg = { key: editKey }; // Tetap gunakan key lama
    } catch (e) {
      // Jika pesan terlalu lama dan tidak bisa di-edit, kirim baru
      sentMsg = await sock.sendMessage(remoteJid, { text: startingText }, { quoted: msg });
    }
  } else {
    sentMsg = await sock.sendMessage(remoteJid, { text: startingText }, { quoted: msg });
  }

  // 4. Countdown Edit
  for (let i = 4; i >= 1; i--) {
    await delay(1000);
    await sock.sendMessage(remoteJid, {
      text: `🎣 *Melempar kail ke air...*${buffText}\n⏱️ Menunggu ikan menyambar: *${i} detik*`,
      edit: sentMsg.key
    });
  }
  await delay(1000);
  
  // 5. Gacha Ikan
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

  // 6. Edit hasil akhir & Simpan Key untuk .lnj berikutnya
  await sock.sendMessage(remoteJid, { text: resultText, edit: sentMsg.key });
  user.lastFishKey = sentMsg.key;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

async function pakaiPotionCommand(sock, msg, sender, args) {
  const remoteJid = msg.key.remoteJid;
  const potionId = args[0]?.toLowerCase();
  
  if (!potionId || !potions[potionId]) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ ID Potion tidak valid!\nContoh: *.fish pakai minor*` }, { quoted: msg });
  }

  // Cek apakah ada buff yang masih menyala
  const currentBuff = getActiveBuff(sender);
  if (currentBuff) {
    return await sock.sendMessage(remoteJid, { text: `⏳ Kamu masih memiliki efek *${potions[currentBuff].name}* yang aktif! Tunggu sampai habis sebelum memakai lagi.` }, { quoted: msg });
  }

  const item = potions[potionId];
  const success = usePotion(sender, potionId, item.duration);
  
  if (success) {
    await sock.sendMessage(remoteJid, { text: `✅ Berhasil meminum *${item.name}*!\n\n✨ Efek Luck kamu meningkat selama ${item.duration / 60000} Menit ke depan.\nSering-sering ketik *.lnj* agar durasinya maksimal!` }, { quoted: msg });
  } else {
    await sock.sendMessage(remoteJid, { text: `❌ Kamu tidak memiliki *${item.name}* di tas. Beli dulu di *.shop*!` }, { quoted: msg });
  }
}

// ... Sisanya biarkan sama (inventoryCommand, sellCommand, sellAllCommand, statsCommand)
async function inventoryCommand(sock, msg, sender) { /* Sama seperti kode sebelumnya */ }
async function sellCommand(sock, msg, sender, args) { /* Sama seperti kode sebelumnya */ }
async function sellAllCommand(sock, msg, sender) { /* Sama seperti kode sebelumnya */ }
async function statsCommand(sock, msg, sender) { /* Sama seperti kode sebelumnya */ }

async function fishingHelpCommand(sock, msg) {
  const helpText = `
╭─ 🎣 *FISHING SYSTEM HELP* 🎣 ─╮
│
│ 📌 *COMMANDS:*
│ *.mancing* - Mulai memancing baru
│ *.lnj* - Lanjut mancing (No Spam Chat)
│ *.fish tas* - Lihat isi tas
│ *.fish sellall* - Jual semua ikan
│ *.fish pakai <id>* - Pakai Luck Potion
│
│ 🛒 *SHOP & POTION:*
│ Beli Potion di *.shop* untuk menaikkan
│ peluang dapet ikan MYTHIC & DIVINE!
│
╰────────────────────────╯`;
  await sock.sendMessage(msg.key.remoteJid, { text: helpText }, { quoted: msg });
}

module.exports = {
  handleFishingCommand, fishCommand, inventoryCommand, sellCommand,
  sellAllCommand, statsCommand, fishingHelpCommand, pakaiPotionCommand
};
    
