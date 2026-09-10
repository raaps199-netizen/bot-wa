const config = require('../config');

async function listCommand(sock, msg) {
  const from = msg.key.remoteJid;

  const menuText = 
`┏━『 *ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ* 』
┃
┣⌬ ɢᴀᴍᴇꜱ
┣⌬ ᴛᴏᴏʟꜱ
┣⌬ ɢʀᴏᴜᴘ
┣⌬ ᴀʟʟᴍᴇɴᴜ
┗━━━━━━━◧

_ᴋᴇᴛɪᴋ ɴᴀᴍᴀ ᴋᴀᴛᴇɢᴏʀɪ ᴜɴᴛᴜᴋ ᴍᴇʟɪʜᴀᴛ ɪꜱɪɴʏᴀ._
_ᴄᴏɴᴛᴏʜ: *${config.prefix}menu_game* ᴀᴛᴀᴜ *${config.prefix}allmenu* ᴜɴᴛᴜᴋ ᴍᴇɴᴀᴍᴘɪʟᴋᴀɴ ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ_`;

  await sock.sendMessage(from, { text: menuText }, { quoted: msg });
}

module.exports = listCommand;
