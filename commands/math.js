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
      const a = getRandomInt(5, 50);
      const b = getRandomInt(5, 50);
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
      const type = getRandomInt(1, 2);
      if (type === 1) {
        const a = getRandomInt(2, 12);
        const b = getRandomInt(2, 12);
        const c = getRandomInt(1, 20);
        problemStr = `${a} × ${b} + ${c}`;
        answer = (a * b) + c;
      } else {
        const a = getRandomInt(10, 50);
        const b = getRandomInt(2, 10);
        const c = getRandomInt(1, 15);
        problemStr = `${a} + ${b} × ${b} - ${c}`;
        answer = a + (b * b) - c;
      }
    } else if (level === 'hard') {
      const pattern = getRandomInt(1, 3);
      if (pattern === 1) {
        const base = getRandomInt(2, 5);
        const addNum = getRandomInt(10, 40);
        const mult = getRandomInt(2, 6);
        problemStr = `${base}² + (${addNum} - ${mult})`;
        answer = Math.pow(base, 2) + (addNum - mult);
      } else if (pattern === 2) {
        const a = getRandomInt(2, 6);
        const b = getRandomInt(2, 4);
        const c = getRandomInt(5, 20);
        problemStr = `(${a} + ${b})³ - ${c}`;
        answer = Math.pow(a + b, 3) - c;
      } else {
        const a = getRandomInt(16, 81);
        const sqrtVal = Math.sqrt(a);
        const b = getRandomInt(2, 8);
        const c = getRandomInt(3, 10);
        problemStr = `√${a} × ${b} + ${c}`;
        answer = sqrtVal * b + c;
      }
    } else {
      const pattern = getRandomInt(1, 3);
      if (pattern === 1) {
        const a = getRandomInt(2, 5);
        const b = getRandomInt(2, 4);
        const c = getRandomInt(10, 30);
        problemStr = `(${a}³ + ${b}²) × (${c} - 5)`;
        answer = (Math.pow(a, 3) + Math.pow(b, 2)) * (c - 5);
      } else if (pattern === 2) {
        const a = getRandomInt(36, 144);
        const sqrtVal = Math.round(Math.sqrt(a));
        const b = getRandomInt(2, 5);
        const c = getRandomInt(10, 50);
        problemStr = `(√${a} × ${b}³) - ${c}`;
        answer = (sqrtVal * Math.pow(b, 3)) - c;
      } else {
        const a = getRandomInt(2, 4);
        const b = getRandomInt(3, 7);
        const c = getRandomInt(10, 25);
        const d = getRandomInt(2, 5);
        problemStr = `(${a}⁴ + ${b}³) ÷ ${d} + ${c}`;
        answer = (Math.pow(a, 4) + Math.pow(b, 3)) / d + c;
      }
    }
    if (!isNaN(answer) && Number.isInteger(answer)) break;
  } while (attempts < 10);

  return { problemStr, answer: Math.round(answer) };
}

async function mathCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada kuis yang belum selesai di chat ini!'
    }, { quoted: msg });
  }

  let levelInput = (args[0] || 'mudah').toLowerCase();
  let levelName = 'EASY';
  let timeoutSec = 45;

  if (['sedang', 'medium'].includes(levelInput)) {
    levelName = 'MEDIUM';
    timeoutSec = 60;
  } else if (['hard', 'susah'].includes(levelInput)) {
    levelName = 'HARD';
    timeoutSec = 90;
  } else if (['max', 'extreme', 'ekstrem'].includes(levelInput)) {
    levelName = 'EXTREME MAX 💥';
    timeoutSec = 120;
  } else {
    levelInput = 'mudah';
  }

  const { problemStr, answer } = generateMathProblem(levelInput);

  const caption = 
`🧮 *KUIS MATEMATIKA (${levelName})*

Berapa hasil dari:
*${problemStr}*

⏱️ Waktu: *${timeoutSec} Detik*

_Ketik langsung angka jawabannya di chat tanpa prefix apa pun!_`;

  const sentMsg = await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

  const timer = setTimeout(async () => {
    if (global.db.game[remoteJid]) {
      delete global.db.game[remoteJid];
      await sock.sendMessage(remoteJid, {
        text: `⏳ *Waktu habis!*\nJawaban yang benar adalah: *${answer}*`
      }, { quoted: sentMsg });
    }
  }, timeoutSec * 1000);

  global.db.game[remoteJid] = {
    type: 'math',
    msgId: sentMsg.key.id,
    soal: problemStr,
    jawabanOpsi: answer.toString(),
    jawabanTeks: answer.toString(),
    jawabanBenar: answer.toString(),
    timer: timer
  };
}

module.exports = mathCommand;
