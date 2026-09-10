// SUB-MENU PER KATEGORI
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
