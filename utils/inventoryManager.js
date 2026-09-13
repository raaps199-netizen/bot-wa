// File: utils/inventoryManager.js
const { addPoints, getTotalScore, getUserData } = require('./helper');

function initializeInventory(userId) {
  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
  if (!global.db.users[userId]) global.db.users[userId] = {};
  
  if (!global.db.users[userId].inventory) global.db.users[userId].inventory = [];
  if (global.db.users[userId].totalFish === undefined) global.db.users[userId].totalFish = 0;
  
  // Storage Bait (Umpan) - Default user punya 5 Umpan Roti gratis
  if (!global.db.users[userId].baits) {
    global.db.users[userId].baits = { roti: 5, cacing: 0, pelet: 0, udang: 0, legenda: 0 };
  }
  // Storage Potion
  if (!global.db.users[userId].potions) {
    global.db.users[userId].potions = { minor: 0, major: 0, divine: 0 };
  }
  // Status Buff Aktif
  if (!global.db.users[userId].activeBuff) {
    global.db.users[userId].activeBuff = { id: null, expiresAt: 0 };
  }
}

// ==========================================
// 🪱 SISTEM BAIT (UMPAN)
// ==========================================
function addBait(userId, baitId, amount) {
  initializeInventory(userId);
  global.db.users[userId].baits[baitId] = (global.db.users[userId].baits[baitId] || 0) + amount;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

function getBaitCount(userId, baitId) {
  initializeInventory(userId);
  return global.db.users[userId].baits[baitId] || 0;
}

function consumeBait(userId, baitId) {
  initializeInventory(userId);
  if (global.db.users[userId].baits[baitId] > 0) {
    global.db.users[userId].baits[baitId] -= 1;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
    return true;
  }
  return false;
}

// ==========================================
// 🧪 SISTEM POTION
// ==========================================
function addPotion(userId, potionId, amount) {
  initializeInventory(userId);
  global.db.users[userId].potions[potionId] = (global.db.users[userId].potions[potionId] || 0) + amount;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

function getPotionCount(userId, potionId) {
  initializeInventory(userId);
  return global.db.users[userId].potions[potionId] || 0;
}

function usePotion(userId, potionId, duration) {
  initializeInventory(userId);
  if (global.db.users[userId].potions[potionId] > 0) {
    global.db.users[userId].potions[potionId] -= 1;
    global.db.users[userId].activeBuff = {
      id: potionId,
      expiresAt: Date.now() + duration
    };
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
    return true;
  }
  return false;
}

function getActiveBuff(userId) {
  initializeInventory(userId);
  const buff = global.db.users[userId].activeBuff;
  if (buff && buff.expiresAt > Date.now()) {
    return buff.id;
  }
  return null;
}

// ==========================================
// 🎣 SISTEM INVENTORY IKAN
// ==========================================
function addItem(userId, item) {
  initializeInventory(userId);
  global.db.users[userId].inventory.push(item);
  if (!global.db.users[userId].bestCatch || item.price > global.db.users[userId].bestCatch.price) {
    global.db.users[userId].bestCatch = item;
  }
  global.db.users[userId].totalFish += 1;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  return item;
}

function getInventory(userId) {
  initializeInventory(userId);
  return global.db.users[userId].inventory;
}

function getInventorySummary(userId) {
  initializeInventory(userId);
  const inventory = global.db.users[userId].inventory;
  const summary = {
    totalItems: inventory.length,
    byRarity: { 'COMMON': 0, 'UNCOMMON': 0, 'RARE': 0, 'EPIC': 0, 'LEGENDARY': 0, 'MYTHIC': 0, 'DIVINE': 0 },
    totalValue: 0
  };
  inventory.forEach(item => {
    if (summary.byRarity[item.rarity] !== undefined) summary.byRarity[item.rarity] += 1;
    summary.totalValue += item.price;
  });
  return summary;
}

function sellItem(userId, itemId) {
  initializeInventory(userId);
  const user = global.db.users[userId];
  const itemIndex = user.inventory.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return { success: false, message: '❌ Item tidak ditemukan!' };
  const item = user.inventory[itemIndex];
  addPoints(global.db, userId, item.price);
  user.inventory.splice(itemIndex, 1);
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  return { success: true, itemName: item.name, priceReceived: item.price, totalPoints: getTotalScore(getUserData(global.db, userId)) };
}

function sellAllItems(userId) {
  initializeInventory(userId);
  const user = global.db.users[userId];
  if (user.inventory.length === 0) return { success: false, message: '❌ Inventory kosong!' };
  let totalPrice = 0;
  user.inventory.forEach(item => totalPrice += item.price);
  addPoints(global.db, userId, totalPrice);
  const itemCount = user.inventory.length;
  user.inventory = [];
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  return { success: true, itemsSold: itemCount, totalEarnings: totalPrice, totalPoints: getTotalScore(getUserData(global.db, userId)) };
}

function getUserStats(userId) {
  initializeInventory(userId);
  const user = global.db.users[userId];
  return {
    totalPoints: getTotalScore(getUserData(global.db, userId)),
    totalFish: user.totalFish || 0,
    inventoryCount: user.inventory.length,
    bestCatch: user.bestCatch || null
  };
}

module.exports = {
  initializeInventory, addBait, getBaitCount, consumeBait,
  addPotion, getPotionCount, usePotion, getActiveBuff,
  addItem, getInventory, getInventorySummary, sellItem, sellAllItems, getUserStats
};
