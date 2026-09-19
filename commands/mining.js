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
// ⚡ ENERGY UPGRADES
// ==========================================

const energyUpgrades = {
  battery: {
    name: '🔋 Energy Cell',
    price: 10000,
    maxStamina: 125
  },

  core: {
    name: '⚡ Advanced Energy Core',
    price: 30000,
    maxStamina: 150
  },

  reactor: {
    name: '🔋 Mining Reactor',
    price: 75000,
    maxStamina: 200
  },

  fusion: {
    name: '⚡ Fusion Energy Core',
    price: 200000,
    maxStamina: 300
  },

  hyper: {
    name: '🔋 Hyper Energy Reactor',
    price: 500000,
    maxStamina: 500
  },

  quantum: {
    name: '⚡ Quantum Energy Core',
    price: 1200000,
    maxStamina: 750
  },

  infinity: {
    name: '🌌 Infinity Energy Core',
    price: 3000000,
    maxStamina: 1000
  },

  transcendent: {
    name: '✨ Transcendent Energy Core',
    price: 7500000,
    maxStamina: 1500
  }
};


// ==========================================
// 😴 ACTIVE REST
// ==========================================

// Menyimpan user yang sedang melakukan rest
const activeRest = new Set();

// ==========================================
// 🤖 AUTO MINING
// ==========================================

const activeAutoMining = new Set();


// ==========================================
// 🛠️ DEFAULT MINING STATE
// ==========================================

function getDefaultMiningState() {
  const consumables = {};

  for (const id of Object.keys(staminaItems)) {
    consumables[id] = 0;
  }

  return {
    depth: 0,
    stamina: 100,
    maxStamina: 100,
    pickaxe: 'wooden',
    durability: pickaxes.wooden?.maxDurability || 50,
    inventory: {},

    stats: {
      totalMined: 0,
      deepestDepth: 0,
      totalValue: 0,
      diamondsFound: 0,
      ancientCrystalsFound: 0
    },

    consumables,
    energyUpgrade: null,
    lastDigKey: null
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

  if (user.mining.depth === undefined) user.mining.depth = defaults.depth;
  if (user.mining.stamina === undefined) user.mining.stamina = defaults.stamina;
  if (user.mining.maxStamina === undefined) user.mining.maxStamina = defaults.maxStamina;

  if (!pickaxes[user.mining.pickaxe]) {
    user.mining.pickaxe = 'wooden';
  }

  if (user.mining.durability === undefined) {
    user.mining.durability =
      pickaxes[user.mining.pickaxe]?.maxDurability ||
      pickaxes.wooden.maxDurability;
  }

  if (!user.mining.inventory) user.mining.inventory = {};

  user.mining.consumables = {
    ...defaults.consumables,
    ...(user.mining.consumables || {})
  };

  user.mining.stats = {
    ...defaults.stats,
    ...(user.mining.stats || {})
  };

  if (user.mining.energyUpgrade === undefined) {
    user.mining.energyUpgrade = null;
  }

  if (user.mining.lastDigKey === undefined) {
    user.mining.lastDigKey = null;
  }
}





// ==========================================
// 🤖 AUTO MINING
// ==========================================

async function autoMiningCommand(sock, msg, user, sender) {
  const remoteJid = msg.key.remoteJid;
  const mining = user.mining;

  if (activeAutoMining.has(sender)) {
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          '⚠️ *AUTO MINING SUDAH AKTIF!*\\n\\n' +
          'Ketik *.mining stop* untuk menghentikannya.'
      },
      { quoted: msg }
    );
  }

  if (mining.stamina < 10) {
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          '⚡ *ENERGY TERLALU RENDAH!*\\n\\n' +
          `Energy kamu: *${mining.stamina}/${mining.maxStamina}*\\n\\n` +
          'Rest atau gunakan item energy dulu.'
      },
      { quoted: msg }
    );
  }

  if (mining.durability <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          '🔧 *PICKAXE RUSAK!*\\n\\n' +
          'Beli atau gunakan pickaxe lain sebelum menjalankan Auto Mining.'
      },
      { quoted: msg }
    );
  }

  activeAutoMining.add(sender);

  await sock.sendMessage(
    remoteJid,
    {
      text:
        '🤖 *AUTO MINING AKTIF!*\\n\\n' +
        '⛏️ Bot akan menggali secara otomatis.\\n' +
        '⚡ Energy terkuras lebih cepat karena interval mining dipercepat.\\n\\n' +
        'Ketik *.mining stop* untuk berhenti.'
    },
    { quoted: msg }
  );

  runAutoMining(sock, msg, user, sender).catch(err => {
    console.error('❌ Auto Mining Error:', err);
    activeAutoMining.delete(sender);
  });
}

