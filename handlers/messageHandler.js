const config = require('../config');

// Command Bawaan
const stickerCommand = require('../commands/sticker');
const tiktokCommand = require('../commands/tiktok');
const bratCommand = require('../commands/brat');
const bratvidCommand = require('../commands/bratvid');
const wmCommand = require('../commands/wm');
const listCommand = require('../commands/list');
const hidetagCommand = require('../commands/hidetag');
const toimgCommand = require('../commands/toimg');
const igCommand = require('../commands/ig');
const groupCommand = require('../commands/group');
const quoteCommand = require('../commands/quote');
const rvoCommand = require('../commands/rvo');
const handleJadwalCommand = require('../commands/jadwal');

// Command Baru Sesuai Folder Github
const aiCommand = require('../commands/ai');
const hdCommand = require('../commands/hd');
const sswebCommand = require('../commands/ssweb');
const playCommand = require('../commands/play');
const ytmp3Command = require('../commands/ytmp3');
const cekkhodamCommand = require('../commands/cekkhodam');
const truthCommand = require('../commands/truth');
const dareCommand = require('../commands/dare');
const tovidCommand = require('../commands/tovid');

async function handleMessage(sock, msg) {
  try {
    const messageContent = msg.message;
    if (!messageContent) return;

    // Ambil teks dari berbagai jenis pesan WhatsApp
    const text = messageContent.conversation ||
                 messageContent.extendedTextMessage?.text ||
                 messageContent.imageMessage?.caption ||
                 messageContent.videoMessage?.caption ||
                 messageContent.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || '';

    if (!text.startsWith(config.prefix)) return;

    const args = text.slice(config.prefix.length).trim().split(/ +/);
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

      case 'hidetag':
      case 'h':
        await hidetagCommand(sock, msg, args);
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

      case 'jsn':
      case 'jsl':
      case 'jrb':
      case 'jkm':
      case 'jjt':
        await handleJadwalCommand(sock, msg, command);
        break;

      case 'list':
      case 'menu':
      case 'help':
        await listCommand(sock, msg);
        break;

      default:
        break;
    }

  } catch (err) {
    console.error('Error di messageHandler:', err?.stack || err?.message || err);
  }
}

module.exports = handleMessage;
