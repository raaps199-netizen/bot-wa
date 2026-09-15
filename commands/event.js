const { rods } = require('../utils/fishingData'); // Pastikan rods diimport dari fishingData

async function handleAttackBossCommand(sock, msg, senderId) {
  const remoteJid = msg.key.remoteJid;

  if (!global.activeBoss) {
    return await sock.sendMessage(remoteJid, { text: `❌ Tidak ada World Boss yang aktif sekarang!` }, { quoted: msg });
  }

  global.activeBoss.participants[senderId] = true;

  // Cooldown serang 4 detik biar pas dan gak terlalu lambat
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

  // Base damage dihitung dari luck joran biar makin mahal joran makin sakit
  const baseDamage = Math.floor((Math.random() * 500 + 400) * (currentRod.luck * 0.6));
  
  // 15% Peluang Critical Hit (Damage x2)
  const isCrit = Math.random() < 0.15;
  const finalDamage = isCrit ? Math.floor(baseDamage * 2) : baseDamage;

  global.activeBoss.hp -= finalDamage;
  global.activeBoss.damagers[senderId] = (global.activeBoss.damagers[senderId] || 0) + finalDamage;

  const userNum = senderId.split('@')[0];

  // Variasi teks serangan biar seru
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
    clearTimeout(global.activeBoss.timer); // Matikan timer denda 3 menit
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