async function stopAutoMining(sock, msg, sender) {
  const remoteJid = msg.key.remoteJid;

  if (!activeAutoMining.has(sender)) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: '⚠️ *AUTO MINING TIDAK AKTIF!*'
      },
      { quoted: msg }
    );
  }

  activeAutoMining.delete(sender);

  return await sock.sendMessage(
    remoteJid,
    {
      text: '🛑 *AUTO MINING DIHENTIKAN!*'
    },
    { quoted: msg }
  );
}

async function runAutoMining(sock, msg, user, sender) {
  const mining = user.mining;

  while (activeAutoMining.has(sender)) {
    if (mining.stamina < 10) {
      activeAutoMining.delete(sender);

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text:
            `⚡ *AUTO MINING BERHENTI!*\\n\\n` +
            `Energy habis: *${mining.stamina}/${mining.maxStamina}*`
        }
      );

      break;
    }

    if (mining.durability <= 0) {
      activeAutoMining.delete(sender);

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text:
            '🔧 *AUTO MINING BERHENTI!*\\n\\n' +
            'Pickaxe kamu sudah rusak.'
        }
      );

      break;
    }

    try {
      await digCommand(sock, msg, user, true);
    } catch (err) {
      console.error('❌ Auto mining step error:', err);
      activeAutoMining.delete(sender);
      break;
    }
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
│
│ ⚡ Energy: *${mining.stamina}/${mining.maxStamina}*
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
│   ⚡ +${item.stamina} Energy
│
`;
  }

  text += `├────────────────────────┤
│ ⚡ *ENERGY UPGRADES*
│
`;

  for (const [id, item] of Object.entries(energyUpgrades)) {
    text += `│ • *${id}*
│   ${item.name}
│   💰 ${formatRupiah(item.price)}
│   ⚡ Max Energy: ${item.maxStamina}
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
│ .mining buy battery
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
        text: `⚠️ Masukkan ID barang.\n\nContoh:\n*.mining buy stone*\n*.mining buy energy*\n*.mining buy battery*`
      },
      { quoted: msg }
    );
  }


  // ==========================================
  // ⛏️ PICKAXE
  // ==========================================

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

    const currentIndex =
      Object.keys(pickaxes).indexOf(user.mining.pickaxe);

    const targetIndex =
      Object.keys(pickaxes).indexOf(itemId);

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

    deductPoints(
      global.db,
      getSenderId(msg, msg.key.remoteJid),
      item.price
    );

    user.mining.pickaxe = itemId;
    user.mining.durability = item.maxDurability;

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


  // ==========================================
  // 🥤 STAMINA ITEM
  // ==========================================

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
        text: `✅ Berhasil membeli *${item.name}*!\n\n📦 Jumlah: *${user.mining.consumables[itemId]}x*\n⚡ Memulihkan: *+${item.stamina} Energy*\n💳 Sisa Saldo: *${formatRupiah(getTotalScore(user))}*\n\nGunakan dengan:\n*.mining use ${itemId}*`
      },
      { quoted: msg }
    );
  }


  // ==========================================
  // ⚡ ENERGY UPGRADE
  // ==========================================

  if (energyUpgrades[itemId]) {
    const item = energyUpgrades[itemId];

    // Tidak boleh membeli upgrade yang sama
    // atau upgrade yang lebih rendah
    const currentMax = user.mining.maxStamina;

    if (item.maxStamina <= currentMax) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `⚠️ Kamu sudah memiliki *${currentMax} Max Energy* atau lebih tinggi.\n\nUpgrade *${item.name}* hanya memberikan *${item.maxStamina} Max Energy*.`
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

    deductPoints(
      global.db,
      getSenderId(msg, msg.key.remoteJid),
      item.price
    );

    const oldMax = user.mining.maxStamina;

    user.mining.maxStamina = item.maxStamina;
    user.mining.energyUpgrade = itemId;

    global.saveDatabase?.();

    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `
╭─ ⚡ *ENERGY UPGRADE* ⚡ ─╮
│
│ ✅ Upgrade berhasil!
│
│ ${item.name}
│
│ ⚡ Max Energy:
│ *${oldMax} → ${item.maxStamina}*
│
│ 💰 Harga:
│ *${formatRupiah(item.price)}*
│
│ 💳 Sisa Saldo:
│ *${formatRupiah(getTotalScore(user))}*
│
╰────────────────────────╯`
      },
      { quoted: msg }
    );
  }


  // ==========================================
  // ❌ ITEM TIDAK DITEMUKAN
  // ==========================================

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

  const count =
    user.mining.consumables[itemId] || 0;

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
        text: `⚡ Energy kamu sudah penuh!\n\n*${user.mining.stamina}/${user.mining.maxStamina}*`
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

  const recovered =
    user.mining.stamina - oldStamina;

  global.saveDatabase?.();

  await sock.sendMessage(
    msg.key.remoteJid,
    {
      text: `
⚡ *ENERGY RECOVERED!*

${item.name}

⚡ +${recovered} Energy

Energy:
*${oldStamina} → ${user.mining.stamina}/${user.mining.maxStamina}*

📦 Sisa:
*${user.mining.consumables[itemId]}x*
`
    },
    { quoted: msg }
  );
}


