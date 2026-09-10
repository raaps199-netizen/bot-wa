const config = require('../config');

async function listCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const menuText = `🤖 *BOT MENU LIST* 🤖\n\n` +
    `PREFIX: [ *${config.prefix}* ]\n\n` +
    `🛠️ *TOOLS & DOWNLOADER*\n` +
    `• ${config.prefix}s / ${config.prefix}sticker\n` +
    `• ${config.prefix}wm <pack|author>\n` +
    `• ${config.prefix}toimg\n` +
    `• ${config.prefix}tovid\n` +
    `• ${config.prefix}tt <link>\n` +
    `• ${config.prefix}ig <link>\n` +
    `• ${config.prefix}play <judul>\n` +
    `• ${config.prefix}ytmp3 <link>\n` +
    `• ${config.prefix}hd\n` +
    `• ${config.prefix}ssweb <url>\n` +
    `• ${config.prefix}ai <pertanyaan>\n` +
    `• ${config.prefix}brat <teks>\n` +
    `• ${config.prefix}bratvid <teks>\n` +
    `• ${config.prefix}quote <teks>\n` +
    `• ${config.prefix}rvo\n` +
    `• ${config.prefix}hidetag <teks>\n\n` +
    `🎮 *GAMES & FUN*\n` +
    `• ${config.prefix}bj / ${config.prefix}blackjack\n` +
    `• ${config.prefix}math\n` +
    `• ${config.prefix}tebakbendera\n` +
    `• ${config.prefix}tebakkata\n` +
    `• ${config.prefix}tebakgambar\n` +
    `• ${config.prefix}cekkhodam <nama>\n` +
    `• ${config.prefix}bucin <nama>\n` +
    `• ${config.prefix}truth\n` +
    `• ${config.prefix}dare\n\n` +
    `📅 *JADWAL*\n` +
    `• ${config.prefix}jsn / ${config.prefix}jsl / ${config.prefix}jrb / ${config.prefix}jkm / ${config.prefix}jjt`;

  await sock.sendMessage(remoteJid, { text: menuText }, { quoted: msg });
}

module.exports = listCommand;
