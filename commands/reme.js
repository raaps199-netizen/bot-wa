const spinCommand = require('./remeSpin');

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
  if (!global.db.game) global.db.game = {};

  // Cek apakah sedang ada game aktif di chat ini
  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masih ada sesi Reme yang aktif di grup/chat ini! Selesaikan dulu.` }, { quoted: msg });
  }

  const userDb = global.db.users[senderId] || { mathScore: 0, triviaScore: 0, score: 0 };
  const totalScore = (userDb.triviaScore || 0) + (userDb.mathScore || 0) + (userDb.score || 0);

  // Cek apakah user menag seseorang atau main sendiri lawan bot
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  
  // Ambil angka taruhan dari args (filter keluar tag kalau ada)
  const nonTagArgs = args.filter(arg => !arg.includes('@'));
  const betAmount = parseInt(nonTagArgs[0]);

  if (isNaN(betAmount) || betAmount <= 0) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Format salah, bre!\nContoh main lawan bot: *.reme 100*\nContoh tantang orang lain: *.reme @user 100*` 
    }, { quoted: msg });
  }

  if (totalScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `❌ Poin total lu kurang, bre! Poin lu sekarang: *${totalScore}*` }, { quoted: msg });
  }

  // --- KONDISI 1: MAIN SENDIRI LAWAN BOT (.reme <jumlah>) ---
  if (mentioned.length === 0) {
    // Set status game langsung aktif melawan bot ('bot')
    global.db.game[remoteJid] = {
      type: 'reme',
      mode: 'bot',
      player: senderId,
      bet: betAmount
    };

    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    await sock.sendMessage(remoteJid, { 
      text: `🎰 *REME VS BOT*\n\n👤 Pemain: @${senderId.split('@')[0]}\n💰 Taruhan: *${betAmount}* poin\n\n_Bot langsung menerima tantangan! Memutar mesin slot..._`,
      mentions: [senderId]
    }, { quoted: msg });

    // Langsung jalankan spin otomatis detik itu juga tanpa jeda/menunggu
    return await spinCommand(sock, msg);
  }

  // --- KONDISI 2: MAIN LAWAN ORANG LAIN (.reme @user <jumlah>) ---
  const targetId = mentioned[0];
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: `❌ Gak bisa main lawan diri sendiri, bre! Main sendiri lawan bot aja ketik: .reme ${betAmount}` }, { quoted: msg });
  }

  global.db.game[remoteJid] = {
    type: 'reme',
    mode: 'pvp',
    challenger: senderId,
    target: targetId,
    bet: betAmount,
    status: 'pending'
  };

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  await sock.sendMessage(remoteJid, { 
    text: `🎰 *TANTANGAN REME KASINO*\n\n@${targetId.split('@')[0]}, lu ditantang duel Reme sama @${senderId.split('@')[0]} dengan taruhan *${betAmount}* poin!\n\nKetik *${config?.prefix || '.'}terima* untuk menerima atau *${config?.prefix || '.'}tolak* untuk membatalkan.`,
    mentions: [senderId, targetId]
  }, { quoted: msg });
}

module.exports = remeCommand;
