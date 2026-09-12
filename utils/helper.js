// File: utils/helper.js

function getUserData(remoteJid, userId) {
  if (!userId) return { mathScore: 0, triviaScore: 0, score: 0, lastClaim: 0, nickname: '' };

  if (!remoteJid || !remoteJid.endsWith('@g.us')) {
    global.db.users = global.db.users || {};
    if (!global.db.users[userId]) {
      global.db.users[userId] = { mathScore: 0, triviaScore: 0, score: 0, lastClaim: 0, nickname: '' };
    }
    return global.db.users[userId];
  }

  global.db.groups = global.db.groups || {};
  global.db.groups[remoteJid] = global.db.groups[remoteJid] || { users: {} };
  
  if (!global.db.groups[remoteJid].users[userId]) {
    // Cari berdasarkan kecocokan digit angka nomor HP (mengatasi perbedaan format :1@s.whatsapp.net)
    const rawDigits = userId.replace(/[^0-9]/g, '');
    let foundGlobalKey = null;

    for (const k of Object.keys(global.db.users || {})) {
      const kDigits = k.replace(/[^0-9]/g, '');
      if (kDigits === rawDigits || kDigits.endsWith(rawDigits) || rawDigits.endsWith(kDigits)) {
        foundGlobalKey = k;
        break;
      }
    }
    
    if (foundGlobalKey && global.db.users[foundGlobalKey]) {
      const gUser = global.db.users[foundGlobalKey];
      global.db.groups[remoteJid].users[userId] = { 
        mathScore: gUser.mathScore || 0, 
        triviaScore: gUser.triviaScore || 0, 
        score: gUser.score || ((gUser.mathScore || 0) + (gUser.triviaScore || 0)), 
        lastClaim: gUser.lastClaim || 0,
        nickname: gUser.nickname || '' 
      };
    } else {
      global.db.groups[remoteJid].users[userId] = { 
        mathScore: 0, 
        triviaScore: 0, 
        score: 0, 
        lastClaim: 0,
        nickname: '' 
      };
    }
  }
  return global.db.groups[remoteJid].users[userId];
}

function addPoints(remoteJid, userId, type, amount) {
  const user = getUserData(remoteJid, userId);
  if (type === 'math') {
    user.mathScore = (user.mathScore || 0) + amount;
  } else {
    user.triviaScore = (user.triviaScore || 0) + amount;
  }
  user.score = (user.mathScore || 0) + (user.triviaScore || 0);
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

function deductPoints(remoteJid, userId, amount) {
  const user = getUserData(remoteJid, userId);
  let remaining = amount;
  
  if (user.triviaScore && user.triviaScore > 0) {
    const take = Math.min(user.triviaScore, remaining);
    user.triviaScore -= take;
    remaining -= take;
  }
  if (remaining > 0 && user.mathScore && user.mathScore > 0) {
    const take = Math.min(user.mathScore, remaining);
    user.mathScore -= take;
    remaining -= take;
  }
  user.score = (user.mathScore || 0) + (user.triviaScore || 0);
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

function parseBetAmount(args, userTotal) {
  const rawArg = args.find(arg => !arg.includes('@') && (!isNaN(arg) || ['all', 'all-in', 'semua'].includes(arg.toLowerCase())));
  if (!rawArg) return null;
  
  if (['all', 'all-in', 'semua'].includes(rawArg.toLowerCase())) {
    return userTotal;
  }
  
  const parsed = parseInt(rawArg);
  return isNaN(parsed) ? null : parsed;
}

module.exports = { getUserData, addPoints, deductPoints, parseBetAmount };
