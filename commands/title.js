// File: commands/title.js[span_2](start_span)[span_2](end_span)
const { getUserData, getTotalScore } = require('../utils/helper');[span_3](start_span)[span_3](end_span)
const { getSenderId, resolveUserKey } = require('../utils/jid-utils');[span_4](start_span)[span_4](end_span)

// Config Daftar Gelar per Kategori (diurutkan dari syarat terkecil ke terbesar)
const TITLES_CONFIG = {[span_5](start_span)[span_5](end_span)
  poin: {
    label: '💰 EKONOMI (Poin)',
    unit: 'Poin',
    list: [
      { min: 0,      name: 'The Initiate' },[span_6](start_span)[span_6](end_span)
      { min: 500,    name: 'The Rising One' },[span_7](start_span)[span_7](end_span)
      { min: 1000,   name: 'Knight of Dawn' },[span_8](start_span)[span_8](end_span)
      { min: 3000,   name: 'Noble Knight' },[span_9](start_span)[span_9](end_span)
      { min: 5000,   name: 'Lord of Valor' },[span_10](start_span)[span_10](end_span)
      { min: 10000,  name: 'Duke of Honor' },[span_11](start_span)[span_11](end_span)
      { min: 50000,  name: 'Prince of the Realm' },[span_12](start_span)[span_12](end_span)
      { min: 100000, name: 'Emperor of the Realm' }[span_13](start_span)[span_13](end_span)
    ]
  },
  reme: {
    label: '🎰 KASINO (Reme)',
    unit: 'Win',
    list: [
      { min: 0,   name: 'Reme Initiate' },[span_14](start_span)[span_14](end_span)
      { min: 5,   name: 'Reme Adept' },[span_15](start_span)[span_15](end_span)
      { min: 10,  name: 'Reme Virtuoso' },[span_16](start_span)[span_16](end_span)
      { min: 20,  name: 'Reme Highmaster' },[span_17](start_span)[span_17](end_span)
      { min: 50,  name: 'The King of Spin' },[span_18](start_span)[span_18](end_span)
      { min: 100, name: 'The God of Reme' }[span_19](start_span)[span_19](end_span)
    ]
  },
  qq: {
    label: '🎴 KASINO (QiuQiu)',
    unit: 'Win',
    list: [
      { min: 0,   name: 'QQ Initiate' },[span_20](start_span)[span_20](end_span)
      { min: 10,  name: 'QQ Adept' },[span_21](start_span)[span_21](end_span)
      { min: 20,  name: 'QQ Virtuoso' },[span_22](start_span)[span_22](end_span)
      { min: 50,  name: 'The Luck Hand' },[span_23](start_span)[span_23](end_span)
      { min: 100, name: 'The God of QQ' }[span_24](start_span)[span_24](end_span)
    ]
  },
  trivia: {
    label: '🧠 KUIS (Trivia)',
    unit: 'Soal',
    list: [
      { min: 0,   name: 'The Initiate' },[span_25](start_span)[span_25](end_span)
      { min: 10,  name: 'The Quizer' },[span_26](start_span)[span_26](end_span)
      { min: 30,  name: 'The Scholar' },[span_27](start_span)[span_27](end_span)
      { min: 50,  name: 'The Learned' },[span_28](start_span)[span_28](end_span)
      { min: 100, name: 'The Trivia King' }[span_29](start_span)[span_29](end_span)
    ]
  },
  math: {
    label: '📐 KUIS (Matematika)',
    unit: 'Soal',
    list: [
      { min: 0,   name: 'The Initiate' },[span_30](start_span)[span_30](end_span)
      { min: 10,  name: 'The Counter' },[span_31](start_span)[span_31](end_span)
      { min: 30,  name: 'The Mathematician' },[span_32](start_span)[span_32](end_span)
      { min: 50,  name: 'The Human Calculator' },[span_33](start_span)[span_33](end_span)
      { min: 100, name: 'The Einstein' }[span_34](start_span)[span_34](end_span)
    ]
  },
  mancing: {
    label: '🎣 MANCING (Fishing)',
    unit: 'Tangkapan',
    list: [
      { min: 0,     name: 'Rookie Angler' },[span_35](start_span)[span_35](end_span)
      { min: 10,    name: 'Patient Fisher' },[span_36](start_span)[span_36](end_span)
      { min: 50,    name: 'River Master' },[span_37](start_span)[span_37](end_span)
      { min: 100,   name: 'Ocean Conqueror' },[span_38](start_span)[span_38](end_span)
      { min: 300,   name: 'Poseidon\'s Heir' },[span_39](start_span)[span_39](end_span)
      { min: 500,   name: 'The God of Seas' },[span_40](start_span)[span_40](end_span)
      { min: 1000,  name: 'Leviathan Tamer' },[span_41](start_span)[span_41](end_span)
      { min: 2500,  name: 'Abyssal Hunter' },[span_42](start_span)[span_42](end_span)
      { min: 5000,  name: 'Ruler of the Tides' },[span_43](start_span)[span_43](end_span)
      { min: 7500,  name: 'Neptune\'s Avatar' },[span_44](start_span)[span_44](end_span)
      { min: 10000, name: 'The Ultimate Angler' }[span_45](start_span)[span_45](end_span)
    ]
  },
  boss: {
    label: '🐙 WORLD BOSS (Raid)',
    unit: 'Kill',
    list: [
      { min: 0,  name: 'Boss Novice' },[span_46](start_span)[span_46](end_span)
      { min: 1,  name: 'Kraken Slayer' },[span_47](start_span)[span_47](end_span)
      { min: 3,  name: 'Monster Bane' },[span_48](start_span)[span_48](end_span)
      { min: 5,  name: 'Titan Destroyer' },[span_49](start_span)[span_49](end_span)
      { min: 10, name: 'Legendary Conqueror' }[span_50](start_span)[span_50](end_span)
    ]
  }
};

