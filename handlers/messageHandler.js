// File: handlers/messageHandler.js

const config = require('../config');
const handleGameAnswer = require('./gameHandler');
const { getUserData, getTotalScore, addPoints, deductPoints } = require('../utils/helper');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

// Command Media & Utility
const stickerCommand = require('../commands/sticker');
const tiktokCommand = require('../commands/tiktok');
const bratCommand = require('../commands/brat');
const bratvidCommand = require('../commands/bratvid');
const wmCommand = require('../commands/wm');
const listCommand = require('../commands/list');
const toimgCommand = require('../commands/toimg');
const igCommand = require('../commands/ig');
const groupCommand = require('../commands/group');
const quoteCommand = require('../commands/quote');
const rvoCommand = require('../commands/rvo');

// Command Fitur Tambahan
const aiCommand = require('../commands/ai');
const hdCommand = require('../commands/hd');
const sswebCommand = require('../commands/ssweb');
const playCommand = require('../commands/play');
const ytmp3Command = require('../commands/ytmp3');
const cekkhodamCommand = require('../commands/cekkhodam');
const truthCommand = require('../commands/truth');
const dareCommand = require('../commands/dare');
const cekbucinCommand = require('../commands/cekbucin');
const tovidCommand = require('../commands/tovid');
const onlineCommand = require('../commands/online');
const ncodeCommand = require('../commands/ncode');

// Command Games, Leaderboard, & Ekonomi Baru
const blackjackCommand = require('../commands/blackjack');
const mathCommand = require('../commands/math');
const tebakbenderaCommand = require('../commands/tebakbendera');
const tebakkataCommand = require('../commands/tebakkata');
const tebakgambarCommand = require('../commands/tebakgambar');
const triviaCommand = require('../commands/trivia');
const { tetrisCommand, claimTetrisCommand } = require('../commands/tetris');
const scoreCommand = require('../commands/score');
const leaderboardCommand = require('../commands/leaderboard');
const claimCommand = require('../commands/claim');
const tfCommand = require('../commands/tf');
const { duelCommand, handleDuelAnswer } = require('../commands/duel');

// Command Reme & QQ Kasino
const remeCommand = require('../commands/reme');
const { terimaCommand, tolakCommand } = require('../commands/remeAcceptReject');
const spinCommand = require('../commands/remeSpin');

const qqCommand = require('../commands/qq');
const { qqAcceptCommand, qqRejectCommand } = require('../commands/qqAcceptReject');
const qqSpinCommand = require('../commands/qqSpin');

// ==========================================
// 🚨 DAFTAR KATA TERLARANG (FULL LIST)
// ==========================================
const BAD_WORDS = [
  'g0bl0k',
  'b3g0',
  't0l0l',
  'k0nt0l',
  'm3m3k',
  'rule34',
  'ng3nt0t',
  'j4nc0k',
  'b4ngs4t',
  't4i',
  'p4nt3k',
  'asuuu',
  'kontooool',
  'memekk',
  'jancokkktai',
  'kontol',
  'memek',
  'ngentot',
  'jancok',
  'cok',
  'fuck',
  'kintil',
  'pantek',
  'anjing',
  'monyet',
  'kimak',
  'lonte',
  'sundal',
  'nekopoi',
  'porno',
  'porn',
  'pornografi',
  'ph',
  'pornhub',
  'porn hub',
  'brutal sez',
  'brutal sex',
  'gay porn',
  'nhentai',
  'xvideos',
  'xnxx'
];

