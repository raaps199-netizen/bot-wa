async function ncodeCommand(sock, msg) {
  // Generate 6 angka acak (100000 - 999999)
  const randomCode = Math.floor(100000 + Math.random() * 900000);

  const caption = 
`☢️ *6-DIGIT CODE GENERATOR* ☢️

🔑 *Kode:* \`${randomCode}\``;

  await sock.sendMessage(msg.key.remoteJid, {
    text: caption
  }, { quoted: msg });
}

module.exports = ncodeCommand;
