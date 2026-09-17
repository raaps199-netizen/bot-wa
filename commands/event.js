// File: commands/event.js
const { deductPoints, addPoints, formatRupiah, getUserData, getTotalScore } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');
const { rods } = require('../utils/fishingData');

global.activeBoss = global.activeBoss || null;

// ==========================================
// 1. HANDLER UTAMA EVENT (.event kraken / megalodon / status)
// ==========================================
async function handleEventCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');

  if (!isGroup) {
    return await sock.sendMessage(remoteJid, { text: '❌ Perintah event grup hanya bisa digunakan di dalam grup WhatsApp!' }, { quoted: msg });
  }

  const subCmd = args[0]?.toLowerCase();

  if (['kraken', 'megalodon', 'boss', 'start'].includes(subCmd)) {
    if (global.activeBoss) {
      return await sock.sendMessage(remoteJid, { 
        text: `⚠️ *EVENT BOSS SEDANG BERLANGSUNG!*\n\nMonster *${global.activeBoss.name}* masih mengamuk!\nHP Tersisa: *${global.activeBoss.hp.toLocaleString()} / ${global.activeBoss.maxHp.toLocaleString()}*\n\nKetik *.serang* sekarang!` 
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

    let selectedBoss;
    if (subCmd === 'kraken') {
      selectedBoss = { 
        name: '🐙 The Ancient Kraken', 
        hp: 500000, 
        maxHp: 500000, 
        reward: 15000000,
        material: 'Kraken Tentacle',
        minMat: 1, maxMat: 4,
        minFrag: 2, maxFrag: 5
      };
    } else if (subCmd === 'megalodon') {
      selectedBoss = { 
        name: '🦈 Megalodon Purba Raksasa', 
        hp: 750000, 
        maxHp: 750000, 
        reward: 22000000,
        material: 'Megalodon Tooth',
        minMat: 1, maxMat: 10,
        minFrag: 5, maxFrag: 10
      };
    } else {
      const bossList = [
        { name: '🐙 The Ancient Kraken', hp: 500000, maxHp: 500000, reward: 15000000, material: 'Kraken Tentacle', minMat: 1, maxMat: 4, minFrag: 2, maxFrag: 5 },
        { name: '🦈 Megalodon Purba Raksasa', hp: 750000, maxHp: 750000, reward: 22000000, material: 'Megalodon Tooth', minMat: 1, maxMat: 10, minFrag: 5, maxFrag: 10 }
      ];
      selectedBoss = bossList[Math.floor(Math.random() * bossList.length)];
    }

    global.activeBoss = {
      name: selectedBoss.name,
      hp: selectedBoss.hp,
      maxHp: selectedBoss.maxHp,
      reward: selectedBoss.reward,
      material: selectedBoss.material,
      minMat: selectedBoss.minMat,
      maxMat: selectedBoss.maxMat,
      minFrag: selectedBoss.minFrag,
      maxFrag: selectedBoss.maxFrag,
      damagers: {},
      participants: {},
      hasEvolved: false
    };

    // ⏱️ TIMER 5 MENIT (Denda 40% untuk SEMUA jika gagal)
    global.activeBoss.timer = setTimeout(async () => {
      if (global.activeBoss) {
        for (const uid of Object.keys(global.db.users)) {
          const userData = getUserData(global.db, uid);
          const totalScore = getTotalScore(userData);

          if (totalScore > 10000) {
            const penalty = Math.floor(totalScore * 0.40);
            deductPoints(global.db, uid, penalty);
          }
        }
        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        global.activeBoss = null;

        await sock.sendMessage(remoteJid, {
          text: `⏰ *WAKTU HABIS (5 MENIT) BOSS MENANG!* 💀💥\n\n` +
                `Monster berhasil menghancurkan perairan karena kalian gagal membunuhnya tepat waktu!\n` +
                `⚠️ Hukuman telak! **Seluruh harta kekayaan warga** dijarah monster sebesar **40%** karena gagal total!\n\n` +
                `_Semua aktivitas kembali normal._`
        });
      }
    }, 5 * 60 * 1000);

    let announcement = `🚨 *WORLD BOSS MUNCUL DI PERAIRAN!* 🚨\n\n`;
    announcement += `⚠️ Monster legendaris *${selectedBoss.name}* menampakkan diri!\n`;
    announcement += `⏱️ Batas Waktu: *5 Menit*\n`;
    announcement += `❤️ Total HP Boss: *${selectedBoss.hp.toLocaleString()}*\n`;
    announcement += `🎁 Drop Material: *${selectedBoss.material}* & *Rebirth Fragments*\n`;
    announcement += `💰 Hadiah Utama: *${formatRupiah(selectedBoss.reward)}*\n\n`;
    announcement += `🔒 *Semua aktivitas game dibekukan!* Warga wajib mengetik *.serang* untuk melawan atau harta dijarah 40%!\n\n`;
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
      text: `📊 *STATUS RAID BOSS*\n\n🦖 Monster: *${global.activeBoss.name}*\n❤️ HP: *${global.activeBoss.hp.toLocaleString()} / ${global.activeBoss.maxHp.toLocaleString()}*\n\nKetik *.serang* untuk menggempur!`
    }, { quoted: msg });
  }

  await sock.sendMessage(remoteJid, {
    text: `⚠️ *Format Event Salah*\nGunakan: *.event kraken*, *.event megalodon*, atau *.event status*`
  }, { quoted: msg });
}

