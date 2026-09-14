// File: utils/fishingData.js

const rarityEmoji = {
  COMMON: '⚪',
  UNCOMMON: '🟢',
  RARE: '🔵',
  EPIC: '🟣',
  LEGENDARY: '🟡',
  MYTHIC: '🔴',
  SECRET: '✨'
};

const baits = {
  roti: { name: '🍞 Roti', price: 50, luckBonus: 1 },
  cacing: { name: '🪱 Cacing', price: 150, luckBonus: 1.2 },
  pelet: { name: '🟢 Pelet Super', price: 350, luckBonus: 1.5 },
  udang: { name: '🦐 Udang Segar', price: 750, luckBonus: 2.0 },
  cumi: { name: '🦑 Cumi Impor', price: 1500, luckBonus: 3.0 }
};

const potions = {
  minor: { name: '🧪 Minor Luck Potion', price: 1000, multiplier: 1.25, duration: 15 * 60 * 1000 },
  major: { name: '🧪 Major Luck Potion', price: 2500, multiplier: 1.5, duration: 30 * 60 * 1000 },
  divine: { name: '🧪 Divine Luck Potion', price: 6000, multiplier: 2.0, duration: 60 * 60 * 1000 }
};

const rods = {
  training: { name: '🎣 Training Rod', price: 0, luck: 1.0, timer: 5 },
  fiber: { name: '🎣 Fiberglass Rod', price: 5000, luck: 1.3, timer: 4 },
  carbon: { name: '🎣 Carbon Rod', price: 15000, luck: 1.7, timer: 3 },
  magical: { name: '🎣 Mystic Wand Rod', price: 50000, luck: 2.3, timer: 2 },
  crystal: { name: '🔱 Destiny Crystal Rod', price: 150000, luck: 3.5, timer: 1 }
};

const fishPool = {
  COMMON: [
    { name: 'Ikan Lele', price: 20 },
    { name: 'Ikan Mujair', price: 25 },
    { name: 'Ikan Nila', price: 30 },
    { name: 'Ikan Mas', price: 35 },
    { name: 'Ikan Sepat', price: 15 }
  ],
  UNCOMMON: [
    { name: 'Ikan Gurame', price: 80 },
    { name: 'Ikan Bawal', price: 100 },
    { name: 'Ikan Patin', price: 120 },
    { name: 'Ikan Gabus', price: 150 }
  ],
  RARE: [
    { name: 'Ikan Salmon', price: 400 },
    { name: 'Ikan Tuna', price: 500 },
    { name: 'Ikan Kakap Merah', price: 650 },
    { name: 'Ikan Tenggiri', price: 800 }
  ],
  EPIC: [
    { name: 'Ikan Hiu Martil', price: 2000 },
    { name: 'Ikan Pari Manta', price: 2500 },
    { name: 'Ikan Swordfish', price: 3200 },
    { name: 'Ikan Marlin Biru', price: 4000 }
  ],
  LEGENDARY: [
    { name: 'Ikan Hiu Putih', price: 10000 },
    { name: 'Ikan Paus Biru', price: 15000 },
    { name: 'Ikan Coelacanth Purba', price: 22000 }
  ],
  MYTHIC: [
    { name: 'Kraken Junior', price: 50000 },
    { name: 'Naga Laut Dalam', price: 75000 },
    { name: 'Leviathan Samudra', price: 100000 }
  ],
  SECRET: [
    { name: 'The Celestial Leviathan', price: 250000 },
    { name: 'The Void Sovereign', price: 500000 },
    { name: 'The Eternal Neptune', price: 1000000 }
  ]
};

const mutations = [
  { prefix: 'Golden', multiplier: 2.0 },
  { prefix: 'Shiny', multiplier: 1.5 },
  { prefix: 'Shadow', multiplier: 2.5 },
  { prefix: 'Rainbow', multiplier: 3.0 }
];

function getRandomCatch(potionBuff = 'normal', rodId = 'training') {
  let totalLuck = 1.0;

  // 1. Rod Multiplier
  const rod = rods[rodId] || rods.training;
  totalLuck *= rod.luck;

  // 2. Potion Multiplier
  if (potionBuff && potions[potionBuff]) {
    totalLuck *= potions[potionBuff].multiplier;
  }

  // 3. Server Luck Multiplier (Diatur via .setluck)
  if (global.serverAuroraEvent && global.serverAuroraEvent.active) {
    const serverLuck = global.serverAuroraEvent.multiplier || 1.0;
    totalLuck *= serverLuck;
  }

  const roll = Math.random() * 100;

  let rarity = 'COMMON';
  if (roll < 0.5 * (totalLuck / 1.5)) {
    rarity = 'SECRET';
  } else if (roll < 2 * (totalLuck / 1.2)) {
    rarity = 'MYTHIC';
  } else if (roll < 6 * (totalLuck / 1.1)) {
    rarity = 'LEGENDARY';
  } else if (roll < 15 * totalLuck) {
    rarity = 'EPIC';
  } else if (roll < 35 * totalLuck) {
    rarity = 'RARE';
  } else if (roll < 65 * totalLuck) {
    rarity = 'UNCOMMON';
  }

  const pool = fishPool[rarity];
  const baseFish = pool[Math.floor(Math.random() * pool.length)];

  let finalPrice = baseFish.price;
  let fishName = baseFish.name;
  let mutationApplied = null;

  // 15% peluang kena Mutasi
  if (Math.random() < 0.15) {
    const mutation = mutations[Math.floor(Math.random() * mutations.length)];
    fishName = `${mutation.prefix} ${baseFish.name}`;
    finalPrice = Math.floor(baseFish.price * mutation.multiplier);
    mutationApplied = mutation.prefix;
  }

  return {
    id: `fish_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: fishName,
    rarity: rarity,
    price: finalPrice,
    mutation: mutationApplied,
    isFavorite: false
  };
}

module.exports = {
  rarityEmoji,
  baits,
  potions,
  rods,
  fishPool,
  getRandomCatch
};
