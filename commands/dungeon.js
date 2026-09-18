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

    const prompt = `Kamu adalah game master teks RPG gaya klasik Zork yang sangat imajinatif. 
    Kondisi: Player berada di Lantai ${floor} dari 100 dengan tema "${theme}". 
    Player baru saja melakukan aksi: "${action}".
    
    Buat deskripsi ruangan/lantai baru yang unik, atmosferik, dan bereaksi terhadap aksi player tersebut (3-4 kalimat).
    Berikan 4 pilihan aksi atau perintah yang spesifik dan bervariasi sesuai situasi (contoh: .periksa meja, .buka peti, .intip celah dinding, .naik tangga). 
    PENTING: Pastikan ada minimal 1 aksi yang jelas untuk naik/pindah lantai (misal: .naik tangga, .lanjut lantai).
    
    Tentukan 'encounter' acak di ruangan ini:
    - Jika ada monster: { "type": "monster", "name": "Nama Monster", "hp": 100 }
    - Jika ada item/harta: { "type": "item", "name": "Nama Item" }
    - Jika aman: { "type": "none", "name": "", "hp": 0 }
    
    Format output JSON MURNI tanpa markdown:
    {
      "description": "...",
      "actions": [".aksi_1", ".aksi_2", ".aksi_3", ".naik tangga"],
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
      description: `Kamu berada di lantai ${floor} yang sunyi dan mencekam. Ada jalur misterius di hadapanmu.`,
      actions: [".periksa sekitar", ".buka peti", ".cari jalan", ".naik tangga"],
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
    else if (lower.includes('karatan') || lower.includes('belati') || lower.includes('obor') || lower.includes('besi')) { baseDamage = 12; weaponName = item; }
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

  // Inisialisasi data dungeon dengan aman (mencegah undefined/undefined)
  if (!user.dungeon) {
    user.dungeon = {
      active: false,
      floor: 1,
      theme: 'Reruntuhan Benteng Kuno & Labirin Bawah Tanah',
      hp: 100,
      maxHp: 100,
      inventory: [],
      activeMonster: null,
      monsterMsgKey: null,
      validChoices: []
    };
  }

  if (user.dungeon.hp === undefined || isNaN(user.dungeon.hp)) { 
    user.dungeon.hp = 100; 
    user.dungeon.maxHp = 100; 
  }

  // 1. Masuk Dungeon / Inisialisasi Awal
  if (!user.dungeon.active) {
    user.dungeon.active = true;
    user.dungeon.hp = user.dungeon.maxHp;
    const currentFloor = user.dungeon.floor || 1;
    const roomData = await generateDungeonRoom(user.dungeon.theme, currentFloor, 'Memasuki gerbang dungeon');
    
    user.dungeon.validChoices = roomData.actions.map(a => a.toLowerCase().replace('.', '').trim());
    user.dungeon.validChoices.push('keluar', 'exit', 'serang');

    let encounterMsg = '';
    if (roomData.encounter?.type === 'monster') {
      user.dungeon.activeMonster = { name: roomData.encounter.name, hp: roomData.encounter.hp, maxHp: roomData.encounter.hp };
      encounterMsg = `\n\n⚠️ *MONSTER MUNCUL: ${roomData.encounter.name}*\n❤️ HP Monster: [ ${roomData.encounter.hp} / ${roomData.encounter.hp} ]\n_Ketik .serang untuk bertarung!_`;
    } else if (roomData.encounter?.type === 'item') {
      user.dungeon.inventory.push(roomData.encounter.name);
      encounterMsg = `\n\n✨ *MENEMUKAN ITEM:* Mendapatkan **${roomData.encounter.name}** masuk ke tas!`;
    }

    const sent = await sock.sendMessage(remoteJid, {
      text: `🚀 *PETUALANGAN ZORK DUNGEON DIMULAI*\n📍 Lantai ${currentFloor}/100 | ❤️ HP Kamu: [ ${user.dungeon.hp}/${user.dungeon.maxHp} ]\n\n${roomData.description}\n\n🧭 *Aksi Tersedia:* \n${roomData.actions.join(' | ')}${encounterMsg}`,
      quoted: msg
    });
    if (roomData.encounter?.type === 'monster') user.dungeon.monsterMsgKey = sent.key;
    return;
  }

  // 2. Keluar Dungeon
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

    const monster = user.dungeon.activeMonster;
    const dmgInfo = calculateDamage(user.dungeon.inventory);
    
    monster.hp -= dmgInfo.total;
    if (monster.hp < 0) monster.hp = 0;

    const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

    if (monster.hp <= 0) {
      const bounty = user.dungeon.floor * 25000;
      if (typeof helper.addPoints === 'function') {
        try { helper.addPoints(global.db, senderId, bounty); } catch (e) {}
      }
      
      const defeatText = `⚔️ *SERANGAN TELAK! (${dmgInfo.weapon} - ${dmgInfo.total} DMG)*\n\n` +
                         `🎉 *MONSTER ${monster.name.toUpperCase()} BERHASIL DIKALAHKAN!* 💀\n` +
                         `❤️ HP Kamu: [ ${user.dungeon.hp} / ${user.dungeon.maxHp} ]\n` +
                         `💰 Hadiah Rampasan: *+${formatRp(bounty)}* masuk ke saldo!\n\n` +
                         `_Monster sudah tumbang. Pilih aksi selanjutnya atau naik ke lantai berikutnya._`;

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
    }

    const monsterDmg = Math.floor(Math.random() * 10) + 7;
    user.dungeon.hp -= monsterDmg;
    if (user.dungeon.hp < 0) user.dungeon.hp = 0;

    if (user.dungeon.hp <= 0) {
      user.dungeon.active = false;
      user.dungeon.floor = Math.max(1, user.dungeon.floor - 2);
      user.dungeon.activeMonster = null;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      const deadText = `💀 *KAMU TEWAS DI TANGAN ${monster.name.toUpperCase()}!* 🪦\n\n` +
                       `Monster melancarkan serangan balasan fatal (${monsterDmg} DMG).\n` +
                       `⚠️ Kamu terpental turun ke *Lantai ${user.dungeon.floor}* akibat kekalahan ini!`;

      if (user.dungeon.monsterMsgKey) {
        try { await sock.sendMessage(remoteJid, { text: deadText, edit: user.dungeon.monsterMsgKey }); }
        catch (e) { await sock.sendMessage(remoteJid, { text: deadText, quoted: msg }); }
      } else {
        await sock.sendMessage(remoteJid, { text: deadText, quoted: msg });
      }
      user.dungeon.monsterMsgKey = null;
      return;
    }

    const fightText = `⚔️ *TARUNG SENGIT!*\n` +
                      `• Kamu menyerang dengan *${dmgInfo.weapon}* (-${dmgInfo.total} DMG)\n` +
                      `• ${monster.name} membalas! (-${monsterDmg} DMG)\n\n` +
                      `⚠️ *STATUS TERKINI*\n` +
                      `👾 Monster: *${monster.name}* | HP: *[ ${monster.hp} / ${monster.maxHp} ]*\n` +
                      `👤 Kamu | ❤️ HP: *[ ${user.dungeon.hp} / ${user.dungeon.maxHp} ]*\n\n` +
                      `_Ketik .serang lagi untuk melanjutkan!_`;

    if (user.dungeon.monsterMsgKey) {
      try { await sock.sendMessage(remoteJid, { text: fightText, edit: user.dungeon.monsterMsgKey }); }
      catch (e) { await sock.sendMessage(remoteJid, { text: fightText, quoted: msg }); }
    }
    return;
  }

  if (user.dungeon.activeMonster) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Kamu sedang diserang oleh **${user.dungeon.activeMonster.name}**! Kalahkan dulu dengan mengetik *.serang*!`, quoted: msg });
  }

  // 4. Validasi Ketikan User
  const userActionClean = args.join(' ').toLowerCase().replace('.', '').trim();
  const isValid = user.dungeon.validChoices?.some(c => userActionClean.includes(c)) || ['keluar', 'exit', 'serang'].includes(userActionClean);

  if (!isValid && userActionClean !== '') {
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ *Aksi tidak dikenali di ruangan ini!* \n_Gunakan pilihan aksi yang tertera pada daftar opsi ruangan sebelumnya._`,
      quoted: msg
    });
  }

  // 5. ATURAN NAIK LANTAI DIPERKETAT (Hanya trigger jika benar-benar kata kunci tangga/naik lantai)
  const isMovingUp = userActionClean.includes('naik') || userActionClean.includes('tangga') || userActionClean.includes('lanjut lantai') || userActionClean.includes('lantai berikutnya');

  const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

  if (isMovingUp) {
    // --- SKENARIO A: Naik ke Lantai Berikutnya ---
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

    const roomData = await generateDungeonRoom(user.dungeon.theme, user.dungeon.floor, args.join(' '));
    user.dungeon.validChoices = roomData.actions.map(a => a.toLowerCase().replace('.', '').trim());
    user.dungeon.validChoices.push('keluar', 'exit', 'serang');

    let encounterMsg = `\n\n🎁 *Hadiah Naik Lantai ${user.dungeon.floor}:* Mendapatkan *+${formatRp(earnedPrize)}*!`;
    if (roomData.encounter?.type === 'monster') {
      user.dungeon.activeMonster = { name: roomData.encounter.name, hp: roomData.encounter.hp, maxHp: roomData.encounter.hp };
      encounterMsg += `\n\n⚠️ *MONSTER MUNCUL: ${roomData.encounter.name}*\n❤️ HP Monster: [ ${roomData.encounter.hp} / ${roomData.encounter.hp} ]\n_Ketik .serang untuk bertarung!_`;
    } else if (roomData.encounter?.type === 'item') {
      user.dungeon.inventory.push(roomData.encounter.name);
      encounterMsg += `\n✨ *MENEMUKAN ITEM:* Mendapatkan **${roomData.encounter.name}**!`;
    }

    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    const sent = await sock.sendMessage(remoteJid, {
      text: `🕳️ *ZORK DUNGEON (Lantai ${user.dungeon.floor}/100)*\n📍 ❤️ HP Kamu: [ ${user.dungeon.hp}/${user.dungeon.maxHp} ]\n\n${roomData.description}\n\n🧭 *Aksi Tersedia:* \n${roomData.actions.join(' | ')}${encounterMsg}`,
      quoted: msg
    });

    if (roomData.encounter?.type === 'monster') {
      user.dungeon.monsterMsgKey = sent.key;
    } else {
      user.dungeon.activeMonster = null;
    }
    return;

  } else {
    // --- SKENARIO B: Interaksi di Lantai yang Sama (Buka pintu, periksa sekitar, dll) ---
    const roomData = await generateDungeonRoom(user.dungeon.theme, user.dungeon.floor, args.join(' '));
    user.dungeon.validChoices = roomData.actions.map(a => a.toLowerCase().replace('.', '').trim());
    user.dungeon.validChoices.push('keluar', 'exit', 'serang');

    let encounterMsg = `\n\n🔍 *EKSPLORASI SELESAI:* _Kamu mengamati situasi setelah melakukan aksi tersebut._`;
    if (roomData.encounter?.type === 'monster') {
      user.dungeon.activeMonster = { name: roomData.encounter.name, hp: roomData.encounter.hp, maxHp: roomData.encounter.hp };
      encounterMsg = `\n\n⚠️ *JEBAKAN/MONSTER TERPICU!* \n_Aksi tersebut membangunkan **${roomData.encounter.name} (HP: ${roomData.encounter.hp})** dari persembunyiannya!_\n_Ketik .serang untuk menghadapinya!_`;
    } else if (roomData.encounter?.type === 'item') {
      user.dungeon.inventory.push(roomData.encounter.name);
      encounterMsg = `\n\n✨ *PENEMUAN BERHARGA:* \n_Dari aksi tersebut, kamu berhasil mengamankan item: **${roomData.encounter.name}** ke dalam tas!_`;
      if (roomData.encounter.name.toLowerCase().includes('ramuan') || roomData.encounter.name.toLowerCase().includes('potion')) {
        user.dungeon.hp = Math.min(user.dungeon.maxHp, user.dungeon.hp + 35);
      }
    }

    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    const sent = await sock.sendMessage(remoteJid, {
      text: `🕳️ *ZORK DUNGEON (Lantai ${user.dungeon.floor}/100)*\n📍 ❤️ HP Kamu: [ ${user.dungeon.hp}/${user.dungeon.maxHp} ]\n\n${roomData.description}${encounterMsg}\n\n🧭 *Aksi Tersedia Selanjutnya:* \n${roomData.actions.join(' | ')}`,
      quoted: msg
    });

    if (roomData.encounter?.type === 'monster') {
      user.dungeon.monsterMsgKey = sent.key;
    }
    return;
  }
}

module.exports = handleDungeonCommand;
      