// ==========================================
// 2. HANDLER SERANGAN BOSS (.serang)
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

  const user = getUserData(global.db, senderId);
  const activeRodId = user.activeRod || 'training';
  const currentRod = rods[activeRodId] || rods['training'];

  const baseDamage = Math.floor((Math.random() * 500 + 400) * (currentRod.luck * 0.6));
  
  // 15% Peluang Critical Hit
  const isCrit = Math.random() < 0.15;
  const finalDamage = isCrit ? Math.floor(baseDamage * 2) : baseDamage;

  global.activeBoss.hp -= finalDamage;
  global.activeBoss.damagers[senderId] = (global.activeBoss.damagers[senderId] || 0) + finalDamage;

  const userNum = senderId.split('@')[0];

  // ⚡ CHANCE EVOLUSI 1/5 (20%) KETIKA HP <= 50%
  if (!global.activeBoss.hasEvolved && global.activeBoss.hp <= global.activeBoss.maxHp * 0.5) {
    global.activeBoss.hasEvolved = true;

    if (Math.random() < 0.50) {
      if (global.activeBoss.name.includes('Kraken')) {
        global.activeBoss.name = '🐙 NIGHTMARE ANCIENT KRAKEN (EVOLVED!)';
        global.activeBoss.maxHp += 300000;
        global.activeBoss.hp += 300000;
        global.activeBoss.reward += 10000000;
      } else {
        global.activeBoss.name = '🦈 ABYSSAL MEGALODON LORD (EVOLVED!)';
        global.activeBoss.maxHp += 400000;
        global.activeBoss.hp += 400000;
        global.activeBoss.reward += 15000000;
      }

      await sock.sendMessage(remoteJid, {
        text: `⚡ *PERINGATAN DARURAT! BOSS BEREVOLASI!* 🩸🔥\n\n` +
              `Monster menyerap energi lautan dan bangkit ke bentuk terkuatnya:\n👉 *${global.activeBoss.name}*!\n\n` +
              `❤️ Darahnya kembali menebal secara drastis!\n` +
              `💰 Karena tingkat bahaya meningkat, **Hadiah Utama** melonjak menjadi *${formatRupiah(global.activeBoss.reward)}*!\n\n` +
              `_Hajar terus, jangan kasih ampun!_`
      });
    } else {
      await sock.sendMessage(remoteJid, {
        text: `🌀 *Cahaya gelap sempat berputar di tubuh ${global.activeBoss.name}, namun gagal memicu evolusi!* Lanjutkan gempuran!`
      });
    }
  }

  const attackActions = [
    'menebas tentakel/tubuh dengan kekuatan penuh',
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
      // 1. Berikan Poin Utama & Kills ke Top Attacker
      addPoints(global.db, topAttacker, bossData.reward);
      const topUserData = getUserData(global.db, topAttacker);
      topUserData.bossKills = (topUserData.bossKills || 0) + 1;

      // 2. DISTRIBUSI LOOT RANDOM KE SEMUA PARTISIPAN (MASUK INVENTORY)
      const allDamagers = Object.keys(bossData.damagers);
      allDamagers.forEach(uid => {
        const uData = getUserData(global.db, uid);
        
        uData.inventory = uData.inventory || {};
        uData.inventory.materials = uData.inventory.materials || {};

        // Random jumlah material (Kraken: 1-4, Megalodon: 1-10)
        const matEarned = Math.floor(Math.random() * (bossData.maxMat - bossData.minMat + 1)) + bossData.minMat;
        // Random jumlah fragments
        const fragEarned = Math.floor(Math.random() * (bossData.maxFrag - bossData.minFrag + 1)) + bossData.minFrag;

        uData.inventory.materials[bossData.material] = (uData.inventory.materials[bossData.material] || 0) + matEarned;
        uData.inventory.rebirthFragments = (uData.inventory.rebirthFragments || 0) + fragEarned;
      });

      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      const topNum = topAttacker.split('@')[0];
      return await sock.sendMessage(remoteJid, {
        text: `🎉 *VICTORY! BOSS TERKUAT BERHASIL DIKALAHKAN!* 🎉\n\n` +
              `💥 Pukulan pemungkas oleh @${userNum}!\n` +
              `🏆 *Top Damage:* @${topNum} (${maxDmg.toLocaleString()} Total Damage)\n` +
              `💰 Hadiah Utama *${formatRupiah(bossData.reward)}* dikirim ke Top Attacker!\n` +
              `🎁 *Bonus Loot:* Material & Rebirth Fragments berhasil masuk ke Inventory (.inv) masing-masing partisipan!\n` +
              `🔓 *Lockdown dicabut, harta warga aman!*`,
        mentions: [senderId, topAttacker]
      }, { quoted: msg });
    }
  }

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  await sock.sendMessage(remoteJid, {
    text: `⚔️ @${userNum} ${randomAction} *${global.activeBoss.name}*!${critText}\n` +
          `💥 Damage: *-${finalDamage.toLocaleString()} HP* (Joran: ${currentRod.name})\n` +
          `❤️ Sisa HP Boss: *${global.activeBoss.hp.toLocaleString()} / ${global.activeBoss.maxHp.toLocaleString()}*`,
    mentions: [senderId]
  }, { quoted: msg });
}

module.exports = {
  handleEventCommand,
  handleAttackBossCommand
};
