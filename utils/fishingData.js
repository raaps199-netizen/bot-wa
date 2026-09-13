// File: utils/fishingData.js

// Fishing Items Database dengan 7 Rarity System (Nama Fantasy Sesuai Request)
const fishingItems = {
  // COMMON - Peluang 45% (Range: 10 - 30 Poin)
  common: [
    { name: '🐟 Anchovy', rarity: 'COMMON', price: 10, weight: '50g' },
    { name: '🐚 Garden Snail', rarity: 'COMMON', price: 15, weight: '30g' },
    { name: '🐟 Herring', rarity: 'COMMON', price: 20, weight: '150g' },
    { name: '🐟 Oil Sardine', rarity: 'COMMON', price: 25, weight: '120g' },
    { name: '🐟 Red Drum', rarity: 'COMMON', price: 30, weight: '200g' }
  ],

  // UNCOMMON - Peluang 28% (Range: 40 - 70 Poin)
  uncommon: [
    { name: '🐠 Piranha', rarity: 'UNCOMMON', price: 40, weight: '300g' },
    { name: '🐟 Gem Anchovy', rarity: 'UNCOMMON', price: 50, weight: '80g' },
    { name: '🐟 Gem Salmon', rarity: 'UNCOMMON', price: 60, weight: '400g' },
    { name: '🦑 Peacock Squid', rarity: 'UNCOMMON', price: 70, weight: '250g' }
  ],

  // RARE - Peluang 13% (Range: 80 - 120 Poin)
  rare: [
    { name: '✨ Bluegem Angelfish', rarity: 'RARE', price: 80, weight: '500g' },
    { name: '✨ Emerald Angelfish', rarity: 'RARE', price: 95, weight: '450g' },
    { name: '✨ Quartzfin Queenfish', rarity: 'RARE', price: 110, weight: '800g' },
    { name: '✨ Bluntnose Sixgill Shark', rarity: 'RARE', price: 120, weight: '15kg' }
  ],

  // EPIC - Peluang 7% (Range: 130 - 160 Poin)
  epic: [
    { name: '💫 Atlantean Sardine', rarity: 'EPIC', price: 130, weight: '1kg' },
    { name: '💫 Abyssal Slickhead', rarity: 'EPIC', price: 145, weight: '3kg' },
    { name: '💫 Cladoselache', rarity: 'EPIC', price: 160, weight: '12kg' }
  ],

  // LEGENDARY - Peluang 4% (Range: 170 - 250 Poin)
  legendary: [
    { name: '👑 Celestial Crab', rarity: 'LEGENDARY', price: 170, weight: '5kg' },
    { name: '👑 Hellfire Haddock', rarity: 'LEGENDARY', price: 200, weight: '8kg' },
    { name: '👑 Greenland Shark', rarity: 'LEGENDARY', price: 250, weight: '100kg' }
  ],

  // MYTHIC - Peluang 2.5% (Range: 300 - 500 Poin)
  mythic: [
    { name: '🔴 Calcified Trilobite', rarity: 'MYTHIC', price: 300, weight: '10kg' },
    { name: '🔴 Petrified Ammonite', rarity: 'MYTHIC', price: 400, weight: '15kg' },
    { name: '🔴 Flamekissed Hawkfish', rarity: 'MYTHIC', price: 500, weight: '20kg' }
  ],

  // DIVINE (GODLY) - Peluang 0.5% (Range: 750 - 1000 Poin)
  divine: [
    { name: '🌟 Aqua Scribe', rarity: 'DIVINE', price: 750, weight: '25kg' },
    { name: '🌟 Celestial Pearl Danio', rarity: 'DIVINE', price: 850, weight: '30kg' },
    { name: '🌟 Poseidon\'s Perch', rarity: 'DIVINE', price: 900, weight: '50kg' },
    { name: '🌟 Neptune\'s Nibbler', rarity: 'DIVINE', price: 1000, weight: '80kg' }
  ]
};

// Color mapping untuk rarity
const rarityColors = {
  'COMMON': '#808080',
  'UNCOMMON': '#00AA00',
  'RARE': '#0055FF',
  'EPIC': '#AA00FF',
  'LEGENDARY': '#FFAA00',
  'MYTHIC': '#FF0000',
  'DIVINE': '#00FFFF'
};

// Emoji mapping untuk rarity
const rarityEmoji = {
  'COMMON': '⚪',
  'UNCOMMON': '🟢',
  'RARE': '🔵',
  'EPIC': '🟣',
  'LEGENDARY': '🟡',
  'MYTHIC': '🔴',
  'DIVINE': '🌟'
};

// Fungsi probabilitas Gacha 7 Kasta
function getRandomCatch() {
  const rand = Math.random() * 100;
  let items, rarity;

  if (rand < 45) {
    items = fishingItems.common;
    rarity = 'COMMON';
  } else if (rand < 73) {
    items = fishingItems.uncommon;
    rarity = 'UNCOMMON';
  } else if (rand < 86) {
    items = fishingItems.rare;
    rarity = 'RARE';
  } else if (rand < 93) {
    items = fishingItems.epic;
    rarity = 'EPIC';
  } else if (rand < 97) {
    items = fishingItems.legendary;
    rarity = 'LEGENDARY';
  } else if (rand < 99.5) {
    items = fishingItems.mythic;
    rarity = 'MYTHIC';
  } else {
    items = fishingItems.divine;
    rarity = 'DIVINE';
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
    
