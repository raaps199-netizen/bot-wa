// File: commands/mining.js

const {
  pickaxes,
  staminaItems,
  ores,
  rarityEmoji
} = require('../utils/miningData');

const {
  getUserData,
  getTotalScore,
  addPoints,
  deductPoints,
  formatRupiah
} = require('../utils/helper');

const { getSenderId } = require('../utils/jid-utils');


// ==========================================
// 🛠️ DEFAULT MINING STATE
// ==========================================

function getDefaultMiningState() {
  return {
    depth: 0,

    stamina: 100,
    maxStamina: 100,

    pickaxe: 'wooden',

    durability: 50,

    inventory: {},

    stats: {
      totalMined: 0,
      deepestDepth: 0,
      totalValue: 0,
      diamondsFound: 0,
      ancientCrystalsFound: 0
    },

    consumables: {
      snack: 0,
      energy: 0,
      potion: 0
    }
  };
}


// ==========================================
// 🔧 INITIALIZE
// ==========================================

function initializeMining(user) {
  if (!user.mining) {
    user.mining = getDefaultMiningState();
    return;
  }

  const defaults = getDefaultMiningState();

  if (user.mining.depth === undefined) {
    user.mining.depth = defaults.depth;
  }

  if (user.mining.stamina === undefined) {
    user.mining.stamina = defaults.stamina;
  }

  if (user.mining.maxStamina === undefined) {
    user.mining.maxStamina = defaults.maxStamina;
  }

  if (!user.mining.pickaxe) {
    user.mining.pickaxe = 'wooden';
  }

  if (user.mining.durability === undefined) {
    user.mining.durability = pickaxes[user.mining.pickaxe].maxDurability;
  }

  if (!user.mining.inventory) {
    user.mining.inventory = {};
  }

  if (!user.mining.consumables) {
    user.mining.consumables = {
      snack: 0,
      energy: 0,
      potion: 0
    };
  }

  if (!user.mining.stats) {
    user.mining.stats = defaults.stats;
  }
}


// ==========================================
// 📊 STATUS
// ==========================================

async function statusCommand(sock, msg, user, sender) {
  const mining = user.mining;
  const pickaxe = pickaxes[mining.pickaxe];

  const balance = getTotalScore(user);

  const text = `
╭─ ⛏️ *MINING STATUS* ⛏️ ─╮
│
│ 📍 Kedalaman: *${mining.depth}m*
│ ⚡ Stamina: *${mining.stamina}/${mining.maxStamina}*
│
│ ⛏️ Pickaxe: *${pickaxe.name}*
│ 💥 Power: *${pickaxe.power}*
│ 🔧 Durability: *${mining.durability}/${pickaxe.maxDurability}*
│
│ 💰 Saldo: *${formatRupiah(balance)}*
│
├────────────────────────┤
│ 🪨 Total Ditambang: *${mining.stats.totalMined}*
│ 🏆 Kedalaman Tertinggi: *${mining.stats.deepestDepth}m*
│ 💎 Diamond: *${mining.stats.diamondsFound}*
│ 🔮 Ancient Crystal: *${mining.stats.ancientCrystalsFound}*
│
╰────────────────────────╯
`;

  await sock.sendMessage(
    msg.key.remoteJid,
    { text },
    { quoted: msg }
  );
}


// ==========================================
// 🛒 SHOP
// ==========================================

async function shopCommand(sock, msg) {
  let text = `
╭─ 🛒 *MINING SHOP* 🛒 ─╮
│
│ ⛏️ *PICKAXE*
│
`;

  for (const [id, item] of Object.entries(pickaxes)) {
    text += `│ • *${id}*
│   ${item.name}
│   💰 ${formatRupiah(item.price)}
│   💥 Power: ${item.power}
│   🔧 Durability: ${item.maxDurability}
│   📍 Max Depth: ${item.maxDepth}m
│
`;
  }

  text += `├────────────────────────┤
│ 🥤 *STAMINA ITEMS*
│
`;

  for (const [id, item] of Object.entries(staminaItems)) {
    text += `│ • *${id}*
│   ${item.name}
│   💰 ${formatRupiah(item.price)}
│   ⚡ +${item.stamina} Stamina
│
`;
  }

  text += `├────────────────────────┤
│ 💡 *CARA BELI*
│ .mining buy <id>
│
│ Contoh:
│ .mining buy stone
│ .mining buy energy
│
╰────────────────────────╯`;

  await sock.sendMessage(
    msg.key.remoteJid,
    { text },
    { quoted: msg }
  );
}


