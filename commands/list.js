const config = require('../config');

async function listCommand(sock, msg) {
  const from = msg.key.remoteJid;
  const prefix = config.prefix || '.';

  const menuText = `
══════════════════
🤖 *${config.botName || 'BOT WHATSAPP'}*
══════════════════

📌 *STICKER & MEDIA*
 🔹 *${prefix}sticker* / *${prefix}s* ── Ubah gambar/gif/video jadi stiker
 🔹 *${prefix}wm* ── Ubah watermark/packname stiker
 🔹 *${prefix}toimg* ── Ubah stiker foto jadi gambar biasa
 🔹 *${prefix}brat* <teks> ── Buat stiker teks gaya Brat
 🔹 *${prefix}bratvid* <teks> ── Buat stiker video/animasi Brat
 🔹 *${prefix}quote* / *${prefix}q* ── Buat stiker quote dari chat (reply)

🔓 *RAHASIA & UTILITY*
 🔹 *${prefix}rvo* / *${prefix}save* ── Ambil/buka foto & video 1x lihat (View Once)

📥 *DOWNLOADER*
 🔹 *${prefix}tiktok* / *${prefix}tt* <url> ── Download video TikTok no WM
 🔹 *${prefix}ig* / *${prefix}instagram* <url> ── Download media Instagram

👥 *GROUP MANAGEMENT*
 🔹 *${prefix}close* / *${prefix}tutup* ── Tutup grup (Hanya Admin yang bisa chat)
 🔹 *${prefix}open* / *${prefix}buka* ── Buka grup (Semua member bisa chat)
 🔹 *${prefix}promote* / *${prefix}pm* ── Naikkan jabatan member jadi Admin (tag/reply)
 🔹 *${prefix}demote* / *${prefix}dm* ── Turunkan jabatan Admin jadi member (tag/reply)
 🔹 *${prefix}hidetag* / *${prefix}h* <teks> ── Tag seluruh member grup secara tersembunyi

ℹ️ *OTHER*
 🔹 *${prefix}list* / *${prefix}help* ── Menampilkan daftar menu ini

══════════════════
✨ *Gunakan bot dengan bijak!*
`;

  try {
    await sock.sendMessage(from, { text: menuText.trim() }, { quoted: msg });
  } catch (err) {
    console.error('Error di listCommand:', err);
  }
}

module.exports = listCommand;