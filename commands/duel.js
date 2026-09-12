// File: commands/duel.js
const axios = require('axios');

// Storage sementara untuk duel yang pending atau aktif
global.db.duel = global.db.duel || {};

module.exports = async function duelCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  // Sub-command handler untuk terima/tolak duel
  const subCmd = args[0]?.toLowerCase();
  if (subCmd === 'terima' || subCmd === 'accept') {
    return await handleAcceptDuel(sock, msg);
  } else if (subCmd === 'tolak' || subCmd === 'reject') {
    return await handleRejectDuel(sock, msg);
  }

  // Format utama: .duel <math|trivia> @user <taruhan> [args...]
  const gameType = args[0]?.toLowerCase();
  if (!gameType || !['math', 'matematika', 'trivia', 'kuis'].includes(gameType)) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Pilih jenis game duel yang valid!\n\nContoh Math: *.duel math @user 100 sedang*\nContoh Trivia: *.duel trivia @user 100 sejarah mudah*` 
    }, { quoted: msg });
  }

  // Ambil Target (@user)
  let targetId = null;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (mentioned.length > 0) {
    targetId = mentioned[0];
  } else if (quotedParticipant) {
    targetId = quotedParticipant;
  }

  if (!targetId || targetId === senderId || targetId === sock.user.id) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Tag teman yang bener buat diajak duel, bre!` }, { quoted: msg });
  }

  // Ambil Nominal Taruhan
  const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
  const taruhan = parseInt(numericArgs[0]);

  if (isNaN(taruhan) || taruhan <= 0) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan nominal taruhan poin yang valid!` }, { quoted: msg });
  }

  // Cek Saldo Poin Challenger
  if (!global.db.users[senderId]) global.db.users[senderId] = { mathScore: 0, triviaScore: 0, score: 0 };
  const senderTotal = (global.db.users[senderId].mathScore || 0) + (global.db.users[senderId].triviaScore || 0);

  if (senderTotal < taruhan) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Poin lu gak cukup buat pasang taruhan *${taruhan}*!` }, { quoted: msg });
  }

  // Cek Saldo Poin Target
  if (!global.db.users[targetId]) global.db.users[targetId] = { mathScore: 0, triviaScore: 0, score: 0 };
  const targetTotal = (global.db.users[targetId].mathScore || 0) + (global.db.users[targetId].triviaScore || 0);

  if (targetTotal < taruhan) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu (@${targetId.split('@')[0]}) poinnya gak cukup buat bayar taruhan segitu!` }, { quoted: msg });
  }

  // Parsing sisa argumen untuk Diff / Kategori
  // Math: .duel math @user 100 [mudah/sedang/hard/max]
  // Trivia: .duel trivia @user 100 [kategori] [mudah/sedang/hard]
  const isMath = gameType.startsWith('math');
  let difficulty = 'mudah';
  let category = '';

  if (isMath) {
    difficulty = args.find(arg => ['mudah', 'sedang', 'hard', 'max'].includes(arg.toLowerCase())) || 'mudah';
  } else {
    // Trivia args filtering
    const cleanArgs = args.filter(arg => !arg.includes('@') && isNaN(arg) && arg.toLowerCase() !== 'trivia' && arg.toLowerCase() !== 'kuis');
    difficulty = cleanArgs.pop()?.toLowerCase() || 'mudah';
    if (!['mudah', 'sedang', 'hard'].includes(difficulty)) {
      cleanArgs.push(difficulty);
      difficulty = 'mudah';
    }
    category = cleanArgs.join(' ').toLowerCase();
  }

  // Simpan Sesi Challenge
  global.db.duel[remoteJid] = {
    challenger: senderId,
    target: targetId,
    type: isMath ? 'math' : 'trivia',
    taruhan,
    difficulty,
    category,
    status: 'pending',
    timestamp: Date.now()
  };

  const modeText = isMath ? `Math (${difficulty.toUpperCase()})` : `Trivia [${category || 'Random'} - ${difficulty.toUpperCase()}]`;

  await sock.sendMessage(remoteJid, { 
    text: `⚔️ *TANTANGAN DUEL 1V1!*\n\n@${targetId.split('@')[0]}, lu ditantang duel *${modeText}* oleh @${senderId.split('@')[0]} dengan taruhan *${taruhan} Poin*!\n\nKetik *.duel terima* untuk menerima atau *.duel tolak* untuk kabur.`,
    mentions: [senderId, targetId]
  }, { quoted: msg });
};

async function handleAcceptDuel(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const duel = global.db.duel[remoteJid];

  if (!duel || duel.status !== 'pending') {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Tidak ada tantangan duel yang aktif di chat ini.` }, { quoted: msg });
  }

  if (duel.target !== senderId) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Bukan lu yang ditantang, gak usah sok asik ikut-ikutan!` }, { quoted: msg });
  }

  duel.status = 'active';

  // Generate Soal Berdasarkan Tipe
  if (duel.type === 'math') {
    const qData = generateMathQuestion(duel.difficulty);
    duel.question = qData.question;
    duel.answer = qData.answer;

    await sock.sendMessage(remoteJid, { 
      text: `🔥 *DUEL MATEMATIKA DIMULAI!*\n\nSiapa cepat dia dapat!\n\nBerapa hasil dari: *${duel.question}*\n\n*(Jawab langsung tanpa prefix!)*`,
      mentions: [duel.challenger, duel.target]
    }, { quoted: msg });

  } else {
    // Fetch Trivia Question
    try {
      let url = `https://opentdb.com/api.php?amount=1&type=multiple`;
      if (duel.difficulty) {
        const diffMap = { mudah: 'easy', sedang: 'medium', hard: 'hard' };
        url += `&difficulty=${diffMap[duel.difficulty] || 'easy'}`;
      }
      
      const res = await axios.get(url);
      const data = res.data.results[0];
      if (!data) throw new Error('Gagal ambil soal trivia');

      const correctAnswer = decodeHtml(data.correct_answer);
      const options = [...data.incorrect_answers.map(decodeHtml), correctAnswer].sort(() => Math.random() - 0.5);
      
      duel.question = decodeHtml(data.question);
      duel.answer = correctAnswer.toLowerCase();
      duel.options = options;

      let optionText = options.map((opt, i) => `${['A', 'B', 'C', 'D'][i]}. ${opt}`).join('\n');

      await sock.sendMessage(remoteJid, { 
        text: `🔥 *DUEL TRIVIA DIMULAI!*\n\nKategori: *${data.category}* (${duel.difficulty.toUpperCase()})\n\n*${duel.question}*\n\n${optionText}\n\n*(Balas dengan pilihan huruf A/B/C/D atau jawabannya langsung!)*`,
        mentions: [duel.challenger, duel.target]
      }, { quoted: msg });

    } catch (err) {
      delete global.db.duel[remoteJid];
      await sock.sendMessage(remoteJid, { text: `❌ Gagal mengambil soal Trivia, sesi duel dibatalkan.` }, { quoted: msg });
    }
  }
}

