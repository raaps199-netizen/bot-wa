// File: utils/miningData.js

const rarityEmoji = {
  COMMON: '⚪',
  UNCOMMON: '🟢',
  RARE: '🔵',
  EPIC: '🟣',
  LEGENDARY: '🟡',
  MYTHIC: '🔴',
  DIVINE: '🟠',
  CELESTIAL: '🌌',
  ANCIENT: '🏺',
  TRANSCENDENT: '✨'
};

// ==========================================
// ⛏️ PICKAXE
// ==========================================

const pickaxes = {

  wooden: {
    name: '🪵 Wooden Pickaxe',
    price: 0,
    power: 1,
    maxDurability: 50,
    maxDepth: 25
  },

  stone: {
    name: '🪨 Stone Pickaxe',
    price: 25000,
    power: 2,
    maxDurability: 100,
    maxDepth: 50
  },

  copper: {
    name: '🟠 Copper Pickaxe',
    price: 60000,
    power: 3,
    maxDurability: 125,
    maxDepth: 75
  },

  iron: {
    name: '⚙️ Iron Pickaxe',
    price: 100000,
    power: 4,
    maxDurability: 150,
    maxDepth: 100
  },

  steel: {
    name: '🔩 Steel Pickaxe',
    price: 175000,
    power: 5,
    maxDurability: 180,
    maxDepth: 150
  },

  silver: {
    name: '🥈 Silver Pickaxe',
    price: 300000,
    power: 6,
    maxDurability: 200,
    maxDepth: 175
  },

  gold: {
    name: '🥇 Gold Pickaxe',
    price: 400000,
    power: 7,
    maxDurability: 225,
    maxDepth: 200
  },

  diamond: {
    name: '💎 Diamond Pickaxe',
    price: 500000,
    power: 8,
    maxDurability: 250,
    maxDepth: 250
  },

  platinum: {
    name: '⚪ Platinum Pickaxe',
    price: 750000,
    power: 10,
    maxDurability: 300,
    maxDepth: 350
  },

  obsidian: {
    name: '🌑 Obsidian Pickaxe',
    price: 2500000,
    power: 15,
    maxDurability: 400,
    maxDepth: 1000
  },

  amethyst: {
    name: '💜 Amethyst Pickaxe',
    price: 5000000,
    power: 20,
    maxDurability: 500,
    maxDepth: 1500
  },

  titanium: {
    name: '🔷 Titanium Pickaxe',
    price: 10000000,
    power: 25,
    maxDurability: 650,
    maxDepth: 2500
  },

  meteorite: {
    name: '☄️ Meteorite Pickaxe',
    price: 25000000,
    power: 35,
    maxDurability: 800,
    maxDepth: 5000
  },

  void: {
    name: '🌌 Void Pickaxe',
    price: 75000000,
    power: 50,
    maxDurability: 1000,
    maxDepth: 10000
  },

  celestial: {
    name: '✨ Celestial Pickaxe',
    price: 250000000,
    power: 75,
    maxDurability: 1500,
    maxDepth: 25000
  },

  ancient: {
    name: '🏺 Ancient Pickaxe',
    price: 750000000,
    power: 110,
    maxDurability: 2000,
    maxDepth: 50000
  },

  divine: {
    name: '👑 Divine Pickaxe',
    price: 2500000000,
    power: 175,
    maxDurability: 3000,
    maxDepth: 100000
  },

  transcendent: {
    name: '🌠 Transcendent Pickaxe',
    price: 10000000000,
    power: 300,
    maxDurability: 5000,
    maxDepth: 250000
  }

};

// ==========================================
// 🥤 STAMINA / ENERGY ITEMS
// ==========================================

