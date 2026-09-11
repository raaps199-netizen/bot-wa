async function onlineCommand(sock, msg) {
  if (!msg.key.remoteJid.endsWith('@g.us')) {
    return await sock.sendMessage(msg.key.remoteJid, {
      text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!'
    }, { quoted: msg });
  }

  try {
    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
    const groupMembers = groupMetadata.participants;

    let teks = `🟢 *DAFTAR PRESENSI ANGGOTA GRUP*\n`;
    teks += `👥 *Total Anggota:* ${groupMembers.length}\n\n`;

    let mentions = [];
    groupMembers.forEach((member, i) => {
      teks += `${i + 1}. @${member.id.split('@')[0]}\n`;
      mentions.push(member.id);
    });

    teks += `\n_Tag otomatis untuk memancing status presensi anggota._`;

    await sock.sendMessage(msg.key.remoteJid, {
      text: teks,
      mentions: mentions
    }, { quoted: msg });

  } catch (err) {
    console.error('Error Cek Online:', err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ Gagal mengambil data anggota grup.'
    }, { quoted: msg });
  }
}

module.exports = onlineCommand;

