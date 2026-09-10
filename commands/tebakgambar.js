if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

async function tebakgambarCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    await sock.sendMessage(remoteJid, { text: 'itu jawab dulu njir' }, { quoted: msg });
    return;
  }

  try {
    const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json');
    const data = await res.json();
    const json = data[Math.floor(Math.random() * data.length)];

    const caption = `🖼️ *TEBAK GAMBAR*\n\n` +
      `Petunjuk: ${json.deskripsi || 'Tebak susunan kata dari gambar di atas'}\n` +
      `Waktu: *60 Detik*\n\n` +
      `_Reply gambar ini lalu jawab pakai slash!_`;

    const sentMsg = await sock.sendMessage(remoteJid, {
      image: { url: json.img },
      caption: caption
    }, { quoted: msg });

    global.db.game[remoteJid] = {
      jawaban: json.jawaban.toLowerCase().trim(),
      timer: setTimeout(async () => {
        if (global.db.game[remoteJid]) {
          delete global.db.game[remoteJid];
          await sock.sendMessage(remoteJid, { text: `lama ah kalian, yang bener: *${json.jawaban}*` }, { quoted: sentMsg });
        }
      }, 60000)
    };

  } catch (err) {
    console.error(err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil data Tebak Gambar.' }, { quoted: msg });
  }
}

module.exports = tebakgambarCommand;