const staminaItems = {

  snack: {
    name: '🍞 Mining Snack',
    price: 5000,
    stamina: 25
  },

  energy: {
    name: '🥤 Energy Drink',
    price: 15000,
    stamina: 50
  },

  coffee: {
    name: '☕ Miner Coffee',
    price: 25000,
    stamina: 75
  },

  electrolyte: {
    name: '🧃 Electrolyte Drink',
    price: 40000,
    stamina: 100
  },

  potion: {
    name: '🧪 Stamina Potion',
    price: 40000,
    stamina: 100
  },

  super_potion: {
    name: '🧪 Super Stamina Potion',
    price: 100000,
    stamina: 250
  },

  mega_potion: {
    name: '🔮 Mega Stamina Potion',
    price: 250000,
    stamina: 500
  },

  energy_core: {
    name: '⚡ Energy Core',
    price: 750000,
    stamina: 1000
  },

  ancient_elixir: {
    name: '🏺 Ancient Elixir',
    price: 2500000,
    stamina: 2500
  },

  celestial_elixir: {
    name: '✨ Celestial Elixir',
    price: 10000000,
    stamina: 5000
  },

  divine_elixir: {
    name: '👑 Divine Elixir',
    price: 50000000,
    stamina: 10000
  }

};

// ==========================================
// 💎 ORE
// ==========================================

