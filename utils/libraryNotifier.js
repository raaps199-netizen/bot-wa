const axios = require('axios');

const API = process.env.LIBRARY_API_URL || 'https://bionestone.vercel.app/api/library';
const KEY = process.env.LIBRARY_BOT_KEY || '';
const OWNER_JID = '6289531307627@s.whatsapp.net';

async function fetchPending() {
  if (!KEY) return [];
  const response = await axios.get(API, { params: { pending: '1' }, headers: { 'x-library-bot-key': KEY }, timeout: 15000 });
  return Array.isArray(response.data?.items) ? response.data.items : [];
}

async function moderate(id, decision) {
  if (!KEY) throw new Error('LIBRARY_BOT_KEY belum dipasang di bot.');
  const response = await axios.post(API, { action: 'moderate', bot_key: KEY, id, decision }, { timeout: 20000 });
  return response.data;
}

function formatPending(item) {
  const type = item.type === 'article' ? '✍️ Tulisan' : '📄 Dokumen';
  return [
    '📚 *LIBRARY — MENUNGGU KONFIRMASI*',
    '',
    `🆔 *${item.id}*`,
    `📌 *${item.title}*`,
    type,
    `📂 ${item.category || '-'}`,
    `👤 ${item.author || item.author_username || '-'}`,
    item.filename ? `📎 ${item.filename}` : '',
    item.size ? `💾 ${(item.size / 1024 / 1024).toFixed(2)} MB` : '',
    item.description || item.excerpt ? `📝 ${item.description || item.excerpt}` : '',
    '',
    `Ketik *.acc ${item.id}* untuk publish`,
    `Ketik *.dc ${item.id}* untuk menolak`
  ].filter(Boolean).join('\n');
}

async function checkLibraryPending(sock) {
  try {
    const items = await fetchPending();
    global.db = global.db || {};
    global.db.library = global.db.library || {};
    global.db.library.notified = global.db.library.notified || {};
    for (const item of items) {
      if (global.db.library.notified[item.id]) continue;
      await sock.sendMessage(OWNER_JID, { text: formatPending(item) });
      global.db.library.notified[item.id] = Date.now();
      if (typeof global.saveDatabase === 'function') global.saveDatabase();
    }
  } catch (error) {
    console.error('❌ Library notifier:', error?.response?.data || error.message || error);
  }
}

function startLibraryNotifier(sock) {
  if (!KEY) { console.warn('⚠️ Library notifier tidak aktif: LIBRARY_BOT_KEY belum diset.'); return; }
  checkLibraryPending(sock);
  if (global.libraryNotifierTimer) clearInterval(global.libraryNotifierTimer);
  global.libraryNotifierTimer = setInterval(() => checkLibraryPending(sock), 20000);
  console.log('📚 Library notifier aktif.');
}

async function findAnnouncementGroup(sock) {
  const configured = process.env.LIBRARY_ANNOUNCEMENT_GROUP;
  if (configured && configured.endsWith('@g.us')) return configured;
  try {
    const groups = await sock.groupFetchAllParticipating();
    const entries = Object.values(groups || {});
    // WhatsApp Community punya grup pengumuman khusus.
    // Baileys menandainya sebagai isCommunityAnnounce.
    const communityAnnounce = entries.find(g => g.isCommunityAnnounce === true);
    if (communityAnnounce) return communityAnnounce.id;

    // Fallback: grup biasa bernama Pengumuman.
    const exact = entries.find(g => String(g.subject || '').trim().toLowerCase() === 'pengumuman');
    if (exact) return exact.id;
    const partial = entries.find(g => String(g.subject || '').toLowerCase().includes('pengumuman'));
    return partial?.id || null;
  } catch (error) {
    console.error('❌ Gagal mencari grup Pengumuman:', error.message || error);
    return null;
  }
}

async function sendLibraryAnnouncement(sock, item) {
  const jid = await findAnnouncementGroup(sock);
  if (!jid) {
    console.warn('⚠️ Grup Pengumuman tidak ditemukan. Set LIBRARY_ANNOUNCEMENT_GROUP jika perlu.');
    return false;
  }
  const type = item.type === 'article' ? 'Tulisan' : 'Dokumen';
  const text = ['📚 *LIBRARY B1 — KOLEKSI BARU*', '', `📌 *${item.title}*`, `👤 Oleh: ${item.author || '-'}`, `📂 Kategori: ${item.category || '-'}`, `📖 Jenis: ${type}`, '', 'Sudah tersedia di Library XI.B1.'].join('\n');
  await sock.sendMessage(jid, { text });
  return true;
}
async function libraryModerationCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = String(msg.key.participant || remoteJid || '');
  if (!senderId.includes('6289531307627') && !senderId.includes('66477638029541')) return sock.sendMessage(remoteJid, { text: '❌ Command Library ini hanya untuk owner.' }, { quoted: msg });
  const action = String(args[0] || '').toLowerCase();
  const id = String(args[1] || '').trim();
  if (!['acc', 'dc'].includes(action) || !id) return sock.sendMessage(remoteJid, { text: '📚 Format:\n*.acc ID* — terima upload\n*.dc ID* — tolak upload' }, { quoted: msg });
  try {
    const result = await moderate(id, action === 'acc' ? 'approve' : 'reject');
    const item = result.item || {};
    if (global.db?.library?.notified) { delete global.db.library.notified[id]; if (typeof global.saveDatabase === 'function') global.saveDatabase(); }
    if (action === 'acc') {
      let announcementSent = false;
      try { announcementSent = await sendLibraryAnnouncement(sock, item); } catch (e) { console.error('❌ Gagal kirim pengumuman Library:', e.message || e); }
      return sock.sendMessage(remoteJid, { text: ['✅ *LIBRARY DISETUJUI*', '', `📌 ${item.title || id}`, `👤 ${item.author || '-'}`, '', 'Sudah dipublikasikan ke Library.', announcementSent ? '📢 Sudah diumumkan di grup Pengumuman.' : '⚠️ Gagal menemukan grup Pengumuman.'].join('\n') }, { quoted: msg });
    }
    return sock.sendMessage(remoteJid, { text: ['🗑️ *LIBRARY DITOLAK*', '', `📌 ${item.title || id}`, `👤 ${item.author || '-'}`, '', 'Upload tidak dipublikasikan.'].join('\n') }, { quoted: msg });
  } catch (error) {
    const detail = error?.response?.data?.error || error.message || 'Unknown error';
    return sock.sendMessage(remoteJid, { text: `❌ Gagal memproses Library.\n\n${detail}` }, { quoted: msg });
  }
}

module.exports = { startLibraryNotifier, libraryModerationCommand };