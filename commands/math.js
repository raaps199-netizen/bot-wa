if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function mathCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    await sock.sendMessage(remoteJid, { text: '⚠️ Masih ada game yang berlangsung di chat ini!' }, { quoted: msg });
    return;
  }

  const level = args[0]?.toLowerCase() || 'easy';
  let soal = '';
  let jawaban = '';

  if (level === 'easy') {
    const a = getRandomInt(1, 50);
    const b = getRandomInt(1, 50);
    const op = Math.random() > 0.5 ? '+' : '-';
    soal = `${a} ${op} ${b}`;
    jawaban = eval(soal).toString();

  } else if (level === 'medium') {
    const a = getRandomInt(2, 15);
    const b = getRandomInt(2, 15);
    soal = `${a} × ${b}`;
    jawaban = (a * b).toString();

  } else if (level === 'hard') {
    const b = getRandomInt(2, 12);
    const hasil = getRandomInt(2, 15);
    const a = b * hasil;
    const opList = ['+', '-', '*', '/'];
    const selectedOp = opList[getRandomInt(0, 3)];

    if (selectedOp === '/') {
      soal = `${a} ÷ ${b}`;
      jawaban = hasil.toString();
    } else if (selectedOp === '*') {
      soal = `${b} × ${getRandomInt(2, 10)}`;
      jawaban = eval(soal.replace('×', '*')).toString();
    } else {
      soal = `${getRandomInt(10, 100)} ${selectedOp} ${getRandomInt(10, 100)}`;
      jawaban = eval(soal).toString();
    }

  } else if (level === 'extreme') {
    const tipe = getRandomInt(1, 2);
    if (tipe === 1) { // Pangkat
      const base = getRandomInt(2, 10);
      const exp = getRandomInt(2, 3);
      soal = `${base}^${exp}`;
      jawaban = Math.pow(base, exp).toString();
    } else { // Akar
      const ans = getRandomInt(2, 15);
      soal = `√${ans * ans}`;
      jawaban = ans.toString();
    }

  } else if (level === 'max') { // Kelas 11 Kurikulum Merdeka
    const tipeMax = getRandomInt(1, 4);
    if (tipeMax === 1) { // Turunan f(x) = ax^n
      const a = getRandomInt(2, 5);
      soal = `Turunan pertama dari f(x) = ${a}x² pada x = 3`;
      jawaban = (2 * a * 3).toString(); // f'(x) = 2ax -> 2*a*3
    } else if (tipeMax === 2) { // Matriks Determinan 2x2
      const a = getRandomInt(1, 5), b = getRandomInt(1, 5), c = getRandomInt(1, 5), d = getRandomInt(1, 5);
      soal = `Determinan matriks [[${a}, ${b}], [${c}, ${d}]]`;
      jawaban = (a * d - b * c).toString();
    } else if (tipeMax === 3) { // Kombinasi C(n, 2)
      const n = getRandomInt(4, 7);
      soal = `Nilai Kombinasi C(${n}, 2)`;
      jawaban = ((n * (n - 1)) / 2).toString();
    } else { // Barisan Aritmatika Un
      const a = getRandomInt(2, 10);
      const b = getRandomInt(3, 6);
      soal = `Suku ke-5 dari barisan aritmatika dengan a = ${a} dan beda = ${b}`;
      jawaban = (a + 4 * b).toString();
    }
  } else {
    await sock.sendMessage(remoteJid, { 
      text: `❌ Level tidak valid!\n\n*Pilihan Level:*\n• .math easy\n• .math medium\n• .math hard\n• .math extreme\n• .math max` 
    }, { quoted: msg });
    return;
  }

  const teks = `🧮 *KUIS MATEMATIKA (${level.toUpperCase()})*\n\n` +
    `Berapa hasil dari: *${soal}* ?\n` +
    `Waktu: *45 Detik*\n\n` +
    `_Reply pesan ini lalu jawab pakai slash!_\nContoh: */${jawaban}*`;

  const sentMsg = await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });

  global.db.game[remoteJid] = {
    jawaban: jawaban.toLowerCase().trim(),
    timer: setTimeout(async () => {
      if (global.db.game[remoteJid]) {
        delete global.db.game[remoteJid];
        await sock.sendMessage(remoteJid, { text: `⏰ *WAKTU HABIS!*\nJawaban yang benar: *${jawaban}*` }, { quoted: sentMsg });
      }
    }, 45000)
  };
}

module.exports = mathCommand;
