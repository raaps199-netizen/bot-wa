const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const config = require('../config');

async function listCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const captionMenu = `
🤖 *BOT WHATSAPP MULTIFUNGSI*

📂 *Silakan pilih kategori menu di bawah ini:*
`.trim();

  const msgContent = generateWAMessageFromContent(
    remoteJid,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: captionMenu
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: "Klik tombol di bawah untuk memilih perintah"
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              title: "✨ *MENU UTAMA*",
              hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🎮 Game & Fun",
                    id: `${config.prefix}menu_game`
                  })
                },
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🛠️ Tools & Downloader",
                    id: `${config.prefix}menu_tools`
                  })
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "👑 Owner / Contact",
                    url: "https://wa.me/6289531307627" // Ganti dengan nomor WA kamu
                  })
                }
              ]
            })
          })
        }
      }
    },
    { quoted: msg }
  );

  await sock.relayMessage(remoteJid, msgContent.message, {
    messageId: msgContent.key.id
  });
}

module.exports = listCommand;
