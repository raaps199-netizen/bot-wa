const config = require('../config');
const { handleGameAnswer } = require('./gameHandler');

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

// Command Games & Leaderboard
const blackjackCommand = require('../commands/blackjack');
const mathCommand = require('../commands/math');
const tebakbenderaCommand = require('../commands/tebakbendera');
const tebakkataCommand = require('../commands/tebakkata');
const tebakgambarCommand = require('../commands/tebakgambar');
const triviaCommand = require('../commands/trivia');
const { tetrisCommand, claimTetrisCommand } = require('../commands/tetris');
const scoreCommand = require('../commands/score');
const leaderboardCommand = require('../commands/leaderboard');

// Command Reme Kasino
const remeCommand = require('../commands/reme');
const { terimaCommand, tolakCommand } = require('../commands/remeAcceptReject');
const spinCommand = require('../commands/remeSpin');

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

    // Khusus command .spin waktu game Reme aktif
    if (cleanText.toLowerCase() === '.spin' || cleanText.toLowerCase() === 'spin') {
      await spinCommand(sock, msg);
      if (global.db?.game?.[remoteJid]?.type === 'reme') return;
    }

    // 1. CEK JAWABAN GAME (Langsung ditangkap tanpa prefix/perintah apa pun)
    try {
      const isGameAnswered = await handleGameAnswer(sock, msg, cleanText);
      if (isGameAnswered) return;
    } catch (gameErr) {
      console.error('Error saat handleGameAnswer:', gameErr);
    }

    // 2. CEK PREFIX
    let prefixUsed = '';
    if (cleanText.startsWith(config.prefix)) prefixUsed = config.prefix;
    else if (cleanText.startsWith('/')) prefixUsed = '/';

    if (!prefixUsed) return;

    const args = cleanText.slice(prefixUsed.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 3. SWITCH CASE COMMAND
    switch (command) {
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
┣⌬ ${prefixUsed}reme @user <taruhan>
┣⌬ ${prefixUsed}score
┣⌬ ${prefixUsed}leaderboard
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
`┏━『 *ᴍᴇɴᴜ ɢʀᴏᴜᴘ* 』
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
┃  • ${prefixUsed}reme @user <taruhan>
┃  • ${prefixUsed}score
┃  • ${prefixUsed}leaderboard
┃  • ${prefixUsed}cekkhodam <nama>
┃  • ${prefixUsed}bucin <nama>
┃  • ${prefixUsed}truth
┃  • ${prefixUsed}dare
┃
┣⌬ *ᴛᴏᴏʟꜱ*
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
┣⌬ *ɢʀᴏᴜᴘ*
┃  • ${prefixUsed}open
┃  • ${prefixUsed}close
┃  • ${prefixUsed}online
┃  • ${prefixUsed}promote @user
┃  • ${prefixUsed}demote @user
┗━━━━━━━◧`;
        await sock.sendMessage(remoteJid, { text: allText }, { quoted: msg });
        break;
      }

      case 'list':
      case 'menu':
      case 'help':
        await listCommand(sock, msg);
        break;

      default:
        await sock.sendMessage(remoteJid, {
          text: `❌ Command *${prefixUsed}${command}* tidak ditemukan!\nKetik *${prefixUsed}menu* untuk melihat daftar menu.`
        }, { quoted: msg });
        break;
    }

  } catch (err) {
    console.error('Error di handleMessage:', err?.stack || err?.message || err);
  }
}

module.exports = handleMessage;
