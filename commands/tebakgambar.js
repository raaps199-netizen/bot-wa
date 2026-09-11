if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

// Kamu bisa pakai API tebak gambar publik / bank gambar yang sudah ada
async function tebakgambarCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid] || global.mathGame?.has(remoteJid)) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada game yang sedang berjalan di chat ini! Ketik *.nyerah* untuk menyerah.'
    }, { quoted: msg });
  }

  try {
    // Contoh mengambil API Tebak Gambar publik
    const res = await fetch('https://raw.githubusercontent.com/BagasPrasetio/Kumpulan-Gambar/main/tebakgambar.json');
    const data = await res.json();
    const item = data[Math.floor(Math.random() * data.length)];

    const timeoutSec = 60;

    const caption = 
`🖼️ *TEBAK GAMBAR*

Tebak apakah gambar berikut ini!

⏱️ Waktu: *${timeoutSec} Detik*

_Ketik langsung jawabannya di chat!_
_Ketik *.nyerah* jika ingin menyerah._`;

    const sentMsg = await sock.sendMessage(remoteJid, {
      image: { url: item.img },
      caption: caption
    }, { quoted: msg });

    const timer = setTimeout(async () => {
      if (global.db.game[remoteJid]) {
        delete global.db.game[remoteJid];
        await sock.sendMessage(remoteJid, {
          text: `⏳ *Waktu habis!*\nJawaban yang benar adalah: *${item.jawaban.toUpperCase()}*`
        }, { quoted: sentMsg });
      }
    }, timeoutSec * 1000);

    // Simpan kunci jawaban secara rahasia di sesi game
    global.db.game[remoteJid] = {
      msgId: sentMsg.key.id,
      jawaban: item.jawaban.trim().toLowerCase(),
      jawabanTeks: item.jawaban.toUpperCase(),
      timer: timer
    };

  } catch (err) {
    console.error('Error Tebak Gambar:', err);
    await sock.sendMessage(remoteJid, {
      text: '❌ Gagal mengambil gambar dari server. Coba lagi!'
    }, { quoted: msg });
  }
}

module.exports = tebakgambarCommand;
