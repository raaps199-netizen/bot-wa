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
// 🎣 DAFTAR JORAN (RODS) & STATISTIK LUCK
// ==========================================
const rods = {
  'training':  { id: 'training', name: '🪵 Training Rod', luck: 1, timer: 5, price: 0, desc: 'Joran kayu pemula.' },
  'carbon':    { id: 'carbon', name: '🎣 Carbon Rod', luck: 2, timer: 4, price: 1000, desc: 'Serat karbon ringan.' },
  'crystal':   { id: 'crystal', name: '💎 Crystal Rod', luck: 3.5, timer: 3.5, price: 5000, desc: 'Berbalut kristal berkilau.' },
  'fortune':   { id: 'fortune', name: '🍀 Fortune Rod', luck: 6, timer: 3, price: 15000, desc: 'Joran penuh keberuntungan.' },
  'sovereign': { id: 'sovereign', name: '👑 Sovereign Rod', luck: 10, timer: 2.5, price: 40000, desc: 'Joran bangsawan.' },
  'destiny':   { id: 'destiny', name: '🌟 Destiny Rod', luck: 16, timer: 2, price: 100000, desc: 'Joran penjemput takdir.' },
  'trident':   { id: 'trident', name: '🔱 Trident Rod', luck: 24, timer: 1.5, price: 250000, desc: 'Kekuatan penguasa samudera.' },
  'aurora':    { id: 'aurora', name: '🌌 Aurora Cosmic Rod', luck: 35, timer: 1, price: 600000, desc: 'Joran pamungkas cahaya kosmik.' }
};

// ==========================================
// 🧬 DAFTAR MUTASI IKAN & MULTIPLIER HARGA
// ==========================================
const mutations = [
  { name: 'Shiny', prefix: '✨ Shiny', multiplier: 1.5, baseChance: 0.15 },
  { name: 'Gold', prefix: '🪙 Golden', multiplier: 2.0, baseChance: 0.10 },
  { name: 'Albino', prefix: '🥛 Albino', multiplier: 2.5, baseChance: 0.07 },
  { name: 'Translucent', prefix: '🧊 Translucent', multiplier: 3.0, baseChance: 0.04 },
  { name: 'Darkened', prefix: '🌑 Darkened', multiplier: 3.5, baseChance: 0.025 },
  { name: 'Electric', prefix: '⚡ Electric', multiplier: 4.5, baseChance: 0.015 },
  { name: 'Celestial', prefix: '🌟 Celestial', multiplier: 6.0, baseChance: 0.008 },
  { name: 'Abyssal', prefix: '🌀 Abyssal', multiplier: 8.0, baseChance: 0.003 },
  { name: 'Mythical', prefix: '👑 Mythical', multiplier: 12.0, baseChance: 0.001 }
];

// ==========================================
// 🪱 DAFTAR BAIT (UMPAN)
// ==========================================
const baits = {
  'roti':    { id: 'roti', name: '🍞 Umpan Roti', price: 30, desc: 'Umpan dasar.' },
  'cacing':  { id: 'cacing', name: '🪱 Cacing Tanah', price: 100, desc: 'Umpan cacing.' },
  'pelet':   { id: 'pelet', name: '🍘 Pelet Premium', price: 300, desc: 'Pelet berkualitas.' },
  'udang':   { id: 'udang', name: '🦐 Udang Segar', price: 800, desc: 'Udang pilihan.' },
  'legenda': { id: 'legenda', name: '✨ Umpan Legendaris', price: 2000, desc: 'Umpan para master.' }
};

// ==========================================
// 🧪 DAFTAR POTION (LUCK BUFF)
// ==========================================
const potions = {
  'minor': { id: 'minor', name: '🧪 Minor Luck Potion', price: 1000, duration: 3 * 60 * 1000 },
  'major': { id: 'major', name: '🧪 Major Luck Potion', price: 3500, duration: 5 * 60 * 1000 },
  'divine': { id: 'divine', name: '🧪 Divine Luck Potion', price: 15000, duration: 5 * 60 * 1000 }
};

const potionRates = {
  'normal': { c: 45, u: 73, r: 86, e: 93, l: 97, m: 99.5 },
  'minor':  { c: 30, u: 65, r: 82, e: 92, l: 96.5, m: 99.0 },
  'major':  { c: 15, u: 45, r: 70, e: 87, l: 95, m: 98.5 },
  'divine': { c: 0,  u: 20, r: 50, e: 75, l: 90, m: 97.0 }
};

function getRandomCatch(activePotionId = 'normal', userRodId = 'training') {
  let rod = rods[userRodId] || rods['training'];
  let rand = Math.random() * 100;
  
  // 1. Cek Event Aurora Server (Stack dengan Potion & Rod)
  const aurora = global.serverAuroraEvent;
  if (aurora && aurora.active) {
    if (aurora.expiresAt > Date.now()) {
      const boostFactor = 0.45;
      rand = rand + (100 - rand) * boostFactor;
    } else {
      aurora.active = false;
    }
  }

  // 2. Terapkan Stat Luck dari Joran (Rod)
  let luckFactor = Math.max(1, rod.luck);
  rand = rand / Math.pow(luckFactor, 0.35);

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

  const baseItem = items[Math.floor(Math.random() * items.length)];

  // 3. Sistem Roll Mutasi Ikan (Dipengaruhi Luck Joran)
  let chosenMutation = null;
  let mutationBoost = Math.sqrt(rod.luck); // Makin bagus joran, makin tinggi chance mutasi

  // Urutkan dari mutasi terlangka ke umum
  const sortedMutations = [...mutations].sort((a, b) => b.multiplier - a.multiplier);
  for (let mut of sortedMutations) {
    let finalChance = mut.baseChance * mutationBoost;
    if (Math.random() < finalChance) {
      chosenMutation = mut;
      break; // Dapat satu mutasi tertinggi yang tembus roll
    }
  }

  let finalName = baseItem.name;
  let finalPrice = baseItem.price;

  if (chosenMutation) {
    finalName = `${chosenMutation.prefix} ${baseItem.name}`;
    finalPrice = Math.round(baseItem.price * chosenMutation.multiplier);
  }

  return {
    ...baseItem,
    name: finalName,
    price: finalPrice,
    mutation: chosenMutation ? chosenMutation.name : null,
    catchTime: new Date().getTime(),
    id: `${rarity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

module.exports = {
  fishingItems,
  rarityEmoji,
  rods,
  mutations,
  baits,
  potions,
  getRandomCatch
};
      
