async function cekbucinCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const nama = args.join(' ') || 'Kamu';
  const persen = Math.floor(Math.random() * 100) + 1;

  const teks = `❤️ *CEK BUCIN*\n\n` +
    `Tingkat kebucinan *${nama}* adalah *${persen}%*!`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
}

module.exports = cekbucinCommand;
