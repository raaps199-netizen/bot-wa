// File: commands/event.js
const { deductPoints, addPoints, formatRupiah } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');
const { rods } = require('../utils/fishingData');

global.activeBoss = global.activeBoss || null;

// ==========================================
// 1.HANDLER UTAMA EVENT (.event kraken / status)
// ==========================================
async function handleEventCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');

  if (!isGroup) {
    return await sock.sendMessage(remoteJid, { text: '❌ Perintah event grup hanya bisa digunakan di dalam grup WhatsApp!' }, { quoted: msg });
  }

  const subCmd = args[0]?.toLowerCase();

  // MULAI EVENT KRAKEN / BOSS
  if (['kraken', 'megalodon', 'boss', 'start'].includes(subCmd)) {
    if (global.activeBoss) {
      return await sock.sendMessage(remoteJid, { 
        text: `⚠️ *EVENT BOSS SEDANG BERLANGSUNG!*\n\nMonster *${global.activeBoss.name}* masih mengamuk!\nHP Tersisa: *${global.activeBoss.hp} / ${global.activeBoss.maxHp}*\n\nKetik *.serang* sekarang!` 
      }, { quoted: msg });
    }

    let metadata;
    try {
      metadata = await sock.groupMetadata(remoteJid);
    } catch (e) {
      return await sock.sendMessage(remoteJid, { text: `❌ Gagal mengambil data grup: ${e.message}` }, { quoted: msg });
    }

    const participants = metadata.participants || [];
    const participantJids = participants.map(p => p.id);

    const bossList = [
      { name: '🐙 The Ancient Kraken', hp: 35000, maxHp: 35000, reward: 3000000 },
      { name: '🦈 Megalodon Purba Raksasa', hp: 30000, maxHp: 30000, reward: 2500000 }
    ];
    const selectedBoss = bossList[Math.floor(Math.random() * bossList.length)];

    global.activeBoss = {
      name: selectedBoss.name,
      hp: selectedBoss.hp,
      maxHp: selectedBoss.maxHp,
      reward: selectedBoss.reward,
      damagers: {},
      participants: {}
    };

    // ⏱️ TIMER 3 MENIT OTOMATIS (Denda 40% jika gagal)
    global.activeBoss.timer = setTimeout(async () => {
      if (global.activeBoss) {
        for (const uid of Object.keys(global.db.users)) {
          if (!global.activeBoss.participants[uid]) {
            const user = global.db.users[uid];
            if (user.points && user.points > 10000) {
              const penalty = Math.floor(user.points * 0.40); // Potong 40%
              user.points -= penalty;
            }
          }
        }
        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        global.activeBoss = null;

        await sock.sendMessage(remoteJid, {
          text: `⏰ *WAKTU HABIS (3 MENIT) KRAKEN MENANG!* 🐙💥\n\n` +
                `Monster berhasil menghancurkan perairan karena gagal dikalahkan tepat waktu!\n` +
                `⚠️ Seluruh warga yang **mangkir dan tidak ikut menyerang** telah dijarah Kraken sebesar **40% dari total harta kekayaan** mereka!\n\n` +
                `_Semua aktivitas kembali normal._`
        });
      }
    }, 3 * 60 * 1000); // 3 Menit

    let announcement = `🚨 *WORLD BOSS LOCKDOWN DIMULAI!* 🚨\n\n`;
    announcement += `⚠️ Monster *${selectedBoss.name}* muncul dan mengunci seluruh perairan!\n`;
    announcement += `⏱️ Batas Waktu: *3 Menit*\n`;
    announcement += `❤️ Total HP Boss: *${selectedBoss.hp}*\n`;
    announcement += `💰 Hadiah Utama: *${formatRupiah(selectedBoss.reward)}*\n\n`;
    announcement += `🔒 *Semua aktivitas game dibekukan!* Warga wajib mengetik *.serang* untuk melawan atau harta kalian dijarah 40%!\n\n`;
    announcement += `_Segera angkat senjata!_`;

    return await sock.sendMessage(remoteJid, {
      text: announcement,
      mentions: participantJids
    }, { quoted: msg });
  }

  if (subCmd === 'status') {
    if (!global.activeBoss) {
      return await sock.sendMessage(remoteJid, { text: `ℹ️ Tidak ada World Boss yang aktif saat ini.` }, { quoted: msg });
    }
    return await sock.sendMessage(remoteJid, {
      text: `📊 *STATUS RAID BOSS*\n\n🦖 Monster: *${global.activeBoss.name}*\n❤️ HP: *${global.activeBoss.hp} / ${global.activeBoss.maxHp}*\n\nKetik *.serang* untuk menggempur!`
    }, { quoted: msg });
  }

  await sock.sendMessage(remoteJid, {
    text: `⚠️ *Format Event Salah*\nGunakan: *.event kraken* atau *.event status*`
  }, { quoted: msg });
}