// Helper untuk membersihkan kurung siku ganda & merapikan teks
function cleanTitle(titleName) {
  if (!titleName) return '';
  // Hapus semua kurung siku di awal/akhir jika ada, lalu bungkus satu saja secara bersih
  const raw = titleName.replace(/^\[+|\]+$/g, '').trim();
  return `*[${raw}]*`;
}

function getCategoryProgress(categoryData, currentVal) {[span_51](start_span)[span_51](end_span)
  const list = categoryData.list;[span_52](start_span)[span_52](end_span)
  let currentTitle = list[0].name;[span_53](start_span)[span_53](end_span)
  let nextTarget = null;[span_54](start_span)[span_54](end_span)

  for (let i = 0; i < list.length; i++) {[span_55](start_span)[span_55](end_span)
    if (currentVal >= list[i].min) {[span_56](start_span)[span_56](end_span)
      currentTitle = list[i].name;[span_57](start_span)[span_57](end_span)
      nextTarget = list[i + 1] || null;[span_58](start_span)[span_58](end_span)
    }
  }

  return {
    currentTitle,
    currentVal,
    nextMin: nextTarget ? nextTarget.min : null,[span_59](start_span)[span_59](end_span)
    nextTitle: nextTarget ? nextTarget.name : null,[span_60](start_span)[span_60](end_span)
    isMax: !nextTarget[span_61](start_span)[span_61](end_span)
  };
}

