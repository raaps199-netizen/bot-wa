// File: commands/title.js
const { getUserData, getTotalScore } = require('../utils/helper');
const { getSenderId, resolveUserKey } = require('../utils/jid-utils');

// Config Daftar Gelar per Kategori (diurutkan dari syarat terkecil ke terbesar)
const TITLES_CONFIG = {
  poin: {
    label: '💰 EKONOMI (Poin)',
    unit: 'Poin',
    list: [
      { min: 0,      name: '[The Initiate]' },
      { min: 500,    name: '[The Rising One]' },
      { min: 1000,   name: '[Knight of Dawn]' },
      { min: 3000,   name: '[Noble Knight]' },
      { min: 5000,   name: '[Lord of Valor]' },
      { min: 10000,  name: '[Duke of Honor]' },
      { min: 50000,  name: '[Prince of the Realm]' },
      { min: 100000, name: '[Emperor of the Realm]' }
    ]
  },
  reme: {
    label: '🎰 KASINO (Reme)',
    unit: 'Win',
    list: [
      { min: 0,   name: '[Reme Initiate]' },
      { min: 5,   name: '[Reme Adept]' },
      { min: 10,  name: '[Reme Virtuoso]' },
      { min: 20,  name: '[Reme Highmaster]' },
      { min: 50,  name: '[The King of Spin]' },
      { min: 100, name: '[The God of Reme]' }
    ]
  },
  qq: {
    label: '🎴 KASINO (QiuQiu)',
    unit: 'Win',
    list: [
      { min: 0,   name: '[QQ Initiate]' },
      { min: 10,  name: '[QQ Adept]' },
      { min: 20,  name: '[QQ Virtuoso]' },
      { min: 50,  name: '[The Luck Hand]' },
      { min: 100, name: '[The God of QQ]' }
    ]
  },
  trivia: {
    label: '🧠 KUIS (Trivia)',
    unit: 'Soal',
    list: [
      { min: 0,   name: '[The Initiate]' },
      { min: 10,  name: '[The Quizer]' },
      { min: 30,  name: '[The Scholar]' },
      { min: 50,  name: '[The Learned]' },
      { min: 100, name: '[The Trivia King]' }
    ]
  },
  math: {
    label: '📐 KUIS (Matematika)',
    unit: 'Soal',
    list: [
      { min: 0,   name: '[The Initiate]' },
      { min: 10,  name: '[The Counter]' },
      { min: 30,  name: '[The Mathematician]' },
      { min: 50,  name: '[The Human Calculator]' },
      { min: 100, name: '[The Einstein]' }
    ]
  },
  // 👇 KATEGORI MANCING DIPERLUAS SAMPAI 10.000 👇
  mancing: {
    label: '🎣 MANCING (Fishing)',
    unit: 'Tangkapan',
    list: [
      { min: 0,     name: '[Rookie Angler]' },
      { min: 10,    name: '[Patient Fisher]' },
      { min: 50,    name: '[River Master]' },
      { min: 100,   name: '[Ocean Conqueror]' },
      { min: 300,   name: '[Poseidon\'s Heir]' },
      { min: 500,   name: '[The God of Seas]' },
      { min: 1000,  name: '[Leviathan Tamer]' },
      { min: 2500,  name: '[Abyssal Hunter]' },
      { min: 5000,  name: '[Ruler of the Tides]' },
      { min: 7500,  name: '[Neptune\'s Avatar]' },
      { min: 10000, name: '[The Ultimate Angler]' }
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

    // Tracking Peak Points (Poin Tertinggi yang Pernah Dicapai)
    const currentScore = getTotalScore(user);
    if (typeof user.maxPoin !== 'number' || currentScore > user.maxPoin) {
      user.maxPoin = currentScore;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();
    }

    // Menggunakan maxPoin agar progress tidak turun saat transfer atau kalah kasino
    const stats = {
      poin: user.maxPoin,
      reme: user.remeWin || 0,
      qq: user.qqWin || 0,
      trivia: user.triviaCount || 0,
      math: user.mathCount || 0,
      mancing: user.totalFish || 0 // 👈 Mengambil data total tangkapan ikan
    };

    const subCommand = args[0] ? args[0].toLowerCase() : null;

    // ===================================================
    // 🎯 MODE 1: MEMAKAI / MEMILIH GELAR
    // (Contoh: .title pakai trivia 2)
    // ===================================================
    if (['pakai', 'set', 'use', 'select'].includes(subCommand)) {
      const categoryKey = args[1] ? args[1].toLowerCase() : null;
      const targetIndex = parseInt(args[2]) - 1;

      if (!categoryKey || !TITLES_CONFIG[categoryKey] || isNaN(targetIndex)) {
        return await sock.sendMessage(remoteJid, {
          text: `⚠️ *Format Salah, Bre!*\n\n` +
                `📌 Cara Pakai: *.title pakai <kategori> <nomor_gelar>*\n` +
                `💡 Contoh: *.title pakai trivia 2*\n` +
                `💡 Cek list & nomornya via: *.title trivia*`
        }, { quoted: msg });
      }

      const catConfig = TITLES_CONFIG[categoryKey];
      const selectedTitle = catConfig.list[targetIndex];

      if (!selectedTitle) {
        return await sock.sendMessage(remoteJid, {
          text: `❌ Nomor gelar tidak ditemukan dalam kategori *${categoryKey}*!`
        }, { quoted: msg });
      }

      const userVal = stats[categoryKey];
      if (userVal < selectedTitle.min) {
        return await sock.sendMessage(remoteJid, {
          text: `🔒 Gelar *${selectedTitle.name}* masih terkunci!\n` +
                `Capaian kamu baru *${userVal}/${selectedTitle.min} ${catConfig.unit}*.`
        }, { quoted: msg });
      }

      // Simpan gelar aktif ke DB
      user.equippedTitle = selectedTitle.name;
      user.title = selectedTitle.name;

      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Berhasil memasang gelar: *${selectedTitle.name}*!\n\n` +
              `Gelar ini akan otomatis muncul saat bot me-mention kamu di game/command.`
      }, { quoted: msg });
    }

    // ===================================================
    // ❌ MODE 2: MELEPAS GELAR
    // (Contoh: .title lepas)
    // ===================================================
    if (['lepas', 'reset', 'off', 'remove'].includes(subCommand)) {
      delete user.equippedTitle;
      delete user.title;

      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Gelar kamu berhasil dilepas!`
      }, { quoted: msg });
    }

    // ===================================================
    // 📜 MODE 3: RINCIAN PER KATEGORI (misal: .title mancing)
    // ===================================================
    if (subCommand && TITLES_CONFIG[subCommand]) {
      const catConfig = TITLES_CONFIG[subCommand];
      const val = stats[subCommand];
      const userNum = senderId.split('@')[0];
      const currentEquipped = user.equippedTitle || user.title;

      let caption = `🎖️ *RINCIAN GELAR — ${catConfig.label.toUpperCase()}*\n`;
      caption += `👤 User: @${userNum}\n`;
      caption += `📊 Capaian Kamu: *${val} ${catConfig.unit}*\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      catConfig.list.forEach((t, idx) => {
        const no = idx + 1;
        const isEquipped = currentEquipped === t.name;

        if (val >= t.min) {
          const statusBadge = isEquipped ? ' 📌 *[DIPAKAI]*' : ' ✅ *[TERBUKA]*';
          caption += `${no}. *${t.name}*${statusBadge}\n   └ Syarat: ${t.min} ${catConfig.unit}\n`;
        } else {
          caption += `${no}. 🔒 *${t.name}*\n   └ Progress: *${val}/${t.min} ${catConfig.unit}*\n`;
        }
      });

      caption += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      caption += `💡 *Cara Pasang:* Ketik *.title pakai ${subCommand} <nomor_gelar>*\n`;
      caption += `📌 Contoh: *.title pakai ${subCommand} 2*`;

      return await sock.sendMessage(remoteJid, {
        text: caption,
        mentions: [senderId]
      }, { quoted: msg });
    }

    // ===================================================
    // 🏠 MODE 4: MENU UTAMA (Ringkasan Semua Kategori)
    // ===================================================
    const userNum = senderId.split('@')[0];
    const currentEquipped = user.equippedTitle || user.title || 'Belum Ada (Otomatis)';

    let caption = `🎖️ *STATUS & MENU GELAR PENGGUNA*\n`;
    caption += `👤 User: @${userNum}\n`;
    caption += `📌 Gelar Dipakai: *${currentEquipped}*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const key in TITLES_CONFIG) {
      const cat = TITLES_CONFIG[key];
      const prog = getCategoryProgress(cat, stats[key]);

      caption += `${cat.label}\n`;
      caption += `├ Gelar Tertinggi: *${prog.currentTitle}*\n`;

      if (prog.isMax) {
        caption += `└ Progress: *MAX LEVEL (Tercapai)* 👑\n\n`;
      } else {
        caption += `└ Progress: *${prog.currentVal}/${prog.nextMin} ${cat.unit}* (Menuju ${prog.nextTitle})\n\n`;
      }
    }

    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `🔍 *Lihat List Gelar:* Ketik *.title <kategori>*\n`;
    caption += `👉 *Pasang Gelar:* Ketik *.title pakai <kategori> <nomor>*\n`;
    caption += `❌ *Lepas Gelar:* Ketik *.title lepas*\n`;
    caption += `📌 Contoh: *.title mancing* lalu *.title pakai mancing 2*`;

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
  
