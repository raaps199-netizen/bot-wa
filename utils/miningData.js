// File: utils/miningData.js

const rarityEmoji = {
  COMMON: '⚪',
  UNCOMMON: '🟢',
  RARE: '🔵',
  EPIC: '🟣',
  LEGENDARY: '🟡',
  MYTHIC: '🔴'
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

  iron: {
    name: '⛏️ Iron Pickaxe',
    price: 100000,
    power: 4,
    maxDurability: 150,
    maxDepth: 100
  },

  diamond: {
    name: '💎 Diamond Pickaxe',
    price: 500000,
    power: 8,
    maxDurability: 250,
    maxDepth: 250
  },

  obsidian: {
    name: '🌑 Obsidian Pickaxe',
    price: 2500000,
    power: 15,
    maxDurability: 400,
    maxDepth: 1000
  }
};

// ==========================================
// 🥤 STAMINA ITEMS
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

  potion: {
    name: '🧪 Stamina Potion',
    price: 40000,
    stamina: 100
  }
};

// ==========================================
// 💎 ORE
// ==========================================

const ores = {
  stone: {
    name: '🪨 Stone',
    rarity: 'COMMON',
    price: 100,
    minDepth: 0,
    maxDepth: 9999
  },

  coal: {
    name: '⚫ Coal',
    rarity: 'COMMON',
    price: 300,
    minDepth: 0,
    maxDepth: 9999
  },

  copper: {
    name: '🟠 Copper',
    rarity: 'UNCOMMON',
    price: 750,
    minDepth: 15,
    maxDepth: 9999
  },

  iron: {
    name: '⚙️ Iron',
    rarity: 'UNCOMMON',
    price: 1500,
    minDepth: 25,
    maxDepth: 9999
  },

  gold: {
    name: '🟡 Gold',
    rarity: 'RARE',
    price: 5000,
    minDepth: 50,
    maxDepth: 9999
  },

  emerald: {
    name: '💚 Emerald',
    rarity: 'RARE',
    price: 10000,
    minDepth: 75,
    maxDepth: 9999
  },

  ruby: {
    name: '❤️ Ruby',
    rarity: 'EPIC',
    price: 25000,
    minDepth: 100,
    maxDepth: 9999
  },

  sapphire: {
    name: '💙 Sapphire',
    rarity: 'EPIC',
    price: 40000,
    minDepth: 125,
    maxDepth: 9999
  },

  diamond: {
    name: '💎 Diamond',
    rarity: 'LEGENDARY',
    price: 100000,
    minDepth: 200,
    maxDepth: 9999
  },

  ancient_crystal: {
    name: '🔮 Ancient Crystal',
    rarity: 'MYTHIC',
    price: 500000,
    minDepth: 500,
    maxDepth: 9999
  }
};

module.exports = {
  rarityEmoji,
  pickaxes,
  staminaItems,
  ores
};
