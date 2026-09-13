// File: commands/title.js
const { getUserData, getTotalScore } = require('../utils/helper');
const { getSenderId, resolveUserKey } = require('../utils/jid-utils');

// Config Daftar Gelar per Kategori (diurutkan dari syarat terkecil ke terbesar)
const TITLES_CONFIG = {
  poin: {
    label: '💰 EKONOMI (Poin)',
    unit: 'Poin',
    list: [
      { min: 0,      name: '🪵 [Pemula]' },
      { min: 500,    name: '🪙 [Punya Tabungan]' },
      { min: 1000,   name: '💼 [Kelas Menengah]' },
      { min: 3000,   name: '🎩 [Jutawan Lokal]' },
      { min: 5000,   name: '💎 [Orang Kaya]' },
      { min: 10000,  name: '🏛️ [Konglomerat]' },
      { min: 50000,  name: '👑 [Sultan Kasino]' },
      { min: 100000, name: '👑 [Penguasa Server]' }
    ]
  },
  reme: {
    label: '🎰 KASINO (Reme)',
    unit: 'Win',
    list: [
      { min: 0,   name: '🪵 [Pemula]' },
      { min: 5,   name: '🎲 [Pemain Reme]' },
      { min: 10,  name: '🃏 [Jago Reme]' },
      { min: 20,  name: '🔥 [Master Reme]' },
      { min: 50,  name: '🎰 [Raja Spin]' },
      { min: 100, name: '🔱 [Dewa Reme]' }
    ]
  },
  qq: {
    label: '🎴 KASINO (QiuQiu)',
    unit: 'Win',
    list: [
      { min: 0,  name: '🪵 [Pemula]' },
      { min: 10, name: '🎴 [Pemain QQ]' },
      { min: 20, name: '💥 [Jago Domino]' },
      { min: 50, name: '🐲 [Dewa QiuQiu]' }
    ]
  },
  trivia: {
    label: '🧠 KUIS (Trivia)',
    unit: 'Soal',
    list: [
      { min: 0,   name: '🪵 [Pemula]' },
      { min: 10,  name: '💡 [Penjawab Kuis]' },
      { min: 30,  name: '📚 [Si Pintar]' },
      { min: 50,  name: '🧠 [Profesor Kuis]' },
      { min: 100, name: '🧙‍♂️ [Mbah Cerdas]' }
    ]
  },
  math: {
    label: '📐 KUIS (Matematika)',
    unit: 'Soal',
    list: [
      { min: 0,   name: '🪵 [Pemula]' },
      { min: 10,  name: '📐 [Tukang Hitung]' },
      { min: 30,  name: '📊 [Jago Aljabar]' },
      { min: 50,  name: '🧮 [Kalkulator Berjalan]' },
      { min: 100, name: '⚡ [Albert Einstein]' }
    ]
  }
};

// Helper untuk mengambil info progress
function getCategoryProgress(categoryData, currentVal) {
  const list = categoryData.list;
  let currentTitle = list[0].name;
  let nextTarget = null;

  for (let i = 0; i < list.length; i++) {
    if (currentVal >= list[i].min) {
      currentTitle = list[i].name;
      nextTarget = list[i + 1] || null;
    }
  }

  return {
    currentTitle,
    currentVal,
    nextMin: nextTarget ? nextTarget.min : null,
    nextTitle: nextTarget ? nextTarget.name : null,
    isMax: !nextTarget
  };
}

module.exports = async function titleCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  try {
    const rawSenderId = getSenderId(msg, remoteJid) || (msg.key.participant || remoteJid);
    const senderId = typeof resolveUserKey === 'function'
      ? resolveUserKey(global.db, rawSenderId)
      : rawSenderId;

    const user = getUserData(global.db, senderId);

    // Ambil statistik user dari DB
    const stats = {
      poin: getTotalScore(user),
      reme: user.remeWin || 0,
      qq: user.qqWin || 0,
      trivia: user.triviaCount || 0,
      math: user.mathCount || 0
    };

    const subCommand = args[0] ? args[0].toLowerCase() : null;

    // ===================================================
    // MODE 1: RICIAN PER KATEGORI (misal: .title trivia)
    // ===================================================
    if (subCommand && TITLES_CONFIG[subCommand]) {
      const catConfig = TITLES_CONFIG[subCommand];
      const val = stats[subCommand];
      const userNum = senderId.split('@')[0];

      let caption = `🎖️ *RINCIAN GELAR — ${catConfig.label.toUpperCase()}*\n`;
      caption += `👤 User: @${userNum}\n`;
      caption += `📊 Capaian Kamu: *${val} ${catConfig.unit}*\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      catConfig.list.forEach((t) => {
        if (val >= t.min) {
          caption += `✅ *${t.name}* — (${t.min} ${catConfig.unit})\n`;
        } else {
          caption += `🔒 *${t.name}* — Progress: *${val}/${t.min} ${catConfig.unit}*\n`;
        }
      });

      caption += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      caption += `💡 *Petunjuk:* Selesaikan misi atau tingkatkan win rate untuk membuka gelar bertanda 🔒!`;

      return await sock.sendMessage(remoteJid, {
        text: caption,
        mentions: [senderId]
      }, { quoted: msg });
    }

    // ===================================================
    // MODE 2: MENU UTAMA (Ringkasan Semua Kategori)
    // ===================================================
    const userNum = senderId.split('@')[0];
    let caption = `🎖️ *MENU KATEGORI & PROGRESS GELAR*\n`;
    caption += `👤 User: @${userNum}\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const key in TITLES_CONFIG) {
      const cat = TITLES_CONFIG[key];
      const prog = getCategoryProgress(cat, stats[key]);

      caption += `${cat.label}\n`;
      caption += `├ Gelar: *${prog.currentTitle}*\n`;

      if (prog.isMax) {
        caption += `└ Progress: *MAX LEVEL (Tercapai)* 👑\n\n`;
      } else {
        caption += `└ Progress: *${prog.currentVal}/${prog.nextMin} ${cat.unit}* (Menuju ${prog.nextTitle})\n\n`;
      }
    }

    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `💡 *Rincian Lengkap:* Ketik *.title <kategori>*\n`;
    caption += `📌 Contoh: *.title trivia*, *.title reme*, *.title poin*`;

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
    