// ==========================================
// 😴 REST
// ==========================================

function generateRestProgress(start, max, seconds) {
  const totalGain = max - start;

  if (totalGain <= 0) {
    return Array(seconds + 1).fill(max);
  }

  // Buat titik progres acak
  // supaya kenaikannya tidak selalu sama.
  const values = [];

  for (let i = 1; i < seconds; i++) {
    const progress = i / seconds;

    // Base progress
    const base =
      start + (totalGain * progress);

    // Variasi kecil
    const variation =
      (Math.random() - 0.5) *
      totalGain *
      0.15;

    let value = Math.floor(
      base + variation
    );

    // Harus selalu lebih tinggi
    // dari nilai sebelumnya
    const previous =
      values.length > 0
        ? values[values.length - 1]
        : start;

    value = Math.max(
      previous + 1,
      value
    );

    // Jangan sampai menyentuh max
    // sebelum waktunya
    value = Math.min(
      max - (seconds - i),
      value
    );

    values.push(value);
  }

  // Tambahkan nilai awal dan akhir
  return [
    start,
    ...values,
    max
  ];
}


async function restCommand(sock, msg, user, sender) {
  const mining = user.mining;
  const remoteJid = msg.key.remoteJid;

  // ==========================================
  // CEK REST AKTIF
  // ==========================================

  if (activeRest.has(sender)) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `😴 Kamu sedang beristirahat.\n\nTunggu sampai rest selesai dulu.`
      },
      { quoted: msg }
    );
  }


  // ==========================================
  // CEK ENERGY FULL
  // ==========================================

  if (mining.stamina >= mining.maxStamina) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚡ Energy kamu sudah penuh!\n\n*${mining.stamina}/${mining.maxStamina}*`
      },
      { quoted: msg }
    );
  }


  activeRest.add(sender);

  const maxStamina = mining.maxStamina;
  const startStamina = mining.stamina;

  const restDuration = 15;

  const progress =
    generateRestProgress(
      startStamina,
      maxStamina,
      restDuration
    );


  // ==========================================
  // KIRIM 1 PESAN
  // ==========================================

  let sentMessage;

  try {
    sentMessage = await sock.sendMessage(
      remoteJid,
      {
        text: `
╭─ 😴 *MINING REST* 😴 ─╮
│
│ 💤 Sedang beristirahat...
│
│ ⏳ Sisa: *15*
│ ⚡ Energy: *${startStamina}/${maxStamina}*
│
╰────────────────────────╯
`
      },
      { quoted: msg }
    );


    // ==========================================
    // EDIT SETIAP DETIK
    // ==========================================

    for (let remaining = 14; remaining >= 0; remaining--) {
      await new Promise(
        resolve => setTimeout(resolve, 1000)
      );

      const elapsed =
        15 - remaining;

      const newStamina =
        progress[elapsed];

      mining.stamina =
        Math.min(
          maxStamina,
          newStamina
        );

      global.saveDatabase?.();


      // ==========================================
      // REST SELESAI
      // ==========================================

      if (remaining === 0) {
        mining.stamina = maxStamina;

        global.saveDatabase?.();

        await sock.sendMessage(
          remoteJid,
          {
            text: `
