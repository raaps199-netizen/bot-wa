// File: commands/bank.js
const { getUserData, getTotalScore, deductPoints, addPoints, formatRupiah } = require('../utils/helper');

// Helper lokal untuk membaca angka singkat (contoh: 500k, 5jt, atau all)
function parseCustomNumber(input, maxAvailable) {
  if (!input) return 0;
  let str = input.toString().toLowerCase().trim();

  if (str === 'all' || str === 'allin' || str === 'semua') {
    return maxAvailable;
  }

  let multiplier = 1;
  if (str.endsWith('k')) {
    multiplier = 1000;
    str = str.slice(0, -1);
  } else if (str.endsWith('jt') || str.endsWith('juta')) {
    multiplier = 1000000;
    str = str.replace(/(jt|juta)$/, '');
  } else if (str.endsWith('m')) {
    multiplier = 1000000000;
    str = str.slice(0, -1);
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.floor(num * multiplier);
}

async function handleBankCommand(sock, msg, args, senderId) {
  const remoteJid = msg.key.remoteJid;
  const subCmd = args[0]?.toLowerCase();
  const amountArg = args[1];

  const user = getUserData(global.db, senderId);
  
  // Inisialisasi properti bank & hutang jika belum ada
  user.bank = user.bank || 0;
  user.debt = user.debt || 0;

  const userNum = senderId.split('@')[0];
  const totalWealth = getTotalScore(user); // Sinkron dengan total saldo di .score[span_2](start_span)[span_2](end_span)

  switch (subCmd) {
    case 'info':
    case undefined: {
      let text = `🏦 *BANK CENTRAL BOT* 🏦\n`;
      text += `👤 Nasabah: @${userNum}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `👛 Total Saldo Aktif: *${formatRupiah(totalWealth)}*\n`;
      text += `🏛️ Tabungan Bank: *${formatRupiah(user.bank)}*\n`;
      text += `💳 Total Hutang: *${formatRupiah(user.debt)}*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `💡 *Panduan Layanan:* \n`;
      text += `• *.bank setor <jumlah>* (Contoh: 500k / 5jt / all)\n`;
      text += `• *.bank tarik <jumlah>* (Ambil tabungan)\n`;
      text += `• *.bank minjem <jumlah>* (Ajukan pinjaman)\n`;
      text += `• *.bank bayar <jumlah>* (Lunasi hutang)`;

      return await sock.sendMessage(remoteJid, { text, mentions: [senderId] }, { quoted: msg });
    }

    case 'setor':
    case 'deposit': {
      const amount = parseCustomNumber(amountArg, totalWealth);
      
      if (amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Format nominal salah!\nContoh: *.bank setor 500k*, *.bank setor 5jt*, atau *.bank setor all*` }, { quoted: msg });
      }
      if (totalWealth < amount) {
        return await sock.sendMessage(remoteJid, { text: `❌ Total saldo kamu tidak cukup buat setor *${formatRupiah(amount)}*!` }, { quoted: msg });
      }

      // Potong dari saldo utama dan masukkan ke bank[span_3](start_span)[span_3](end_span)
      deductPoints(global.db, senderId, amount);
      user.bank += amount;
      
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Sukses menyetor uang sebesar *${formatRupiah(amount)}* ke Bank!\n🏛️ Tabungan sekarang: *${formatRupiah(user.bank)}*`
      }, { quoted: msg });
    }

    case 'tarik':
    case 'withdraw': {
      const amount = parseCustomNumber(amountArg, user.bank);
      
      if (amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Format nominal salah!\nContoh: *.bank tarik 500k* atau *.bank tarik all*` }, { quoted: msg });
      }
      if (user.bank < amount) {
        return await sock.sendMessage(remoteJid, { text: `❌ Saldo tabungan bank kamu tidak cukup! Tabungan saat ini: *${formatRupiah(user.bank)}*` }, { quoted: msg });
      }

      user.bank -= amount;
      addPoints(global.db, senderId, amount); // Kembalikan ke saldo utama user[span_4](start_span)[span_4](end_span)
      
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `✅ Sukses menarik uang sebesar *${formatRupiah(amount)}* dari Bank ke dompet!`
      }, { quoted: msg });
    }

    case 'minjem':
    case 'loan': {
      const amount = parseCustomNumber(amountArg, 2000000);
      
      if (amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Format nominal pinjaman salah!\nContoh: *.bank minjem 500k*` }, { quoted: msg });
      }
      if (user.debt > 0) {
        return await sock.sendMessage(remoteJid, { text: `❌ Kamu masih punya hutang sebesar *${formatRupiah(user.debt)}*! Lunasi dulu sebelum pinjam lagi, bro.` }, { quoted: msg });
      }
      if (amount > 2000000) {
        return await sock.sendMessage(remoteJid, { text: `❌ Maksimal pinjaman bank untuk sekali ambil adalah *Rp2.000.000*!` }, { quoted: msg });
      }

      const totalDebt = Math.floor(amount * 1.10); // Bunga 10%
      user.debt = totalDebt;
      addPoints(global.db, senderId, amount); // Cairkan langsung ke saldo user[span_5](start_span)[span_5](end_span)
      
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `💳 *PINJAMAN BANK DISETUJUI*\n\n` +
              `💰 Pinjaman pokok: *${formatRupiah(amount)}*\n` +
              `📈 Total tagihan (+ bunga 10%): *${formatRupiah(totalDebt)}*\n\n` +
              `_Dana sudah dicairkan langsung ke akun kamu._`
      }, { quoted: msg });
    }

    case 'bayar':
    case 'payloan': {
      const amount = parseCustomNumber(amountArg, Math.min(totalWealth, user.debt));
      
      if (amount <= 0) {
        return await sock.sendMessage(remoteJid, { text: `⚠️ Format pembayaran salah!\nContoh: *.bank bayar 500k* atau *.bank bayar all*` }, { quoted: msg });
      }
      if (user.debt <= 0) {
        return await sock.sendMessage(remoteJid, { text: `🎉 Mantap, kamu tidak punya hutang sama sekali di bank!` }, { quoted: msg });
      }
      if (totalWealth < amount) {
        return await sock.sendMessage(remoteJid, { text: `❌ Saldo kamu tidak cukup buat bayar hutang sebesar *${formatRupiah(amount)}*!` }, { quoted: msg });
      }

      const payAmount = Math.min(amount, user.debt);
      deductPoints(global.db, senderId, payAmount);[span_6](start_span)[span_6](end_span)
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
