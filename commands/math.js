// Database Sesi Game Matematika Aktif
if (!global.mathGame) global.mathGame = new Map();

/**
 * Helper untuk membuat angka acak dalam rentang [min, max]
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generator Soal Dinamis untuk Level Hard & Extreme/Max
 */
function generateMathProblem(level) {
  let problemStr = '';
  let answer = 0;

  if (level === 'mudah') {
    const a = getRandomInt(10, 99);
    const b = getRandomInt(10, 99);
    const isAdd = Math.random() > 0.5;
    problemStr = isAdd ? `${a} + ${b}` : `${Math.max(a, b)} - ${Math.min(a, b)}`;
    answer = eval(problemStr);
  } else if (level === 'sedang') {
    const a = getRandomInt(12, 50);
    const b = getRandomInt(3, 15);
    const c = getRandomInt(10, 40);
    const op = Math.random() > 0.5 ? '*' : '+';
    problemStr = `${a} ${op} ${b} - ${c}`;
    answer = eval(problemStr);
  } else if (level === 'hard') {
    // Contoh bentuk: 2² + (-5 × 6³) atau 4³ - (8 × -3²)
    const base1 = getRandomInt(2, 6);
    const pow1 = getRandomInt(2, 3);
    const num1 = getRandomInt(-9, -2);
    const num2 = getRandomInt(3, 8);
    const pow2 = getRandomInt(2, 3);

    const pattern = getRandomInt(1, 2);
    if (pattern === 1) {
      // e.g. 3² + (-5 × 4³)
      problemStr = `${base1}² + (${num1} × ${num2}³)`;
      const evalExpr = `Math.pow(${base1}, ${pow1}) + (${num1} * Math.pow(${num2}, ${pow2}))`;
      answer = eval(evalExpr);
    } else {
      // e.g. (-4 × 5²) - (3³ + 12)
      problemStr = `(${num1} × ${num2}²) - (${base1}³ + ${getRandomInt(10, 50)})`;
      const evalExpr = `(${num1} * Math.pow(${num2}, ${pow2})) - (Math.pow(${base1}, 3) + ${getRandomInt(10, 50)})`;
      answer = eval(evalExpr);
    }
  } else {
    // LEVEL MAX / EXTREME (Di-generate super acak, panjang, & bervariasi)
    const n1 = getRandomInt(2, 7);
    const p1 = getRandomInt(2, 4);
    const n2 = getRandomInt(-15, -3);
    const n3 = getRandomInt(4, 12);
    const p2 = getRandomInt(2, 3);
    const n4 = getRandomInt(15, 80);
    const n5 = getRandomInt(-20, -5);

    const type = getRandomInt(1, 3);
    if (type === 1) {
      // e.g. 4³ + (-12 × 5³) - (-8 + 45)
      problemStr = `${n1}³ + (${n2} × ${n3}³) - (${n5} + ${n4})`;
      const expr = `Math.pow(${n1}, 3) + (${n2} * Math.pow(${n3}, ${p2})) - (${n5} + ${n4})`;
      answer = eval(expr);
    } else if (type === 2) {
      // e.g. (${n1}⁴ - ${n4}) × (${n2} + ${n3}²)
      problemStr = `(${n1}⁴ - ${n4}) × (${n2} + ${n3}²)`;
      const expr = `(Math.pow(${n1}, 4) - ${n4}) * (${n2} + Math.pow(${n3}, 2))`;
      answer = eval(expr);
    } else {
      // e.g. (${n2} × ${n1}³) + (${n4} - ${n3}³) × ${n5}
      problemStr = `(${n2} × ${n1}³) + (${n4} - ${n3}³) × ${n5}`;
      const expr = `(${n2} * Math.pow(${n1}, 3)) + (${n4} - Math.pow(${n3}, 3)) * ${n5}`;
      answer = eval(expr);
    }
  }

  return { problemStr, answer: Math.round(answer) };
}

async function mathCommand(sock, msg, args) {
  const from = msg.key.remoteJid;

  // Cek jika sedang ada game berjalan di obrolan ini
  if (global.mathGame.has(from)) {
    return await sock.sendMessage(from, {
      text: '⚠️ Masih ada kuis matematika yang belum dijawab di chat ini!'
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

_Ketik langsung jawabannya di chat (contoh: ${answer} atau /${answer})_`;

  const sentMsg = await sock.sendMessage(from, { text: caption }, { quoted: msg });

  // Set Timer Penjawab
  const timer = setTimeout(async () => {
    if (global.mathGame.has(from)) {
      global.mathGame.delete(from);
      await sock.sendMessage(from, {
        text: `⏳ *Waktu habis!*\nJawaban yang benar adalah: *${answer}*`
      }, { quoted: sentMsg });
    }
  }, timeoutSec * 1000);

  // Simpan Sesi Game
  global.mathGame.set(from, {
    answer: answer.toString(),
    timer: timer
  });
}

module.exports = mathCommand;
