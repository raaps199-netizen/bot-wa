const {
  proto,
  generateWAMessageFromContent
} = require('@whiskeysockets/baileys');

module.exports = async function testInteractive(sock, msg) {
  const jid = msg.key.remoteJid;

  const message = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text:
                '⛏️ *MINING TEST*\n\n' +
                '📍 Depth: *100m*\n' +
                '⚡ Energy: *100/100*\n' +
                '💎 Diamond: *4*'
            }),

            footer: proto.Message.InteractiveMessage.Footer.create({
              text: 'Mining System'
            }),

            nativeFlowMessage:
              proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                      display_text: '⛏️ GALI',
                      id: 'mining_dig'
                    })
                  },
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                      display_text: '🎒 INVENTORY',
                      id: 'mining_inventory'
                    })
                  }
                ]
              })
          })
        }
      }
    },
    {
      userJid: jid
    }
  );

  await sock.relayMessage(
    jid,
    message.message,
    {
      messageId: message.key.id
    }
  );
};
