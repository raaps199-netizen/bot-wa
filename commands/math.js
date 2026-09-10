const { activeGames } = require('../handlers/gameHandler');

async function mathCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (activeGames.math.has(remoteJid)) {
    await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada sesi Math yang berlangsung! Jawab dengan *.jawab <angka>*'
    }, { quoted: msg });
    return;
  }

  // Pilih mode / level
  const mode = (args[0] || 'mudah').toLowerCase();
  let num1, num2, operator, answer;

  if (mode === 'sulit') {
    num1 = Math.floor(Math.random() * 100) + 10;
    num2 = Math.floor(Math.random() * 50) + 5;
    const ops = ['+', '-', '*'];
    operator = ops[Math.floor(Math.random() * ops.length)];
  } else if (mode === 'sedang') {
    num1 = Math.floor(Math.random() * 50) + 5;
    num2 = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '*'];
    operator = ops[Math.floor(Math.random() * ops.length)];
  } else {
    // Mode mudah (default)
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-'];
    operator = ops[Math.floor(Math.random() * ops.length)];
  }

  if (operator === '+') answer = num1 + num2;
  if (operator === '-') answer = num1 - num2;
  if (operator === '*') answer = num1 * num2;

  const timeout = setTimeout(async () => {
    if (activeGames.math.has(remoteJid)) {
      activeGames.math.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `⏱️ *Waktu Habis!*\nJawaban yang benar adalah: *${answer}*`
      });
    }
  }, 60000);

  activeGames.math.set(remoteJid, {
    answer: answer,
    timeout: timeout
  });

  const caption = `
🧮 *KUIS MATEMATIKA* (${mode.toUpperCase()})

Berapakah hasil dari: *${num1} ${operator} ${num2}*?

⏱️ Waktu: *60 detik*
Ketik *.jawab <angka>* untuk menjawab!
`.trim();

  await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });
}

module.exports = mathCommand;
