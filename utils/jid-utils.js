/**
 * Utility functions untuk validasi & ekstraksi JID (WhatsApp ID).
 * Import ini di SEMUA command yang butuh sender/target personal (bukan grup) —
 * termasuk handler .terima / .tolak, biar konsisten dan gak duplikat logic.
 */

/**
 * Cek apakah sebuah JID valid sebagai akun personal (bukan grup/broadcast/channel).
 * @param {any} jid
 * @returns {boolean}
 */
function isPersonalJid(jid) {
  if (!jid || typeof jid !== 'string') return false;
  if (jid.includes('@g.us')) return false;        // ID grup
  if (jid.includes('@broadcast')) return false;    // status/broadcast
  if (jid.includes('@newsletter')) return false;   // channel

  const digits = jid.replace(/[^0-9]/g, '');
  return digits.length >= 5;
}

/**
 * Ekstrak sender ID personal dari objek pesan Baileys, dengan fallback berlapis.
 * Dijamin TIDAK PERNAH mengembalikan ID grup — kalau gagal, return null.
 *
 * @param {object} msg - objek pesan dari Baileys
 * @param {string} remoteJid - msg.key.remoteJid
 * @returns {string|null}
 */
function getSenderId(msg, remoteJid) {
  const candidates = [
    msg?.key?.participant,
    msg?.participant,
    msg?.message?.extendedTextMessage?.contextInfo?.participant,
  ];

  for (const candidate of candidates) {
    if (isPersonalJid(candidate)) return candidate;
  }

  // Kalau ini private chat (remoteJid BUKAN grup), remoteJid pasti si pengirim
  if (isPersonalJid(remoteJid)) {
    return remoteJid;
  }

  // Semua kandidat gagal → jangan pernah kembalikan ID grup
  return null;
}

module.exports = { isPersonalJid, getSenderId };
