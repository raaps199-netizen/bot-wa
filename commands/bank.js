// File: commands/bank.js
const { getUserData, formatRupiah } = require('../utils/helper');

async function handleBankCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const subCmd = args[0]?.toLowerCase();
  const amountArg = args[1];

  const user = getUserData(global.db, senderId);
  
  // Inisialisasi properti bank & hutang jika belum ada di database user
  user.bank = user.bank || 0;
  user.debt = user.debt || 0;
  user.points = user.points || 0;

  const userNum = senderId.split('@')[0];

  switch (subCmd) {
    case 'info':
    case undefined: {
      let text = `🏦 *BANK CENTRAL BOT* 🏦\n`;
      text += `👤 Nasabah: @${userNum}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `👛 Dompet (Wallet): *${formatRupiah(user.points)}*\n`;
      text += `🏛️ Tabungan Bank: *${formatRupiah(user.bank)}*\n`;
      text += `💳 Total Hutang: *${formatRupiah(user.debt)}*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `💡 *Panduan Layanan:* \n`;
      text += `• *.bank setor <jumlah>* (Simpan uang)\n`;
      text += `• *.bank tarik <jumlah>* (Ambil uang)\n`;
      text += `• *.bank minjem <jumlah>* (Ajukan pinjaman)\n`;
      text += `• *.bank bayar <jumlah>* (Lunasi hutang)`;

      return await sock.sendMessage(remoteJid, { text, mentions: [senderId] }, { quoted: msg });
    }

    case 'setor':
    case 'deposit': {
      const amount = parseInt(amountArg);
      if (isNaN(amount) || amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan jumlah nominal yang valid untuk disetor!\nContoh: *.bank setor 50000*` }, { quoted: msg });
      }
      if (user.points < amount) {
        return await sock.sendMessage(remoteJid, { text: `❌ Saldo dompet kamu tidak cukup buat setor *${formatRupiah(amount)}*!` }, { quoted: msg });
      }

      user.points -= amount;
      user.bank += amount;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Sukses menyetor uang sebesar *${formatRupiah(amount)}* ke Bank!\n🏛️ Tabungan sekarang: *${formatRupiah(user.bank)}*`
      }, { quoted: msg });
    }

    case 'tarik':
    case 'withdraw': {
      const amount = parseInt(amountArg);
      if (isNaN(amount) || amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan jumlah nominal yang valid untuk ditarik!\nContoh: *.bank tarik 50000*` }, { quoted: msg });
      }
      if (user.bank < amount) {
        return await sock.sendMessage(remoteJid, { text: `❌ Saldo tabungan bank kamu tidak cukup! Tabungan saat ini: *${formatRupiah(user.bank)}*` }, { quoted: msg });
      }

      user.bank -= amount;
      user.points += amount;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Sukses menarik uang sebesar *${formatRupiah(amount)}* dari Bank ke dompet!`
      }, { quoted: msg });
    }

    case 'minjem':
    case 'loan': {
      const amount = parseInt(amountArg);
      if (isNaN(amount) || amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan jumlah pinjaman yang valid!\nContoh: *.bank minjem 100000*` }, { quoted: msg });
      }
      if (user.debt > 0) {
        return await sock.sendMessage(remoteJid, { text: `❌ Kamu masih punya hutang sebesar *${formatRupiah(user.debt)}*! Lunasi dulu sebelum pinjam lagi, bro.` }, { quoted: msg });
      }
      if (amount > 2000000) {
        return await sock.sendMessage(remoteJid, { text: `❌ Maksimal pinjaman bank untuk sekali ambil adalah *Rp2.000.000*!` }, { quoted: msg });
      }

      // Pinjaman dikenakan bunga 10% langsung
      const totalDebt = Math.floor(amount * 1.10);
      user.debt = totalDebt;
      user.points += amount;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `💳 *PINJAMAN BANK DISETUJUI*\n\n` +
              `💰 Pinjaman pokok: *${formatRupiah(amount)}*\n` +
              `📈 Total tagihan (+ bunga 10%): *${formatRupiah(totalDebt)}*\n\n` +
              `_Dana sudah dicairkan langsung ke dompet kamu._`
      }, { quoted: msg });
    }

    case 'bayar':
    case 'payloan': {
      const amount = parseInt(amountArg);
      if (isNaN(amount) || amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Masukkan jumlah pembayaran hutang yang valid!\nContoh: *.bank bayar 50000*` }, { quoted: msg });
      }
      if (user.debt <= 0) {
        return await sock.sendMessage(remoteJid, { text: `🎉 Mantap, kamu tidak punya hutang sama sekali di bank!` }, { quoted: msg });
      }
      if (user.points < amount) {
        return await sock.sendMessage(remoteJid, { text: `❌ Saldo dompet kamu tidak cukup buat bayar hutang sebesar *${formatRupiah(amount)}*!` }, { quoted: msg });
      }

      const payAmount = Math.min(amount, user.debt);
      user.points -= payAmount;
      user.debt -= payAmount;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Sukses membayar hutang sebesar *${formatRupiah(payAmount)}*!\n` +
              `${user.debt > 0 ? `Sisa hutang: *${formatRupiah(user.debt)}*` : `🎉 *Hutang kamu lunas sepenuhnya!*`}`
      }, { quoted: msg });
    }

    default:
      return await sock.sendMessage(remoteJid, {
        text: `⚠️ Perintah bank tidak dikenal!\nGunakan: *.bank*, *.bank setor*, *.bank tarik*, *.bank minjem*, atau *.bank bayar*`
      }, { quoted: msg });
  }
}

module.exports = { handleBankCommand };
          
