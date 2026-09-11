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

// Command Games
const blackjackCommand = require('../commands/blackjack');
const mathCommand = require('../commands/math');
const tebakbenderaCommand = require('../commands/tebakbendera');
const tebakkataCommand = require('../commands/tebakkata');
const tebakgambarCommand = require('../commands/tebakgambar');
const triviaCommand = require('../commands/trivia');
const { tetrisCommand, claimTetrisCommand } = require('../commands/tetris');

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

    // 1. CEK DULU JAWABAN GAME (Untuk Trivia, Math, dll)
    const isGameAnswered = await handleGameAnswer(sock, msg, cleanText);
    if (isGameAnswered) return;

    // 2. CEK PREFIX '.' ATAU '/'
    let prefixUsed = '';
    if (cleanText.startsWith(config.prefix)) prefixUsed = config.prefix;
    else if (cleanText.startsWith('/')) prefixUsed = '/';

    if (!prefixUsed) return;

    const args = cleanText.slice(prefixUsed.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
      case 'jawab':
      case 'j': {
        const userAnswer = args.join(' ');
        if (!userAnswer) {
          await sock.sendMessage(msg.key.remoteJid, { 
            text: '⚠️ Masukkan jawaban kamu!\nContoh: *.jawab a* atau reply soal lalu ketik /a.' 
          }, { quoted: msg });
          break;
        }
        await handleGameAnswer(sock, msg, userAnswer);
        break;
      }

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

      // SUB-MENU DENGAN STYLE BARU (SMALL CAPS & BOX BORDER)
      case 'menu_game':
      case 'games': {
        const gameText = 
`┏━『 *ᴍᴇɴᴜ ɢᴀᴍᴇꜱ* 』
┃
┣⌬ ${config.prefix}bj
┣⌬ ${config.prefix}math [mudah|sedang|sulit]
┣⌬ ${config.prefix}tebakbendera
┣⌬ ${config.prefix}tebakkata
┣⌬ ${config.prefix}tebakgambar
┣⌬ ${config.prefix}trivia <kategori> <level>
┣⌬ ${config.prefix}tetris
┣⌬ ${config.prefix}claimtetris <kode>
┣⌬ ${config.prefix}cekkhodam <nama>
┣⌬ ${config.prefix}bucin <nama>
┣⌬ ${config.prefix}truth
┣⌬ ${config.prefix}dare
┗━━━━━━━◧`;
        await sock.sendMessage(msg.key.remoteJid, { text: gameText }, { quoted: msg });
        break;
      }

      case 'menu_tools':
      case 'tools': {
        const toolsText = 
`┏━『 *ᴍᴇɴᴜ ᴛᴏᴏʟꜱ* 』
┃
┣⌬ ${config.prefix}s
┣⌬ ${config.prefix}wm <pack|author>
┣⌬ ${config.prefix}toimg
┣⌬ ${config.prefix}tovid
┣⌬ ${config.prefix}tt <link>
┣⌬ ${config.prefix}ig <link>
┣⌬ ${config.prefix}play <judul>
┣⌬ ${config.prefix}ytmp3 <link>
┣⌬ ${config.prefix}hd
┣⌬ ${config.prefix}ssweb <url>
┣⌬ ${config.prefix}ai <teks>
┣⌬ ${config.prefix}brat <teks>
┣⌬ ${config.prefix}bratvid <teks>
┣⌬ ${config.prefix}quote <teks>
┣⌬ ${config.prefix}rvo
┗━━━━━━━◧`;
        await sock.sendMessage(msg.key.remoteJid, { text: toolsText }, { quoted: msg });
        break;
      }

      case 'menu_group':
      case 'group': {
        const groupText = 
`┏━『 *ᴍᴇɴᴜ ɢʀᴏᴜᴘ* 』
┃
┣⌬ ${config.prefix}open
┣⌬ ${config.prefix}close
┣⌬ ${config.prefix}promote @user
┣⌬ ${config.prefix}demote @user
┗━━━━━━━◧`;
        await sock.sendMessage(msg.key.remoteJid, { text: groupText }, { quoted: msg });
        break;
      }

      case 'allmenu': {
        const allText = 
`┏━『 *ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ* 』
┃
┣⌬ *ɢᴀᴍᴇꜱ*
┃  • ${config.prefix}bj
┃  • ${config.prefix}math [mudah|sedang|sulit]
┃  • ${config.prefix}tebakbendera
┃  • ${config.prefix}tebakkata
┃  • ${config.prefix}tebakgambar
┃  • ${config.prefix}trivia <kategori> <level>
┃  • ${config.prefix}tetris
┃  • ${config.prefix}claimtetris <kode>
┃  • ${config.prefix}cekkhodam <nama>
┃  • ${config.prefix}bucin <nama>
┃  • ${config.prefix}truth
┃  • ${config.prefix}dare
┃
┣⌬ *ᴛᴏᴏʟꜱ*
┃  • ${config.prefix}s
┃  • ${config.prefix}wm <pack|author>
┃  • ${config.prefix}toimg
┃  • ${config.prefix}tovid
┃  • ${config.prefix}tt <link>
┃  • ${config.prefix}ig <link>
┃  • ${config.prefix}play <judul>
┃  • ${config.prefix}ytmp3 <link>
┃  • ${config.prefix}hd
┃  • ${config.prefix}ssweb <url>
┃  • ${config.prefix}ai <teks>
┃  • ${config.prefix}brat <teks>
┃  • ${config.prefix}bratvid <teks>
┃  • ${config.prefix}quote <teks>
┃  • ${config.prefix}rvo
┃
┣⌬ *ɢʀᴏᴜᴘ*
┃  • ${config.prefix}open
┃  • ${config.prefix}close
┃  • ${config.prefix}promote @user
┃  • ${config.prefix}demote @user
┗━━━━━━━◧`;
        await sock.sendMessage(msg.key.remoteJid, { text: allText }, { quoted: msg });
        break;
      }

      case 'list':
      case 'menu':
      case 'help':
        await listCommand(sock, msg);
        break;

      default:
        if (prefixUsed === config.prefix) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Command *${config.prefix}${command}* tidak ditemukan!\nKetik *${config.prefix}menu* untuk melihat daftar menu.`
          }, { quoted: msg });
        }
        break;
    }

  } catch (err) {
    console.error('Error di handleMessage:', err?.stack || err?.message || err);
  }
}

module.exports = handleMessage;