╭─ 😴 *REST COMPLETE* 😴 ─╮
│
│ ✅ Istirahat selesai!
│
│ ⚡ Energy:
│ *${mining.stamina}/${maxStamina}*
│
│ ⛏️ Siap kembali menambang!
│
╰────────────────────────╯
`,
            edit: sentMessage.key
          }
        );

        break;
      }


      // ==========================================
      // UPDATE ENERGY
      // ==========================================

      await sock.sendMessage(
        remoteJid,
        {
          text: `
╭─ 😴 *MINING REST* 😴 ─╮
│
│ 💤 Sedang beristirahat...
│
│ ⏳ Sisa: *${remaining}*
│ ⚡ Energy: *${mining.stamina}/${maxStamina}*
│
╰────────────────────────╯
`,
          edit: sentMessage.key
        }
      );
    }

  } catch (error) {
    console.error('Mining rest error:', error);

    // Kalau terjadi error saat edit,
    // jangan biarkan user terkunci dalam activeRest.
    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ Rest mengalami error: ${error.message}`
      },
      { quoted: msg }
    );

  } finally {
    activeRest.delete(sender);
    global.saveDatabase?.();
  }
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

  if (available.length === 0) return ores.stone;

  const weighted = [];

  for (const [, ore] of available) {
    let weight = 100;

    switch (ore.rarity) {
      case 'COMMON': weight = 100; break;
      case 'UNCOMMON': weight = 35 + power * 3; break;
      case 'RARE': weight = 10 + power * 2; break;
      case 'EPIC': weight = 4 + power; break;
      case 'LEGENDARY': weight = 1 + power * 0.5; break;
      case 'MYTHIC': weight = 0.2 + power * 0.1; break;
      case 'DIVINE': weight = 0.08 + power * 0.04; break;
      case 'CELESTIAL': weight = 0.03 + power * 0.02; break;
      case 'ANCIENT': weight = 0.01 + power * 0.01; break;
      case 'TRANSCENDENT': weight = 0.003 + power * 0.005; break;
    }

    weighted.push({ ore, weight });
  }

  const totalWeight = weighted.reduce(
    (total, item) => total + item.weight,
    0
  );

  let roll = Math.random() * totalWeight;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.ore;
  }

  return weighted[weighted.length - 1].ore;
}