const ores = {

  // =========================
  // COMMON
  // =========================

  stone: {
    name: '🪨 Stone',
    rarity: 'COMMON',
    price: 100,
    minDepth: 0,
    maxDepth: 999999
  },

  coal: {
    name: '⚫ Coal',
    rarity: 'COMMON',
    price: 300,
    minDepth: 0,
    maxDepth: 999999
  },

  granite: {
    name: '🪨 Granite',
    rarity: 'COMMON',
    price: 500,
    minDepth: 5,
    maxDepth: 999999
  },

  limestone: {
    name: '⬜ Limestone',
    rarity: 'COMMON',
    price: 700,
    minDepth: 10,
    maxDepth: 999999
  },

  // =========================
  // UNCOMMON
  // =========================

  copper: {
    name: '🟠 Copper',
    rarity: 'UNCOMMON',
    price: 750,
    minDepth: 15,
    maxDepth: 999999
  },

  iron: {
    name: '⚙️ Iron',
    rarity: 'UNCOMMON',
    price: 1500,
    minDepth: 25,
    maxDepth: 999999
  },

  tin: {
    name: '🔘 Tin',
    rarity: 'UNCOMMON',
    price: 2000,
    minDepth: 30,
    maxDepth: 999999
  },

  zinc: {
    name: '🔩 Zinc',
    rarity: 'UNCOMMON',
    price: 2500,
    minDepth: 40,
    maxDepth: 999999
  },

  nickel: {
    name: '🪙 Nickel',
    rarity: 'UNCOMMON',
    price: 3500,
    minDepth: 50,
    maxDepth: 999999
  },

  // =========================
  // RARE
  // =========================

  silver: {
    name: '🥈 Silver',
    rarity: 'RARE',
    price: 4000,
    minDepth: 60,
    maxDepth: 999999
  },

  gold: {
    name: '🟡 Gold',
    rarity: 'RARE',
    price: 5000,
    minDepth: 75,
    maxDepth: 999999
  },

  emerald: {
    name: '💚 Emerald',
    rarity: 'RARE',
    price: 10000,
    minDepth: 100,
    maxDepth: 999999
  },

  topaz: {
    name: '🟨 Topaz',
    rarity: 'RARE',
    price: 12500,
    minDepth: 125,
    maxDepth: 999999
  },

  aquamarine: {
    name: '🩵 Aquamarine',
    rarity: 'RARE',
    price: 15000,
    minDepth: 150,
    maxDepth: 999999
  },

  // =========================
  // EPIC
  // =========================

  ruby: {
    name: '❤️ Ruby',
    rarity: 'EPIC',
    price: 25000,
    minDepth: 175,
    maxDepth: 999999
  },

  sapphire: {
    name: '💙 Sapphire',
    rarity: 'EPIC',
    price: 40000,
    minDepth: 200,
    maxDepth: 999999
  },

  amethyst: {
    name: '💜 Amethyst',
    rarity: 'EPIC',
    price: 50000,
    minDepth: 250,
    maxDepth: 999999
  },

  opal: {
    name: '🌈 Opal',
    rarity: 'EPIC',
    price: 75000,
    minDepth: 300,
    maxDepth: 999999
  },

  obsidian: {
    name: '🌑 Obsidian',
    rarity: 'EPIC',
    price: 90000,
    minDepth: 400,
    maxDepth: 999999
  },

  // =========================
  // LEGENDARY
  // =========================

  diamond: {
    name: '💎 Diamond',
    rarity: 'LEGENDARY',
    price: 100000,
    minDepth: 500,
    maxDepth: 999999
  },

  platinum: {
    name: '⚪ Platinum',
    rarity: 'LEGENDARY',
    price: 150000,
    minDepth: 750,
    maxDepth: 999999
  },

  meteorite: {
    name: '☄️ Meteorite',
    rarity: 'LEGENDARY',
    price: 250000,
    minDepth: 1000,
    maxDepth: 999999
  },

  black_diamond: {
    name: '🖤 Black Diamond',
    rarity: 'LEGENDARY',
    price: 350000,
    minDepth: 1250,
    maxDepth: 999999
  },

  // =========================
  // MYTHIC
  // =========================

  ancient_crystal: {
    name: '🔮 Ancient Crystal',
    rarity: 'MYTHIC',
    price: 500000,
    minDepth: 1500,
    maxDepth: 999999
  },

  dragonite: {
    name: '🐉 Dragonite',
    rarity: 'MYTHIC',
    price: 750000,
    minDepth: 2500,
    maxDepth: 999999
  },

  phoenix_ore: {
    name: '🔥 Phoenix Ore',
    rarity: 'MYTHIC',
    price: 1000000,
    minDepth: 3500,
    maxDepth: 999999
  },

  soul_crystal: {
    name: '💀 Soul Crystal',
    rarity: 'MYTHIC',
    price: 1500000,
    minDepth: 5000,
    maxDepth: 999999
  },

  // =========================
  // DIVINE
  // =========================

  divine_crystal: {
    name: '👑 Divine Crystal',
    rarity: 'DIVINE',
    price: 3000000,
    minDepth: 7500,
    maxDepth: 999999
  },

  star_ore: {
    name: '⭐ Star Ore',
    rarity: 'DIVINE',
    price: 5000000,
    minDepth: 10000,
    maxDepth: 999999
  },

  godstone: {
    name: '🔱 Godstone',
    rarity: 'DIVINE',
    price: 10000000,
    minDepth: 15000,
    maxDepth: 999999
  },

  // =========================
  // CELESTIAL
  // =========================

  celestial_ore: {
    name: '🌌 Celestial Ore',
    rarity: 'CELESTIAL',
    price: 25000000,
    minDepth: 25000,
    maxDepth: 999999
  },

  stardust_crystal: {
    name: '✨ Stardust Crystal',
    rarity: 'CELESTIAL',
    price: 50000000,
    minDepth: 35000,
    maxDepth: 999999
  },

  nebula_core: {
    name: '🌠 Nebula Core',
    rarity: 'CELESTIAL',
    price: 100000000,
    minDepth: 50000,
    maxDepth: 999999
  },

  // =========================
  // ANCIENT
  // =========================

  ancient_ore: {
    name: '🏺 Ancient Ore',
    rarity: 'ANCIENT',
    price: 250000000,
    minDepth: 75000,
    maxDepth: 999999
  },

  titan_core: {
    name: '🗿 Titan Core',
    rarity: 'ANCIENT',
    price: 500000000,
    minDepth: 100000,
    maxDepth: 999999
  },

  primordial_crystal: {
    name: '💠 Primordial Crystal',
    rarity: 'ANCIENT',
    price: 1000000000,
    minDepth: 150000,
    maxDepth: 999999
  },

  // =========================
  // TRANSCENDENT
  // =========================

  void_crystal: {
    name: '🌌 Void Crystal',
    rarity: 'TRANSCENDENT',
    price: 2500000000,
    minDepth: 200000,
    maxDepth: 999999
  },

  infinity_ore: {
    name: '♾️ Infinity Ore',
    rarity: 'TRANSCENDENT',
    price: 5000000000,
    minDepth: 300000,
    maxDepth: 999999
  },

  reality_shard: {
    name: '🌀 Reality Shard',
    rarity: 'TRANSCENDENT',
    price: 10000000000,
    minDepth: 500000,
    maxDepth: 999999
  }

};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  rarityEmoji,
  pickaxes,
  staminaItems,
  ores
};
