async function blackjackCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const cards = ['🂡', '🂢', '🂣', '🂤', '🂥', '🂦', '🂧', '🂨', '🂩', '🂪', '🂫', '🂬', '🂭'];
  
  const playerCard1 = Math.floor(Math.random() * 10) + 1;
  const playerCard2 = Math.floor(Math.random() * 10) + 1;
  const botCard1 = Math.floor(Math.random() * 10) + 1;
  const botCard2 = Math.floor(Math.random() * 10) + 1;

  const playerTotal = playerCard1 + playerCard2;
  const botTotal = botCard1 + botCard2;

  let hasil = '🤝 *SERI!*';
  if (playerTotal > 21) hasil = '❌ *KAMU KALAH!* (Kartu kamu burst/melebihi 21)';
  else if (botTotal > 21 || playerTotal > botTotal) hasil = '🎉 *KAMU MENANG!*';
  else if (playerTotal < botTotal) hasil = '❌ *KAMU KALAH!*';

  const teks = `🃏 *BLACKJACK GAME*\n\n` +
    `👤 *Kartu Kamu:* ${playerCard1} + ${playerCard2} = *${playerTotal}*\n` +
    `🤖 *Kartu Bot:* ${botCard1} + ${botCard2} = *${botTotal}*\n\n` +
    `Hasil: ${hasil}`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
}

module.exports = blackjackCommand;
