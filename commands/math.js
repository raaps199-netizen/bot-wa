if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function mathCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    await sock.sendMessage(remoteJid, { text: 'itu jawab dulu njir' }, { quoted: msg });
    return;
  }

  const level = args[0]?.toLowerCase() || 'easy';
  let soal = '';
  let jawaban = '';

  if (level === 'easy') {
    const a = getRandomInt(10, 99);
    const b = getRandomInt(10, 99);
    const op = Math.random() > 0.5 ? '+' : '-';
    soal = `${a} ${op} ${b}`;
    jawaban = eval(soal).toString();

  } else if (level === 'medium') {
    const a = getRandomInt(12, 50);
    const b = getRandomInt(12, 30);
    soal = `${a} × ${b}`;
    jawaban = (a * b).toString();

  } else if (level === 'hard') {
    // FIX HARD: Perkalian angka besar + penjumlahan/pengurangan bertingkat
    const a = getRandomInt(25, 85);
    const b = getRandomInt(15, 45);
    const c = getRandomInt(50, 200);
    soal = `(${a} × ${b}) - ${c}`;
    jawaban = (a * b - c).toString();

  } else if (level === 'extreme') {
    const tipe = getRandomInt(1, 2);
    if (tipe === 1) {
      const base = getRandomInt(12, 30);
      soal = `${base}²`;
      jawaban = (base * base).toString();
    } else {
      const ans = getRandomInt(15, 40);
      soal = `√${ans * ans}`;
      jawaban = ans.toString();
    }

  } else if (level === 'max') {
    const tipeMax = getRandomInt(1, 3);
    if (tipeMax === 1) {
      const a = getRandomInt(3, 9);
      soal = `Turunan pertama f(x) = ${a}x² pada x = 4`;
      jawaban = (2 * a * 4).toString();
    } else if (tipeMax === 2) {
      const a = getRandomInt(3, 9), b = getRandomInt(2, 7), c = getRandomInt(2, 6), d = getRandomInt(4, 9);
      soal = `Determinan matriks [[${a}, ${b}], [${c}, ${d}]]`;
      jawaban = (a * d - b * c).toString();
    } else {
      const n = getRandomInt(6, 10);
      soal = `Nilai Kombinasi C(${n}, 2)`;
      jawaban = ((n * (n - 1)) / 2).toString();
    }
  } else {
    await sock.sendMessage(remoteJid, { 
      text: `❌ Level tidak valid!\nPilihan: easy, medium, hard, extreme, max` 
    }, { quoted: msg });
    return;
  }

  // FIX: Petunjuk pesan dibuat umum tanpa bocoran angka jawaban
  const teks = `🧮 *KUIS MATEMATIKA (${level.toUpperCase()})*\n\n` +
    `Berapa hasil dari: *${soal}* ?\n` +
    `Waktu: *45 Detik*\n\n` +
    `_Ketik langsung jawabannya di chat (misal: 150 atau /150)_`;

  const sentMsg = await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });

  global.db.game[remoteJid] = {
    jawaban: jawaban.toLowerCase().trim(),
    timer: setTimeout(async () => {
      if (global.db.game[remoteJid]) {
        delete global.db.game[remoteJid];
        await sock.sendMessage(remoteJid, { text: `lama ah kalian, yang bener: *${jawaban}*` }, { quoted: sentMsg });
      }
    }, 45000)
  };
}

module.exports = mathCommand;
