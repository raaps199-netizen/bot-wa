if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};
if (!global.db.users) global.db.users = {};

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro!' }, { quoted: msg });
  }

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length === 0) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tag player yang mau ditantang!\nContoh: *.reme @user 50*' }, { quoted: msg });
  }

  const targetId = mentioned[0];
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
  }

  // Ambil argumen jumlah taruhan (default 15 poin kalau gak diisi)
  // args biasanya berisi [@user, 50] atau [@user]
  let betAmount = 15;
  const potentialBet = args.find(arg => !arg.includes('@') && !isNaN(arg));
  if (potentialBet) {
    betAmount = parseInt(potentialBet);
    if (betAmount <= 0) betAmount = 15;
  }

  // Cek apakah yang ditang itu bot
  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isTargetBot = targetId.includes(sock.user.id.split(':')[0]);

  // Siapkan database user pengirim kalau belum ada
  if (!global.db.users[senderId]) {
    global.db.users[senderId] = { mathScore: 0, triviaScore: 0 };
  }

  if (isTargetBot) {
    // Lawan Bot: Gratis / Fun aja tanpa taruhan poin
    global.db.game[remoteJid] = {
      type: 'reme',
      players: [senderId, botNumber],
      scores: { [senderId]: 0, [botNumber]: 0 },
      currentTurnIndex: 0,
      round: 1,
      maxRound: 3,
      roundData: {},
      bet: 0 // Lawan bot gak pake taruhan
    };

    const senderName = senderId.split('@')[0];
    await sock.sendMessage(remoteJid, {
      text: `🤖 *Wuih, nantangin bot buat Remenan santai!*\n\nPermainan 3 Ronde dimulai tanpa taruhan.\nSilakan @${senderName} ketik *.spin* buat ronde 1!`,
      mentions: [senderId]
    }, { quoted: msg });
    return;
  }

  // Lawan Manusia: Cek saldo poin kedua player
  if (!global.db.users[targetId]) {
    global.db.users[targetId] = { mathScore: 0, triviaScore: 0 };
  }

  const senderScore = global.db.users[senderId].triviaScore || 0;
  const targetScore = global.db.users[targetId].triviaScore || 0;

  if (senderScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Poin lo kurang, bre! Poin lo saat ini: *${senderScore}*, tapi taruhannya *${betAmount}*.` }, { quoted: msg });
  }

  if (targetScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu poinnya gak cukup buat taruhan *${betAmount}* poin!` }, { quoted: msg });
  }

  // Simpan data tantangan pending beserta nominal taruhannya
  global.db.remeChallenges[remoteJid] = {
    challenger: senderId,
    challenged: targetId,
    bet: betAmount,
    timestamp: Date.now()
  };

  const text = `🎰 *REMEY DUEL TARUHAN POIN* 🎰\n\n@${senderId.split('@')[0]} menantang @${targetId.split('@')[0]} taruhan sebesar *${betAmount}* poin!\n\nKetik *.terima* buat gas main, atau *.tolak* buat kabur.`;

  await sock.sendMessage(remoteJid, {
    text: text,
    mentions: [senderId, targetId]
  }, { quoted: msg });
}

async function terimaCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif di chat ini.' }, { quoted: msg });
  }

  if (challenge.challenged !== senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tantangan ini bukan buat lo!' }, { quoted: msg });
  }

  const { challenger, challenged, bet } = challenge;

  // Potong poin kedua player pas tantangan diterima
  global.db.users[challenger].triviaScore -= bet;
  global.db.users[challenged].triviaScore -= bet;

  delete global.db.remeChallenges[remoteJid];

  global.db.game[remoteJid] = {
    type: 'reme',
    players: [challenger, challenged],
    scores: { [challenger]: 0, [challenged]: 0 },
    currentTurnIndex: 0,
    round: 1,
    maxRound: 3,
    roundData: {},
    bet: bet // Simpan nominal taruhan
  };

  const starterName = challenger.split('@')[0];

  await sock.sendMessage(remoteJid, {
    text: `⚔️ *Tantangan Diterima & Poin Dipotong (${bet} Poin)*!\n\nPermainan Reme 3 Ronde dimulai!\nGiliran pertama melakukan *.spin* adalah: @${starterName}`,
    mentions: [challenger, challenged]
  }, { quoted: msg });
}

async function tolakCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif.' }, { quoted: msg });
  }

  if (challenge.challenged !== senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Bukan hak lo buat nolak tantangan ini!' }, { quoted: msg });
  }

  delete global.db.remeChallenges[remoteJid];
  await sock.sendMessage(remoteJid, { text: `🏳️ Tantangan Reme ditolak. Cupu lu!` }, { quoted: msg });
}

module.exports = { remeCommand, terimaCommand, tolakCommand };
