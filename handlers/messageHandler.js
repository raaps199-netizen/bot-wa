// File: handlers/messageHandler.js

const config = require('../config');
const handleGameAnswer = require('./gameHandler');
const { getUserData, getTotalScore, addPoints, deductPoints } = require('../utils/helper');
const { handleBankCommand } = require('../commands/bank');
const { handleInventoryCommand } = require('../commands/inventory');
const { getSenderId } = require('../utils/jid-utils');
const { handleRebirthCommand } = require('../commands/rebirth');
const handleResetCommand = require('../commands/reset');
const handleDungeonCommand = require('../commands/dungeon');
const testInteractiveCommand = require('../commands/testinteractive');


// ⛏️ Import Mining
const handleMiningCommand = require('../commands/mining');

// ==========================================================
// 🧪 IMPORT INTERACTIVE MESSAGE
// ==========================================================
const {
  proto,
  generateWAMessageFromContent
} = require('@whiskeysockets/baileys');

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

// Command Games, Leaderboard, & Ekonomi Baru
const blackjackCommand = require('../commands/blackjack');
const mathCommand = require('../commands/math');
const tebakbenderaCommand = require('../commands/tebakbendera');
const tebakkataCommand = require('../commands/tebakkata');
const tebakgambarCommand = require('../commands/tebakgambar');
const triviaCommand = require('../commands/trivia');
const { tetrisCommand, claimTetrisCommand } = require('../commands/tetris');
const scoreCommand = require('../commands/score');
const leaderboardCommand = require('../commands/leaderboard');
const claimCommand = require('../commands/claim');
const tfCommand = require('../commands/tf');
const { duelCommand, handleDuelAnswer } = require('../commands/duel');
const titleCommand = require('../commands/title');

// 🎣 Import Command Fishing, Shop, & Event World Boss
const { handleFishingCommand } = require('../commands/fishing');
const { handleShopCommand, handleBeliCommand } = require('../commands/shop');
const auroraCommand = require('../commands/aurora');
const { handleEventCommand, handleAttackBossCommand } = require('../commands/event');

// Command Reme & QQ Kasino
const remeCommand = require('../commands/reme');
const { terimaCommand, tolakCommand } = require('../commands/remeAcceptReject');
const spinCommand = require('../commands/remeSpin');

const qqCommand = require('../commands/qq');
const { qqAcceptCommand, qqRejectCommand } = require('../commands/qqAcceptReject');
const qqSpinCommand = require('../commands/qqSpin');

// ==========================================
// 📅 DATA JADWAL PELAJARAN & PIKET KELAS
// ==========================================
const jadwalPelajaran = {
  jsn: { hari: "Senin", mapel: ["MTK TL", "Inggris", "Fisika"] },
  jsl: { hari: "Selasa", mapel: ["Fisika", "Sunda", "Informatika", "PAI"] },
  jrb: { hari: "Rabu", mapel: ["PKN", "PKWU", "Kimia", "B. Indo", "SBK"] },
  jkm: { hari: "Kamis", mapel: ["Kimia", "Penjas", "Sejarah", "MTK U"] },
  jjt: { hari: "Jumat", mapel: ["MTK TL", "MTK U", "BK", "B. Indo", "Informatika"] }
};

const daftarPiket = {
  jsn: ["Khafi", "Arjasena", "Orlen", "Avisha", "Fareal", "Andrian", "Sadam", "Wisnu", "Tania", "Jauharah"],
  jsl: ["Keyla", "Mikaela", "Ridho", "Rizky", "Zyella", "Nishar", "Alvian", "Brella", "Fathian", "Reno"],
  jrb: ["Lutfan", "Rafif", "Kevin", "Arya", "Al Mira", "Elang", "Dzaki N.", "Aisahra", "Satria P", "Putri"],
  jkm: ["Fahri", "Rifqi", "Fadhil", "Yusuf", "Kirana", "Effan", "Dzaki", "Aura", "Reva", "Surya"],
  jjt: ["Dhirgam", "Yoga", "Dude", "Daffa", "Irfan", "Ara", "Anissa", "Meli", "Gibran", "Salsabila"]
};

