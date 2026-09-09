async function hidetagCommand(sock, msg, args) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');

  if (!isGroup) {
    return await sock.sendMessage(from, { text: '⚠️ Command ini hanya bisa digunakan di dalam grup!' });
  }

  try {
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Cek apakah pengirim adalah Admin
    const isSenderAdmin = participants.some(
      p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
    );

    if (!isSenderAdmin) {
      return await sock.sendMessage(from, { 
        text: '❌ Akses ditolak! Hanya Admin grup yang bisa menggunakan Hidetag.' 
      }, { quoted: msg });
    }

    const text = args.join(' ') || 'Panggilan untuk semua anggota!';
    const allParticipants = participants.map(p => p.id);

    await sock.sendMessage(from, {
      text: text,
      mentions: allParticipants
    });

  } catch (err) {
    console.error('Error hidetag:', err);
    await sock.sendMessage(from, { text: '❌ Gagal melakukan hidetag.' });
  }
}

module.exports = hidetagCommand;