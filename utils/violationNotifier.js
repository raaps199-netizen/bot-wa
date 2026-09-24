const config = require('../config');

const VIOLATION_API_URL = process.env.BIONEST_VIOLATION_API || 'https://bionestone.vercel.app/api/violation';
const BOT_API_SECRET = process.env.BOT_API_SECRET;
const POLL_INTERVAL = 5000;

function getNotifyJid() {
  const raw = String(process.env.VIOLATION_NOTIFY_JID || config.ownerNumbers?.[0] || '').trim();
  if (!raw) return null;
  if (raw.includes('@')) return raw;
  return raw.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

function formatViolation(record) {
  return [
    '🚨 *LAPORAN PELANGGARAN*',
    '',
    '👤 Siswa: *' + (record.student_name || record.student || '-') + '*',
    '⚠️ Pelanggaran: *' + (record.violation || '-') + '*',
    '📂 Kategori: ' + (record.category || '-'),
    '📚 Pelajaran: ' + (record.subject || '-'),
    '👨‍🏫 Guru: ' + (record.reported_by_name || '-'),
    '📅 Tanggal: ' + (record.date || '-'),
    '🕐 Waktu: ' + (record.time || '-') + ' WIB',
    '',
    '_Laporan telah tercatat di sistem Bionest One._'
  ].join('\n');
}

async function fetchNewViolations(cursor) {
  if (!BOT_API_SECRET) throw new Error('BOT_API_SECRET belum diset.');
  const url = new URL(VIOLATION_API_URL);
  url.searchParams.set('notify', '1');
  if (cursor) url.searchParams.set('after', cursor);
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + BOT_API_SECRET } });
  let result = {};
  try { result = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(result.error || 'HTTP ' + response.status);
  return Array.isArray(result.violations) ? result.violations : [];
}

async function startViolationNotifier(sock) {
  const jid = getNotifyJid();
  if (!jid) { console.log('⚠️ Violation notifier: nomor tujuan belum dikonfigurasi.'); return; }
  if (!BOT_API_SECRET) { console.log('⚠️ Violation notifier: BOT_API_SECRET belum dikonfigurasi.'); return; }
  if (!global.db.bionestViolationNotifier) {
    global.db.bionestViolationNotifier = { cursor: null, initialised: false };
  }
  let running = false;
  const poll = async () => {
    if (running) return;
    running = true;
    try {
      const state = global.db.bionestViolationNotifier;
      const violations = await fetchNewViolations(state.cursor);
      if (!state.initialised) {
        const latest = violations.slice().sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''))).at(-1);
        if (latest?.created_at) state.cursor = latest.created_at;
        state.initialised = true;
        global.saveDatabase();
        console.log('📡 Violation notifier aktif → ' + jid + '. Cursor awal: ' + (state.cursor || 'kosong'));
        return;
      }
      const sorted = violations.slice().sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
      for (const violation of sorted) {
        await sock.sendMessage(jid, { text: formatViolation(violation) });
        if (violation.created_at) { state.cursor = violation.created_at; global.saveDatabase(); }
      }
      if (sorted.length) console.log('📨 ' + sorted.length + ' laporan pelanggaran dikirim ke ' + jid + '.');
    } catch (error) {
      console.error('❌ VIOLATION NOTIFIER ERROR:', error.message);
    } finally { running = false; }
  };
  await poll();
  setInterval(poll, POLL_INTERVAL);
}

module.exports = { startViolationNotifier };