// Fishing Items Database dengan Rarity System
const fishingItems = {
  // COMMON - Peluang 50%
  common: [
    { name: '🐠 Ikan Mas', rarity: 'COMMON', price: 50, weight: '200g' },
    { name: '🐟 Ikan Nila', rarity: 'COMMON', price: 60, weight: '180g' },
    { name: '🐟 Ikan Gabus', rarity: 'COMMON', price: 55, weight: '150g' },
    { name: '🦐 Udang Biasa', rarity: 'COMMON', price: 45, weight: '50g' },
    { name: '🐚 Kerang Kecil', rarity: 'COMMON', price: 40, weight: '30g' }
  ],

  // UNCOMMON - Peluang 30%
  uncommon: [
    { name: '🎣 Ikan Lele Besar', rarity: 'UNCOMMON', price: 150, weight: '400g' },
    { name: '🐟 Ikan Koi', rarity: 'UNCOMMON', price: 200, weight: '500g' },
    { name: '🦑 Cumi-Cumi', rarity: 'UNCOMMON', price: 180, weight: '300g' },
    { name: '🦐 Udang Jumbo', rarity: 'UNCOMMON', price: 160, weight: '150g' },
    { name: '🐚 Kerang Mutiara', rarity: 'UNCOMMON', price: 140, weight: '80g' }
  ],

  // RARE - Peluang 12%
  rare: [
    { name: '✨ Ikan Bawal Emas', rarity: 'RARE', price: 500, weight: '800g' },
    { name: '✨ Ikan Arwana Merah', rarity: 'RARE', price: 600, weight: '1kg' },
    { name: '✨ Belut Emas', rarity: 'RARE', price: 450, weight: '600g' },
    { name: '✨ Cumi Raksasa', rarity: 'RARE', price: 550, weight: '900g' }
  ],

  // EPIC - Peluang 6%
  epic: [
    { name: '💫 Ikan Paus Kecil', rarity: 'EPIC', price: 1500, weight: '5kg' },
    { name: '💫 Ikan Hiu Putih', rarity: 'EPIC', price: 2000, weight: '8kg' },
    { name: '💫 Buaya Purba', rarity: 'EPIC', price: 1800, weight: '10kg' },
    { name: '💫 Piranha Langka', rarity: 'EPIC', price: 1600, weight: '3kg' }
  ],

  // LEGENDARY - Peluang 2%
  legendary: [
    { name: '👑 Naga Laut Mitologi', rarity: 'LEGENDARY', price: 5000, weight: '50kg' },
    { name: '👑 Ikan Emas Abadi', rarity: 'LEGENDARY', price: 7000, weight: '20kg' },
    { name: '👑 Leviathan Purba', rarity: 'LEGENDARY', price: 8000, weight: '100kg' },
    { name: '👑 Ikan Cahaya Malam', rarity: 'LEGENDARY', price: 6000, weight: '15kg' }
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
