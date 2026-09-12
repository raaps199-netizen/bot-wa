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
    global.db.groups[remoteJid].users[userId] = { 
      mathScore: 0, 
      triviaScore: 0, 
      score: 0, 
      lastClaim: 0,
      nickname: '' 
    };
  }

  const groupUser = global.db.groups[remoteJid].users[userId];
  const currentScore = (groupUser.score || 0) + (groupUser.mathScore || 0) + (groupUser.triviaScore || 0);

  // Jika poin di grup masih 0, sinkronkan/tarik data dari global.db.users
  if (currentScore === 0) {
    global.db.users = global.db.users || {};
    let foundGlobalKey = global.db.users[userId] ? userId : null;

    if (!foundGlobalKey) {
      const rawDigits = userId.replace(/[^0-9]/g, '');
      if (rawDigits.length >= 5) {
        for (const k of Object.keys(global.db.users)) {
          const kDigits = k.replace(/[^0-9]/g, '');
          if (kDigits && (kDigits === rawDigits || kDigits.endsWith(rawDigits) || rawDigits.includes(rawDigits))) {
            foundGlobalKey = k;
            break;
          }
        }
      }
    }

    // Jika masih tidak ketemu dan user pakai @lid, ambil data global pertama yang memiliki poin aktif (> 0)
    if (!foundGlobalKey && userId.includes('@lid')) {
      for (const k of Object.keys(global.db.users)) {
        const u = global.db.users[k];
        if ((u.score || u.mathScore || u.triviaScore || 0) > 0) {
          foundGlobalKey = k;
          break;
        }
      }
    }

    if (foundGlobalKey && global.db.users[foundGlobalKey]) {
      const gUser = global.db.users[foundGlobalKey];
      groupUser.mathScore = gUser.mathScore || 0;
      groupUser.triviaScore = gUser.triviaScore || 0;
      groupUser.score = gUser.score || ((gUser.mathScore || 0) + (gUser.triviaScore || 0));
      groupUser.lastClaim = gUser.lastClaim || 0;
      groupUser.nickname = gUser.nickname || '';
    }
  }

  return groupUser;
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
