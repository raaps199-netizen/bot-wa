// File: utils/fishingData.js

// Fishing Items Database dengan Rarity System (Custom Range)
const fishingItems = {
  // COMMON - Peluang 50% (Range: 10 - 30 Poin)
  common: [
    { name: '🐠 Ikan Mas', rarity: 'COMMON', price: 10, weight: '200g' },
    { name: '🐟 Ikan Nila', rarity: 'COMMON', price: 15, weight: '180g' },
    { name: '🐟 Ikan Gabus', rarity: 'COMMON', price: 20, weight: '150g' },
    { name: '🦐 Udang Biasa', rarity: 'COMMON', price: 25, weight: '50g' },
    { name: '🐚 Kerang Kecil', rarity: 'COMMON', price: 30, weight: '30g' }
  ],

  // UNCOMMON - Peluang 30% (Range: 40 - 70 Poin)
  uncommon: [
    { name: '🎣 Ikan Lele Besar', rarity: 'UNCOMMON', price: 40, weight: '400g' },
    { name: '🐟 Ikan Koi', rarity: 'UNCOMMON', price: 45, weight: '500g' },
    { name: '🦑 Cumi-Cumi', rarity: 'UNCOMMON', price: 50, weight: '300g' },
    { name: '🦐 Udang Jumbo', rarity: 'UNCOMMON', price: 60, weight: '150g' },
    { name: '🐚 Kerang Mutiara', rarity: 'UNCOMMON', price: 70, weight: '80g' }
  ],

  // RARE - Peluang 12% (Range: 80 - 120 Poin)
  rare: [
    { name: '✨ Ikan Bawal Emas', rarity: 'RARE', price: 80, weight: '800g' },
    { name: '✨ Ikan Arwana Merah', rarity: 'RARE', price: 90, weight: '1kg' },
    { name: '✨ Belut Emas', rarity: 'RARE', price: 100, weight: '600g' },
    { name: '✨ Cumi Raksasa', rarity: 'RARE', price: 120, weight: '900g' }
  ],

  // EPIC - Peluang 6% (Range: 130 - 160 Poin)
  epic: [
    { name: '💫 Ikan Paus Kecil', rarity: 'EPIC', price: 130, weight: '5kg' },
    { name: '💫 Ikan Hiu Putih', rarity: 'EPIC', price: 140, weight: '8kg' },
    { name: '💫 Buaya Purba', rarity: 'EPIC', price: 150, weight: '10kg' },
    { name: '💫 Piranha Langka', rarity: 'EPIC', price: 160, weight: '3kg' }
  ],

  // LEGENDARY - Peluang 2% (Range: 170 - 220 Poin)
  legendary: [
    { name: '👑 Naga Laut Mitologi', rarity: 'LEGENDARY', price: 170, weight: '50kg' },
    { name: '👑 Ikan Emas Abadi', rarity: 'LEGENDARY', price: 180, weight: '20kg' },
    { name: '👑 Leviathan Purba', rarity: 'LEGENDARY', price: 200, weight: '100kg' },
    { name: '👑 Ikan Cahaya Malam', rarity: 'LEGENDARY', price: 220, weight: '15kg' }
  ]
};

// Color mapping untuk rarity
const rarityColors = {
  'COMMON': '#808080',
  'UNCOMMON': '#00AA00',
  'RARE': '#0055FF',
  'EPIC': '#AA00FF',
  'LEGENDARY': '#FFAA00'
};

// Emoji mapping untuk rarity
const rarityEmoji = {
  'COMMON': '⚪',
  'UNCOMMON': '🟢',
  'RARE': '🔵',
  'EPIC': '🟣',
  'LEGENDARY': '🟡'
};

// Fungsi untuk mendapatkan item random berdasarkan rarity
function getRandomCatch() {
  const rand = Math.random() * 100;
  let items, rarity;

  if (rand < 50) {
    items = fishingItems.common;
    rarity = 'COMMON';
  } else if (rand < 80) {
    items = fishingItems.uncommon;
    rarity = 'UNCOMMON';
  } else if (rand < 92) {
    items = fishingItems.rare;
    rarity = 'RARE';
  } else if (rand < 98) {
    items = fishingItems.epic;
    rarity = 'EPIC';
  } else {
    items = fishingItems.legendary;
    rarity = 'LEGENDARY';
  }

  const item = items[Math.floor(Math.random() * items.length)];
  return {
    ...item,
    catchTime: new Date().getTime(),
    id: `${rarity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

module.exports = {
  fishingItems,
  rarityColors,
  rarityEmoji,
  getRandomCatch
};
