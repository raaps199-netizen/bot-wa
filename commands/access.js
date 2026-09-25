const { getSenderId, isPersonalJid } = require('../utils/jid-utils');

const OWNER_PHONE = '6289531307627';
const OWNER_LID = '66477638029541';

function isOwner(senderId) {
  return !!senderId && (senderId.includes(OWNER_PHONE) || senderId.includes(OWNER_LID));
}

function ensureStore() {
  if (!global.db) global.db = {};
  if (!global.db.access) global.db.access = {};
  if (!global.db.access.admins) global.db.access.admins = {};
  return global.db.access.admins;
}

function save() {
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
}

function getTargetJid(msg) {
  const context =
    msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo ||
    {};

  const mentioned = Array.isArray(context.mentionedJid)
    ? context.mentionedJid.find(isPersonalJid)
    : null;

  if (mentioned) return mentioned;

  const quoted = context.participant;
  if (isPersonalJid(quoted)) return quoted;

  return null;
}

async function accessCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid);

  if (!isOwner(senderId)) {
    return sock.sendMessage(remoteJid, {
      text: '❌ Command ini hanya bisa dipakai owner bot.'
    }, { quoted: msg });
  }

  const action = String(args[0] || '').toLowerCase();
  const targetJid = getTargetJid(msg);
  const admins = ensureStore();

  if (!action || action === 'list') {
    const entries = Object.entries(admins);
    const text = entries.length
      ? '👑 *ADMIN BIONEST*\n\n' + entries.map(([jid, data], i) =>
          (i + 1) + '. @' + jid.split('@')[0] + ' — ' + (data.role || 'admin')
        ).join('\n')
      : '👑 Belum ada admin tambahan.';

    return sock.sendMessage(remoteJid, {
      text,
      mentions: entries.map(([jid]) => jid)
    }, { quoted: msg });
  }

  if (!['admin', 'remove', 'hapus'].includes(action)) {
    return sock.sendMessage(remoteJid, {
      text: '⚠️ Format:\n\n*.acces admin @brela*\n*.acces remove @brela*\n*.acces list*\n\nBisa juga reply pesan orangnya lalu ketik *.acces admin brela*.'
    }, { quoted: msg });
  }

  if (!targetJid) {
    return sock.sendMessage(remoteJid, {
      text: '⚠️ Tag orangnya atau reply pesannya.\n\nContoh: *.acces admin @brela*'
    }, { quoted: msg });
  }

  if (action === 'admin') {
    admins[targetJid] = {
      role: 'cash_admin',
      grantedBy: senderId,
      grantedAt: new Date().toISOString()
    };
    save();

    return sock.sendMessage(remoteJid, {
      text: '✅ *Akses admin diberikan!*\n\n👤 @' + targetJid.split('@')[0] + '\n🛡️ Akses: *Kas & Poe Ibu*\n\nSekarang dia bisa memakai *.kas* dan *.poe*.',
      mentions: [targetJid]
    }, { quoted: msg });
  }

  delete admins[targetJid];
  save();

  return sock.sendMessage(remoteJid, {
    text: '✅ *Akses admin dicabut!*\n\n👤 @' + targetJid.split('@')[0],
    mentions: [targetJid]
  }, { quoted: msg });
}

function isCashAdmin(senderId) {
  if (isOwner(senderId)) return true;
  const admins = ensureStore();
  return !!admins[senderId]?.role && admins[senderId].role === 'cash_admin';
}

module.exports = { accessCommand, isCashAdmin, isOwner };