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

async function generateDungeonRoom(theme, floor, action) {
  try {
    const groq = getGroqClient();
    if (!groq) throw new Error("API Key Groq tidak ditemukan!");

    const prompt = `Kamu adalah game master teks RPG gaya klasik Zork yang sangat imajinatif dan menantang. 
    Kondisi: Player berada di Lantai ${floor} dari 100 dengan tema "${theme}". 
    Player baru saja melakukan aksi: "${action}".
    Buat deskripsi ruangan/lantai saat ini yang sangat detail, menegangkan, dan penuh rahasia (3-4 kalimat).
    
    Tentukan juga apakah ada 'encounter' atau kejadian di ruangan ini:
    - Jika ada monster: { "type": "monster", "name": "Nama Monster", "hp": 100 }
    - Jika ada item/obor/peti: { "type": "item", "name": "Nama Item" }
    - Jika aman: { "type": "none", "name": "", "hp": 0 }
    
    Berikan 4 pilihan aksi yang variatif untuk player di ruangan ini. 
    PENTING: Harus ada minimal 1 aksi untuk berinteraksi/mencari item (contoh: .ambil obor, .periksa peti), dan minimal 1 aksi untuk pindah/naik ke lantai berikutnya (contoh: .naik tangga, .buka pintu berat).
    
    Format output JSON MURNI tanpa markdown:
    {
      "description": "...",
      "actions": [".ambil obor", ".periksa sudut", ".cari item", ".naik tangga"],
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
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawContent = jsonMatch[0];

    return JSON.parse(rawContent);
  } catch (err) {
    console.error('Groq Dungeon Error:', err);
    return {
      description: `Kamu berada di ruangan remang-remang lantai ${floor}. Ada bau belerang dan lorong misterius di depanmu.`,
      actions: [".ambil obor", ".periksa peti", ".cari item", ".naik tangga"],
      encounter: { type: 'none', name: '', hp: 0 }
    };
  }
}

function calculateDamage(inventory = []) {
  let baseDamage = 3;
  let weaponName = "Tangan Kosong";
  inventory.forEach(item => {
    const lower = item.toLowerCase();
    if (lower.includes('legendaris') || lower.includes('excalibur')) { baseDamage = 45; weaponName = item; }
    else if (lower.includes('pedang') || lower.includes('tombak')) { baseDamage = 20; weaponName = item; }
    else if (lower.includes('karatan') || lower.includes('belati') || lower.includes('obor')) { baseDamage = 10; weaponName = item; }
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
      validChoices: []
    };
  }

  // 1. Masuk dungeon
  if (!user.dungeon.active) {
    user.dungeon.active = true;
    const currentFloor = user.dungeon.floor || 1;
    const data = await generateDungeonRoom(user.dungeon.theme, currentFloor, 'Memasuki gerbang dungeon');
    
    user.dungeon.validChoices = data.actions.map(a => a.toLowerCase().replace('.', '').trim());
    user.dungeon.validChoices.push('keluar', 'exit', 'serang');

    let encounterMsg = '';
    if (data.encounter?.type === 'monster') {
      user.dungeon.activeMonster = { name: data.encounter.name, hp: data.encounter.hp, maxHp: data.encounter.hp };
      encounterMsg = `\n\n⚠️ *MONSTER MUNCUL: ${data.encounter.name} (HP: ${data.encounter.hp})*\n_Ketik .serang untuk bertarung!_`;
    } else if (data.encounter?.type === 'item') {
      user.dungeon.inventory.push(data.encounter.name);
      encounterMsg = `\n\n✨ *MENEMUKAN ITEM:* Mendapatkan **${data.encounter.name}** masuk ke tas!`;
    }

    const sent = await sock.sendMessage(remoteJid, {
      text: `🚀 *PETUALANGAN ZORK DUNGEON DIMULAI*\n📍 Lantai ${currentFloor}/100\n\n${data.description}\n\n🧭 *Aksi Tersedia:* \n${data.actions.join(' | ')}${encounterMsg}`,
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

  // 3. Fitur Serang Monster
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
      const bounty = user.dungeon.floor * 25000;
      if (typeof helper.addPoints === 'function') {
        try { helper.addPoints(global.db, senderId, bounty); } catch (e) {}
      }
      
      const defeatText = `⚔️ *SERANGAN TELAK! (${dmgInfo.weapon} - ${dmgInfo.total} DMG)*\n\n` +
                         `🎉 *MONSTER ${monster.name.toUpperCase()} BERHASIL DIKALAHKAN!* 💀\n` +
                         `💰 Hadiah Rampasan: *+${formatRp(bounty)}* masuk ke saldo!\n\n` +
                         `_Sekarang kamu bebas mencari item atau pilih opsi untuk naik ke lantai berikutnya._`;

      if (user.dungeon.monsterMsgKey) {
        try { await sock.sendMessage(remoteJid, { text: defeatText, edit: user.dungeon.monsterMsgKey }); }
        catch (e) { await sock.sendMessage(remoteJid, { text: defeatText, quoted: msg }); }
      } else {
        await sock.sendMessage(remoteJid, { text: defeatText, quoted: msg });
      }

      user.dungeon.activeMonster = null;
      user.dungeon.monsterMsgKey = null;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();
      return;
    } else {
      const fightText = `⚔️ *KAMU MENYERANG DENGAN ${dmgInfo.weapon.toUpperCase()}!* (-${dmgInfo.total} DMG)\n\n` +
                        `⚠️ *STATUS PERTARUNGAN*\n` +
                        `👾 Monster: *${monster.name}*\n` +
                        `❤️ HP Monster: *[ ${monster.hp} / ${monster.maxHp} ]*\n\n` +
                        `_Ketik .serang lagi untuk menghabisinya!_`;

      if (user.dungeon.monsterMsgKey) {
        try { await sock.sendMessage(remoteJid, { text: fightText, edit: user.dungeon.monsterMsgKey }); }
        catch (e) { await sock.sendMessage(remoteJid, { text: fightText, quoted: msg }); }
      }
      return;
    }
  }

  // 4. Validasi aksi user
  const userActionClean = args.join(' ').toLowerCase().replace('.', '').trim();

  // Jika ada monster aktif, player wajib mengalahkan monster dulu sebelum bisa ngapa-ngapain
  if (user.dungeon.activeMonster) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Kamu dikurung monster **${user.dungeon.activeMonster.name}**! Kalahkan dulu dengan mengetik *.serang*!`, quoted: msg });
  }

  // 5. ATURAN UTAMA: CEK APAKAH AKSI ADALAH PINDAH/NAIK LANTAI ATAU HANYA INTERAKSI DI LANTAI YANG SAMA
  const isMovingUp = userActionClean.includes('naik') || userActionClean.includes('lanjut') || userActionClean.includes('pintu') || userActionClean.includes('maju') || userActionClean.includes('koridor');

  const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

  if (isMovingUp) {
    // Pindah ke lantai berikutnya
    user.dungeon.floor += 1;
    const earnedPrize = user.dungeon.floor * 20000;
    if (typeof helper.addPoints === 'function') {
      try { helper.addPoints(global.db, senderId, earnedPrize); } catch (e) {}
    }

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

    // Generate ruangan baru di lantai baru
    const data = await generateDungeonRoom(user.dungeon.theme, user.dungeon.floor, args.join(' '));
    user.dungeon.validChoices = data.actions.map(a => a.toLowerCase().replace('.', '').trim());
    user.dungeon.validChoices.push('keluar', 'exit', 'serang');

    let encounterMsg = `\n\n🎁 *Hadiah Naik Lantai ${user.dungeon.floor}:* Mendapatkan *+${formatRp(earnedPrize)}*!`;
    if (data.encounter?.type === 'monster') {
      user.dungeon.activeMonster = { name: data.encounter.name, hp: data.encounter.hp, maxHp: data.encounter.hp };
      encounterMsg += `\n\n⚠️ *MONSTER MUNCUL: ${data.encounter.name} (HP: ${data.encounter.hp})*\n_Ketik .serang untuk bertarung!_`;
    } else if (data.encounter?.type === 'item') {
      user.dungeon.inventory.push(data.encounter.name);
      encounterMsg += `\n✨ *MENEMUKAN ITEM:* Mendapatkan **${data.encounter.name}**!`;
    }

    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    const sent = await sock.sendMessage(remoteJid, {
      text: `🕳️ *ZORK DUNGEON (Lantai ${user.dungeon.floor}/100)*\n\n${data.description}\n\n🧭 *Aksi Tersedia:* \n${data.actions.join(' | ')}${encounterMsg}`,
      quoted: msg
    });

    if (data.encounter?.type === 'monster') {
      user.dungeon.monsterMsgKey = sent.key;
    } else {
      user.dungeon.activeMonster = null;
    }
    return;

  } else {
    // Interaksi di lantai yang sama (misal: .ambil obor, .periksa peti, dll)
    const rand = Math.random();
    let interactionResult = '';

    if (rand < 0.4) {
      const foundItems = ['🔦 Obor Menyala', '🧪 Ramuan Kecil HP', '💎 Permata Berkilau', '🗝️ Kunci Besi Tua', '🗡️ Belati Berkarat'];
      const newItem = foundItems[Math.floor(Math.random() * foundItems.length)];
      user.dungeon.inventory.push(newItem);
      interactionResult = `\n\n✨ *HASIL INTERAKSI:* Kamu berhasil menemukan dan mengambil **${newItem}** masuk ke dalam tas!`;
    } else if (rand >= 0.4 && rand < 0.7) {
      const foundMonster = ['Laba-laba Raksasa', 'Tikus Bawah Tanah', 'Roh Penjaga Lorong', 'Goblin Kecil'];
      const mName = foundMonster[Math.floor(Math.random() * foundMonster.length)];
      user.dungeon.activeMonster = { name: mName, hp: 80, maxHp: 80 };
      interactionResult = `\n\n⚠️ *JEBAKAN TERPICU!* Saat kamu memeriksa area tersebut, tiba-tiba muncul **${mName} (HP: 80)** menyerangmu!\n_Ketik .serang untuk menghadapinya!_`;
    } else {
      interactionResult = `\n\n🔍 *HASIL INTERAKSI:* Kamu memeriksa sudut ruangan dengan teliti, namun hanya menemukan tumpukan debu dan tulang-belukar tua.`;
    }

    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    const sent = await sock.sendMessage(remoteJid, {
      text: `🕳️ *ZORK DUNGEON (Lantai ${user.dungeon.floor}/100)*\n\n_Kamu melakukan aksi: "${args.join(' ')}"..._${interactionResult}\n\n🧭 *Info:* _Lanjutkan eksplorasi atau pilih opsi untuk naik ke lantai berikutnya jika sudah siap._`,
      quoted: msg
    });

    if (user.dungeon.activeMonster) {
      user.dungeon.monsterMsgKey = sent.key;
    }
    return;
  }
}

module.exports = handleDungeonCommand;
                                                 
