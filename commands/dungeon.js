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

// 🧠 AI GENERATOR YANG LEBIH TAHAN BANTING (DENGAN FALLBACK DINAMIS)
async function generateDungeonData(theme, floor, action, isFighting) {
  try {
    const groq = getGroqClient();
    if (!groq) throw new Error("API Key Groq tidak ditemukan!");

    const prompt = `Kamu adalah game master teks RPG gaya klasik Zork yang sangat imajinatif. 
    Kondisi: Lantai ${floor} dari 100, tema "${theme}". Player baru saja melakukan aksi: "${action}".
    ${isFighting ? "Player sedang bertarung melawan monster." : "Buat deskripsi ruangan baru yang unik dan menegangkan (2-3 kalimat)."}
    
    Tentukan 'encounter' acak di ruangan ini dalam format JSON:
    - Jika monster: { "type": "monster", "name": "Nama Monster Keren", "hp": 100 }
    - Jika item/senjata: { "type": "item", "name": "Nama Senjata/Item Unik" }
    - Jika kosong/aman: { "type": "none", "name": "", "hp": 0 }
    
    Berikan 3-4 pilihan aksi valid (contoh: [".maju", ".serang", ".periksa", ".keluar"]).
    PENTING: Output HARUS berupa objek JSON valid tanpa teks pembungkus markdown.
    Format JSON:
    {
      "description": "...",
      "actions": [".maju", ".periksa", ".keluar"],
      "encounter": {
        "type": "monster|item|none",
        "name": "...",
        "hp": 100
      }
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    let rawContent = completion.choices[0]?.message?.content || '{}';
    // Ekstraksi teks JSON yang bersih dari markdown
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawContent = jsonMatch[0];

    return JSON.parse(rawContent);
  } catch (err) {
    console.error('Groq Dungeon Error Detail:', err.message || err);
    
    // Fallback dinamis agar game tetap seru walau AI sempat slip
    const fallbackMonsters = ['Ork Penjaga Besi', 'The Grue Bermata Merah', 'Kelelawar Vampire', 'Goblin Gua Beracun'];
    const fallbackItems = ['🗡️ Pedang Besi Tua', '🛡️ Perisai Perunggu', '🧪 Ramuan Pemulih HP', '📜 Perkamen Kuno'];
    const rand = Math.random();
    
    let encounterData = { type: 'none', name: '', hp: 0 };
    if (rand < 0.35) {
      encounterData = { type: 'item', name: fallbackItems[Math.floor(Math.random() * fallbackItems.length)] };
    } else if (rand >= 0.35 && rand < 0.70) {
      encounterData = { type: 'monster', name: fallbackMonsters[Math.floor(Math.random() * fallbackMonsters.length)], hp: 100 };
    }

    return {
      description: `Lorong lantai ${floor} tampak sunyi dengan dinding basah berlumut. Aroma misterius tercium kuat di udara sekitar.`,
      actions: [".maju", ".periksa", ".keluar"],
      encounter: encounterData
    };
  }
}

// Hitung total damage berdasarkan senjata di Inventory
function calculateDamage(inventory = []) {
  let baseDamage = 3; // Damage tangan kosong
  let weaponName = "Tangan Kosong";

  inventory.forEach(item => {
    const lower = item.toLowerCase();
    if (lower.includes('legendaris') || lower.includes('excalibur')) {
      baseDamage = 45;
      weaponName = item;
    } else if (lower.includes('pedang') || lower.includes('tombak')) {
      baseDamage = 20;
      weaponName = item;
    } else if (lower.includes('karatan') || lower.includes('belati') || lower.includes('perisai')) {
      baseDamage = 12;
      weaponName = item;
    }
  });

  return { total: baseDamage, weapon: weaponName };
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
      theme: 'Reruntuhan Benteng Kuno & Labirin Bawah Tanah',
      hp: 100,
      inventory: [],
      activeMonster: null,
      monsterMsgKey: null,
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
      encounterMsg = `\n\n⚠️ *MONSTER MUNCUL: ${data.encounter.name} (HP: ${data.encounter.hp})*\n_Ketik .serang untuk menyerang!_`;
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
  
  if (user.dungeon.activeMonster && (userActionClean.includes('maju') || userActionClean.includes('keluar') == false && userActionClean !== 'serang')) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Kamu tidak bisa kabur atau maju! Kalahkan dulu **${user.dungeon.activeMonster.name}** dengan mengetik *.serang*!`, quoted: msg });
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
      text: `🏆🎉 *SELAMAT! MENAKLUKKAN LANTAI 100 DUNGEON!* 🎉🏆\n💰 Hadiah Utama: *+${formatRp(grandPrize)}* masuk saldo!`,
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
  
