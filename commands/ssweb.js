async function sswebCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  let url = args[0];

  if (!url) {
    return await sock.sendMessage(remoteJid, { text: '❌ Masukkan URL web! Contoh: *.ssweb google.com*' }, { quoted: msg });
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    const ssUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${url}`;

    await sock.sendMessage(remoteJid, {
      image: { url: ssUrl },
      caption: `📸 *Screenshot Web:* ${url}`
    }, { quoted: msg });

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error SSWeb:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Gagal!* Gagal mengambil screenshot.' }, { quoted: msg });
  }
}

module.exports = sswebCommand;
