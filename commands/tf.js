// File: commands/tf.js
const { getUserData, getTotalScore, addPoints, deductPoints, parseBetAmount } = require('../utils/helper');
const { getSenderId, resolveUserKey } = require('../utils/jid-utils');

function ensureDB() {
  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
}

module.exports = async function tfCommand(sock, msg, args) {
  ensureDB();
  const remoteJid = msg.key.remoteJid;

  try {
    // 1. Dapatkan Sender ID
    const rawSenderId = getSenderId(msg, remoteJid) || (msg.key.participant || remoteJid);
    const senderId = typeof resolveUserKey === 'function' 
      ? resolveUserKey(global.db, rawSenderId) 
      : rawSenderId;

    if (!senderId) {
      return await sock.sendMessage(remoteJid, { 
        text: `⚠️ Gagal mendeteksi akun lu! Coba ketik command sambil reply pesan lu sendiri.` 
      }, { quoted: msg });
    }

    // 2. Deteksi Target (Mentions / Reply / Nomor)
    let targetId = null;
    let targetArgStr = null;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentioned.length > 0) {
      targetId = mentioned[0];
    } else if (quotedParticipant) {
      targetId = quotedParticipant;
    } else {
      const argTarget = args.find(arg => arg.includes('@') || (!isNaN(arg.replace(/[^0-9]/g, '')) && arg.replace(/[^0-9]/g, '').length >= 10));
      if (argTarget) {
        targetArgStr = argTarget;
        const cleanNum = argTarget.replace(/[^0-9]/g, '');
        if (cleanNum.length >= 5) {
          targetId = cleanNum + '@s.whatsapp.net';
        }
      }
    }

    if (targetId && typeof resolveUserKey === 'function') {
      targetId = resolveUserKey(global.db, targetId);
    }

    // Validasi Target
    if (!targetId || targetId === senderId || targetId.split('@')[0] === senderId.split('@')[0]) {
      return await sock.sendMessage(remoteJid, {
        text: `⚠️ Target tidak valid atau lu mau transfer ke diri sendiri?\nCara pakai: *.tf @tag nominal* atau reply pesan target.`
      }, { quoted: msg });
    }

    // 3. Ambil data pengirim & saldo awal
    const senderUser = getUserData(global.db, senderId);
    const senderScore = getTotalScore(senderUser);

    // 4. Parsing Nominal Transfer (Filter argumen yang merupakan tag user)
    const filteredArgs = args.filter(a => a !== targetArgStr && !a.includes('@'));
    let tfAmount = null;

    if (filteredArgs.length > 0) {
      tfAmount = parseBetAmount(filteredArgs[0], senderScore);
    }

    if (isNaN(tfAmount) || !tfAmount || tfAmount <= 0) {
      return await sock.sendMessage(remoteJid, { 
        text: `⚠️ Masukkan nominal transfer yang valid!\nContoh: *.tf @user 1000* atau *.tf @user all*` 
      }, { quoted: msg });
    }

    // 5. Cek kecukupan saldo
    if (senderScore < tfAmount) {
      return await sock.sendMessage(remoteJid, {
        text: `⚠️ Poin lu gak cukup! Total poin lu cuma *${senderScore}*, tapi mau transfer *${tfAmount}*.`
      }, { quoted: msg });
    }

    // 6. Eksekusi Transfer Poin (Memakai signature baru helper.js)
    const sukses = deductPoints(global.db, senderId, tfAmount);
    if (!sukses) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Transfer gagal, saldo tidak mencukupi.` }, { quoted: msg });
    }

    // Tambah poin ke target
    addPoints(global.db, targetId, tfAmount);

    // Autosave ke database jika fungsi global tersedia
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    // Sisa poin terbaru pengirim
    const sisaPoin = getTotalScore(getUserData(global.db, senderId));

    // 7. Kirim pesan konfirmasi transfer
    await sock.sendMessage(remoteJid, {
      text: `💸 *TRANSFER POIN BERHASIL!*\n\n• Pengirim: @${senderId.split('@')[0]}\n• Penerima: @${targetId.split('@')[0]}\n• Nominal: *${tfAmount} Poin*\n\n💰 Sisa poin lu: *${sisaPoin} Poin*`,
      mentions: [senderId, targetId]
    }, { quoted: msg });

  } catch (err) {
    console.error('Error di tfCommand:', err);
    const shortStack = (err.stack || '').split('\n').slice(0, 5).join('\n');
    await sock.sendMessage(remoteJid, {
      text: `❌ [DEBUG] Error di .tf: ${err.message}\n\n📍 Lokasi:\n${shortStack}`
    }, { quoted: msg });
  }
};
