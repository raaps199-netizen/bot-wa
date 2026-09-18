// File: commands/dungeon.js
const { getSenderId } = require('../utils/jid-utils');
const helper = require('../utils/helper');
const Groq = require('groq-sdk');

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
        text: `🕳️ *RUANG BAWAH TANAH (Lantai ${floor}/100)*\nKamu berada di ruangan gelap berdebu.\n\nAksi Tersedia:\n• .maju - Lanjut ke depan\n• .periksa meja - Melihat isi meja\n• .ambil obor - Mengambil obor\n• .keluar - Pulang`,
        choices: ['maju', 'periksa', 'ambil', 'keluar', '.maju', '.periksa', '.ambil', '.keluar']
      };
    }

    const prompt = `Kamu adalah game master teks RPG gaya klasik Zork yang sangat imajinatif. 
    Buat deskripsi ruangan dungeon yang unik, menegangkan, dan kaya detail (3-4 kalimat) dengan tema "${theme}" di lantai ${floor} dari 100 lantai total. 
    Player baru saja melakukan aksi: "${action}". 
    Berikan 3 sampai 4 pilihan aksi atau arah yang sangat variatif, kreatif, dan menantang (contoh format perintah: .maju, .periksa peti, .ambil pedang, .ke kiri, .buka pintu, .panjat dinding, .keluar).
    Pastikan format output berupa JSON murni: { "description": "...", "actions": [".maju", ".periksa peti", ".ambil kunci", ".keluar"] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const rawActions = result.actions || ['.maju', '.periksa sudut', '.keluar'];
    
    // Ekstraksi kata kunci agar validasi input user lebih fleksibel
    const cleanChoices = rawActions.map(act => act.toLowerCase().replace('.', '').trim());
    cleanChoices.push('keluar', 'exit', 'maju', 'mundur', 'kiri', 'kanan', 'utara', 'selatan', 'timur', 'barat');

    return {
      text: `🕳️ *ZORK DUNGEON (Lantai ${floor}/100)*\n\n${result.description || 'Kamu menyusuri lorong sunyi penuh misteri.'}\n\n🧭 *Pilihan Aksi Tersedia:* \n${rawActions.join(' | ')}`,
      choices: cleanChoices
    };
  } catch (err) {
    console.error('Groq Dungeon Error:', err);
    return {
      text: `🕳️ *RUANG BAWAH TANAH (Lantai ${floor}/100)*\nSuasana tiba-tiba senyap dan bergemuruh...\n\nAksi Tersedia:\n• .maju\n• .keluar`,
      choices: ['maju', 'keluar', '.maju', '.keluar']
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
  const subCommand = args[0]?.toLowerCase().replace('.', '').trim();

  if (!user.dungeon) {
    user.dungeon = {
      active: false,
      floor: 1,
      theme: 'Gua Lembab Berbatu & Reruntuhan Kuno',
      hp: 100,
      validChoices: ['maju', 'keluar', '.maju', '.keluar']
    };
  }

  // Masuk dungeon atau cek status progres
  if (!user.dungeon.active) {
    user.dungeon.active = true;
    const currentFloor = user.dungeon.floor || 1;
    const room = await generateDungeonRoom(user.dungeon.theme, currentFloor, 'Memasuki gerbang dungeon');
    
    user.dungeon.validChoices = room.choices;

    return await sock.sendMessage(remoteJid, {
      text: `🚀 *PETUALANGAN ZORK DUNGEON DIMULAI!*\n` +
            `📍 Posisi: *Lantai ${currentFloor} dari 100*\n\n${room.text}`,
      quoted: msg
    });
  }

  // Keluar dungeon
  if (subCommand === 'keluar' || subCommand === 'exit') {
    user.dungeon.active = false;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, {
      text: `💾 *PROGRES TERSIMPAN!*\n` +
            `Kamu mundur dari dungeon. Posisi aman terakhir di **Lantai ${user.dungeon.floor}**. Ketik .dungeon lagi untuk lanjut!`,
      quoted: msg
    });
  }

  // Validasi ketikan user agar tidak bisa asal ketik command luar (anti-bug)
  const userActionClean = args.join(' ').toLowerCase().replace('.', '').trim();
  const isValidAction = user.dungeon.validChoices?.some(choice => userActionClean.includes(choice));

  if (!isValidAction && userActionClean !== '') {
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ *Aksi tidak dikenali di ruangan ini!* \n` +
            `_“Kamu mencoba melakukan hal aneh, tapi dinding gua hanya memantulkan gema suaramu...”_\n\n` +
            `Gunakan pilihan aksi / kata kunci yang tertera pada deskripsi ruangan!`,
      quoted: msg
    });
  }

  // Jika valid, naik lantai dan berikan hadiah
  user.dungeon.floor += 1;

  const earnedPrize = user.dungeon.floor * 20000;
  if (typeof helper.addPoints === 'function') {
    try { helper.addPoints(global.db, senderId, earnedPrize); } catch (e) {}
  }
  const formatRp = helper.formatRupiah || (val => `Rp${Number(val || 0).toLocaleString('id-ID')}`);

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
            `Kamu berhasil mengalahkan Raja Kegelapan Zork di lantai puncak!\n` +
            `💰 Hadiah Utama: *+${formatRp(grandPrize)}* masuk ke saldo!\n\n` +
            `_Namamu resmi jadi legenda Season 1!_ ✨`,
      quoted: msg
    });
  }

  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  // Generate ruangan berikutnya berdasarkan aksi yang dipilih player
  const nextRoom = await generateDungeonRoom(user.dungeon.theme, user.dungeon.floor, args.join(' '));
  user.dungeon.validChoices = nextRoom.choices;

  return await sock.sendMessage(remoteJid, {
    text: `${nextRoom.text}\n\n🎁 *Hadiah Lantai ${user.dungeon.floor}:* Mendapatkan *+${formatRp(earnedPrize)}* dari reruntuhan!`,
    quoted: msg
  });
}

module.exports = handleDungeonCommand;
      
