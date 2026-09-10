async function menuCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const pushName = msg.pushName || 'User';

  // Opsi tanggal format Indonesia real-time
  const today = new Date();
  const dateString = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const menuText = `╭───［ *BOT MENU* ］───
│ 👤 User : ${pushName}
│ 📅 Date : ${dateString}
├──
│ 💡 Gunakan prefix [ . ] sebelum command
╰───────────────────────

┌──『 *MAIN & UTILITY* 』
│ ├ .ai (Tanya AI)
│ ├ .rvo (Lihat Pesan View Once)
│ ├ .toimg (Stiker ke Gambar)
│ ├ .hd (Jernihkan Foto)
│ └ .ssweb (Screenshot Web)
└───────────────────────

┌──『 *MAKER & CONVERT* 』
│ ├ .sticker (Bikin Stiker)
│ ├ .brat (Stiker Teks Brat)
│ ├ .qc (Stiker Chat Bubble)
│ ├ .wm (Ganti Watermark Stiker)
│ └ .tovid (Stiker ke Video)
└───────────────────────

┌──『 *DOWNLOADER* 』
│ ├ .tiktok (Video No WM)
│ ├ .ig (Foto / Reel IG)
│ ├ .play (Cari & Musik)
│ └ .ytmp3 (Audio YouTube)
└───────────────────────

┌──『 *FUN & GAMES* 』
│ ├ .cekkhodam (Cek Khodam)
│ ├ .tebakgambar (Tebak Gambar)
│ ├ .truth / .dare
│ └ .cekbucin (Cek Bucin)
└───────────────────────

┌──『 *GROUP & ADMIN* 』
│ ├ .hidetag (Tag Semua)
│ ├ .kick (Keluarkan Member)
│ ├ .linkgc (Link Grup)
│ └ .mute / .unmute
└───────────────────────`;

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: menuText }, { quoted: msg });
    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
  } catch (err) {
    console.error('Error Menu:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
  }
}

module.exports = menuCommand;
