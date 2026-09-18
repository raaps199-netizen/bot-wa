// File: commands/dungeon.js
const { getSenderId } = require('../utils/jid-utils');
const helper = require('../utils/helper');
const Groq = require('groq-sdk');
const config = require('../config');

function getGroqClient() {
  const apiKey = (global.config && global.config.groqKey) || (config && config.groqKey) || process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// 🧠 AI MENGHASILKAN SEMUA (Ruangan, Aksi, Monster, & Item) SECARA DINAMIS
async function generateDungeonData(theme, floor, action, isFighting) {
  try {
    const groq = getGroqClient();
    if (!groq) {
      return {
        description: "Kamu berada di lorong bawah tanah yang gelap dan lembab.",
        actions: [".maju", ".periksa", ".keluar"],
        encounter: { type: "none" }
      };
    }

    const prompt = `Kamu adalah game master teks RPG gaya klasik Zork yang sangat kreatif. 
    Kondisi: Lantai ${floor} dari 100, tema "${theme}". Player baru saja melakukan aksi: "${action}".
    ${isFighting ? "Player sedang bertarung melawan monster. Berikan narasi pertarungan singkat." : "Buat deskripsi ruangan baru yang imajinatif (3 kalimat)."}
    
    Tentukan juga apakah ada 'encounter' (kejadian acak) di ruangan ini: 
    - Bisa berupa monster (type: "monster", name: "Nama Monster", hp: 80 s/d 150)
    - Bisa berupa peti item (type: "item", name: "Nama Item/Senjata", description: "...")
    - Atau kosong (type: "none")
    
    Berikan 3-4 pilihan aksi valid (contoh format: .maju, .serang, .periksa, .ambil, .keluar).
    Format output JSON MURNI tanpa markdown: 
    {
      "description": "...",
      "actions": [".maju", ".serang", ".periksa", ".keluar"],
      "encounter": {
        "type": "monster|item|none",
        "name": "...",
        "hp": 100,
        "itemReward": "..."
      }
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    let rawContent = completion.choices[0]?.message?.content || '{}';
    rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(rawContent);
  } catch (err) {
    console.error('Groq Dungeon Error:', err);
    return {
      description: "Suasana di lorong ini mendadak senyap dan mencekam.",
      actions: [".maju", ".keluar"],
      encounter: { type: "none" }
    };
  }
}

// Hitung total damage berdasarkan senjata di Inventory
function calculateDamage(inventory = []) {
  let baseDamage = 3; // Damage tangan kosong
  let weaponName = "Tangan Kosong";
  let bonusDamage = 0;

  inventory.forEach(item => {
    const lower = item.toLowerCase();
    if (lower.includes('pedang legendaris') || lower.includes('excalibur')) {
      bonusDamage = 45;
      weaponName = item;
    } else if (lower.includes('pedang') || lower.includes('tombak')) {
      bonusDamage = 20;
      weaponName = item;
    } else if (lower.includes('karatan') || lower.includes('belati')) {
      bonusDamage = 12;
      weaponName = item;
    }
  });

  return { total: baseDamage + bonusDamage, weapon: weaponName, bonus: bonusDamage };
}

async function handleDungeonCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid);
  if (!senderId) return;

  if (!global.db.users) global.db.users = {};
  if (!global.db.users[senderId]) global.db.users[senderId] = {};

  const user = global.db.users[senderId];
  const subCommand = args[0]?.toLowerCase().replace('.', '').trim();

  if (!user.dungeon) {
    user.dungeon = {
      active: false,
      floor: 1,
      theme: 'Reruntuhan Benteng Kuno',
      hp: 100,
      inventory: [],
      activeMonster: null, // Menyimpan data monster saat bertarung
      monsterMsgKey: null, // Menyimpan key pesan bot untuk fitur edit pesan
      validChoices: ['.maju', '.keluar']
    };
  }

  // 1. Masuk dungeon
  if (!user.dungeon.active) {
    user.dungeon.active = true;
    const currentFloor = user.dungeon.floor || 1;
    const data = await generateDungeonData(user.dungeon.theme, currentFloor, 'Memasuki gerbang dungeon', false);
    
    user.dungeon.validChoices = data.actions.map(a => a.toLowerCase().replace('.', '').trim());
    user.dungeon.validChoices.push('keluar', 'exit', 'serang');

    let encounterMsg = '';
    if (data.encounter?.type === 'monster') {
      user.dungeon.activeMonster = { name: data.encounter.name, hp: data.encounter.hp, maxHp: data.encounter.hp };
      encounterMsg = `\n\n⚠️ *MONSTER MUNCUL: ${data.encounter.name} (HP: ${data.encounter.hp})*\n_Ketik .serang untuk menghabisinya!_`;
    } else if (data.encounter?.type === 'item') {
      user.dungeon.inventory.push(data.encounter.name);
      encounterMsg = `\n\n✨ *MENEMUKAN ITEM:* Mendapatkan **${data.encounter.name}** masuk ke tas!`;
    }

    const sent = await sock.sendMessage(remoteJid, {
      text: `🚀 *PETUALANGAN ZORK DUNGEON DIMULAI*\n📍 Lantai ${currentFloor}/100\n\n${data.description}\n\n🧭 *Aksi:* ${data.actions.join(' | ')}${encounterMsg}`,
      quoted: msg
    });
    if (data.encounter?.type === 'monster') user.dungeon.monsterMsgKey = sent.key;
    return;
  }

  // 2. Keluar dungeon
  if (subCommand === 'keluar' || subCommand === 'exit') {
    user.dungeon.active = false;
    user.dungeon.activeMonster = null;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, {
      text: `💾 *PROGRES TERSIMPAN!*\nPosisi aman di **Lantai ${user.dungeon.floor}**. Ketik .dungeon untuk lanjut!`,
      quoted: msg
    });
  }

  // 3. FITUR UTAMA: .SERANG (Live Edit Message HP Monster)
  if (subCommand === 'serang') {
    if (!user.dungeon.activeMonster) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Tidak ada monster di ruangan ini untuk diserang!`, quoted: msg });
    }

    const dmgInfo = calculateDamage(user.dungeon.inventory);
    user.dungeon.activeMonster.hp -= dmgInfo.total;
    if (user.dungeon.activeMonster.hp < 0) user.dungeon.activeMonster.hp = 0;

    const monster = user.dungeon.activeMonster;
    const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

    if (monster.hp <= 0) {
      // Monster Mati
      const bounty = user.dungeon.floor * 25000;
      if (typeof helper.addPoints === 'function') {
        try { helper.addPoints(global.db, senderId, bounty); } catch (e) {}
      }
      
      const defeatText = `⚔️ *SERANGAN TELAK! (${dmgInfo.weapon} - ${dmgInfo.total} DMG)*\n\n` +
                         `🎉 *MONSTER ${monster.name.toUpperCase()} BERHASIL DIKALAHKAN!* 💀\n` +
                         `💰 Hadiah Rampasan: *+${formatRp(bounty)}* masuk ke saldo!\n\n` +
                         `_Ketik .maju untuk melanjutkan perjalanan ke lantai berikutnya._`;

      // EDIT PESAN LAMA SECARA REAL-TIME
      if (user.dungeon.monsterMsgKey) {
        try {
          await sock.sendMessage(remoteJid, { text: defeatText, edit: user.dungeon.monsterMsgKey });
        } catch (e) {
          await sock.sendMessage(remoteJid, { text: defeatText, quoted: msg });
        }
      } else {
        await sock.sendMessage(remoteJid, { text: defeatText, quoted: msg });
      }

      user.dungeon.activeMonster = null;
      user.dungeon.monsterMsgKey = null;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();
      return;
    } else {
      // Monster Masih Hidup (Update HP via Edit Message)
      const fightText = `⚔️ *KAMU MENYERANG DENGAN ${dmgInfo.weapon.toUpperCase()}!* (-${dmgInfo.total} DMG)\n\n` +
                        `⚠️ *STATUS PERTARUNGAN*\n` +
                        `👾 Monster: *${monster.name}*\n` +
                        `❤️ HP Monster: *[ ${monster.hp} / ${monster.maxHp} ]*\n\n` +
                        `_Ketik .serang lagi untuk melancarkan serangan berikutnya!_`;

      if (user.dungeon.monsterMsgKey) {
        try {
          await sock.sendMessage(remoteJid, { text: fightText, edit: user.dungeon.monsterMsgKey });
        } catch (e) {
          await sock.sendMessage(remoteJid, { text: fightText, quoted: msg });
        }
      }
      return;
    }
  }

  // 4. Validasi Aksi Biasa
  const userActionClean = args.join(' ').toLowerCase().replace('.', '').trim();
  
  // Jika sedang ada monster aktif, cegah kabur sembarangan sebelum monster mati
  if (user.dungeon.activeMonster && userActionClean.includes('maju')) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Kamu tidak bisa maju! Kalahkan dulu **${user.dungeon.activeMonster.name}** dengan mengetik *.serang*!`, quoted: msg });
  }

  // 5. Proses Pindah Lantai / Aksi Normal
  user.dungeon.floor += 1;
  const earnedPrize = user.dungeon.floor * 20000;
  if (typeof helper.addPoints === 'function') {
    try { helper.addPoints(global.db, senderId, earnedPrize); } catch (e) {}
  }
  const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

  // Cek Kemenangan Lantai 100
  if (user.dungeon.floor >= 100) {
    const grandPrize = 50000000;
    if (typeof helper.addPoints === 'function') {
      try { helper.addPoints(global.db, senderId, grandPrize); } catch (e) {}
    }
    user.dungeon.active = false;
    user.dungeon.floor = 1;
    user.dungeon.activeMonster = null;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, {
      text: `🏆🎉 *SELAMAT! MENAKLUKKAN LANTAI 100 DUNGEON!* 🎉🏆\n💰 Hadiah Utama: *+${formatRp(grandPrize)}*!`,
      quoted: msg
    });
  }

  const data = await generateDungeonData(user.dungeon.theme, user.dungeon.floor, args.join(' '), false);
  user.dungeon.validChoices = data.actions.map(a => a.toLowerCase().replace('.', '').trim());
  user.dungeon.validChoices.push('keluar', 'exit', 'serang');

  let encounterMsg = `\n\n🎁 *Hadiah Lantai ${user.dungeon.floor}:* Mendapatkan *+${formatRp(earnedPrize)}*!`;
  if (data.encounter?.type === 'monster') {
    user.dungeon.activeMonster = { name: data.encounter.name, hp: data.encounter.hp, maxHp: data.encounter.hp };
    encounterMsg += `\n\n⚠️ *MONSTER MUNCUL: ${data.encounter.name} (HP: ${data.encounter.hp})*\n_Ketik .serang untuk bertarung!_`;
  } else if (data.encounter?.type === 'item') {
    user.dungeon.inventory.push(data.encounter.name);
    encounterMsg += `\n\n✨ *MENEMUKAN ITEM:* Mendapatkan **${data.encounter.name}**!`;
  }

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  const sent = await sock.sendMessage(remoteJid, {
    text: `🕳️ *ZORK DUNGEON (Lantai ${user.dungeon.floor}/100)*\n\n${data.description}\n\n🧭 *Aksi:* ${data.actions.join(' | ')}${encounterMsg}`,
    quoted: msg
  });

  if (data.encounter?.type === 'monster') {
    user.dungeon.monsterMsgKey = sent.key;
  } else {
    user.dungeon.activeMonster = null;
  }
}

module.exports = handleDungeonCommand;
