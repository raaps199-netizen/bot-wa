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

async function handleMessage(sock, msg) {
  try {
    const messageContent = msg.message;
    if (!messageContent) return;

    let text = messageContent.conversation ||
               messageContent.extendedTextMessage?.text ||
               messageContent.imageMessage?.caption ||
               messageContent.videoMessage?.caption ||
               messageContent.editedMessage?.message?.protocolMessage?.extendedTextMessage?.text || '';

    if (!text) return;

    // 1. CEK JAWABAN GAME
    const isAnswerCorrect = await handleGameAnswer(sock, msg, text);
    if (isAnswerCorrect) return;

    // 2. CEK PREFIX '.' ATAU '/'
    let prefixUsed = '';
    if (text.startsWith(config.prefix)) prefixUsed = config.prefix;
    else if (text.startsWith('/')) prefixUsed = '/';

    if (!prefixUsed) return;

    const args = text.slice(prefixUsed.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
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

      // SUB-MENU
      case 'menu_game': {
        const gameText = `*MENU GAME*\n\n` +
          `• ${config.prefix}bj\n` +
          `• ${config.prefix}math\n` +
          `• ${config.prefix}tebakbendera\n` +
          `• ${config.prefix}tebakkata\n` +
          `• ${config.prefix}tebakgambar\n` +
          `• ${config.prefix}cekkhodam <nama>\n` +
          `• ${config.prefix}bucin <nama>\n` +
          `• ${config.prefix}truth\n` +
          `• ${config.prefix}dare`;
        await sock.sendMessage(msg.key.remoteJid, { text: gameText }, { quoted: msg });
        break;
      }

      case 'menu_tools': {
        const toolsText = `*MENU TOOLS*\n\n` +
          `• ${config.prefix}s\n` +
          `• ${config.prefix}wm <pack|author>\n` +
          `• ${config.prefix}toimg\n` +
          `• ${config.prefix}tovid\n` +
          `• ${config.prefix}tt <link>\n` +
          `• ${config.prefix}ig <link>\n` +
          `• ${config.prefix}play <judul>\n` +
          `• ${config.prefix}ytmp3 <link>\n` +
          `• ${config.prefix}hd\n` +
          `• ${config.prefix}ssweb <url>\n` +
          `• ${config.prefix}ai <teks>\n` +
          `• ${config.prefix}brat <teks>\n` +
          `• ${config.prefix}bratvid <teks>\n` +
          `• ${config.prefix}quote <teks>\n` +
          `• ${config.prefix}rvo`;
        await sock.sendMessage(msg.key.remoteJid, { text: toolsText }, { quoted: msg });
        break;
      }

      case 'menu_group': {
        const groupText = `*MENU GROUP*\n\n` +
          `• ${config.prefix}open\n` +
          `• ${config.prefix}close\n` +
          `• ${config.prefix}promote @user\n` +
          `• ${config.prefix}demote @user`;
        await sock.sendMessage(msg.key.remoteJid, { text: groupText }, { quoted: msg });
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
    console.error('Error di messageHandler:', err?.stack || err?.message || err);
  }
}

module.exports = handleMessage;
