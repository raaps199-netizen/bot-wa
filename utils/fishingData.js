// File: utils/fishingData.js

const fishingItems = {
  common: [
    { name: '🐟 Anchovy', rarity: 'COMMON', price: 10, weight: '50g' },
    { name: '🐚 Garden Snail', rarity: 'COMMON', price: 15, weight: '30g' },
    { name: '🐟 Herring', rarity: 'COMMON', price: 20, weight: '150g' },
    { name: '🐟 Oil Sardine', rarity: 'COMMON', price: 25, weight: '120g' },
    { name: '🐟 Red Drum', rarity: 'COMMON', price: 30, weight: '200g' }
  ],
  uncommon: [
    { name: '🐠 Piranha', rarity: 'UNCOMMON', price: 40, weight: '300g' },
    { name: '🐟 Gem Anchovy', rarity: 'UNCOMMON', price: 50, weight: '80g' },
    { name: '🐟 Gem Salmon', rarity: 'UNCOMMON', price: 60, weight: '400g' },
    { name: '🦑 Peacock Squid', rarity: 'UNCOMMON', price: 70, weight: '250g' }
  ],
  rare: [
    { name: '✨ Bluegem Angelfish', rarity: 'RARE', price: 80, weight: '500g' },
    { name: '✨ Emerald Angelfish', rarity: 'RARE', price: 95, weight: '450g' },
    { name: '✨ Quartzfin Queenfish', rarity: 'RARE', price: 110, weight: '800g' },
    { name: '✨ Bluntnose Sixgill Shark', rarity: 'RARE', price: 120, weight: '15kg' }
  ],
  epic: [
    { name: '💫 Atlantean Sardine', rarity: 'EPIC', price: 130, weight: '1kg' },
    { name: '💫 Abyssal Slickhead', rarity: 'EPIC', price: 145, weight: '3kg' },
    { name: '💫 Cladoselache', rarity: 'EPIC', price: 160, weight: '12kg' }
  ],
  legendary: [
    { name: '👑 Celestial Crab', rarity: 'LEGENDARY', price: 170, weight: '5kg' },
    { name: '👑 Hellfire Haddock', rarity: 'LEGENDARY', price: 200, weight: '8kg' },
    { name: '👑 Greenland Shark', rarity: 'LEGENDARY', price: 250, weight: '100kg' }
  ],
  mythic: [
    { name: '🔴 Calcified Trilobite', rarity: 'MYTHIC', price: 300, weight: '10kg' },
    { name: '🔴 Petrified Ammonite', rarity: 'MYTHIC', price: 400, weight: '15kg' },
    { name: '🔴 Flamekissed Hawkfish', rarity: 'MYTHIC', price: 500, weight: '20kg' }
  ],
  divine: [
    { name: '🌟 Aqua Scribe', rarity: 'DIVINE', price: 750, weight: '25kg' },
    { name: '🌟 Celestial Pearl Danio', rarity: 'DIVINE', price: 850, weight: '30kg' },
    { name: '🌟 Poseidon\'s Perch', rarity: 'DIVINE', price: 900, weight: '50kg' },
    { name: '🌟 Neptune\'s Nibbler', rarity: 'DIVINE', price: 1000, weight: '80kg' }
  ]
};

const rarityEmoji = {
  'COMMON': '⚪', 'UNCOMMON': '🟢', 'RARE': '🔵', 
  'EPIC': '🟣', 'LEGENDARY': '🟡', 'MYTHIC': '🔴', 'DIVINE': '🌟'
};

// ==========================================
// 🎣 DAFTAR BAIT (PENGURANG TIMER / KECEPATAN)
// ==========================================
const baits = {
  'roti':    { id: 'roti', name: '🍞 Umpan Roti', price: 30, timer: 5, desc: 'Umpan dasar. Kecepatan: 5 Detik.' },
  'cacing':  { id: 'cacing', name: '🪱 Cacing Tanah', price: 100, timer: 4, desc: 'Kecepatan mancing naik: 4 Detik.' },
  'pelet':   { id: 'pelet', name: '🍘 Pelet Premium', price: 300, timer: 3, desc: 'Kecepatan mancing naik: 3 Detik.' },
  'udang':   { id: 'udang', name: '🦐 Udang Segar', price: 800, timer: 2, desc: 'Mancing super ngebut: 2 Detik.' },
  'legenda': { id: 'legenda', name: '✨ Umpan Legendaris', price: 2000, timer: 1, desc: 'Kecepatan kilat maksimal: 1 Detik!' }
};

// ==========================================
// 🧪 DAFTAR POTION (LUCK BUFF)
// ==========================================
const potions = {
  'minor': { id: 'minor', name: '🧪 Minor Luck Potion', price: 1000, duration: 3 * 60 * 1000, desc: 'Durasi 3 Menit. Sedikit menaikkan peluang ikan langka.' },
  'major': { id: 'major', name: '🧪 Major Luck Potion', price: 3500, duration: 5 * 60 * 1000, desc: 'Durasi 5 Menit. Peluang Epic & Legendary meningkat drastis.' },
  'divine': { id: 'divine', name: '🧪 Divine Luck Potion', price: 15000, duration: 5 * 60 * 1000, desc: 'Durasi 5 Menit. 0% Common! Peluang Mythic & Divine sangat besar.' }
};

const potionRates = {
  'normal': { c: 45, u: 73, r: 86, e: 93, l: 97, m: 99.5 },
  'minor':  { c: 30, u: 65, r: 82, e: 92, l: 96.5, m: 99.0 },
  'major':  { c: 15, u: 45, r: 70, e: 87, l: 95, m: 98.5 },
  'divine': { c: 0,  u: 20, r: 50, e: 75, l: 90, m: 97.0 }
};

function getRandomCatch(activePotionId = 'normal') {
  const rand = Math.random() * 100;
  const rate = potionRates[activePotionId] || potionRates['normal'];
  let items, rarity;

  if (rand < rate.c) { items = fishingItems.common; rarity = 'COMMON'; }
  else if (rand < rate.u) { items = fishingItems.uncommon; rarity = 'UNCOMMON'; }
  else if (rand < rate.r) { items = fishingItems.rare; rarity = 'RARE'; }
  else if (rand < rate.e) { items = fishingItems.epic; rarity = 'EPIC'; }
  else if (rand < rate.l) { items = fishingItems.legendary; rarity = 'LEGENDARY'; }
  else if (rand < rate.m) { items = fishingItems.mythic; rarity = 'MYTHIC'; }
  else { items = fishingItems.divine; rarity = 'DIVINE'; }

  if (items.length === 0) { items = fishingItems.uncommon; rarity = 'UNCOMMON'; }

  const item = items[Math.floor(Math.random() * items.length)];
  return {
    ...item,
    catchTime: new Date().getTime(),
    id: `${rarity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

module.exports = {
  fishingItems,
  rarityEmoji,
  baits,
  potions,
  getRandomCatch
};
