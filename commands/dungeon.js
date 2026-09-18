// File: commands/dungeon.js
const Groq = require('groq-sdk');
const config = require('../config');
const { getSenderId } = require('../utils/jid-utils');

function getGroqClient() {
  // Menyesuaikan dengan config.js lu yang pakai 'groqkey' (huruf kecil)
  const apiKey = process.env.GROQ_API_KEY || (config && (config.groqkey || config.groqKey)) || (global.config && (global.config.groqkey || global.config.groqKey));
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// Default State awal Dungeon untuk player baru
const getDefaultDungeonState = () => ({
  active: false,
  location: "living_room",
  inventory: ["brass_lantern"],
  score: 0,
  moves: 0,
  health: "healthy",
  flags: {
    mailbox_open: false,
    leaflet_read: false,
    trapdoor_open: false,
    troll_alive: true
  },
  world_state: {
    living_room: { description: "You are in a living room. There is a brass lantern here and a closed mailbox.", exits: { north: "kitchen", west: "forest", down: "cellar" }, objects: ["brass_lantern", "mailbox"] }
  }
});

async function handleDungeonCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid); 

  if (!global.db.users) global.db.users = {};
  if (!global.db.users[senderId]) global.db.users[senderId] = {};
  
  const user = global.db.users[senderId];
  if (!user.dungeon) user.dungeon = getDefaultDungeonState();

  const subCommand = args[0]?.toLowerCase();

  // Handle .dungeon quit / keluar
  if (subCommand === 'quit' || subCommand === 'keluar') {
    user.dungeon.active = false;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
    return await sock.sendMessage(remoteJid, {
      text: `🚪 *DUNGEON GAME QUIT*\nGame session dihentikan. Ketik .dungeon untuk memulai kembali kapan saja.`,
      quoted: msg
    });
  }

  // Handle .dungeon restart / mulai ulang
  if (subCommand === 'restart') {
    user.dungeon = getDefaultDungeonState();
    user.dungeon.active = true;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
    return await sock.sendMessage(remoteJid, {
      text: `🔄 *DUNGEON RESTARTED*\nGame baru dimulai!\n\n*Living Room*\nYou are standing in a living room. A brass lantern is on the table.\n\nExits: north, west, down\n\n> `,
      quoted: msg
    });
  }

  // Jika mengetik `.dungeon` pertama kali atau saat belum aktif
  if (!user.dungeon.active) {
    user.dungeon.active = true;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();
    return await sock.sendMessage(remoteJid, {
      text: `🎮 *WELCOME TO ZORK TEXT ADVENTURE DUNGEON*\n` +
            `_Ketik perintah seperti 'look', 'north', 'take brass_lantern', 'inventory', dll tanpa prefix._\n` +
            `_Ketik '.dungeon quit' untuk keluar atau '.dungeon restart' untuk mengulang._\n\n` +
            `----------------------------------------\n\n` +
            `*Living Room*\nYou are standing in a living room. A brass lantern is on the table.\n\nExits: north, west, down\n\n> `,
      quoted: msg
    });
  }

  // Jika user mengetik .dungeon doang saat game sudah aktif, anggap sebagai 'look'
  if (user.dungeon.active && !subCommand) {
    args = ['look'];
  }

  const actionText = args.join(' ');
  if (!actionText) {
    return await sock.sendMessage(remoteJid, {
      text: `Game Dungeon kamu sedang aktif. Ketik aksi yang ingin kamu lakukan (contoh: \`look\`, \`inventory\`, \`north\`).`,
      quoted: msg
    });
  }

  // Proses aksi menggunakan Groq AI sebagai Game Engine & Rule Enforcer
  try {
    const groq = getGroqClient();
    if (!groq) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Groq API Key tidak terbaca dari config.js (pastikan properti groqkey terisi).`, quoted: msg });
    }

    const systemPrompt = `Kamu adalah Zork Game Engine dan Rule Narrator yang ketat. 
    Ikuti state pemain saat ini secara mutlak dan jangan mengarang atau melanggar aturan game.
    
    Current Player State:
    ${JSON.stringify(user.dungeon, null, 2)}
    
    Instruksi:
    1. Evaluasi command pemain: "${actionText}".
    2. Perbarui state (location, inventory, score, moves, flags) jika aksi valid.
    3. Jika aksi tidak valid atau terhalang aturan dunia, berikan pesan penolakan klasik Zork (misal: "You can't go that way.", "I don't see that here.").
    4. Berikan output format JSON murni di dalam blok kode, diikuti dengan teks respons narasi untuk pemain.
    Format wajib:
    \`\`\`json
    {
      "updated_state": { ... (state terbaru lengkap) ... },
      "response_text": "Narasi hasil aksi untuk pemain..."
    }
    \`\`\``;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3
    });

    let rawContent = completion.choices[0]?.message?.content || '{}';
    let responseText = rawContent;
    
    try {
      const jsonMatch = rawContent.match(/```json([\s\S]*?)```/) || rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        if (parsedData.updated_state) {
          user.dungeon = parsedData.updated_state;
        }
        if (parsedData.response_text) {
          responseText = parsedData.response_text;
        }
      }
    } catch (parseErr) {
      console.error('Warning: Gagal parse JSON dari Groq:', parseErr);
      responseText = rawContent;
    }
    
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, {
      text: `${responseText}\n\n> `,
      quoted: msg
    });

  } catch (err) {
    console.error('Dungeon Engine Fatal Error Detail:', err);
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ Groq Error: ${err.message || 'Gagal memproses aksi.'}`,
      quoted: msg
    });
  }
}

module.exports = handleDungeonCommand;
                    