module.exports = async function titleCommand(sock, msg, args) {[span_62](start_span)[span_62](end_span)
  const remoteJid = msg.key.remoteJid;[span_63](start_span)[span_63](end_span)

  try {
    const rawSenderId = getSenderId(msg, remoteJid) || (msg.key.participant || remoteJid);[span_64](start_span)[span_64](end_span)
    const senderId = typeof resolveUserKey === 'function[span_65](start_span)'[span_65](end_span)
      ? resolveUserKey(global.db, rawSenderId)[span_66](start_span)[span_66](end_span)
      : rawSenderId;[span_67](start_span)[span_67](end_span)

    const user = getUserData(global.db, senderId);[span_68](start_span)[span_68](end_span)

    const currentScore = getTotalScore(user);[span_69](start_span)[span_69](end_span)
    if (typeof user.maxPoin !== 'number' || currentScore > user.maxPoin) {[span_70](start_span)[span_70](end_span)
      user.maxPoin = currentScore;[span_71](start_span)[span_71](end_span)
      if (typeof global.saveDatabase === 'function') global.saveDatabase();[span_72](start_span)[span_72](end_span)
    }

    const stats = {
      poin: user.maxPoin,[span_73](start_span)[span_73](end_span)
      reme: user.remeWin || 0,[span_74](start_span)[span_74](end_span)
      qq: user.qqWin || 0,[span_75](start_span)[span_75](end_span)
      trivia: user.triviaCount || 0,[span_76](start_span)[span_76](end_span)
      math: user.mathCount || 0,[span_77](start_span)[span_77](end_span)
      mancing: user.totalFish || 0,[span_78](start_span)[span_78](end_span)
      boss: user.bossKills || 0[span_79](start_span)[span_79](end_span)
    };

    const subCommand = args[0] ? args[0].toLowerCase() : null;[span_80](start_span)[span_80](end_span)

    if (['pakai', 'set', 'use', 'select'].includes(subCommand)) {[span_81](start_span)[span_81](end_span)
      const categoryKey = args[1] ? args[1].toLowerCase() : null;[span_82](start_span)[span_82](end_span)
      const targetIndex = parseInt(args[2]) - 1;[span_83](start_span)[span_83](end_span)

      if (!categoryKey || !TITLES_CONFIG[categoryKey] || isNaN(targetIndex)) {[span_84](start_span)[span_84](end_span)
        return await sock.sendMessage(remoteJid, {
          text: `⚠️ *Format Salah, Bre!*\n\n` +
                `📌 Cara Pakai: *.title pakai <kategori> <nomor_gelar>*\n` +
                `💡 Contoh: *.title pakai boss 2*\n` +
                `💡 Cek list & nomornya via: *.title boss*`
        }, { quoted: msg });[span_85](start_span)[span_85](end_span)
      }

      const catConfig = TITLES_CONFIG[categoryKey];[span_86](start_span)[span_86](end_span)
      const selectedTitle = catConfig.list[targetIndex];[span_87](start_span)[span_87](end_span)

      if (!selectedTitle) {[span_88](start_span)[span_88](end_span)
        return await sock.sendMessage(remoteJid, {
          text: `❌ Nomor gelar tidak ditemukan dalam kategori *${categoryKey}*!`[span_89](start_span)[span_89](end_span)
        }, { quoted: msg });[span_90](start_span)[span_90](end_span)
      }

      const userVal = stats[categoryKey];[span_91](start_span)[span_91](end_span)
      if (userVal < selectedTitle.min) {[span_92](start_span)[span_92](end_span)
        return await sock.sendMessage(remoteJid, {
          text: `🔒 Gelar *[${selectedTitle.name}]* masih terkunci!\n` +
                `Capaian kamu baru *${userVal}/${selectedTitle.min} ${catConfig.unit}*.`[span_93](start_span)[span_93](end_span)
        }, { quoted: msg });[span_94](start_span)[span_94](end_span)
      }

      // Simpan bersih tanpa double kurung siku
      user.equippedTitle = selectedTitle.name.replace(/^\[+|\]+$/g, '').trim();[span_95](start_span)[span_95](end_span)
      user.title = user.equippedTitle;[span_96](start_span)[span_96](end_span)

      if (typeof global.saveDatabase === 'function') global.saveDatabase();[span_97](start_span)[span_97](end_span)

      return await sock.sendMessage(remoteJid, {
        text: `✅ Berhasil memasang gelar: ${cleanTitle(selectedTitle.name)}!\n\n` +[span_98](start_span)[span_98](end_span)
              `Gelar ini akan otomatis muncul saat bot me-mention kamu di game/command.`[span_99](start_span)[span_99](end_span)
      }, { quoted: msg });[span_100](start_span)[span_100](end_span)
    }

    if (['lepas', 'reset', 'off', 'remove'].includes(subCommand)) {[span_101](start_span)[span_101](end_span)
      delete user.equippedTitle;[span_102](start_span)[span_102](end_span)
      delete user.title;[span_103](start_span)[span_103](end_span)

      if (typeof global.saveDatabase === 'function') global.saveDatabase();[span_104](start_span)[span_104](end_span)

      return await sock.sendMessage(remoteJid, {
        text: `✅ Gelar kamu berhasil dilepas!`[span_105](start_span)[span_105](end_span)
      }, { quoted: msg });[span_106](start_span)[span_106](end_span)
    }

    if (subCommand && TITLES_CONFIG[subCommand]) {[span_107](start_span)[span_107](end_span)
      const catConfig = TITLES_CONFIG[subCommand];[span_108](start_span)[span_108](end_span)
      const val = stats[subCommand];[span_109](start_span)[span_109](end_span)
      const userNum = senderId.split('@')[0];[span_110](start_span)[span_110](end_span)
      const currentEquipped = user.equippedTitle || user.title;[span_111](start_span)[span_111](end_span)

      let caption = `🎖️ *RINCIAN GELAR — ${catConfig.label.toUpperCase()}*\n`;[span_112](start_span)[span_112](end_span)
      caption += `👤 User: @${userNum}\n`;[span_113](start_span)[span_113](end_span)
      caption += `📊 Capaian Kamu: *${val} ${catConfig.unit}*\n`;[span_114](start_span)[span_114](end_span)
      caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;[span_115](start_span)[span_115](end_span)

      catConfig.list.forEach((t, idx) => {[span_116](start_span)[span_116](end_span)
        const no = idx + 1;[span_117](start_span)[span_117](end_span)
        const isEquipped = currentEquipped === t.name.replace(/^\[+|\]+$/g, '').trim();[span_118](start_span)[span_118](end_span)
        const formattedTitleName = cleanTitle(t.name);[span_119](start_span)[span_119](end_span)

        if (val >= t.min) {[span_120](start_span)[span_120](end_span)
          const statusBadge = isEquipped ? ' 📌 *[DIPAKAI]*' : ' ✅ *[TERBUKA]*';[span_121](start_span)[span_121](end_span)
          caption += `${no}. ${formattedTitleName}${statusBadge}\n   └ Syarat: ${t.min} ${catConfig.unit}\n`;[span_122](start_span)[span_122](end_span)
        } else {
          caption += `${no}. 🔒 ${formattedTitleName}\n   └ Progress: *${val}/${t.min} ${catConfig.unit}*\n`;[span_123](start_span)[span_123](end_span)
        }
      });

      caption += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;[span_124](start_span)[span_124](end_span)
      caption += `💡 *Cara Pasang:* Ketik *.title pakai ${subCommand} <nomor_gelar>*\n`;[span_125](start_span)[span_125](end_span)
      caption += `📌 Contoh: *.title pakai ${subCommand} 2*`;[span_126](start_span)[span_126](end_span)

      return await sock.sendMessage(remoteJid, {
        text: caption,
        mentions: [senderId][span_127](start_span)[span_127](end_span)
      }, { quoted: msg });[span_128](start_span)[span_128](end_span)
    }

    const userNum = senderId.split('@')[0];[span_129](start_span)[span_129](end_span)
    const rawEquipped = user.equippedTitle || user.title;[span_130](start_span)[span_130](end_span)
    const currentEquipped = rawEquipped ? cleanTitle(rawEquipped) : 'Belum Ada (Otomatis)';[span_131](start_span)[span_131](end_span)

    let caption = `🎖️ *STATUS & MENU GELAR PENGGUNA*\n`;[span_132](start_span)[span_132](end_span)
    caption += `👤 User: @${userNum}\n`;[span_133](start_span)[span_133](end_span)
    caption += `📌 Gelar Dipakai: ${currentEquipped}\n`;[span_134](start_span)[span_134](end_span)
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;[span_135](start_span)[span_135](end_span)

    for (const key in TITLES_CONFIG) {[span_136](start_span)[span_136](end_span)
      const cat = TITLES_CONFIG[key];[span_137](start_span)[span_137](end_span)
      const prog = getCategoryProgress(cat, stats[key]);[span_138](start_span)[span_138](end_span)

      caption += `${cat.label}\n`;[span_139](start_span)[span_139](end_span)
      caption += `├ Gelar Tertinggi: ${cleanTitle(prog.currentTitle)}\n`;[span_140](start_span)[span_140](end_span)

      if (prog.isMax) {[span_141](start_span)[span_141](end_span)
        caption += `└ Progress: *MAX LEVEL (Tercapai)* 👑\n\n`;[span_142](start_span)[span_142](end_span)
      } else {
        caption += `└ Progress: *${prog.currentVal}/${prog.nextMin} ${cat.unit}* (Menuju ${cleanTitle(prog.nextTitle)})\n\n`;[span_143](start_span)[span_143](end_span)
      }
    }

    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;[span_144](start_span)[span_144](end_span)
    caption += `🔍 *Lihat List Gelar:* Ketik *.title <kategori>*\n`;[span_145](start_span)[span_145](end_span)
    caption += `👉 *Pasang Gelar:* Ketik *.title pakai <kategori> <nomor>*\n`;[span_146](start_span)[span_146](end_span)
    caption += `❌ *Lepas Gelar:* Ketik *.title lepas*\n`;[span_147](start_span)[span_147](end_span)
    caption += `📌 Contoh: *.title boss* lalu *.title pakai boss 2*`;[span_148](start_span)[span_148](end_span)

    await sock.sendMessage(remoteJid, {
      text: caption,
      mentions: [senderId][span_149](start_span)[span_149](end_span)
    }, { quoted: msg });[span_150](start_span)[span_150](end_span)

  } catch (err) {[span_151](start_span)[span_151](end_span)
    console.error('Error di titleCommand:', err);[span_152](start_span)[span_152](end_span)
    await sock.sendMessage(remoteJid, {
      text: `❌ Error saat mengecek title: ${err.message}`[span_153](start_span)[span_153](end_span)
    }, { quoted: msg });[span_154](start_span)[span_154](end_span)
  }
};
        