async function digCommand(sock, msg, user, isAuto = false) {
  const mining = user.mining;
  const remoteJid = msg.key.remoteJid;
  const pickaxe = pickaxes[mining.pickaxe];

  if (!pickaxe) {
    mining.pickaxe = 'wooden';
    mining.durability = pickaxes.wooden.maxDurability;
    global.saveDatabase?.();

    return await sock.sendMessage(
      remoteJid,
      {
        text:
          '⚠️ Pickaxe mining kamu tidak valid.\\n\\n' +
          'Pickaxe otomatis dikembalikan ke *Wooden Pickaxe*.'
      },
      { quoted: msg }
    );
  }

  if (mining.stamina < 10) {
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          `⚡ *ENERGY HABIS!*\\n\\n` +
          `Energy kamu: *${mining.stamina}/${mining.maxStamina}*\\n\\n` +
          `Gunakan:\\n*.mining rest*\\n\\n` +
          `atau gunakan item:\\n*.mining use energy*`
      },
      { quoted: msg }
    );
  }

  if (mining.durability <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          `🔧 *PICKAXE RUSAK!*\\n\\n` +
          `Pickaxe kamu sudah tidak memiliki durability.\\n\\n` +
          `Beli pickaxe baru di *.mining shop*`
      },
      { quoted: msg }
    );
  }

  const startingText =
    '⛏️ *Sedang menggali...*\\n\\n' +
    '🔨 Pickaxe sedang bekerja...';

  // Sama seperti fishing.js:
  // kalau sudah pernah mining, edit bubble mining sebelumnya.
  // Hanya .mining dig pertama yang membuat bubble baru.
  let editKey = mining.lastDigKey || null;
  let sentMessage;

  if (editKey) {
    try {
      await sock.sendMessage(
        remoteJid,
        {
          text: startingText,
          edit: editKey
        }
      );
      sentMessage = { key: editKey };
    } catch (e) {
      console.error('⚠️ Gagal edit bubble mining lama, membuat bubble baru:', e);
      sentMessage = await sock.sendMessage(
        remoteJid,
        {
          text: startingText
        },
        { quoted: msg }
      );
    }
  } else {
    sentMessage = await sock.sendMessage(
      remoteJid,
      {
        text: startingText
      },
      { quoted: msg }
    );
  }

  const digEditKey = sentMessage.key;

  // Auto mining menggali lebih cepat, jadi energy juga terkuras lebih cepat.
  await new Promise(resolve =>
    setTimeout(resolve, isAuto ? 500 : 1000)
  );

  mining.stamina -= 10;
  mining.durability -= 1;

  const depthGain =
    Math.floor(Math.random() * 4) + pickaxe.power;

  mining.depth += depthGain;

  if (mining.depth > pickaxe.maxDepth) {
    mining.depth = pickaxe.maxDepth;
  }

  mining.stats.deepestDepth =
    Math.max(
      mining.stats.deepestDepth,
      mining.depth
    );

  const ore = chooseOre(
    mining.depth,
    pickaxe.power
  );

  const amount =
    Math.floor(
      Math.random() *
      Math.max(1, Math.floor(pickaxe.power / 2))
    ) + 1;

  const oreId = Object.keys(ores).find(
    id => ores[id] === ore
  );

  if (!ore || !oreId) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: '❌ Gagal menentukan ore. Coba mining lagi.'
      },
      { quoted: msg }
    );
  }

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

  const emoji =
    rarityEmoji[ore.rarity] || '⚪';

  const totalOre =
    mining.inventory[oreId];

  const resultText = `
╭─ ⛏️ *MINING SUCCESS* ⛏️ ─╮
│
│ ${emoji} *${ore.rarity}*
│
│ 💎 Mendapatkan:
│ *${ore.name} x${amount}*
│
│ 💰 Nilai:
│ *${formatRupiah(ore.price * amount)}*
│
├────────────────────────┤
│ 📍 Depth: *${mining.depth}m*
│ ⚡ Energy: *${mining.stamina}/${mining.maxStamina}*
│ 🔧 Durability: *${mining.durability}/${pickaxe.maxDurability}*
│ 📦 Ore ini: *${totalOre}x*
│
╰────────────────────────╯

💡 Jual hasil mining:
*.mining sell*`;

  // EDIT BUBBLE YANG SAMA
  await sock.sendMessage(
    remoteJid,
    {
      text: resultText,
      edit: digEditKey
    }
  );

  // Simpan key bubble ini supaya .mining dig berikutnya
  // mengedit bubble yang sama, persis seperti .lnj di fishing.js.
  mining.lastDigKey = digEditKey;
  global.saveDatabase?.();
}




// ==========================================
// 🎒 INVENTORY
// ==========================================