// ==========================================
// 2. HANDLER SERANGAN BOSS (.serang / .hit)[span_2](start_span)[span_2](end_span)
// ==========================================
async function handleAttackBossCommand(sock, msg, senderId) {
  const remoteJid = msg.key.remoteJid;

  if (!global.activeBoss) {
    return await sock.sendMessage(remoteJid, { text: `❌ Tidak ada World Boss yang aktif sekarang!` }, { quoted: msg });
  }

  global.activeBoss.participants[senderId] = true;

  // Cooldown serang 4 detik
  const now = Date.now();
  global.activeBoss.cooldowns = global.activeBoss.cooldowns || {};
  const lastHit = global.activeBoss.cooldowns[senderId] || 0;
  
  if (now - lastHit < 4000) {
    const sisa = Math.ceil((4000 - (now - lastHit)) / 1000);
    return await sock.sendMessage(remoteJid, { text: `⏳ Napas dulu, bre! Tunggu *${sisa} detik* lagi untuk menyerang.` }, { quoted: msg });
  }
  global.activeBoss.cooldowns[senderId] = now;

  // Ambil data user & joran aktifnya untuk scaling damage
  const user = global.db.users[senderId] || {};
  const activeRodId = user.activeRod || 'training';
  const currentRod = rods[activeRodId] || rods['training'];

  const baseDamage = Math.floor((Math.random() * 500 + 400) * (currentRod.luck * 0.6));
  
  // 15% Peluang Critical Hit
  const isCrit = Math.random() < 0.15;
  const finalDamage = isCrit ? Math.floor(baseDamage * 2) : baseDamage;

  global.activeBoss.hp -= finalDamage;
  global.activeBoss.damagers[senderId] = (global.activeBoss.damagers[senderId] || 0) + finalDamage;

  const userNum = senderId.split('@')[0];

  const attackActions = [
    'menebas tentakel dengan kekuatan penuh',
    'menghujamkan tombak energi ke tubuh',
    'menembakkan meriam air bertekanan tinggi ke arah',
    'menghantam cangkang keras milik'
  ];
  const randomAction = attackActions[Math.floor(Math.random() * attackActions.length)];
  const critText = isCrit ? `\n🔥 *CRITICAL HIT! DAMAGE GANDA!* 🔥` : '';

  // CEK JIKA BOSS MATI (HP <= 0)
  if (global.activeBoss.hp <= 0) {
    clearTimeout(global.activeBoss.timer);
    const bossData = global.activeBoss;
    global.activeBoss = null;

    let topAttacker = null;
    let maxDmg = 0;
    for (const [uid, dmg] of Object.entries(bossData.damagers)) {
      if (dmg > maxDmg) {
        maxDmg = dmg;
        topAttacker = uid;
      }
    }

    if (topAttacker) {
      addPoints(global.db, topAttacker, bossData.reward);
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      const topNum = topAttacker.split('@')[0];
      return await sock.sendMessage(remoteJid, {
        text: `🎉 *VICTORY! KRAKEN BERHASIL DIKALAHKAN!* 🎉\n\n` +
              `💥 Pukulan pemungkas oleh @${userNum}!\n` +
              `🏆 *Top Damage:* @${topNum} (${maxDmg} Total Damage)\n` +
              `💰 Hadiah *${formatRupiah(bossData.reward)}* langsung dikirim ke pemenang!\n` +
              `🔓 *Lockdown dicabut, harta warga aman dari jarahan!*`,
        mentions: [senderId, topAttacker]
      }, { quoted: msg });
    }
  }

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  await sock.sendMessage(remoteJid, {
    text: `⚔️ @${userNum} ${randomAction} *${global.activeBoss.name}*!${critText}\n` +
          `💥 Damage: *-${finalDamage} HP* (Joran: ${currentRod.name})\n` +
          `❤️ Sisa HP Boss: *${global.activeBoss.hp} / ${global.activeBoss.maxHp}*`,
    mentions: [senderId]
  }, { quoted: msg });
}

module.exports = {
  handleEventCommand,
  handleAttackBossCommand
};
      
