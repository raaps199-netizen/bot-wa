const config = require('../config');

async function listCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const menuText = `
*DAFTAR MENU*

• *${config.prefix}menu_game* — Games & Fun
• *${config.prefix}menu_tools* — Tools & Downloader
• *${config.prefix}menu_group* — Pengelola Group
`.trim();

  await sock.sendMessage(remoteJid, { text: menuText }, { quoted: msg });
}

module.exports = listCommand;