async function inventoryCommand(sock, msg, user) {
  const mining = user.mining;

  let oreText = '';

  for (
    const [id, amount]
    of Object.entries(mining.inventory)
  ) {
    if (amount <= 0) continue;

    const ore = ores[id];

    if (!ore) continue;

    oreText +=
      `${rarityEmoji[ore.rarity] || '⚪'} ${ore.name}: *${amount}x* (${formatRupiah(ore.price * amount)})\n`;
  }

  if (!oreText) {
    oreText =
      '📦 Inventory ore masih kosong.\n';
  }

  let consumableText = '';

  for (
    const [id, amount]
    of Object.entries(mining.consumables)
  ) {
    if (amount > 0) {
      consumableText +=
        `• ${staminaItems[id].name}: *${amount}x*\n`;
    }
  }

  if (!consumableText) {
    consumableText =
      'Tidak ada item stamina.\n';
  }

  const totalValue =
    Object.entries(mining.inventory)
      .reduce(
        (total, [id, amount]) => {
          return total + (
            ores[id]
              ? ores[id].price * amount
              : 0
          );
        },
        0
      );

  const text = `
╭─ 🎒 *MINING INVENTORY* 🎒 ─╮
│
${oreText
  .split('\n')
  .map(x =>
    x
      ? `│ ${x}`
      : '│'
  )
  .join('\n')}
│
├────────────────────────┤
│ 💰 Total Nilai Ore:
│ *${formatRupiah(totalValue)}*
│
├────────────────────────┤
│ ⚡ *STAMINA ITEMS*
│
${consumableText
  .split('\n')
  .map(x =>
    x
      ? `│ ${x}`
      : '│'
  )
  .join('\n')}
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

async function sellCommand(
  sock,
  msg,
  user,
  sender,
  args
) {
  const mining = user.mining;

  if (
    Object.keys(mining.inventory).length === 0
  ) {
    return await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: `📦 Inventory mining kamu kosong.`
      },
      { quoted: msg }
    );
  }

  const target =
    args[0]?.toLowerCase();

  let soldItems = [];
  let total = 0;


  // ==========================================
  // SELL ALL
  // ==========================================

  if (
    !target ||
    target === 'all' ||
    target === 'semua'
  ) {
    for (
      const [id, amount]
      of Object.entries(mining.inventory)
    ) {
      if (
        !ores[id] ||
        amount <= 0
      ) {
        continue;
      }

      const value =
        ores[id].price * amount;

      soldItems.push({
        ore: ores[id],
        amount,
        value
      });

      total += value;
    }

    mining.inventory = {};
  }


  // ==========================================
  // SELL SPECIFIC ORE
  // ==========================================

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

    const amount =
      mining.inventory[target] || 0;

    if (amount <= 0) {
      return await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Kamu tidak memiliki *${ores[target].name}*.`
        },
        { quoted: msg }
      );
    }

    total =
      ores[target].price * amount;

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


  // ==========================================
  // MASUK KE SALDO UTAMA
  // ==========================================

  addPoints(
    global.db,
    sender,
    total
  );

  mining.stats.totalValue =
    Math.max(
      0,
      mining.stats.totalValue - total
    );

  global.saveDatabase?.();

  let soldText = '';

  soldItems.forEach(item => {
    soldText +=
      `• ${item.ore.name} x${item.amount} → ${formatRupiah(item.value)}\n`;
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

│ 🤖 *.mining auto*
│    Mining otomatis lebih cepat
│
│ 🛑 *.mining stop*
│    Hentikan Auto Mining
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
│ 😴 *.mining rest*
│    Pulihkan energy selama 15 detik
│
│ 🔋 *.mining buy battery*
│    Upgrade Max Energy
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

async function handleMiningCommand(
  sock,
  msg,
  args
) {
  const remoteJid =
    msg.key.remoteJid;

  const sender =
    getSenderId(
      msg,
      remoteJid
    );

  const user =
    getUserData(
      global.db,
      sender
    );

  initializeMining(user);

  const subCommand =
    args[0]?.toLowerCase();

  try {
    switch (subCommand) {

      case undefined:
      case 'menu':
      case 'mining':
        return await helpCommand(
          sock,
          msg
        );

      case 'help':
      case 'bantuan':
        return await helpCommand(
          sock,
          msg
        );


      case 'status':
        return await statusCommand(
          sock,
          msg,
          user,
          sender
        );


      case 'shop':
      case 'toko':
        return await shopCommand(
          sock,
          msg
        );


      case 'buy':
      case 'beli':
        return await buyCommand(
          sock,
          msg,
          user,
          args.slice(1)
        );


      case 'use':
      case 'pakai':
        return await useCommand(
          sock,
          msg,
          user,
          args.slice(1)
        );


      case 'rest':
      case 'istirahat':
        return await restCommand(
          sock,
          msg,
          user,
          sender
        );


      case 'auto':
      case 'automining':
        return await autoMiningCommand(
          sock,
          msg,
          user,
          sender
        );

      case 'stop':
        return await stopAutoMining(
          sock,
          msg,
          sender
        );

      case 'dig':
      case 'gali':
        if (activeAutoMining.has(sender)) {
          return await sock.sendMessage(
            remoteJid,
            {
              text: '⚠️ Auto Mining sedang aktif. Ketik *.mining stop* dulu jika ingin mining manual.'
            },
            { quoted: msg }
          );
        }

        return await digCommand(
          sock,
          msg,
          user
        );


      case 'inventory':
      case 'inv':
      case 'tas':
        return await inventoryCommand(
          sock,
          msg,
          user
        );


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
    console.error(
      'Mining command error:',
      error
    );

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