// ==========================================
// 💰 BUY
// ==========================================

async function buyCommand(sock, msg, user, args) {
  const itemId = args[0]?.toLowerCase();

  if (!itemId) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `⚠️ Masukkan ID barang.\n\nContoh:\n*.mining buy stone*\n*.mining buy energy*`
      },
      { quoted: msg }
    );
  }

  // --------------------------
  // PICKAXE
  // --------------------------

  if (pickaxes[itemId]) {
    const item = pickaxes[itemId];

    if (itemId === user.mining.pickaxe) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `⚠️ Kamu sudah menggunakan *${item.name}*.`
        },
        { quoted: msg }
      );
    }

    const currentIndex = Object.keys(pickaxes).indexOf(user.mining.pickaxe);
    const targetIndex = Object.keys(pickaxes).indexOf(itemId);

    if (targetIndex < currentIndex) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Kamu tidak bisa membeli pickaxe yang lebih rendah dari pickaxe sekarang.`
        },
        { quoted: msg }
      );
    }

    if (getTotalScore(user) < item.price) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Saldo tidak cukup!\n\n💰 Harga: ${formatRupiah(item.price)}\n💳 Saldo kamu: ${formatRupiah(getTotalScore(user))}`
        },
        { quoted: msg }
      );
    }

    deductPoints(global.db, getSenderId(msg, msg.key.remoteJid), item.price);

    user.mining.pickaxe = itemId;
    user.mining.durability = item.maxDurability;

    if (item.maxDepth > user.mining.depth) {
      // Tidak perlu melakukan apa-apa.
      // Depth tetap berada di posisi sebelumnya.
    }

    global.saveDatabase?.();

    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `
╭─ ⛏️ *PICKAXE PURCHASED* ⛏️ ─╮
│
│ ✅ Pickaxe baru:
│ *${item.name}*
│
│ 💥 Power: *${item.power}*
│ 🔧 Durability: *${item.maxDurability}*
│ 📍 Max Depth: *${item.maxDepth}m*
│
│ 💰 Harga: *${formatRupiah(item.price)}*
│ 💳 Sisa Saldo: *${formatRupiah(getTotalScore(user))}*
│
╰────────────────────────╯`
      },
      { quoted: msg }
    );
  }

  // --------------------------
  // STAMINA ITEM
  // --------------------------

  if (staminaItems[itemId]) {
    const item = staminaItems[itemId];

    if (getTotalScore(user) < item.price) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Saldo tidak cukup!\n\n💰 Harga: ${formatRupiah(item.price)}\n💳 Saldo kamu: ${formatRupiah(getTotalScore(user))}`
        },
        { quoted: msg }
      );
    }

    deductPoints(
      global.db,
      getSenderId(msg, msg.key.remoteJid),
      item.price
    );

    user.mining.consumables[itemId] =
      (user.mining.consumables[itemId] || 0) + 1;

    global.saveDatabase?.();

    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `✅ Berhasil membeli *${item.name}*!\n\n📦 Jumlah: *${user.mining.consumables[itemId]}x*\n⚡ Memulihkan: *+${item.stamina} Stamina*\n💳 Sisa Saldo: *${formatRupiah(getTotalScore(user))}*\n\nGunakan dengan:\n*.mining use ${itemId}*`
      },
      { quoted: msg }
    );
  }

  return await sock.sendMessage(
    msg.key.remoteJid,
    {
      text: `❌ Item *${itemId}* tidak ditemukan di Mining Shop.\n\nKetik *.mining shop* untuk melihat barang.`
    },
    { quoted: msg }
  );
}


// ==========================================
// ⚡ USE STAMINA ITEM
// ==========================================

async function useCommand(sock, msg, user, args) {
  const itemId = args[0]?.toLowerCase();

  if (!itemId || !staminaItems[itemId]) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `⚠️ Pilih item stamina yang valid.\n\n*.mining use snack*\n*.mining use energy*\n*.mining use potion*`
      },
      { quoted: msg }
    );
  }

  const count = user.mining.consumables[itemId] || 0;

  if (count <= 0) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `❌ Kamu tidak memiliki *${staminaItems[itemId].name}*.\n\nBeli di *.mining shop*.`
      },
      { quoted: msg }
    );
  }

  if (user.mining.stamina >= user.mining.maxStamina) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `⚡ Stamina kamu sudah penuh!`
      },
      { quoted: msg }
    );
  }

  const item = staminaItems[itemId];

  const oldStamina = user.mining.stamina;

  user.mining.stamina = Math.min(
    user.mining.maxStamina,
    user.mining.stamina + item.stamina
  );

  user.mining.consumables[itemId]--;

  const recovered = user.mining.stamina - oldStamina;

  global.saveDatabase?.();

  await sock.sendMessage(
    msg.key.remoteJid,
    {
      text: `
⚡ *STAMINA RECOVERED!*

${item.name}

⚡ +${recovered} Stamina

Stamina:
*${oldStamina} → ${user.mining.stamina}/${user.mining.maxStamina}*

📦 Sisa: *${user.mining.consumables[itemId]}x*
`
    },
    { quoted: msg }
  );
}


// ==========================================
// ⛏️ DIG
// ==========================================

function getAvailableOres(depth) {
  return Object.entries(ores).filter(
    ([, ore]) =>
      depth >= ore.minDepth &&
      depth <= ore.maxDepth
  );
}

function chooseOre(depth, power) {
  const available = getAvailableOres(depth);

  if (available.length === 0) {
    return ores.stone;
  }

  let weighted = [];

  for (const [id, ore] of available) {
    let weight = 100;

    switch (ore.rarity) {
      case 'COMMON':
        weight = 100;
        break;

      case 'UNCOMMON':
        weight = 35 + power * 3;
        break;

      case 'RARE':
        weight = 10 + power * 2;
        break;

      case 'EPIC':
        weight = 4 + power;
        break;

      case 'LEGENDARY':
        weight = 1 + power * 0.5;
        break;

      case 'MYTHIC':
        weight = 0.2 + power * 0.1;
        break;
    }

    for (let i = 0; i < Math.max(1, Math.floor(weight)); i++) {
      weighted.push({ id, ore });
    }
  }

  return weighted[Math.floor(Math.random() * weighted.length)].ore;
}


async function digCommand(sock, msg, user) {
  const mining = user.mining;
  const pickaxe = pickaxes[mining.pickaxe];

  if (mining.stamina < 10) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `⚡ *STAMINA HABIS!*\n\nStamina kamu: *${mining.stamina}/${mining.maxStamina}*\n\nGunakan item stamina dengan:\n*.mining use energy*\n\nAtau beli di:\n*.mining shop*`
      },
      { quoted: msg }
    );
  }

  if (mining.durability <= 0) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `🔧 *PICKAXE RUSAK!*\n\nPickaxe kamu sudah tidak memiliki durability.\n\nBeli pickaxe baru di *.mining shop*`
      },
      { quoted: msg }
    );
  }

  mining.stamina -= 10;
  mining.durability -= 1;

  const depthGain = Math.floor(Math.random() * 4) + pickaxe.power;

  mining.depth += depthGain;

  if (mining.depth > pickaxe.maxDepth) {
    mining.depth = pickaxe.maxDepth;
  }

  mining.stats.deepestDepth = Math.max(
    mining.stats.deepestDepth,
    mining.depth
  );

  const ore = chooseOre(mining.depth, pickaxe.power);

  const amount =
    Math.floor(Math.random() * Math.max(1, pickaxe.power / 2)) + 1;

  const oreId = Object.keys(ores).find(
    id => ores[id] === ore
  );

  mining.inventory[oreId] =
    (mining.inventory[oreId] || 0) + amount;

  mining.stats.totalMined += amount;
  mining.stats.totalValue += ore.price * amount;

  if (oreId === 'diamond') {
    mining.stats.diamondsFound += amount;
  }

  if (oreId === 'ancient_crystal') {
    mining.stats.ancientCrystalsFound += amount;
  }

  global.saveDatabase?.();

  const emoji = rarityEmoji[ore.rarity] || '⚪';

  const totalOre =
    mining.inventory[oreId];

  await sock.sendMessage(
    msg.key.remoteJid,
    {
      text: `
╭─ ⛏️ *MINING SUCCESS* ⛏️ ─╮
│
│ ${emoji} *${ore.rarity}*
│
│ 💎 Mendapatkan:
│ *${ore.name} x${amount}*
│
│ 💰 Nilai: *${formatRupiah(ore.price * amount)}*
│
├────────────────────────┤
│ 📍 Depth: *${mining.depth}m*
│ ⚡ Stamina: *${mining.stamina}/${mining.maxStamina}*
│ 🔧 Durability: *${mining.durability}/${pickaxe.maxDurability}*
│ 📦 Ore ini: *${totalOre}x*
│
╰────────────────────────╯

💡 Jual hasil mining:
*.mining sell*`
    },
    { quoted: msg }
  );
}


// ==========================================
// 🎒 INVENTORY
// ==========================================

async function inventoryCommand(sock, msg, user) {
  const mining = user.mining;

  let oreText = '';

  for (const [id, amount] of Object.entries(mining.inventory)) {
    if (amount <= 0) continue;

    const ore = ores[id];

    if (!ore) continue;

    oreText += `${rarityEmoji[ore.rarity] || '⚪'} ${ore.name}: *${amount}x* (${formatRupiah(ore.price * amount)})\n`;
  }

  if (!oreText) {
    oreText = '📦 Inventory ore masih kosong.\n';
  }

  let consumableText = '';

  for (const [id, amount] of Object.entries(mining.consumables)) {
    if (amount > 0) {
      consumableText += `• ${staminaItems[id].name}: *${amount}x*\n`;
    }
  }

  if (!consumableText) {
    consumableText = 'Tidak ada item stamina.\n';
  }

  const totalValue = Object.entries(mining.inventory)
    .reduce((total, [id, amount]) => {
      return total + (
        ores[id]
          ? ores[id].price * amount
          : 0
      );
    }, 0);

  const text = `
╭─ 🎒 *MINING INVENTORY* 🎒 ─╮
│
${oreText.split('\n').map(x => x ? `│ ${x}` : '│').join('\n')}
│
├────────────────────────┤
│ 💰 Total Nilai Ore:
│ *${formatRupiah(totalValue)}*
│
├────────────────────────┤
│ ⚡ *STAMINA ITEMS*
│
${consumableText.split('\n').map(x => x ? `│ ${x}` : '│').join('\n')}
╰────────────────────────╯
`;

  await sock.sendMessage(
    msg.key.remoteJid,
    { text },
    { quoted: msg }
  );
}


// ==========================================
// 💰 SELL
// ==========================================

async function sellCommand(sock, msg, user, sender, args) {
  const mining = user.mining;

  if (Object.keys(mining.inventory).length === 0) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `📦 Inventory mining kamu kosong.`
      },
      { quoted: msg }
    );
  }

  const target = args[0]?.toLowerCase();

  let soldItems = [];
  let total = 0;

  // --------------------------
  // SELL ALL
  // --------------------------

  if (!target || target === 'all' || target === 'semua') {
    for (const [id, amount] of Object.entries(mining.inventory)) {
      if (!ores[id] || amount <= 0) continue;

      const value = ores[id].price * amount;

      soldItems.push({
        ore: ores[id],
        amount,
        value
      });

      total += value;
    }

    mining.inventory = {};
  }

  // --------------------------
  // SELL SPECIFIC ORE
  // --------------------------

  else {
    if (!ores[target]) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Ore *${target}* tidak ditemukan.`
        },
        { quoted: msg }
      );
    }

    const amount = mining.inventory[target] || 0;

    if (amount <= 0) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Kamu tidak memiliki *${ores[target].name}*.`
        },
        { quoted: msg }
      );
    }

    total = ores[target].price * amount;

    soldItems.push({
      ore: ores[target],
      amount,
      value: total
    });

    delete mining.inventory[target];
  }

  if (total <= 0) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `❌ Tidak ada ore yang bisa dijual.`
      },
      { quoted: msg }
    );
  }

  // MASUK KE SALDO UTAMA
  addPoints(global.db, sender, total);

  mining.stats.totalValue = Math.max(
    0,
    mining.stats.totalValue - total
  );

  global.saveDatabase?.();

  let soldText = '';

  soldItems.forEach(item => {
    soldText += `• ${item.ore.name} x${item.amount} → ${formatRupiah(item.value)}\n`;
  });

  await sock.sendMessage(
    msg.key.remoteJid,
    {
      text: `
