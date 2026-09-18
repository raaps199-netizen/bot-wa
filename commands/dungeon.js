// File: commands/dungeon.js
const { getSenderId } = require('../utils/jid-utils');
const helper = require('../utils/helper');
const Groq = require('groq-sdk');

// Fungsi aman untuk inisialisasi Groq (mencegah crash saat bot startup)
function getGroqClient() {
  const apiKey = global.config?.groqKey || process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

async function generateDungeonRoom(theme, floor, action) {
  try {
    const groq = getGroqClient();
    if (!groq) {
      return {
        text: `🕳️ *RUANG BAWAH TANAH (Lantai ${floor}/100)*\nKamu berjalan menyusuri kegelapan (Mode Offline - API Key belum terdeteksi).\n\nArah Jalan:\n• .utara - Lanjut maju\n• .keluar - Pulang`,
        choices: ['.utara', '.keluar']
      };
    }

    const prompt = `Kamu adalah game master teks RPG gaya klasik Zork. 
    Buat deskripsi ruangan dungeon singkat (maksimal 3 kalimat) dengan tema "${theme}" di lantai ${floor} dari 100 lantai total. 
    Player baru saja melakukan aksi: "${action}". 
    Berikan juga 2 pilihan arah atau aksi selanjutnya yang valid (misal: .utara, .timur, .ambil item).
    Format output JSON: { "description": "...", "actions": [".utara", ".ambil peti", ".keluar"] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      text: `🕳️ *ZORK DUNGEON (Lantai ${floor}/100)*\n\n${result.description || 'Kamu menyusuri lorong sunyi.'}\n\n🧭 *Aksi Tersedia:* \n${(result.actions || ['.utara', '.keluar']).join(' | ')}`,
      choices: result.actions || ['.utara', '.keluar']
    };
  } catch (err) {
    console.error('Groq Dungeon Error:', err);
    return {
      text: `🕳️ *RUANG BAWAH TANAH (Lantai ${floor}/100)*\nSuasana tiba-tiba senyap...\n\nArah Jalan:\n• .utara\n• .keluar`,
      choices: ['.utara', '.keluar']
    };
  }
}

async function handleDungeonCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid);
  if (!senderId) return;

  if (!global.db.users) global.db.users = {};
  if (!global.db.users[senderId]) global.db.users[senderId] = {};

  const user = global.db.users[senderId];
  const subCommand = args[0]?.toLowerCase();

  // Inisialisasi atau ambil data dungeon player jika belum ada
  if (!user.dungeon) {
    user.dungeon = {
      active: false,
      floor: 1,
      theme: 'Gua Lembab Berbatu',
      hp: 100
    };
  }

  // Jika player mengetik .dungeon (masuk atau cek status progres tersimpan)
  if (!user.dungeon.active) {
    user.dungeon.active = true;
    
    const currentFloor = user.dungeon.floor || 1;
    const room = await generateDungeonRoom(user.dungeon.theme, currentFloor, 'Melanjutkan kembali petualangan');

    return await sock.sendMessage(remoteJid, {
      text: `🚀 *MELANJUTKAN PETUALANGAN DUNGEON!*\n` +
            `📍 Progres tersimpan: *Lantai ${currentFloor} dari 100*\n\n${room.text}`,
      quoted: msg
    });
  }

  // Jika player ingin keluar / istirahat (Progres otomatis di-save)
  if (subCommand === 'keluar' || subCommand === 'exit') {
    user.dungeon.active = false;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, {
      text: `💾 *PROGRES TERSIMPAN!*\n` +
            `Kamu mundur dari dungeon. Posisi aman terakhir kamu tersimpan di **Lantai ${user.dungeon.floor}**. Ketik .dungeon lagi kapan pun untuk lanjut!`,
      quoted: msg
    });
  }

  // Proses pergerakan naik lantai
  const actionText = args.join(' ');
  user.dungeon.floor += 1;

  // 🎁 HADIAH OTOMATIS TIAP NAIK LANTAI
  const earnedPrize = user.dungeon.floor * 20000;
  if (typeof helper.addPoints === 'function') {
    try { helper.addPoints(global.db, senderId, earnedPrize); } catch (e) {}
  }
  const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

  // CEK APAKAH SUDAH MENYENTUH LANTAI 100
  if (user.dungeon.floor >= 100) {
    const grandPrize = 50000000;
    if (typeof helper.addPoints === 'function') {
      try { helper.addPoints(global.db, senderId, grandPrize); } catch (e) {}
    }
    
    user.dungeon.active = false;
    user.dungeon.floor = 1; 
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, {
      text: `🏆🎉 *SELAMAT! KAMU MENAKLUKKAN LANTAI 100 DUNGEON!* 🎉🏆\n\n` +
            `Setelah perjalanan panjang menembus kegelapan Zork, kamu berhasil mengalahkan Raja Kegelapan di lantai puncak!\n` +
            `💰 Hadiah Utama Kemenangan: *+${formatRp(grandPrize)}* masuk ke saldo!\n\n` +
            `_Nama mu tercatat sebagai legenda penakluk dungeon Season 1!_ ✨`,
      quoted: msg
    });
  }

  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  const nextRoom = await generateDungeonRoom(user.dungeon.theme, user.dungeon.floor, actionText);

  return await sock.sendMessage(remoteJid, {
    text: `${nextRoom.text}\n\n🎁 *Hadiah Lantai ${user.dungeon.floor}:* Mendapatkan *+${formatRp(earnedPrize)}* dari reruntuhan!`,
    quoted: msg
  });
}

module.exports = handleDungeonCommand;
  
