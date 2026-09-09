async function groupCommand(sock, msg, args, type) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');

  if (!isGroup) {
    return await sock.sendMessage(from, { text: '⚠️ Command ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
  }

  try {
    // 1. Open / Close Grup
    if (type === 'close') {
      await sock.groupSettingUpdate(from, 'announcement');
      return await sock.sendMessage(from, { text: '🔒 Grup telah ditutup. Sekarang hanya Admin yang dapat mengirim pesan.' }, { quoted: msg });
    } else if (type === 'open') {
      await sock.groupSettingUpdate(from, 'not_announcement');
      return await sock.sendMessage(from, { text: '🔓 Grup telah dibuka. Semua anggota sekarang dapat mengirim pesan.' }, { quoted: msg });
    }

    // 2. Promote / Demote Member
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = contextInfo?.mentionedJid || [];
    const quotedParticipant = contextInfo?.participant;

    let target = mentionedJid[0] || quotedParticipant;

    if (!target) {
      return await sock.sendMessage(from, { 
        text: `⚠️ Tag/mention atau reply member yang ingin di-${type}!\nContoh: \`.promote @user\` atau reply chat member.` 
      }, { quoted: msg });
    }

    if (type === 'promote') {
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await sock.sendMessage(from, { text: `✅ Berhasil menaikkan @${target.split('@')[0]} menjadi Admin grup!`, mentions: [target] }, { quoted: msg });
    } else if (type === 'demote') {
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await sock.sendMessage(from, { text: `✅ Berhasil mencopot jabatan Admin @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
    }

  } catch (err) {
    console.error(`Error group ${type}:`, err);
    await sock.sendMessage(from, { 
      text: '❌ Gagal mengeksekusi perintah. Pastikan bot sudah menjadi **Admin grup**!' 
    }, { quoted: msg });
  }
}

module.exports = groupCommand;