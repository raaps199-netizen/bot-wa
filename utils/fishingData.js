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
  roti: { name: '🍞 Roti', price: 50000, luckBonus: 1 },
  cacing: { name: '🪱 Cacing', price: 75000, luckBonus: 1.2 },
  pelet: { name: '🟢 Pelet Super', price: 100000, luckBonus: 1.5 },
  udang: { name: '🦐 Udang Segar', price: 125000, luckBonus: 2.0 },
  cumi: { name: '🦑 Cumi Impor', price: 2000000, luckBonus: 4.0 }
};

const potions = {
  minor: { name: '🧪 Minor Luck Potion', price: 200000, multiplier: 1.25, duration: 15 * 60 * 1000 },
  major: { name: '🧪 Major Luck Potion', price: 500000, multiplier: 1.5, duration: 30 * 60 * 1000 },
  divine: { name: '🧪 Divine Luck Potion', price: 1000000, multiplier: 3.0, duration: 60 * 60 * 1000 }
};

// Total 10 Joran: 5 Joran awal (Timer 10-6s) & 5 Joran Sultan (Timer 5-1s)
const rods = {
  training: { name: '🎣 Training Rod', price: 0, luck: 1.0, timer: 10 },
  bamboo: { name: '🎣 Bamboo Rod', price: 10000, luck: 1.2, timer: 9 },
  fiber: { name: '🎣 Fiberglass Rod', price: 35000, luck: 1.4, timer: 8 },
  iron: { name: '🎣 Iron Reinforced Rod', price: 80000, luck: 1.6, timer: 7 },
  carbon: { name: '🎣 Carbon Rod', price: 180000, luck: 1.9, timer: 6 },
  magical: { name: '🎣 Mystic Wand Rod', price: 450000, luck: 2.5, timer: 5 },
  crystal: { name: '🔱 Destiny Crystal Rod', price: 1500000, luck: 4.0, timer: 3 },
  plasma: { name: '⚡ Plasma Core Rod', price: 6000000, luck: 7.0, timer: 2 },
  abyssal: { name: '🌊 Abyssal Titan Rod', price: 25000000, luck: 14.0, timer: 1 },
  quantum: { name: '🌌 Quantum Singularity Rod', price: 100000000, luck: 35.0, timer: 1 }
};

const fishPool = {
  COMMON: [
    { name: 'Ikan Lele', price: 150 },
    { name: 'Ikan Mujair', price: 200 },
    { name: 'Ikan Nila', price: 250 },
    { name: 'Ikan Mas', price: 300 },
    { name: 'Ikan Sepat', price: 100 }
  ],
  UNCOMMON: [
    { name: 'Ikan Gurame', price: 100 },
    { name: 'Ikan Bawal', price: 200 },
    { name: 'Ikan Patin', price: 500 },
    { name: 'Ikan Gabus', price: 700 }
  ],
  RARE: [
    { name: 'Ikan Salmon', price: 400 },
    { name: 'Ikan Tuna', price: 5500 },
    { name: 'Ikan Kakap Merah', price: 700 },
    { name: 'Ikan Tenggiri', price: 900 }
  ],
  EPIC: [
    { name: 'Ikan Hiu Martil', price: 2500 },
    { name: 'Ikan Pari Manta', price: 3500 },
    { name: 'Ikan Swordfish', price: 4500 },
    { name: 'Ikan Marlin Biru', price: 6000 }
  ],
  LEGENDARY: [
    { name: 'Ikan Hiu Putih', price: 15000 },
    { name: 'Ikan Paus Biru', price: 25000 },
    { name: 'Ikan Coelacanth Purba', price: 40000 }
  ],
  MYTHIC: [
    { name: 'Kraken Junior', price: 100000 },
    { name: 'Naga Laut Dalam', price: 175000 },
    { name: 'Leviathan Samudra', price: 250000 }
  ],
  SECRET: [
    { name: 'The Celestial Leviathan', price: 1000000 },
    { name: 'The Void Sovereign', price: 2500000 },
    { name: 'The Eternal Neptune', price: 5000000 }
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

  const rod = rods[rodId] || rods.training;
  totalLuck *= rod.luck;

  if (potionBuff && potions[potionBuff]) {
    totalLuck *= potions[potionBuff].multiplier;
  }

  if (global.serverAuroraEvent && global.serverAuroraEvent.active) {
    const serverLuck = global.serverAuroraEvent.multiplier || 1.0;
    totalLuck *= serverLuck;
  }

  const roll = Math.random() * 100;

  let rarity = 'COMMON';
  
  if (roll < 0.02 * totalLuck) {
    rarity = 'SECRET';
  } else if (roll < 0.5 * totalLuck) {
    rarity = 'MYTHIC';
  } else if (roll < 2.5 * totalLuck) {
    rarity = 'LEGENDARY';
  } else if (roll < 8 * totalLuck) {
    rarity = 'EPIC';
  } else if (roll < 22 * totalLuck) {
    rarity = 'RARE';
  } else if (roll < 50 * totalLuck) {
    rarity = 'UNCOMMON';
  }

  const pool = fishPool[rarity];
  const baseFish = pool[Math.floor(Math.random() * pool.length)];

  let finalPrice = baseFish.price;
  let fishName = baseFish.name;
  let mutationApplied = null;

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
    
