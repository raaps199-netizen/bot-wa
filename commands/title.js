// File: commands/title.js
const { getUserData, getTotalScore } = require('../utils/helper');
const { getSenderId, resolveUserKey } = require('../utils/jid-utils');

// Config Daftar Gelar per Kategori
const TITLES_CONFIG = {
  poin: [
    { min: 100000, name: '👑 [Penguasa Server]' },
    { min: 50000,  name: '👑 [Sultan Kasino]' },
    { min: 10000,  name: '🏛️ [Konglomerat]' },
    { min: 5000,   name: '💎 [Orang Kaya]' },
    { min: 3000,   name: '🎩 [Jutawan Lokal]' },
    { min: 1000,   name: '💼 [Kelas Menengah]' },
    { min: 500,    name: '🪙 [Punya Tabungan]' },
    { min: 0,      name: '🪵 [Pemula]' }
  ],
  reme: [
    { min: 100, name: '🔱 [Dewa Reme]' },
    { min: 50,  name: '🎰 [Raja Spin]' },
    { min: 20,  name: '🔥 [Master Reme]' },
    { min: 10,  name: '🃏 [Jago Reme]' },
    { min: 5,   name: '🎲 [Pemain Reme]' },
    { min: 0,   name: '🪵 [Pemula]' }
  ],
  qq: [
    { min: 50, name: '🐲 [Dewa QiuQiu]' },
    { min: 20, name: '💥 [Jago Domino]' },
    { min: 10, name: '🎴 [Pemain QQ]' },
    { min: 0,  name: '🪵 [Pemula]' }
  ],
  trivia: [
    { min: 100, name: '🧙‍♂️ [Mbah Cerdas]' },
    { min: 50,  name: '🧠 [Profesor Kuis]' },
    { min: 30,  name: '📚 [Si Pintar]' },
    { min: 10,  name: '💡 [Penjawab Kuis]' },
    { min: 0,   name: '🪵 [Pemula]' }
  ],
  math: [
    { min: 100, name: '⚡ [Albert Einstein]' },
    { min: 50,  name: '🧮 [Kalkulator Berjalan]' },
    { min: 30,  name: '📊 [Jago Aljabar]' },
    { min: 10,  name: '📐 [Tukang Hitung]' },
    { min: 0,   name: '🪵 [Pemula]' }
  ]
};

// Helper untuk mengecek gelar tertinggi yang didapat berdasarkan angka
function getTitleForValue(categoryList, val) {
  const currentVal = val || 0;
  for (const t of categoryList) {
    if (currentVal >= t.min) return t.name;
  }
  return '🪵 [Pemula]';
}

module.exports = async function titleCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  try {
    const rawSenderId = getSenderId(msg, remoteJid) || (msg.key.participant || remoteJid);
    const senderId = typeof resolveUserKey === 'function'
      ? resolveUserKey(global.db, rawSenderId)
      : rawSenderId;

    const user = getUserData(global.db, senderId);

    // Ambil statistik user dari DB (dengan fallback default 0)
    const score = getTotalScore(user);
    const remeWin = user.remeWin || 0;
    const qqWin = user.qqWin || 0;
    const triviaCount = user.triviaCount || 0;
    const mathCount = user.mathCount || 0;

    // Hitung Gelar Aktif Tiap Kategori
    const titlePoin = getTitleForValue(TITLES_CONFIG.poin, score);
    const titleReme = getTitleForValue(TITLES_CONFIG.reme, remeWin);
    const titleQq = getTitleForValue(TITLES_CONFIG.qq, qqWin);
    const titleTrivia = getTitleForValue(TITLES_CONFIG.trivia, triviaCount);
    const titleMath = getTitleForValue(TITLES_CONFIG.math, mathCount);

    let caption = `🎖️ *STATUS GELAR / TITLE PENGGUNA*\n`;
    caption += `👤 User: @${senderId.split('@')[0]}\n`;
    caption += `═════════════════════════\n\n`;

    caption += `💰 *EKONOMI (Poin)*\n`;
    caption += `• Total Poin: *${score}*\n`;
    caption += `• Gelar: ${titlePoin}\n\n`;

    caption += `🎰 *KASINO (Reme)*\n`;
    caption += `• Kemenangan: *${remeWin} Win*\n`;
    caption += `• Gelar: ${titleReme}\n\n`;

    caption += `🎴 *KASINO (QiuQiu)*\n`;
    caption += `• Kemenangan: *${qqWin} Win*\n`;
    caption += `• Gelar: ${titleQq}\n\n`;

    caption += `🧠 *KUIS (Trivia)*\n`;
    caption += `• Dikerjakan: *${triviaCount} Soal*\n`;
    caption += `• Gelar: ${titleTrivia}\n\n`;

    caption += `📐 *KUIS (Matematika)*\n`;
    caption += `• Dikerjakan: *${mathCount} Soal*\n`;
    caption += `• Gelar: ${titleMath}\n\n`;

    caption += `═════════════════════════\n`;
    caption += `💡 *Tips:* Tingkatkan poin, win game, dan kerjakan soal kuis untuk membuka Gelar tingkat tinggi!`;

    await sock.sendMessage(remoteJid, {
      text: caption,
      mentions: [senderId]
    }, { quoted: msg });

  } catch (err) {
    console.error('Error di titleCommand:', err);
    await sock.sendMessage(remoteJid, {
      text: `❌ Error saat mengecek title: ${err.message}`
    }, { quoted: msg });
  }
};
  
