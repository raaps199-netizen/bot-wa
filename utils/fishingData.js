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
  roti: { name: '🍞 Roti', price: 100, luckBonus: 1 },
  cacing: { name: '🪱 Cacing', price: 250, luckBonus: 1.2 },
  pelet: { name: '🟢 Pelet Super', price: 500, luckBonus: 1.5 },
  udang: { name: '🦐 Udang Segar', price: 1000, luckBonus: 2.0 },
  cumi: { name: '🦑 Cumi Impor', price: 2500, luckBonus: 4.0 }
};

const potions = {
  minor: {
    name: '🧪 Minor Luck Potion',
    price: 5000,
    multiplier: 1.25,
    duration: 15 * 60 * 1000
  },
  major: {
    name: '🧪 Major Luck Potion',
    price: 15000,
    multiplier: 1.5,
    duration: 30 * 60 * 1000
  },
  divine: {
    name: '🧪 Divine Luck Potion',
    price: 40000,
    multiplier: 3.0,
    duration: 60 * 60 * 1000
  }
};

const rods = {
  training: {
    name: '🎣 Training Rod',
    price: 0,
    luck: 1.0,
    timer: 10
  },

  bamboo: {
    name: '🎣 Bamboo Rod',
    price: 2000,
    luck: 1.2,
    timer: 9
  },

  fiber: {
    name: '🎣 Fiberglass Rod',
    price: 5000,
    luck: 1.4,
    timer: 8
  },

  iron: {
    name: '🎣 Iron Reinforced Rod',
    price: 12000,
    luck: 1.6,
    timer: 7
  },

  carbon: {
    name: '🎣 Carbon Rod',
    price: 25000,
    luck: 1.9,
    timer: 6
  },

  magical: {
    name: '🎣 Mystic Wand Rod',
    price: 60000,
    luck: 2.5,
    timer: 5
  },

  crystal: {
    name: '🔱 Destiny Crystal Rod',
    price: 150000,
    luck: 4.0,
    timer: 3
  },

  plasma: {
    name: '⚡ Plasma Core Rod',
    price: 350000,
    luck: 7.0,
    timer: 2
  },

  abyssal: {
    name: '🌊 Abyssal Titan Rod',
    price: 800000,
    luck: 14.0,
    timer: 1
  },

  quantum: {
    name: '🌌 Quantum Singularity Rod',
    price: 2000000,
    luck: 35.0,
    timer: 1
  }
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
    { name: 'Ikan Gurame', price: 45 },
    { name: 'Ikan Bawal', price: 55 },
    { name: 'Ikan Patin', price: 70 },
    { name: 'Ikan Gabus', price: 90 }
  ],

  RARE: [
    { name: 'Ikan Salmon', price: 120 },
    { name: 'Ikan Tuna', price: 250 },
    { name: 'Ikan Kakap Merah', price: 160 },
    { name: 'Ikan Tenggiri', price: 200 }
  ],

  EPIC: [
    { name: 'Ikan Hiu Martil', price: 400 },
    { name: 'Ikan Pari Manta', price: 550 },
    { name: 'Ikan Swordfish', price: 700 },
    { name: 'Ikan Marlin Biru', price: 900 }
  ],

  LEGENDARY: [
    { name: 'Ikan Hiu Putih', price: 1500 },
    { name: 'Ikan Paus Biru', price: 2500 },
    { name: 'Ikan Coelacanth Purba', price: 4000 }
  ],

  MYTHIC: [
    { name: 'Kraken Junior', price: 7500 },
    { name: 'Naga Laut Dalam', price: 12000 },
    { name: 'Leviathan Samudra', price: 18000 }
  ],

  SECRET: [
    { name: 'The Celestial Leviathan', price: 40000 },
    { name: 'The Void Sovereign', price: 75000 },
    { name: 'The Eternal Neptune', price: 120000 }
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