// ==========================================
// 🧪 TEST INTERACTIVE MESSAGE
// ==========================================
async function sendTestInteractive(sock, msg) {
  const jid = msg.key.remoteJid;

  try {
    console.log('🧪 TEST INTERACTIVE:', jid);

    const message = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },

            interactiveMessage:
              proto.Message.InteractiveMessage.create({
                body:
                  proto.Message.InteractiveMessage.Body.create({
                    text:
                      '⛏️ *MINING TEST*\n\n' +
                      '📍 Depth: *100m*\n' +
                      '⚡ Energy: *100/100*\n' +
                      '💎 Diamond: *4*\n\n' +
                      'Pilih aksi lu:'
                  }),

                footer:
                  proto.Message.InteractiveMessage.Footer.create({
                    text: 'Mining Adventure'
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
                    ],

                    messageParamsJson: JSON.stringify({
                      limited_time_offer: {
                        text: 'Mining Adventure'
                      }
                    })
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

    console.log(
      '✅ INTERACTIVE TERKIRIM:',
      message.key.id
    );

  } catch (err) {
    console.error(
      '❌ ERROR INTERACTIVE:',
      err
    );

    await sock.sendMessage(
      jid,
      {
        text:
          '❌ Gagal mengirim interactive.\n\n' +
          `Error: ${err?.message || err}`
      },
      { quoted: msg }
    );
  }
}
    // ===================================================
    // 🏅 AUTO-INJECT GELAR/TITLE PADA MENTION USER
    // ===================================================
    const originalSendMessage = sock.sendMessage.bind(sock);

    sock = new Proxy(sock, {
      get(target, prop) {
        if (prop === 'sendMessage') {
          return async (jid, content, options) => {
            if (
              content &&
              typeof content.text === 'string' &&
              Array.isArray(content.mentions) &&
              content.mentions.length > 0
            ) {
              let text = content.text;

              content.mentions.forEach(mJid => {
                const userData =
                  getUserData(global.db, mJid);

                const title =
                  userData?.title ||
                  userData?.activeTitle ||
                  userData?.gelar ||
                  userData?.equippedTitle;

                if (title) {
                  const num = mJid.split('@')[0];
                  const nick =
                    userData?.nickname ||
                    userData?.name;

                  const titleTag = `[${title}] `;

                  if (
                    nick &&
                    text.includes(`@${nick}`) &&
                    !text.includes(
                      `${titleTag}@${nick}`
                    )
                  ) {
                    text = text
                      .split(`@${nick}`)
                      .join(
                        `${titleTag}@${nick}`
                      );
                  }

                  if (
                    text.includes(`@${num}`) &&
                    !text.includes(
                      `${titleTag}@${num}`
                    )
                  ) {
                    text = text
                      .split(`@${num}`)
                      .join(
                        `${titleTag}@${num}`
                      );
                  }
                }
              });

              content.text = text;
            }

            return originalSendMessage(
              jid,
              content,
              options
            );
          };
        }

        return Reflect.get(target, prop);
      }
    });

    // ===================================================

    let text =
      messageContent.conversation ||
      messageContent.extendedTextMessage?.text ||
      messageContent.imageMessage?.caption ||
      messageContent.videoMessage?.caption ||
      messageContent.editedMessage?.message?.protocolMessage?.extendedTextMessage?.text ||
      '';

    const cleanText = text.trim();

    if (!cleanText) return;

    const remoteJid = msg.key.remoteJid;
    const senderId = getSenderId(
      msg,
      remoteJid
    );

    // Owner checks
    const ownerPhone = '6289531307627';
    const ownerLid = '66477638029541';

    const isOwner =
      senderId.includes(ownerPhone) ||
      senderId.includes(ownerLid);

    // ===================================================
    // 🕳️ DUNGEON SESSION INTERCEPTOR (NATURAL INPUT)
    // ===================================================
    const user = global.db?.users?.[senderId];

    if (
      user &&
      user.dungeon &&
      user.dungeon.active
    ) {
      if (
        !cleanText.startsWith(config.prefix) &&
        !cleanText.startsWith('/')
      ) {
        const dungeonArgs =
          cleanText.trim().split(/ +/);

        await handleDungeonCommand(
          sock,
          msg,
          dungeonArgs
        );

        return;
      }
    }

    // ===================================================
    // 🎰 SPIN INTERCEPTOR
    // ===================================================
    if (
      cleanText.toLowerCase() === '.spin' ||
      cleanText.toLowerCase() === 'spin'
    ) {
      const gameType =
        global.db?.game?.[remoteJid]?.type;

      if (gameType === 'reme') {
        await spinCommand(sock, msg);
        return;
      }

      if (gameType === 'qq') {
        await qqSpinCommand(sock, msg);
        return;
      }
    }

    // ===================================================
    // 🎮 GAME ANSWER INTERCEPTOR
    // ===================================================
    try {
      const isGameAnswered =
        await handleGameAnswer(
          sock,
          msg,
          cleanText
        );

      if (isGameAnswered) return;

    } catch (gameErr) {
      console.error(
        'Error saat handleGameAnswer:',
        gameErr
      );
    }

    // ===================================================
    // ⚔️ DUEL ANSWER INTERCEPTOR
    // ===================================================
    try {
      const isDuelAnswered =
        await handleDuelAnswer(
          sock,
          msg,
          cleanText
        );

      if (isDuelAnswered) return;

    } catch (duelErr) {
      console.error(
        'Error saat handleDuelAnswer:',
        duelErr
      );
    }

    // ===================================================
    // PREFIX
    // ===================================================
    let prefixUsed = '';

    if (
      cleanText.startsWith(config.prefix)
    ) {
      prefixUsed = config.prefix;

    } else if (
      cleanText.startsWith('/')
    ) {
      prefixUsed = '/';
    }

    if (!prefixUsed) return;

    const args =
      cleanText
        .slice(prefixUsed.length)
        .trim()
        .split(/ +/);

    const command =
      args.shift().toLowerCase();

    // ===================================================
    // 🚨 KUNCI LOCKDOWN KRAKEN
    // ===================================================
    if (global.activeBoss) {
      const allowedCommands = [
        'serang',
        'hit',
        'event',
        'status',
        'boss'
      ];

      if (
        !allowedCommands.includes(command)
      ) {
        return await sock.sendMessage(
          remoteJid,
          {
            text:
              `🚨 *DARURAT! KRAKEN MENGAMUK DI PERAIRAN!* 🐙\n\n` +
              `Semua aktivitas (*.${command}*) dibekukan sementara oleh monster!\n` +
              `⚠️ Segera ketik *.serang* untuk membela diri, atau harta kekayaanmu bakal dijarah habis-habisan oleh Kraken!`
          },
          { quoted: msg }
        );
      }
    }

    // ===================================================
    // COMMAND ROUTER
    // ===================================================
    switch (command) {

      // ==========================================
      // 🧪 TEST INTERACTIVE
      // ==========================================
      case 'testinteractive':
      case 'testinteractive':
        await sendTestInteractive(
          sock,
          msg
        );
        break;

      // ==========================================
      // 🎮 DUNGEON / ZORK
      // ==========================================
      case 'zork':
      case 'dungeon':
      case 'jelajah':
        await handleDungeonCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // ⛏️ MINING
      // ==========================================
      case 'mining':
      case 'mine':
      case 'tambang':
        await handleMiningCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // 🎒 INVENTORY
      // ==========================================
      case 'inv':
      case 'inventory':
      case 'tas':
        await handleInventoryCommand(
          sock,
          msg,
          senderId
        );
        break;

      // ==========================================
      // 🎣 FISHING
      // ==========================================
      case 'fish':
      case 'mancing':
        await handleFishingCommand(
          sock,
          msg,
          command,
          args,
          senderId
        );
        break;

      case 'lnj':
      case 'lanjut':
        await handleFishingCommand(
          sock,
          msg,
          'fish',
          ['lnj', ...args],
          senderId
        );
        break;

      case 'start':
      case 'stop':
      case 'autofish':
      case 'auto':
        await handleFishingCommand(
          sock,
          msg,
          command,
          args,
          senderId
        );
        break;

      case 'favorit':
      case 'fav':
        await handleFishingCommand(
          sock,
          msg,
          command,
          args,
          senderId
        );
        break;

      // ==========================================
      // 🛒 FISHING SHOP
      // ==========================================
      case 'shop':
      case 'toko':
        await handleShopCommand(
          sock,
          msg,
          args,
          senderId
        );
        break;

      case 'beli':
      case 'buy':
        await handleBeliCommand(
          sock,
          msg,
          args,
          senderId
        );
        break;

      // ==========================================
      // 🐙 WORLD BOSS
      // ==========================================
      case 'event':
        await handleEventCommand(
          sock,
          msg,
          args,
          senderId
        );
        break;

      case 'serang':
      case 'hit':
        await handleAttackBossCommand(
          sock,
          msg,
          senderId
        );
        break;

      // ==========================================
      // 📅 JADWAL & PIKET
      // ==========================================
      case 'jadwal':
      case 'jsn':
      case 'jsl':
      case 'jrb':
      case 'jkm':
      case 'jjt':
      case 'senin':
      case 'selasa':
      case 'rabu':
      case 'kamis':
      case 'jumat': {
        const aliasHari = {
          senin: 'jsn',
          jsn: 'jsn',
          selasa: 'jsl',
          jsl: 'jsl',
          rabu: 'jrb',
          jrb: 'jrb',
          kamis: 'jkm',
          jkm: 'jkm',
          jumat: 'jjt',
          jjt: 'jjt'
        };

        let rawKey =
          (
            command === 'jadwal'
              ? args[0]
              : command
          ) || '';

        let key =
          aliasHari[
            rawKey.toLowerCase()
          ];

        if (!key) {
          const todayIdx =
            new Date().getDay();

          const dayMap = {
            1: 'jsn',
            2: 'jsl',
            3: 'jrb',
            4: 'jkm',
            5: 'jjt'
          };

          key =
            dayMap[todayIdx] || 'jsn';
        }

        const dataMapel =
          jadwalPelajaran[key];

        const anggotaPiket =
          daftarPiket[key] || [];

        if (dataMapel) {
          let pesan =
            `📅 *JADWAL PELAJARAN — HARI ${dataMapel.hari.toUpperCase()}*\n`;

          pesan +=
            `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

          dataMapel.mapel.forEach(
            (mapel, index) => {
              pesan +=
                `📖 *Jam ke-${index + 1}:* ${mapel}\n`;
            }
          );

          if (anggotaPiket.length >= 10) {
            const piketKelas =
              acakArray(anggotaPiket);

            pesan +=
              `\n━━━━━━━━━━━━━━━━━━━━━━\n`;

            pesan +=
              `🧹 *PEMBAGIAN PIKET KELAS (${dataMapel.hari.toUpperCase()})*\n`;

            pesan +=
              `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            pesan +=
              `🧹 *Menyapu (2 Orang):*\n` +
              `  1. ${piketKelas[0]}\n` +
              `  2. ${piketKelas[1]}\n\n`;

            pesan +=
              `🧽 *Mengepel (2 Orang):*\n` +
              `  1. ${piketKelas[2]}\n` +
              `  2. ${piketKelas[3]}\n\n`;

            pesan +=
              `🪟 *Mengelap Kaca (2 Orang):*\n` +
              `  1. ${piketKelas[4]}\n` +
              `  2. ${piketKelas[5]}\n\n`;

            pesan +=
              `🪑 *Mengangkat Bangku (2 Orang):*\n` +
              `  1. ${piketKelas[6]}\n` +
              `  2. ${piketKelas[7]}\n\n`;

            pesan +=
              `🗑️ *Cek Kolong & Buang Sampah (1 Orang):*\n` +
              `  1. ${piketKelas[8]}\n\n`;

            pesan +=
              `🖊️ *Isi Spidol & Hapus Papan (1 Orang):*\n` +
              `  1. ${piketKelas[9]}\n`;

            const piketMbg =
              acakArray(anggotaPiket);

            const pengambilMbg =
              piketMbg.slice(0, 5);

            const pengembaliMbg =
              piketMbg.slice(5, 10);

            const piketHp =
              acakArray(anggotaPiket);

            const petugasHp =
              piketHp.slice(0, 2);

            pesan +=
              `\n━━━━━━━━━━━━━━━━━━━━━━\n`;

            pesan +=
              `🍱 *PEMBAGIAN TUGAS KHUSUS (${dataMapel.hari.toUpperCase()})*\n`;

            pesan +=
              `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            pesan +=
              `🚚 *Tim Pengambil MBG (5 Orang):*\n`;

            pengambilMbg.forEach(
              (nama, idx) => {
                pesan +=
                  `  ${idx + 1}. ${nama}\n`;
              }
            );

            pesan +=
              `\n🔄 *Tim Pengembali MBG (5 Orang):*\n`;

            pengembaliMbg.forEach(
              (nama, idx) => {
                pesan +=
                  `  ${idx + 1}. ${nama}\n`;
              }
            );

            pesan +=
              `\n📱 *Tim Kumpul HP ke Ruang Guru (2 Orang):*\n`;

            petugasHp.forEach(
              (nama, idx) => {
                pesan +=
                  `  ${idx + 1}. ${nama}\n`;
              }
            );

            pesan +=
              `\n✨ *Catatan:* Diharapkan teman-teman yang bertugas bisa menjalankan kewajibannya tepat waktu ya. Semangat belajar! 🤝`;
          }

          let mentions = [];

          if (
            remoteJid.endsWith('@g.us')
          ) {
            try {
              const groupMetadata =
                await sock.groupMetadata(
                  remoteJid
                );

              mentions =
                groupMetadata.participants.map(
                  p => p.id
                );

            } catch (e) {
              console.error(
                'Gagal mengambil metadata grup:',
                e
              );
            }
          }

          await sock.sendMessage(
            remoteJid,
            {
              text: pesan,
              mentions: mentions,
              contextInfo: {
                isForwarded: true,
                forwardingScore: 999
              }
            },
            { quoted: msg }
          );
        }

        break;
      }

      // ==========================================
      // 🏓 PING
      // ==========================================
      case 'ping': {
        const start = Date.now();

        const sentMsg =
          await sock.sendMessage(
            remoteJid,
            {
              text: 'Pong! 🏓'
            },
            { quoted: msg }
          );

        const latency =
          Date.now() - start;

        await sock.sendMessage(
          remoteJid,
          {
            text:
              `Pong! 🏓\n` +
              `Kecepatan respon: *${latency} ms*`
          },
          { quoted: sentMsg }
        );

        break;
      }

      // ==========================================
      // ➕ ADD POINT
      // ==========================================
      case 'add': {
        if (!isOwner) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `❌ Lu bukan owner, gak usah sok asik mau nambah poin sendiri wkwk!\n` +
                `(ID terdeteksi: ${senderId})`
            },
            { quoted: msg }
          );

          break;
        }

        const mentioned =
          msg.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid || [];

        let targetId = senderId;
        let addAmount = NaN;

        if (mentioned.length > 0) {
          targetId = mentioned[0];

          const nonTagArgs =
            args.filter(
              arg => !arg.includes('@')
            );

          addAmount =
            parseInt(nonTagArgs[0]);

        } else {
          addAmount =
            parseInt(args[0]);
        }

        if (isNaN(addAmount)) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `⚠️ Format salah, bre!\n` +
                `Contoh buat diri sendiri: *.add 100*\n` +
                `Contoh buat orang lain: *.add @user 500*`
            },
            { quoted: msg }
          );

          break;
        }

        if (addAmount < 0) {
          const success =
            deductPoints(
              global.db,
              targetId,
              Math.abs(addAmount)
            );

          if (!success) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  `❌ Poin total user tidak mencukupi untuk dikurangi sebesar ${Math.abs(addAmount)}!`
              },
              { quoted: msg }
            );

            break;
          }

        } else {
          addPoints(
            global.db,
            targetId,
            addAmount
          );
        }

        if (
          typeof global.saveDatabase ===
          'function'
        ) {
          global.saveDatabase();
        }

        const userData =
          getUserData(
            global.db,
            targetId
          );

        const currentTotal =
          getTotalScore(userData);

        const targetName =
          targetId.split('@')[0];

        await sock.sendMessage(
          remoteJid,
          {
            text:
              `✅ Sukses mengubah poin sebesar *${addAmount}* ke @${targetName}!\n` +
              `Total poin target sekarang: *${currentTotal}*`,
            mentions: [targetId]
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // 🌌 AURORA
      // ==========================================
      case 'aurora': {
        if (!isOwner) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `❌ Lu bukan owner, gak usah sok asik mau aktifin event Aurora wkwk!\n` +
                `(ID terdeteksi: ${senderId})`
            },
            { quoted: msg }
          );

          break;
        }

        await auroraCommand(
          sock,
          msg,
          args
        );

        break;
      }

      // ==========================================
      // 🎁 CLAIM
      // ==========================================
      case 'claim':
      case 'daily':
        await claimCommand(
          sock,
          msg
        );
        break;

      // ==========================================
      // 💸 TRANSFER
      // ==========================================
      case 'tf':
      case 'transfer':
        await tfCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // ⚔️ DUEL
      // ==========================================
      case 'duel':
        await duelCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // 👤 NICKNAME
      // ==========================================
      case 'nickname':
      case 'setname': {
        const newNick =
          args.join(' ').trim();

        if (!newNick) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `⚠️ Masukkan nickname baru yang kamu mau!\n` +
                `Contoh: *${prefixUsed}nickname azalia*`
            },
            { quoted: msg }
          );

          break;
        }

        if (newNick.length > 20) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `❌ Nickname kepanjangan! Maksimal 20 karakter ya, bre.`
            },
            { quoted: msg }
          );

          break;
        }

        const user =
          getUserData(
            global.db,
            senderId
          );

        user.nickname = newNick;
        user.name = newNick;

        if (
          typeof global.saveDatabase ===
          'function'
        ) {
          global.saveDatabase();
        }

        await sock.sendMessage(
          remoteJid,
          {
            text:
              `✅ Sukses mengubah nickname leaderboard kamu menjadi: *${newNick}*`
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // ❌ BATAL
      // ==========================================
      case 'batal':
      case 'cancel': {
        const currentGame =
          global.db.game?.[remoteJid];

        if (!currentGame) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `⚠️ Lagi tidak ada sesi game aktif yang bisa dibatalkan di chat ini.`
            },
            { quoted: msg }
          );

          break;
        }

        if (currentGame.timer) {
          clearTimeout(
            currentGame.timer
          );
        }

        delete global.db.game[remoteJid];

        if (
          typeof global.saveDatabase ===
          'function'
        ) {
          global.saveDatabase();
        }

        await sock.sendMessage(
          remoteJid,
          {
            text:
              `✅ Sesi game aktif (${currentGame.type.toUpperCase()}) berhasil dibatalkan secara paksa.`
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // 📝 JAWAB
      // ==========================================
      case 'jawab':
      case 'j': {
        const userAnswer =
          args.join(' ');

        if (!userAnswer) {
          await sock.sendMessage(
            remoteJid,
            {
              text:
                `⚠️ Masukkan jawaban kamu!\n` +
                `Contoh: *${prefixUsed}jawab a*`
            },
            { quoted: msg }
          );

          break;
        }

        await handleGameAnswer(
          sock,
          msg,
          userAnswer
        );

        break;
      }

      // ==========================================
      // 🔥 REBIRTH
      // ==========================================
      case 'rebirth':
      case 'transendensi':
        await handleRebirthCommand(
          sock,
          msg,
          senderId
        );
        break;

      // ==========================================
      // 🔄 RESET
      // ==========================================
      case 'reset':
      case 'resetseason':
        await handleResetCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // 🏆 TITLE
      // ==========================================
      case 'title':
      case 'gelar':
        await titleCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // 🏦 BANK
      // ==========================================
      case 'bank':
      case 'atm':
      case 'tabungan':
        await handleBankCommand(
          sock,
          msg,
          args,
          senderId
        );
        break;

      // ==========================================
      // 🎰 REME
      // ==========================================
      case 'reme':
        await remeCommand(
          sock,
          msg,
          args
        );
        break;

      case 'terima':
        await terimaCommand(
          sock,
          msg
        );
        break;

      case 'tolak':
        await tolakCommand(
          sock,
          msg
        );
        break;

      case 'spin':
        await spinCommand(
          sock,
          msg
        );
        break;

      // ==========================================
      // 🎰 QQ
      // ==========================================
      case 'qq':
        await qqCommand(
          sock,
          msg,
          args
        );
        break;

      case 'terimaqq':
        await qqAcceptCommand(
          sock,
          msg
        );
        break;

      case 'tolakqq':
        await qqRejectCommand(
          sock,
          msg
        );
        break;

      case 'spinqq':
        await qqSpinCommand(
          sock,
          msg
        );
        break;

      // ==========================================
      // 🖼️ MEDIA
      // ==========================================
      case 's':
      case 'sticker':
        await stickerCommand(
          sock,
          msg
        );
        break;

      case 'tt':
      case 'tiktok':
        await tiktokCommand(
          sock,
          msg,
          args
        );
        break;

      case 'ig':
      case 'instagram':
        await igCommand(
          sock,
          msg,
          args
        );
        break;

      case 'brat':
        await bratCommand(
          sock,
          msg,
          args
        );
        break;

      case 'bratvid':
        await bratvidCommand(
          sock,
          msg,
          args
        );
        break;

      case 'wm':
        await wmCommand(
          sock,
          msg,
          args
        );
        break;

      case 'close':
      case 'tutup':
        await groupCommand(
          sock,
          msg,
          args,
          'close'
        );
        break;

      case 'open':
      case 'buka':
        await groupCommand(
          sock,
          msg,
          args,
          'open'
        );
        break;

      case 'online':
      case 'here':
        await onlineCommand(
          sock,
          msg
        );
        break;

      case 'ncode':
      case 'nukecode':
        await ncodeCommand(
          sock,
          msg
        );
        break;

      case 'nyerah':
      case 'menyerah':
        await handleGameAnswer(
          sock,
          msg,
          '.nyerah'
        );
        break;

      case 'promote':
      case 'pm':
        await groupCommand(
          sock,
          msg,
          args,
          'promote'
        );
        break;

      case 'demote':
      case 'dm':
        await groupCommand(
          sock,
          msg,
          args,
          'demote'
        );
        break;

      case 'toimg':
        await toimgCommand(
          sock,
          msg
        );
        break;

      case 'tovid':
      case 'tomp4':
        await tovidCommand(
          sock,
          msg
        );
        break;

      case 'quote':
      case 'q':
      case 'qc':
        await quoteCommand(
          sock,
          msg,
          args
        );
        break;

      case 'rvo':
      case 'viewonce':
      case 'save':
        await rvoCommand(
          sock,
          msg
        );
        break;

      // ==========================================
      // 🤖 AI & TOOLS
      // ==========================================
      case 'ai':
      case 'tanya':
        await aiCommand(
          sock,
          msg,
          args
        );
        break;

      case 'hd':
      case 'remini':
      case 'enhance':
        await hdCommand(
          sock,
          msg
        );
        break;

      case 'ss':
      case 'ssweb':
        await sswebCommand(
          sock,
          msg,
          args
        );
        break;

      case 'play':
        await playCommand(
          sock,
          msg,
          args
        );
        break;

      case 'ytmp3':
      case 'yta':
        await ytmp3Command(
          sock,
          msg,
          args
        );
        break;

      case 'cekkhodam':
      case 'khodam':
        await cekkhodamCommand(
          sock,
          msg,
          args
        );
        break;

      case 'truth':
        await truthCommand(
          sock,
          msg
        );
        break;

      case 'dare':
        await dareCommand(
          sock,
          msg
        );
        break;

      case 'cekbucin':
      case 'bucin':
        await cekbucinCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // 💰 ECONOMY
      // ==========================================
      case 'score':
      case 'skor':
        await scoreCommand(
          sock,
          msg,
          args
        );
        break;

      case 'leaderboard':
      case 'lb':
      case 'top':
        await leaderboardCommand(
          sock,
          msg
        );
        break;

      // ==========================================
      // 🎮 GAMES
      // ==========================================
      case 'bj':
      case 'blackjack':
      case 'hit':
      case 'stand':
        if (
          command === 'hit' ||
          command === 'stand'
        ) {
          await blackjackCommand(
            sock,
            msg,
            [command]
          );
        } else {
          await blackjackCommand(
            sock,
            msg,
            args
          );
        }

        break;

      case 'math':
      case 'matematika':
        await mathCommand(
          sock,
          msg,
          args
        );
        break;

      case 'tebakbendera':
        await tebakbenderaCommand(
          sock,
          msg
        );
        break;

      case 'tebakkata':
        await tebakkataCommand(
          sock,
          msg
        );
        break;

      case 'tebakgambar':
        await tebakgambarCommand(
          sock,
          msg
        );
        break;

      case 'trivia':
      case 'kuis':
        await triviaCommand(
          sock,
          msg,
          args
        );
        break;

      case 'tetris':
        await tetrisCommand(
          sock,
          msg,
          args
        );
        break;

      case 'claimtetris':
      case 'klaimtetris':
        await claimTetrisCommand(
          sock,
          msg,
          args
        );
        break;

      // ==========================================
      // 📋 MENU GAME
      // ==========================================
      case 'menu_game':
      case 'games': {
        const gameText =
`┏━I *ᴍᴇɴᴜ ɢᴀᴍᴇꜱ* I
┃
┣⌬ ${prefixUsed}dungeon / ${prefixUsed}jelajah (Zork Text Adventure RPG)
┣⌬ ${prefixUsed}mining (Mining Adventure)
┣⌬ ${prefixUsed}bj
┣⌬ ${prefixUsed}mancing
┣⌬ ${prefixUsed}lnj (Lanjut Mancing)
┣⌬ ${prefixUsed}fish [tas|sell|sellall|pakai|stats|help]
┣⌬ ${prefixUsed}inv / ${prefixUsed}tas (Cek Inventory)
┣⌬ ${prefixUsed}shop (Beli Potion Mancing)
┣⌬ ${prefixUsed}beli <item> <jumlah>
┣⌬ ${prefixUsed}math [mudah|sedang|hard|max]
┣⌬ ${prefixUsed}tebakbendera
┣⌬ ${prefixUsed}tebakkata
┣⌬ ${prefixUsed}tebakgambar
┣⌬ ${prefixUsed}trivia <kategori> <level>
┣⌬ ${prefixUsed}tetris
┣⌬ ${prefixUsed}claimtetris <kode>
┣⌬ ${prefixUsed}duel math @user <taruhan> [diff]
┣⌬ ${prefixUsed}duel trivia @user <taruhan> [kategori] [diff]
┣⌬ ${prefixUsed}reme <taruhan> (Lawan Bot)
┣⌬ ${prefixUsed}reme @user <taruhan> (PvP)
┣⌬ ${prefixUsed}qq <taruhan> (Lawan Bot)
┣⌬ ${prefixUsed}qq @user <taruhan> (PvP)
┣⌬ ${prefixUsed}event kraken (World Boss)
┣⌬ ${prefixUsed}serang (Serang Monster)
┣⌬ ${prefixUsed}rebirth / ${prefixUsed}transendensi (Prestige System)
┣⌬ ${prefixUsed}batal
┣⌬ ${prefixUsed}claim (Ambil Poin Harian)
┣⌬ ${prefixUsed}tf @user <nominal>
┣⌬ ${prefixUsed}score
┣⌬ ${prefixUsed}leaderboard
┣⌬ ${prefixUsed}nickname <nama>
┣⌬ ${prefixUsed}cekkhodam <nama>
┣⌬ ${prefixUsed}bucin <nama>
┣⌬ ${prefixUsed}truth
┣⌬ ${prefixUsed}dare
┗━━━━━━━◧`;

        await sock.sendMessage(
          remoteJid,
          {
            text: gameText
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // 🛠️ MENU TOOLS
      // ==========================================
      case 'menu_tools':
      case 'tools': {
        const toolsText =
`┏━I *ᴍᴇɴᴜ ᴛᴏᴏʟꜱ* I
┃
┣⌬ ${prefixUsed}jadwal [senin/selasa/dll]
┣⌬ ${prefixUsed}jsn / .jsl / .jrb / .jkm / .jjt
┣⌬ ${prefixUsed}ping
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

        await sock.sendMessage(
          remoteJid,
          {
            text: toolsText
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // 👥 MENU GROUP
      // ==========================================
      case 'menu_group':
      case 'group': {
        const groupText =
`┏━I *ᴍᴇɴᴜ ɢʀᴏᴜ𝚙* I
┃
┣⌬ ${prefixUsed}open
┣⌬ ${prefixUsed}close
┣⌬ ${prefixUsed}online
┣⌬ ${prefixUsed}promote @user
┣⌬ ${prefixUsed}demote @user
┗━━━━━━━◧`;

        await sock.sendMessage(
          remoteJid,
          {
            text: groupText
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // 📋 ALL MENU
      // ==========================================
      case 'allmenu': {
        const allText =
`┏━I *ꜱᴇᴍᴜᴀ ᴍᴇɴᴜ* I
┃
┣⌬ *ɢᴀᴍᴇꜱ*
┃  • ${prefixUsed}dungeon / ${prefixUsed}jelajah (Zork Text Adventure RPG)
┃  • ${prefixUsed}mining (Mining Adventure)
┃  • ${prefixUsed}bj
┃  • ${prefixUsed}mancing
┃  • ${prefixUsed}lnj (Lanjut Mancing)
┃  • ${prefixUsed}fish [tas|sell|sellall|pakai|stats|help]
┃  • ${prefixUsed}inv / ${prefixUsed}tas
┃  • ${prefixUsed}shop
┃  • ${prefixUsed}beli <item> <jumlah>
┃  • ${prefixUsed}math [mudah|sedang|hard|max]
┃  • ${prefixUsed}tebakbendera
┃  • ${prefixUsed}tebakkata
┃  • ${prefixUsed}tebakgambar
┃  • ${prefixUsed}trivia <kategori> <level>
┃  • ${prefixUsed}tetris
┃  • ${prefixUsed}claimtetris <kode>
┃  • ${prefixUsed}duel math/trivia @user <taruhan>
┃  • ${prefixUsed}reme <taruhan> (Lawan Bot)
┃  • ${prefixUsed}reme @user <taruhan> (PvP)
┃  • ${prefixUsed}qq <taruhan> (Lawan Bot)
┃  • ${prefixUsed}qq @user <taruhan> (PvP)
┃  • ${prefixUsed}event kraken (World Boss)
┃  • ${prefixUsed}serang (Serang Monster)
┃  • ${prefixUsed}rebirth (Prestige System)
┃  • ${prefixUsed}batal
┃  • ${prefixUsed}claim (Ambil Poin Harian)
┃  • ${prefixUsed}tf @user <nominal>
┃  • ${prefixUsed}score
┃  • ${prefixUsed}leaderboard
┃  • ${prefixUsed}nickname <nama>
┃  • ${prefixUsed}cekkhodam <nama>
┃  • ${prefixUsed}bucin <nama>
┃  • ${prefixUsed}truth
┃  • ${prefixUsed}dare
┃
┣⌬ *ᴛᴏᴏʟꜱ & ᴊᴀᴅᴡᴀʟ*
┃  • ${prefixUsed}jadwal [hari]
┃  • ${prefixUsed}jsn / ${prefixUsed}jsl / ${prefixUsed}jrb / ${prefixUsed}jkm / ${prefixUsed}jjt
┃  • ${prefixUsed}ping
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
┣⌬ *ɢʀᴏᴜ𝚙*
┃  • ${prefixUsed}open
┃  • ${prefixUsed}close
┃  • ${prefixUsed}online
┃  • ${prefixUsed}promote @user
┃  • ${prefixUsed}demote @user
┗━━━━━━━◧`;

        await sock.sendMessage(
          remoteJid,
          {
            text: allText
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // 📋 MENU UTAMA
      // ==========================================
      case 'list':
      case 'menu':
      case 'help': {
        const menuText =
`┏━『 *ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ* 』
┃
┣⌬ ɢᴀᴍᴇꜱ
┣⌬ ᴛᴏᴏʟꜱ
┣⌬ ɢʀᴏᴜ𝚙
┣⌬ ᴀʟʟᴍᴇɴᴜ
┗━━━━━━━◧

_ᴋᴇᴛɪᴋ ɴᴀᴍᴀ ᴋᴀᴛᴇɢᴏʀɪ ᴜɴᴛᴜᴋ ᴍᴇʟɪʜᴀᴛ ɪꜱɪɴʏᴀ._
_ᴄᴏɴᴛᴏʜ: *.menu_game* ATAU *.allmenu* UNTUK MENAMPILKAN SEMUA MENU_`;

        await sock.sendMessage(
          remoteJid,
          {
            text: menuText
          },
          { quoted: msg }
        );

        break;
      }

      // ==========================================
      // DEFAULT
      // ==========================================
      default:
        break;
    }

  } catch (err) {
    console.error(
      'Error di handleMessage:',
      err
    );
  }
}

module.exports = handleMessage;
