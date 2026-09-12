// File: commands/duel.js
const axios = require('axios');

global.db.duel = global.db.duel || {};

// Database soal cadangan lokal (berjalan otomatis jika API luar down/gagal)
const localTriviaFallback = [
  { question: "Ibu kota negara Indonesia adalah...", options: ["Jakarta", "Bandung", "Surabaya", "Medan"], answer: "jakarta", category: "Geografi" },
  { question: "Planet terbesar di dalam tata surya kita adalah...", options: ["Mars", "Jupiter", "Saturnus", "Venus"], answer: "jupiter", category: "Sains" },
  { question: "Siapa penemu bola lampu pijar?", options: ["Thomas Edison", "Nikola Tesla", "Albert Einstein", "Alexander Graham Bell"], answer: "thomas edison", category: "Sejarah" },
  { question: "Hewan mamalia terbesar di bumi adalah...", options: ["Paus Biru", "Gajah Afrika", "Hiu Putih", "Jerapah"], answer: "paus biru", category: "Biologi" },
  { question: "Bahasa pemrograman yang paling identik dengan logo kopi/ular adalah...", options: ["JavaScript", "HTML", "CSS", "SQL"], answer: "javascript", category: "Teknologi" }
];

module.exports = async function duelCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  const subCmd = args[0]?.toLowerCase();
  if (subCmd === 'terima' || subCmd === 'accept') {
    return await handleAcceptDuel(sock, msg);
  } else if (subCmd === 'tolak' || subCmd === 'reject') {
    return await handleRejectDuel(sock, msg);
  }

  const gameType = args[0]?.toLowerCase();
  if (!gameType || !['math', 'matematika', 'trivia', 'kuis'].includes(gameType)) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Pilih jenis game duel yang valid!\n\nContoh Math: *.duel math @user 100 sedang*\nContoh Trivia: *.duel trivia @user 100 mudah*` 
    }, { quoted: msg });
  }

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

  const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
  const taruhan = parseInt(numericArgs[0]);

  if (isNaN(taruhan) || taruhan <= 0) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan nominal taruhan poin yang valid!` }, { quoted: msg });
  }

  if (!global.db.users[senderId]) global.db.users[senderId] = { mathScore: 0, triviaScore: 0, score: 0 };
  const senderTotal = (global.db.users[senderId].mathScore || 0) + (global.db.users[senderId].triviaScore || 0);

  if (senderTotal < taruhan) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Poin lu gak cukup buat pasang taruhan *${taruhan}*!` }, { quoted: msg });
  }

  if (!global.db.users[targetId]) global.db.users[targetId] = { mathScore: 0, triviaScore: 0, score: 0 };
  const targetTotal = (global.db.users[targetId].mathScore || 0) + (global.db.users[targetId].triviaScore || 0);

  if (targetTotal < taruhan) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu (@${targetId.split('@')[0]}) poinnya gak cukup buat bayar taruhan segitu!` }, { quoted: msg });
  }

  const isMath = gameType.startsWith('math');
  let difficulty = 'mudah';
  let category = '';

  if (isMath) {
    difficulty = args.find(arg => ['mudah', 'sedang', 'hard', 'max'].includes(arg.toLowerCase())) || 'mudah';
  } else {
    const cleanArgs = args.filter(arg => !arg.includes('@') && isNaN(arg) && arg.toLowerCase() !== 'trivia' && arg.toLowerCase() !== 'kuis');
    difficulty = cleanArgs.pop()?.toLowerCase() || 'mudah';
    if (!['mudah', 'sedang', 'hard'].includes(difficulty)) {
      cleanArgs.push(difficulty);
      difficulty = 'mudah';
    }
    category = cleanArgs.join(' ').toLowerCase();
  }

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

  if (duel.type === 'math') {
    const qData = generateMathQuestion(duel.difficulty);
    duel.question = qData.question;
    duel.answer = qData.answer;

    await sock.sendMessage(remoteJid, { 
      text: `🔥 *DUEL MATEMATIKA DIMULAI!*\n\nSiapa cepat dia dapat!\n\nBerapa hasil dari: *${duel.question}*\n\n*(Jawab langsung tanpa prefix!)*`,
      mentions: [duel.challenger, duel.target]
    }, { quoted: msg });

  } else {
    let questionText = '';
    let correctAnswer = '';
    let options = [];
    let qCategory = 'General Knowledge';

    try {
      let url = `https://opentdb.com/api.php?amount=1&type=multiple`;
      if (duel.difficulty) {
        const diffMap = { mudah: 'easy', sedang: 'medium', hard: 'hard' };
        url += `&difficulty=${diffMap[duel.difficulty] || 'easy'}`;
      }
      
      const response = await axios.get(url, { timeout: 5000 });
      const data = response.data?.results?.[0];

      if (data) {
        correctAnswer = decodeHtml(data.correct_answer);
        options = [...data.incorrect_answers.map(decodeHtml), correctAnswer].sort(() => Math.random() - 0.5);
        questionText = decodeHtml(data.question);
        qCategory = data.category;
      } else {
        throw new Error('Data kosong dari API');
      }
    } catch (err) {
      // AMBIL DARI CADANGAN LOKAL JIKA API GAGAL
      const fallback = localTriviaFallback[Math.floor(Math.random() * localTriviaFallback.length)];
      correctAnswer = fallback.answer;
      options = [...fallback.options].sort(() => Math.random() - 0.5);
      questionText = fallback.question;
      qCategory = fallback.category;
    }

    duel.question = questionText;
    duel.answer = correctAnswer.toLowerCase();
    duel.options = options;

    let optionText = options.map((opt, i) => `${['A', 'B', 'C', 'D'][i]}. ${opt}`).join('\n');

    await sock.sendMessage(remoteJid, { 
      text: `🔥 *DUEL TRIVIA DIMULAI!*\n\nKategori: *${qCategory}* (${duel.difficulty.toUpperCase()})\n\n*${duel.question}*\n\n${optionText}\n\n*(Balas dengan pilihan huruf A/B/C/D atau jawabannya langsung!)*`,
      mentions: [duel.challenger, duel.target]
    }, { quoted: msg });
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
  
