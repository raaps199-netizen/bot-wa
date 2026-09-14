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
  ],
  secret: [
    { name: ' 🌭 The Sausage of Ambatublow', rarity: 'SECRET', price: 5000, weight: '500kg' },
    { name: ' 🌭 The Abyssal Dick', rarity: 'SECRET', price: 7500, weight: '750kg' },
    { name: ' 🐦‍⬛ The Big Black Cock', rarity: 'SECRET', price: 10000, weight: '1200kg' }
  ]
};

const rarityEmoji = {
  'COMMON': '⚪', 'UNCOMMON': '🟢', 'RARE': '🔵', 
  'EPIC': '🟣', 'LEGENDARY': '🟡', 'MYTHIC': '🔴', 'DIVINE': '🌟', 'SECRET': '🔮'
};

// ==========================================
// 🎣 DAFTAR JORAN (RODS) - BALANCE TRADE-OFF
// ==========================================
const rods = {
  'training':  { id: 'training', name: '🪵 Training Rod', luck: 1, timer: 5, mutationBonus: 1.0, price: 0, desc: 'Joran kayu standar.' },
  'carbon':    { id: 'carbon', name: '🎣 Carbon Rod', luck: 1.8, timer: 3.5, mutationBonus: 1.1, price: 1000, desc: 'Fokus kecepatan tinggi, mutasi standar.' },
  'crystal':   { id: 'crystal', name: '💎 Crystal Rod', luck: 3.0, timer: 4.5, mutationBonus: 1.4, price: 5000, desc: 'Hoki lumayan, waktu sedikit lebih lama.' },
  'fortune':   { id: 'fortune', name: '🍀 Fortune Rod', luck: 5.0, timer: 3.0, mutationBonus: 1.6, price: 15000, desc: 'Seimbang antara hoki dan kecepatan.' },
  'sovereign': { id: 'sovereign', name: '👑 Sovereign Rod', luck: 8.5, timer: 6.0, mutationBonus: 2.0, price: 40000, desc: 'Hoki tinggi tapi butuh kesabaran.' },
  'destiny':   { id: 'destiny', name: '🌟 Destiny Rod', luck: 13.0, timer: 4.0, mutationBonus: 2.3, price: 100000, desc: 'Joran takdir pencari ikan besar.' },
  'trident':   { id: 'trident', name: '🔱 Trident Rod', luck: 20.0, timer: 7.0, mutationBonus: 2.8, price: 250000, desc: 'Hoki brutal, tapi timer lumayan lama.' },
  'aurora':    { id: 'aurora', name: '🌌 Aurora Cosmic Rod', luck: 30.0, timer: 5.0, mutationBonus: 3.5, price: 600000, desc: 'Hoki mutlak, penguasa kosmik.' }
};

// ==========================================
// 🧬 DAFTAR MUTASI IKAN & MULTIPLIER HARGA
// ==========================================
const mutations = [
  { name: 'Shiny', prefix: '✨ Shiny', multiplier: 1.5, baseChance: 0.12 },
  { name: 'Gold', prefix: '🪙 Golden', multiplier: 2.0, baseChance: 0.08 },
  { name: 'Albino', prefix: '🥛 Albino', multiplier: 2.5, baseChance: 0.05 },
  { name: 'Translucent', prefix: '🧊 Translucent', multiplier: 3.0, baseChance: 0.03 },
  { name: 'Darkened', prefix: '🌑 Darkened', multiplier: 3.5, baseChance: 0.02 },
  { name: 'Electric', prefix: '⚡ Electric', multiplier: 4.5, baseChance: 0.01 },
  { name: 'Celestial', prefix: '🌟 Celestial', multiplier: 6.0, baseChance: 0.005 },
  { name: 'Abyssal', prefix: '🌀 Abyssal', multiplier: 8.0, baseChance: 0.002 },
  { name: 'Mythical', prefix: '👑 Mythical', multiplier: 12.0, baseChance: 0.0008 }
];

const baits = {
  'roti':    { id: 'roti', name: '🍞 Umpan Roti', price: 10, desc: 'Umpan dasar.' },
  'cacing':  { id: 'cacing', name: '🪱 Cacing Tanah', price: 30, desc: 'Umpan cacing.' },
  'pelet':   { id: 'pelet', name: '🍘 Pelet Premium', price: 50, desc: 'Pelet berkualitas.' },
  'udang':   { id: 'udang', name: '🦐 Udang Segar', price: 100, desc: 'Udang pilihan.' },
  'legenda': { id: 'legenda', name: '✨ Umpan Legendaris', price: 200, desc: 'Umpan para master.' }
};

const potions = {
  'minor': { id: 'minor', name: '🧪 Minor Luck Potion', price: 1000, duration: 3 * 60 * 1000 },
  'major': { id: 'major', name: '🧪 Major Luck Potion', price: 3500, duration: 5 * 60 * 1000 },
  'divine': { id: 'divine', name: '🧪 Divine Luck Potion', price: 15000, duration: 5 * 60 * 1000 }
};

const potionRates = {
  'normal': { c: 45, u: 73, r: 86, e: 93, l: 97, m: 99.5, s: 99.8 },
  'minor':  { c: 30, u: 65, r: 82, e: 92, l: 96.5, m: 99.0, s: 99.5 },
  'major':  { c: 15, u: 45, r: 70, e: 87, l: 95, m: 98.5, s: 99.2 },
  'divine': { c: 0,  u: 20, r: 50, e: 75, l: 90, m: 97.0, s: 98.5 }
};

function getRandomCatch(activePotionId = 'normal', userRodId = 'training') {
  let rod = rods[userRodId] || rods['training'];
  let rand = Math.random() * 100;
  
  // 1. Cek Event Aurora Server
  const aurora = global.serverAuroraEvent;
  if (aurora && aurora.active) {
    if (aurora.expiresAt > Date.now()) {
      const boostFactor = 0.45;
      rand = rand + (100 - rand) * boostFactor;
    } else {
      aurora.active = false;
    }
  }

  // 2. Terapkan Stat Luck dari Joran
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
  else if (rand < rate.s) { items = fishingItems.divine; rarity = 'DIVINE'; }
  else { items = fishingItems.secret; rarity = 'SECRET'; }

  if (items.length === 0) { items = fishingItems.uncommon; rarity = 'UNCOMMON'; }

  const baseItem = items[Math.floor(Math.random() * items.length)];

  // 3. Roll Mutasi dengan Memperhitungkan mutationBonus dari Joran
  let chosenMutation = null;
  let mutationChanceMultiplier = rod.mutationBonus || 1.0;

  const sortedMutations = [...mutations].sort((a, b) => b.multiplier - a.multiplier);
  for (let mut of sortedMutations) {
    let finalChance = mut.baseChance * mutationChanceMultiplier;
    if (Math.random() < finalChance) {
      chosenMutation = mut;
      break;
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
