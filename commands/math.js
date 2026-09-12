// File: commands/math.js

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMathProblem(level) {
  let num1, num2, num3, operator, expression, answer, reward;

  switch (level) {
    case 'sedang':
    case 'medium':
      num1 = getRandomInt(10, 50);
      num2 = getRandomInt(10, 50);
      operator = ['+', '-', '*'][getRandomInt(0, 2)];
      if (operator === '*') {
        num1 = getRandomInt(5, 15);
        num2 = getRandomInt(5, 15);
      }
      expression = `${num1} ${operator} ${num2}`;
      answer = eval(expression);
      reward = 25;
      break;

    case 'hard':
    case 'sulit':
    case 'susah':
      num1 = getRandomInt(20, 100);
      num2 = getRandomInt(10, 50);
      num3 = getRandomInt(5, 20);
      operator = ['+', '-', '*'][getRandomInt(0, 2)];
      expression = `${num1} ${operator} ${num2} + ${num3}`;
      answer = eval(expression);
      reward = 50;
      break;

    case 'extreme':
      num1 = getRandomInt(50, 200);
      num2 = getRandomInt(10, 30);
      num3 = getRandomInt(2, 10);
      expression = `${num1} + ${num2} * ${num3}`;
      answer = eval(expression);
      reward = 100;
      break;

    case 'max':
      num1 = getRandomInt(100, 500);
      num2 = getRandomInt(20, 50);
      num3 = getRandomInt(10, 30);
      expression = `(${num1} + ${num2}) * ${num3}`;
      answer = eval(expression);
      reward = 200;
      break;

    case 'mudah':
    default:
      num1 = getRandomInt(1, 20);
      num2 = getRandomInt(1, 20);
      operator = ['+', '-'][getRandomInt(0, 1)];
      expression = `${num1} ${operator} ${num2}`;
      answer = eval(expression);
      reward = 10;
      break;
  }

  return { expression, answer: String(answer), reward, level: level || 'mudah' };
}

async function mathCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  // Validasi ketat pengecekan game aktif
  if (global.db.game && global.db.game[remoteJid] && global.db.game[remoteJid].type) {
    await sock.sendMessage(remoteJid, {
      text: '⚠️ Eh, selesaikan dulu game yang lagi aktif di chat ini!'
    }, { quoted: msg });
    return;
  }

  const levelInput = (args[0] || 'mudah').toLowerCase().trim();
  const mathData = generateMathProblem(levelInput);
  const timeoutSec = 60;

  const caption = 
`🧮 *MATEMATIKA (${mathData.level.toUpperCase()})*
🎁 Hadiah Poin: *+${mathData.reward} Poin*

Soal: *${mathData.expression} = ?*

⏱️ Waktu: *${timeoutSec} Detik*

_Ketik angka jawaban kamu!_`;

  const sentMsg = await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

  const timer = setTimeout(async () => {
    try {
      if (global.db.game && global.db.game[remoteJid] && global.db.game[remoteJid].type === 'math') {
        delete global.db.game[remoteJid];
        await sock.sendMessage(remoteJid, {
          text: `⏰ *Waktu habis bro!* Nggak ada yang kejawab.\nJawaban yang benar: *${mathData.answer}*`
        }, { quoted: sentMsg });
      }
    } catch (e) {
      console.error('Error di timer math:', e);
    }
  }, timeoutSec * 1000);

  global.db.game[remoteJid] = {
    type: 'math',
    msgId: sentMsg.key.id,
    soal: mathData.expression,
    jawabanBenar: mathData.answer,
    reward: mathData.reward,
    timer: timer
  };
}

module.exports = mathCommand;
          