async function handleRejectDuel(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const duel = global.db.duel[remoteJid];

  if (!duel || duel.status !== 'pending') return;
  if (duel.target !== senderId) return;

  delete global.db.duel[remoteJid];
  await sock.sendMessage(remoteJid, { text: `🏳️ Duel ditolak. Cupu lu wkwk!` }, { quoted: msg });
}

// Fungsi bantu jawab duel (dipanggil dari gameHandler / messageHandler)
async function handleDuelAnswer(sock, msg, userAnswer) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const duel = global.db.duel?.[remoteJid];

  if (!duel || duel.status !== 'active') return false;
  if (senderId !== duel.challenger && senderId !== duel.target) return false;

  const cleanAns = userAnswer.trim().toLowerCase();
  let isCorrect = false;

  if (duel.type === 'math') {
    isCorrect = cleanAns === String(duel.answer);
  } else {
    // Cek jawaban trivia (bisa teks langsung atau opsi A/B/C/D)
    const optIndex = ['a', 'b', 'c', 'd'].indexOf(cleanAns);
    if (optIndex !== -1 && duel.options[optIndex]) {
      isCorrect = duel.options[optIndex].toLowerCase() === duel.answer;
    } else {
      isCorrect = cleanAns === duel.answer;
    }
  }

  if (isCorrect) {
    const winnerId = senderId;
    const loserId = (winnerId === duel.challenger) ? duel.target : duel.challenger;
    const taruhan = duel.taruhan;

    // Potong Poin Loser & Tambah Poin Winner
    deductPoints(loserId, taruhan);
    addPoints(winnerId, taruhan);

    delete global.db.duel[remoteJid];
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    await sock.sendMessage(remoteJid, { 
      text: `🎉 *DUEL SELESAI!*\n\nPemenang: @${winnerId.split('@')[0]} berhasil menjawab dengan benar!\n\n💰 Hadiah +${taruhan} Poin berhasil dirampas dari @${loserId.split('@')[0]}.`,
      mentions: [winnerId, loserId]
    }, { quoted: msg });

    return true;
  }

  return false;
}

function generateMathQuestion(diff) {
  let num1, num2, operator, answer;
  const ops = ['+', '-', '*'];
  operator = ops[Math.floor(Math.random() * ops.length)];

  if (diff === 'mudah') {
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
  } else if (diff === 'sedang') {
    num1 = Math.floor(Math.random() * 50) + 10;
    num2 = Math.floor(Math.random() * 50) + 10;
  } else {
    num1 = Math.floor(Math.random() * 100) + 20;
    num2 = Math.floor(Math.random() * 100) + 20;
  }

  if (operator === '+') answer = num1 + num2;
  else if (operator === '-') answer = num1 - num2;
  else answer = num1 * num2;

  return { question: `${num1} ${operator} ${num2}`, answer };
}

function addPoints(userId, amount) {
  const user = global.db.users[userId];
  user.triviaScore = (user.triviaScore || 0) + amount;
  user.score = (user.mathScore || 0) + (user.triviaScore || 0);
}

function deductPoints(userId, amount) {
  const user = global.db.users[userId];
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
}

function decodeHtml(html) {
  return html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&eacute;/g, 'é');
}

module.exports.duelCommand = duelCommand;
module.exports.handleDuelAnswer = handleDuelAnswer;