async function handleMessage(sock, msg) {
  try {
    const messageContent = msg.message;
    if (!messageContent || msg.key.remoteJid === 'status@broadcast') return;

    let text = messageContent.conversation ||
               messageContent.extendedTextMessage?.text ||
               messageContent.imageMessage?.caption ||
               messageContent.videoMessage?.caption ||
               messageContent.editedMessage?.message?.protocolMessage?.extendedTextMessage?.text || '';

    const cleanText = text.trim();
    if (!cleanText) return;

    const remoteJid = msg.key.remoteJid;
    const senderId = msg.key.participant || remoteJid;

    // ===================================================
    // 🔥 AUTO FILTER & AUTO DELETE KATA TERLARANG 🔥
    // ===================================================
    const ownerPhone = '6289531307627';
    const ownerLid = '66477638029541';
    const isOwner = senderId.includes(ownerPhone) || senderId.includes(ownerLid);

    // Kalau bukan owner, lakukan pengecekan kata terlarang
    if (!isOwner) {
      const lowerText = cleanText.toLowerCase();
      const normalizedText = lowerText.replace(/[^a-z0-9]/g, '');

      const isBadWordDetected = BAD_WORDS.some(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        return lowerText.includes(word) || normalizedText.includes(cleanWord);
      });

      if (isBadWordDetected) {
        try {
          await sock.sendMessage(remoteJid, { delete: msg.key });
          await sock.sendMessage(remoteJid, {
            text: `_pesan telah *dihapus otomatis* karena mengandung kata terlarang_`,
            mentions: [senderId]
          });
        } catch (delErr) {
          console.error('Gagal auto delete pesan:', delErr);
        }
        return;
      }
    }
    // ===================================================

    if (cleanText.toLowerCase() === '.spin' || cleanText.toLowerCase() === 'spin') {
      const gameType = global.db?.game?.[remoteJid]?.type;
      if (gameType === 'reme') {
        await spinCommand(sock, msg);
        return;
      } else if (gameType === 'qq') {
        await qqSpinCommand(sock, msg);
        return;
      }
    }

    try {
      const isGameAnswered = await handleGameAnswer(sock, msg, cleanText);
      if (isGameAnswered) return;
    } catch (gameErr) {
      console.error('Error saat handleGameAnswer:', gameErr);
    }

    try {
      const isDuelAnswered = await handleDuelAnswer(sock, msg, cleanText);
      if (isDuelAnswered) return;
    } catch (duelErr) {
      console.error('Error saat handleDuelAnswer:', duelErr);
    }

    let prefixUsed = '';
    if (cleanText.startsWith(config.prefix)) prefixUsed = config.prefix;
    else if (cleanText.startsWith('/')) prefixUsed = '/';

    if (!prefixUsed) return;

    const args = cleanText.slice(prefixUsed.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
      case 'ping': {
        const start = Date.now();
        const sentMsg = await sock.sendMessage(remoteJid, { text: 'Pong! 🏓' }, { quoted: msg });
        const latency = Date.now() - start;
        
        await sock.sendMessage(remoteJid, { 
          text: `Pong! 🏓\nKecepatan respon: *${latency} ms*` 
        }, { quoted: sentMsg });
        break;
      }

      case 'add': {        
        if (!isOwner) {
          await sock.sendMessage(remoteJid, { text: `❌ Lu bukan owner, gak usah sok asik mau nambah poin sendiri wkwk!\n(ID terdeteksi: ${senderId})` }, { quoted: msg });
          break;
        }

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targetId = senderId;
        let addAmount = NaN;

        if (mentioned.length > 0) {
          targetId = mentioned[0];
          const nonTagArgs = args.filter(arg => !arg.includes('@'));
          addAmount = parseInt(nonTagArgs[0]);
        } else {
          addAmount = parseInt(args[0]);
        }

        if (isNaN(addAmount)) {
          await sock.sendMessage(remoteJid, { 
            text: `⚠️ Format salah, bre!\nContoh buat diri sendiri: *.add 100*\nContoh buat orang lain: *.add @user 500*` 
          }, { quoted: msg });
          break;
        }

        if (addAmount < 0) {
          const success = deductPoints(global.db, targetId, Math.abs(addAmount));
          if (!success) {
            await sock.sendMessage(remoteJid, { text: `❌ Poin total user tidak mencukupi untuk dikurangi sebesar ${Math.abs(addAmount)}!` }, { quoted: msg });
            break;
          }
        } else {
          addPoints(global.db, targetId, addAmount);
        }

        if (typeof global.saveDatabase === 'function') {
          global.saveDatabase();
        }

        const userData = getUserData(global.db, targetId);
        const currentTotal = getTotalScore(userData);
        const targetName = targetId.split('@')[0];

        await sock.sendMessage(remoteJid, { 
          text: `✅ Sukses mengubah poin sebesar *${addAmount}* ke @${targetName}!\nTotal poin target sekarang: *${currentTotal}*`,
          mentions: [targetId]
        }, { quoted: msg });
        break;
      }

      case 'claim':
      case 'daily':
        await claimCommand(sock, msg);
        break;

      case 'tf':
      case 'transfer':
        await tfCommand(sock, msg, args);
        break;

      case 'duel':
        await duelCommand(sock, msg, args);
        break;

      case 'nickname':
      case 'setname': {
        const newNick = args.join(' ').trim();
        if (!newNick) {
          await sock.sendMessage(remoteJid, { 
            text: `⚠️ Masukkan nickname baru yang kamu mau!\nContoh: *${prefixUsed}nickname azalia*` 
          }, { quoted: msg });
          break;
        }

        if (newNick.length > 20) {
          await sock.sendMessage(remoteJid, { text: `❌ Nickname kepanjangan! Maksimal 20 karakter ya, bre.` }, { quoted: msg });
          break;
        }

        const user = getUserData(global.db, senderId);
        user.nickname = newNick;
        user.name = newNick;

        if (typeof global.saveDatabase === 'function') {
          global.saveDatabase();
        }

        await sock.sendMessage(remoteJid, { 
          text: `✅ Sukses mengubah nickname leaderboard kamu menjadi: *${newNick}*` 
        }, { quoted: msg });
        break;
      }

      case 'batal':
      case 'cancel': {
        const currentGame = global.db.game?.[remoteJid];
        
        if (!currentGame) {
          await sock.sendMessage(remoteJid, { text: `⚠️ Lagi tidak ada sesi game aktif yang bisa dibatalkan di chat ini.` }, { quoted: msg });
          break;
        }

        if (currentGame.timer) clearTimeout(currentGame.timer);
        delete global.db.game[remoteJid];
        if (typeof global.saveDatabase === 'function') global.saveDatabase();

        await sock.sendMessage(remoteJid, { text: `✅ Sesi game aktif (${currentGame.type.toUpperCase()}) berhasil dibatalkan secara paksa.` }, { quoted: msg });
        break;
      }

      case 'jawab':
      case 'j': {
        const userAnswer = args.join(' ');
        if (!userAnswer) {
          await sock.sendMessage(remoteJid, { 
            text: `⚠️ Masukkan jawaban kamu!\nContoh: *${prefixUsed}jawab a*` 
          }, { quoted: msg });
          break;
        }
        await handleGameAnswer(sock, msg, userAnswer);
        break;
      }

      case 'reme':
        await remeCommand(sock, msg, args);
        break;

      case 'terima':
        await terimaCommand(sock, msg);
        break;

      case 'tolak':
        await tolakCommand(sock, msg);
        break;

      case 'spin':
        await spinCommand(sock, msg);
        break;

      case 'qq':
        await qqCommand(sock, msg, args);
        break;

      case 'terimaqq':
        await qqAcceptCommand(sock, msg);
        break;

      case 'tolakqq':
        await qqRejectCommand(sock, msg);
        break;

      case 'spinqq':
        await qqSpinCommand(sock, msg);
        break;

      case 's':
      case 'sticker':
        await stickerCommand(sock, msg);
        break;

      case 'tt':
      case 'tiktok':
        await tiktokCommand(sock, msg, args);
        break;

      case 'ig':
      case 'instagram':
        await igCommand(sock, msg, args);
        break;

      case 'brat':
        await bratCommand(sock, msg, args);
        break;

      case 'bratvid':
        await bratvidCommand(sock, msg, args);
        break;

      case 'wm':
        await wmCommand(sock, msg, args);
        break;

      case 'close':
      case 'tutup':
        await groupCommand(sock, msg, args, 'close');
        break;

      case 'open':
      case 'buka':
        await groupCommand(sock, msg, args, 'open');
        break;

      case 'online':
      case 'here':
        await onlineCommand(sock, msg);
        break;

      case 'ncode':
      case 'nukecode':
        await ncodeCommand(sock, msg);
        break;

      case 'nyerah':
      case 'menyerah':
        await handleGameAnswer(sock, msg, '.nyerah');
        break;
        
      case 'promote':
      case 'pm':
        await groupCommand(sock, msg, args, 'promote');
        break;

      case 'demote':
      case 'dm':
        await groupCommand(sock, msg, args, 'demote');
        break;

      case 'toimg':
        await toimgCommand(sock, msg);
        break;

      case 'tovid':
      case 'tomp4':
        await tovidCommand(sock, msg);
        break;

      case 'quote':
      case 'q':
      case 'qc':
        await quoteCommand(sock, msg, args);
        break;

      case 'rvo':
      case 'viewonce':
      case 'save':
        await rvoCommand(sock, msg);
        break;

      case 'ai':
      case 'tanya':
        await aiCommand(sock, msg, args);
        break;

      case 'hd':
      case 'remini':
      case 'enhance':
        await hdCommand(sock, msg);
        break;

      case 'ss':
      case 'ssweb':
        await sswebCommand(sock, msg, args);
        break;

      case 'play':
        await playCommand(sock, msg, args);
        break;

      case 'ytmp3':
      case 'yta':
        await ytmp3Command(sock, msg, args);
        break;

      case 'cekkhodam':
      case 'khodam':
        await cekkhodamCommand(sock, msg, args);
        break;

      case 'truth':
        await truthCommand(sock, msg);
        break;

      case 'dare':
        await dareCommand(sock, msg);
        break;

      case 'cekbucin':
      case 'bucin':
        await cekbucinCommand(sock, msg, args);
        break;

      case 'score':
      case 'skor':
        await scoreCommand(sock, msg, args);
        break;

      case 'leaderboard':
      case 'lb':
      case 'top':
        await leaderboardCommand(sock, msg);
        break;

      case 'bj':
      case 'blackjack':
      case 'hit':
      case 'stand':
        if (command === 'hit' || command === 'stand') {
          await blackjackCommand(sock, msg, [command]);
        } else {
          await blackjackCommand(sock, msg, args);
        }
        break;

      case 'math':
      case 'matematika':
        await mathCommand(sock, msg, args);
        break;

      case 'tebakbendera':
        await tebakbenderaCommand(sock, msg);
        break;

      case 'tebakkata':
        await tebakkataCommand(sock, msg);
        break;

      case 'tebakgambar':
        await tebakgambarCommand(sock, msg);
        break;

      case 'trivia':
      case 'kuis':
        await triviaCommand(sock, msg, args);
        break;

      case 'tetris':
        await tetrisCommand(sock, msg, args);
        break;

      case 'claimtetris':
      case 'klaimtetris':
        await claimTetrisCommand(sock, msg, args);
        break;

      case 'menu_game':
      case 'games': {
        const gameText = 
`┏━『 *ᴍᴇɴᴜ ɢᴀᴍᴇꜱ* 』
┃
┣⌬ ${prefixUsed}bj
┣⌬ ${prefixUsed}math [mudah|sedang|hard|max]
┣⌬ ${prefixUsed}tebakbendera
┣⌬ ${prefixUsed}tebakkata
┣⌬ ${prefixUsed}tebakgambar
┣⌬ ${prefixUsed}trivia <kategori> <level>
┣⌬ ${prefixUsed}tetris
┣⌬ ${prefixUsed}claimtetris <kode>
┣⌬ ${prefixUsed}duel math @user <taruhan> [diff]
┣⌬ ${prefixUsed}duel trivia @user <taruhan> [kategori] [diff]
┣⌬ ${prefixUsed}reme <taruhan> (Lawan Bot)
┣⌬ ${prefixUsed}reme @user <taruhan> (PvP)
┣⌬ ${prefixUsed}qq <taruhan> (Lawan Bot)
┣⌬ ${prefixUsed}qq @user <taruhan> (PvP)
┣⌬ ${prefixUsed}batal
┣⌬ ${prefixUsed}claim (Ambil Poin Harian)
┣⌬ ${prefixUsed}tf @user <nominal>
┣⌬ ${prefixUsed}score
┣⌬ ${prefixUsed}leaderboard
┣⌬ ${prefixUsed}nickname <nama>
┣⌬ ${prefixUsed}cekkhodam <nama>
┣⌬ ${prefixUsed}bucin <nama>
┣⌬ ${prefixUsed}truth
┣⌬ ${prefixUsed}dare
┗━━━━━━━◧`;
        await sock.sendMessage(remoteJid, { text: gameText }, { quoted: msg });
        break;
      }

      case 'menu_tools':
      case 'tools': {
        const toolsText = 
`┏━『 *ᴍᴇɴᴜ ᴛᴏᴏʟꜱ* 』
┃
┣⌬ ${prefixUsed}ping
┣⌬ ${prefixUsed}s
┣⌬ ${prefixUsed}wm <pack|author>
┣⌬ ${prefixUsed}toimg
┣⌬ ${prefixUsed}tovid
┣⌬ ${prefixUsed}tt <link>
┣⌬ ${prefixUsed}ig <link>
┣⌬ ${prefixUsed}play <judul>
┣⌬ ${prefixUsed}ytmp3 <link>
┣⌬ ${prefixUsed}hd
┣⌬ ${prefixUsed}ssweb <url>
┣⌬ ${prefixUsed}ai <teks>
┣⌬ ${prefixUsed}brat <teks>
┣⌬ ${prefixUsed}bratvid <teks>
┣⌬ ${prefixUsed}quote <teks>
┣⌬ ${prefixUsed}rvo
┣⌬ ${prefixUsed}ncode
┗━━━━━━━◧`;
        await sock.sendMessage(remoteJid, { text: toolsText }, { quoted: msg });
        break;
      }

      case 'menu_group':
      case 'group': {
        const groupText = 
`┏━『 *ᴍᴇɴᴜ ɢʀᴏᴜ𝚙* 』
┃
┣⌬ ${prefixUsed}open
┣⌬ ${prefixUsed}close
┣⌬ ${prefixUsed}online
┣⌬ ${prefixUsed}promote @user
┣⌬ ${prefixUsed}demote @user
┗━━━━━━━◧`;
        await sock.sendMessage(remoteJid, { text: groupText }, { quoted: msg });
        break;
      }

      case 'allmenu': {
        try {
          const allText = 
`┏━『 *ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ* 』
┃
┣⌬ *ɢᴀᴍᴇꜱ*
┃  • ${prefixUsed}bj
┃  • ${prefixUsed}math [mudah|sedang|hard|max]
┃  • ${prefixUsed}tebakbendera
┃  • ${prefixUsed}tebakkata
┃  • ${prefixUsed}tebakgambar
┃  • ${prefixUsed}trivia <kategori> <level>
┃  • ${prefixUsed}tetris
┃  • ${prefixUsed}claimtetris <kode>
┃  • ${prefixUsed}duel math/trivia @user <taruhan>
┃  • ${prefixUsed}reme <taruhan> (Lawan Bot)
┃  • ${prefixUsed}reme @user <taruhan> (PvP)
┃  • ${prefixUsed}qq <taruhan> (Lawan Bot)
┃  • ${prefixUsed}qq @user <taruhan> (PvP)
┃  • ${prefixUsed}batal
┃  • ${prefixUsed}claim (Ambil Poin Harian)
┃  • ${prefixUsed}tf @user <nominal>
┃  • ${prefixUsed}score
┃  • ${prefixUsed}leaderboard
┃  • ${prefixUsed}nickname <nama>
┃  • ${prefixUsed}cekkhodam <nama>
┃  • ${prefixUsed}bucin <nama>
┃  • ${prefixUsed}truth
┃  • ${prefixUsed}dare
┃
┣⌬ *ᴛᴏᴏʟꜱ*
┃  • ${prefixUsed}ping
┃  • ${prefixUsed}s
┃  • ${prefixUsed}wm <pack|author>
┃  • ${prefixUsed}toimg
┃  • ${prefixUsed}tovid
┃  • ${prefixUsed}tt <link>
┃  • ${prefixUsed}ig <link>
┃  • ${prefixUsed}play <judul>
┃  • ${prefixUsed}ytmp3 <link>
┃  • ${prefixUsed}hd
┃  • ${prefixUsed}ssweb <url>
┃  • ${prefixUsed}ai <teks>
┃  • ${prefixUsed}brat <teks>
┃  • ${prefixUsed}bratvid <teks>
┃  • ${prefixUsed}quote <teks>
┃  • ${prefixUsed}rvo
┃  • ${prefixUsed}ncode
┃
┣⌬ *ɢʀᴏᴜ𝚙*
┃  • ${prefixUsed}open
┃  • ${prefixUsed}close
┃  • ${prefixUsed}online
┃  • ${prefixUsed}promote @user
┃  • ${prefixUsed}demote @user
┗━━━━━━━◧`;
          await sock.sendMessage(remoteJid, { text: allText }, { quoted: msg });
        } catch (errDb) {
          console.error('[DEBUG ERROR] Gagal mengeksekusi .allmenu:', errDb);
          await sock.sendMessage(remoteJid, { text: `❌ Terjadi error pada .allmenu: ${errDb.message}` }, { quoted: msg });
        }
        break;
      }

      case 'list':
      case 'menu':
      case 'help': {
        try {
          const menuText = `📋 *KATEGORI MENU BOT* 📋\n\n` +
                           `Silakan pilih kategori menu di bawah ini menggunakan tombol interaktif atau ketik perintahnya secara manual.`;

          const buttonsArray = [
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({ display_text: '🎮 Menu Games', id: `${prefixUsed}games` })
            },
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({ display_text: '📥 Menu Tools', id: `${prefixUsed}tools` })
            },
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({ display_text: '🛠️ Menu Group', id: `${prefixUsed}group` })
            },
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({ display_text: '📜 Semua Menu', id: `${prefixUsed}allmenu` })
            }
          ];

          const formattedBut
