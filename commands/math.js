const axios = require('axios');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMathProblem(level) {
  let problemStr = '';
  let answer = 0;
  let attempts = 0;

  do {
    attempts++;
    if (level === 'mudah') {
      const a = getRandomInt(5, 30);
      const b = getRandomInt(5, 30);
      const isAdd = Math.random() > 0.5;
      if (isAdd) {
        problemStr = `${a} + ${b}`;
        answer = a + b;
      } else {
        const maxVal = Math.max(a, b);
        const minVal = Math.min(a, b);
        problemStr = `${maxVal} - ${minVal}`;
        answer = maxVal - minVal;
      }
    } else if (level === 'sedang') {
      const type = getRandomInt(1, 3);
      if (type === 1) {
        const a = getRandomInt(3, 10);
        const b = getRandomInt(3, 10);
        const c = getRandomInt(5, 20);
        problemStr = `${a} × ${b} + ${c}`;
        answer = (a * b) + c;
      } else if (type === 2) {
        const a = getRandomInt(20, 60);
        const b = getRandomInt(2, 6);
        const c = getRandomInt(5, 15);
        problemStr = `${a} - ${b} × ${b} + ${c}`;
        answer = a - (b * b) + c;
      } else {
        const a = getRandomInt(12, 40);
        const b = getRandomInt(5, 25);
        const c = getRandomInt(2, 8);
        problemStr = `${a} + ${b} - ${c}`;
        answer = a + b - c;
      }
    } else if (level === 'hard') {
      const pattern = getRandomInt(1, 2);
      if (pattern === 1) {
        const base = getRandomInt(2, 6);
        const addNum = getRandomInt(10, 30);
        problemStr = `${base}² + ${addNum}`;
        answer = Math.pow(base, 2) + addNum;
      } else {
        const a = getRandomInt(3, 9);
        const b = getRandomInt(2, 5);
        const c = getRandomInt(5, 15);
        problemStr = `(${a} + ${b}) × ${c}`;
        answer = (a + b) * c;
      }
    } else if (level === 'extreme') {
      const a = getRandomInt(2, 5);
      const b = getRandomInt(2, 4);
      const c = getRandomInt(10, 25);
      problemStr = `(${a}³ + ${b}²) - ${c}`;
      answer = (Math.pow(a, 3) + Math.pow(b, 2)) - c;
    } else {
      // Max / Extreme Max
      const a = getRandomInt(3, 6);
      const b = getRandomInt(2, 5);
      const c = getRandomInt(15, 35);
      problemStr = `(${a}³ × ${b}) - ${c}`;
      answer = (Math.pow(a, 3) * b) - c;
    }
    if (!isNaN(answer) && Number.isInteger(answer)) break;
  } while (attempts < 10);

  return { problemStr, answer: Math.round(answer) };
}

async function mathCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada kuis yang aktif di chat ini!\nKetik jawabannya atau ketik *.nyerah* untuk menyerah.'
    }, { quoted: msg });
  }

  let levelInput = (args[0] || 'mudah').toLowerCase();
  let levelName = 'MUDAH';
  let timeoutSec = 45;
  let rewardPoints = 15; // Default mudah

  if (['sedang', 'medium'].includes(levelInput)) {
    levelInput = 'sedang';
    levelName = 'MEDIUM';
    timeoutSec = 60;
    rewardPoints = 30;
  } else if (['hard', 'susah'].includes(levelInput)) {
    levelInput = 'hard';
    levelName = 'HARD';
    timeoutSec = 90;
    rewardPoints = 45;
  } else if (['extreme', 'ekstrem'].includes(levelInput)) {
    levelInput = 'extreme';
    levelName = 'EXTREME';
    timeoutSec = 105;
    rewardPoints = 60;
  } else if (['max', 'extreme max'].includes(levelInput)) {
    levelInput = 'max';
    levelName = 'EXTREME MAX 💥';
    timeoutSec = 120;
    rewardPoints = 70;
  } else {
    levelInput = 'mudah';
  }

  const { problemStr, answer } = generateMathProblem(levelInput);

  const caption = 
`🧮 *KUIS MATEMATIKA (${levelName})*
🎁 Hadiah Poin: *+${rewardPoints} Poin*

Berapa hasil dari:
*${problemStr}*

⏱️ Waktu: *${timeoutSec} Detik*

_Ketik langsung angka jawabannya di chat! Ketik .nyerah jika ingin menyerah._`;

  const sentMsg = await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

  const timer = setTimeout(async () => {
    if (global.db.game[remoteJid]) {
      delete global.db.game[remoteJid];
      if (typeof global.saveDatabase === 'function') global.saveDatabase();
      await sock.sendMessage(remoteJid, {
        text: `⏳ *Waktu habis!*\nJawaban yang benar adalah: *${answer}*`
      }, { quoted: sentMsg });
    }
  }, timeoutSec * 1000);

  global.db.game[remoteJid] = {
    type: 'math',
    msgId: sentMsg.key.id,
    soal: problemStr,
    jawabanBenar: answer.toString(),
    reward: rewardPoints, // Menyimpan jumlah poin hadiah di objek game
    timer: timer
  };
}

module.exports = mathCommand;
