const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '../backup_db.json');

async function recoverCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  // Batasi hanya owner bot yang bisa pakai command recover biar aman dari usilan orang
  const ownerPhone = '6289531307627';
  const ownerLid = '66477638029541';

  if (!senderId.includes(ownerPhone) && !senderId.includes(ownerLid)) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Lu bukan owner, gak usah sok asik mau me-recover database wkwk!` 
    }, { quoted: msg });
  }

  if (!fs.existsSync(backupPath)) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ File backup belum ada atau belum pernah dibuat secara otomatis!` 
    }, { quoted: msg });
  }

  try {
    const rawBackup = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(rawBackup);

    if (!backupData.users) {
      return await sock.sendMessage(remoteJid, { text: `❌ Format file backup tidak valid!` }, { quoted: msg });
    }

    // Timpa data users saat ini dengan data dari backup
    global.db.users = backupData.users;

    if (typeof global.saveDatabase === 'function') {
      global.saveDatabase();
    }

    await sock.sendMessage(remoteJid, { 
      text: `✅ Sukses me-recover database! Leaderboard dan skor berhasil dikembalikan ke data terakhir.` 
    }, { quoted: msg });

  } catch (err) {
    console.error('Error saat recover database:', err);
    await sock.sendMessage(remoteJid, { text: `❌ Terjadi kesalahan saat membaca file backup.` }, { quoted: msg });
  }
}

module.exports = recoverCommand;