╭─ 💰 *MINING SALE* 💰 ─╮
│
${soldText}
├────────────────────────┤
│ 💵 Total Penjualan:
│ *+${formatRupiah(total)}*
│
│ 💰 Saldo Utama:
│ *${formatRupiah(getTotalScore(user))}*
│
╰────────────────────────╯
`
    },
    { quoted: msg }
  );
}


// ==========================================
// 📖 HELP
// ==========================================

async function helpCommand(sock, msg) {
  const text = `
╭─ ⛏️ *MINING SYSTEM* ⛏️ ─╮
│
│ ⛏️ *.mining dig*
│    Menggali tambang
│
│ 📊 *.mining status*
│    Cek status mining
│
│ 🎒 *.mining inventory*
│    Cek hasil tambang
│
│ 🛒 *.mining shop*
│    Buka Mining Shop
│
│ 💰 *.mining sell*
│    Jual semua ore
│
│ 💰 *.mining sell diamond*
│    Jual ore tertentu
│
│ 🛒 *.mining buy stone*
│    Beli pickaxe
│
│ 🥤 *.mining buy energy*
│    Beli stamina item
│
│ ⚡ *.mining use energy*
│    Gunakan stamina item
│
╰────────────────────────╯
`;

  await sock.sendMessage(
    msg.key.remoteJid,
    { text },
    { quoted: msg }
  );
}


// ==========================================
// 🎮 MAIN HANDLER
// ==========================================

async function handleMiningCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const sender = getSenderId(msg, remoteJid);

  const user = getUserData(global.db, sender);

  initializeMining(user);

  const subCommand = args[0]?.toLowerCase();

  try {
    switch (subCommand) {
      case undefined:
      case 'help':
      case 'bantuan':
        return await helpCommand(sock, msg);

      case 'status':
        return await statusCommand(sock, msg, user, sender);

      case 'shop':
      case 'toko':
        return await shopCommand(sock, msg);

      case 'buy':
      case 'beli':
        return await buyCommand(sock, msg, user, args.slice(1));

      case 'use':
      case 'pakai':
        return await useCommand(sock, msg, user, args.slice(1));

      case 'dig':
      case 'gali':
        return await digCommand(sock, msg, user);

      case 'inventory':
      case 'inv':
      case 'tas':
        return await inventoryCommand(sock, msg, user);

      case 'sell':
      case 'jual':
        return await sellCommand(
          sock,
          msg,
          user,
          sender,
          args.slice(1)
        );

      default:
        return await sock.sendMessage(
          remoteJid,
          {
            text: `❌ Perintah mining *${subCommand}* tidak dikenal.\n\nKetik *.mining help*`
          },
          { quoted: msg }
        );
    }
  } catch (error) {
    console.error('Mining command error:', error);

    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ Mining Error: ${error.message}`
      },
      { quoted: msg }
    );
  }
}

module.exports = handleMiningCommand;
