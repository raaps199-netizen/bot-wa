async function onlineCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  // Fitur ini khusus di dalam grup
  if (!remoteJid.endsWith('@g.us')) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!'
    }, { quoted: msg });
  }

  const loadingMsg = await sock.sendMessage(remoteJid, { 
    text: '🔍 *Memindai anggota yang sedang online... (tunggu 3 detik)*' 
  }, { quoted: msg });

  try {
    // 1. Ambil data presensi terbaru dari memori/store bot
    const presenceData = sock.presences?.[remoteJid] || {};
    
    // 2. Minta WhatsApp memperbarui status presensi di grup ini
    await sock.presenceSubscribe(remoteJid);

    // Beri jeda 3 detik agar server WhatsApp sempat mengirim event presence update ke bot
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Filter hanya anggota yang status presensinya 'available' (online) atau sedang 'composing/recording'
    const onlineJids = [];

    // Ambil data presensi lagi setelah dipancing 3 detik
    const updatedPresences = sock.presences?.[remoteJid] || presenceData;

    for (const [jid, data] of Object.entries(updatedPresences)) {
      // Cek apakah user sedang aktif di aplikasi
      if (data?.lastKnownPresence === 'available' || data?.lastKnownPresence === 'composing' || data?.lastKnownPresence === 'recording') {
        // Hindari mentag nomor bot itu sendiri
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (jid !== botJid) {
          onlineJids.push(jid);
        }
      }
    }

    // Jika tidak ada anggota yang terdeteksi aktif/online
    if (onlineJids.length === 0) {
      return await sock.sendMessage(remoteJid, {
        text: '🟢 *CEK ONLINE GRUP*\n\n❌ Tidak ada anggota yang terdeteksi sedang online saat ini.'
      }, { quoted: msg });
    }

    // 4. Susun pesan HANYA untuk anggota yang online
    let teks = `🟢 *ANGGOTA YANG SEDANG ONLINE*\n\n`;
    let mentions = [];

    onlineJids.forEach((jid, index) => {
      teks += `${index + 1}. @${jid.split('@')[0]}\n`;
      mentions.push(jid);
    });

    teks += `\n📊 *Total Online:* ${onlineJids.length} orang`;

    // Kirim hasil tag
    await sock.sendMessage(remoteJid, {
      text: teks,
      mentions: mentions
    }, { quoted: msg });

  } catch (err) {
    console.error('Error Cek Online:', err);
    await sock.sendMessage(remoteJid, {
      text: '❌ Gagal memindai status online anggota grup.'
    }, { quoted: msg });
  }
}

module.exports = onlineCommand;
