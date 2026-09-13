// File: utils/inventoryManager.js

// Import fungsi pengelola poin global dari helper.js
const { addPoints, getTotalScore, getUserData } = require('./helper');

/**
 * Initialize user inventory jika belum ada
 */
function initializeInventory(userId) {
  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
  
  if (!global.db.users[userId]) {
    global.db.users[userId] = {};
  }
  
  if (!global.db.users[userId].inventory) {
    global.db.users[userId].inventory = [];
  }
  if (global.db.users[userId].totalFish === undefined) {
    global.db.users[userId].totalFish = 0;
  }
}

/**
 * Add item ke inventory
 */
function addItem(userId, item) {
  initializeInventory(userId);
  
  const userInventory = global.db.users[userId].inventory;
  userInventory.push(item);
  
  // Update best catch jika perlu
  if (!global.db.users[userId].bestCatch || 
      item.price > global.db.users[userId].bestCatch.price) {
    global.db.users[userId].bestCatch = item;
  }
  
  global.db.users[userId].totalFish += 1;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  
  return item;
}

/**
 * Get user inventory
 */
function getInventory(userId) {
  initializeInventory(userId);
  return global.db.users[userId].inventory;
}

/**
 * Get inventory summary
 */
function getInventorySummary(userId) {
  initializeInventory(userId);
  const user = global.db.users[userId];
  const inventory = user.inventory;
  
  const summary = {
    totalItems: inventory.length,
    byRarity: {
      'COMMON': 0,
      'UNCOMMON': 0,
      'RARE': 0,
      'EPIC': 0,
      'LEGENDARY': 0
    },
    totalValue: 0,
    items: inventory.map(item => ({
      name: item.name,
      rarity: item.rarity,
      price: item.price,
      weight: item.weight,
      id: item.id
    }))
  };
  
  inventory.forEach(item => {
    if (summary.byRarity[item.rarity] !== undefined) {
      summary.byRarity[item.rarity] += 1;
    }
    summary.totalValue += item.price;
  });
  
  return summary;
}

/**
 * Sell item by ID dan dapatkan poin global
 */
function sellItem(userId, itemId) {
  initializeInventory(userId);
  
  const user = global.db.users[userId];
  const itemIndex = user.inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return { success: false, message: '❌ Item tidak ditemukan!' };
  }
  
  const item = user.inventory[itemIndex];
  
  // Tambahkan harga jual langsung ke POIN GLOBAL user
  addPoints(global.db, userId, item.price);
  
  // Hapus item dari tas
  user.inventory.splice(itemIndex, 1);
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  
  // Ambil total skor terbaru untuk ditampilkan
  const currentTotal = getTotalScore(getUserData(global.db, userId));
  
  return {
    success: true,
    itemName: item.name,
    priceReceived: item.price,
    totalPoints: currentTotal
  };
}

/**
 * Sell all items dan tambahkan ke poin global
 */
function sellAllItems(userId) {
  initializeInventory(userId);
  
  const user = global.db.users[userId];
  
  if (user.inventory.length === 0) {
    return { success: false, message: '❌ Inventory kosong!' };
  }
  
  let totalPrice = 0;
  user.inventory.forEach(item => {
    totalPrice += item.price;
  });
  
  // Tambahkan total harga jual ke POIN GLOBAL user
  addPoints(global.db, userId, totalPrice);
  
  const itemCount = user.inventory.length;
  user.inventory = []; // Kosongkan tas
  
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  
  // Ambil total skor terbaru untuk ditampilkan
  const currentTotal = getTotalScore(getUserData(global.db, userId));
  
  return {
    success: true,
    itemsSold: itemCount,
    totalEarnings: totalPrice,
    totalPoints: currentTotal
  };
}

/**
 * Remove specific item from inventory
 */
function removeItem(userId, itemId) {
  initializeInventory(userId);
  
  const user = global.db.users[userId];
  const itemIndex = user.inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return false;
  }
  
  user.inventory.splice(itemIndex, 1);
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  return true;
}

/**
 * Get user stats terhubung dengan poin global
 */
function getUserStats(userId) {
  initializeInventory(userId);
  const user = global.db.users[userId];
  
  // Ambil poin global
  const currentTotal = getTotalScore(getUserData(global.db, userId));
  
  return {
    totalPoints: currentTotal,
    totalFish: user.totalFish || 0,
    inventoryCount: user.inventory.length,
    bestCatch: user.bestCatch || null
  };
}

module.exports = {
  initializeInventory,
  addItem,
  getInventory,
  getInventorySummary,
  sellItem,
  sellAllItems,
  removeItem,
  getUserStats
};
