async function mathCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const num1 = Math.floor(Math.random() * 50) + 1;
  const num2 = Math.floor(Math.random() * 50) + 1;
  const operators = ['+', '-', '*'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let jawaban = 0;
  if (op === '+') jawaban = num1 + num2;
  if (op === '-') jawaban = num1 - num2;
  if (op === '*') jawaban = num1 * num2;

  const teks = `🧮 *KUIS MATEMATIKA*\n\n` +
    `Berapa hasil dari: *${num1} ${op} ${num2}* ?\n\n` +
    `💡 *Jawaban:* ||${jawaban}|| _(Ketuk spoiler jika menyerah)_`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
}

module.exports = mathCommand;
