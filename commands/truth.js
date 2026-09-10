async function truthCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const listTruth = [
    'Siapa nama mantan yang paling susah kamu lupain?',
    'Pernah ga kamu suka sama pacar atau gebetan temen sendiri?',
    'Apa kebohongan terbesar yang pernah kamu ucapkan ke orang tua?',
    'Siapa orang di grup ini yang paling ingin kamu ajak jalan?',
    'Pernah kentut sembarangan terus salahin orang lain?',
    'Apa hal paling memalukan yang pernah kamu alami di tempat umum?',
    'Pernah ga pura-pura sakit demi menghindar dari acara atau sekolah/kerja?',
    'Siapa orang terakhir yang kamu stalk di sosial media?',
    'Apa hal yang paling kamu sesali sampai saat ini?',
    'Pernah ngambil uang kembalian orang tua tanpa ijin?',
    'Kapan terakhir kali kamu menangis dan karena apa?',
    'Apa kebiasaan buruk kamu pas lagi sendirian di kamar?',
    'Siapa kontak WhatsApp yang paling sering kamu chat diam-diam?',
    'Pernah ga kamu diselingkuhin atau malah jadi selingkuhan?',
    'Sebutkan 1 hal yang paling kamu benci dari diri kamu sendiri!',
    'Apa rahasia terbesar kamu yang belum pernah kamu ceritain ke siapapun?',
    'Pernah nembak seseorang tapi ditolak mentah-mentah?',
    'Siapa orang yang paling kamu benci saat ini?',
    'Pernah ga stalking mantan sampai ga sengaja kepencet like?',
    'Berapa jumlah tabungan kamu saat ini?',
    'Pernah ga kamu pacaran cuma karena kasihan?',
    'Apa momen paling awkward saat kamu lagi kencan?',
    'Pernah ngomongin temen sendiri di belakang?',
    'Siapa tipe idaman kamu di antara member grup ini?',
    'Kapan terakhir kali kamu basuh muka atau mandi?',
    'Apa mimpi teraneh yang pernah kamu alami?',
    'Pernah ga ketemu hantu secara langsung? Ceritakan!',
    'Apa hal paling konyol yang pernah kamu beli?',
    'Pernah ngompol di kasur saat usiamu sudah di atas 10 tahun?',
    'Pernah menyukai guru atau dosen sendiri?',
    'Siapa nama cinta pertama kamu?',
    'Kalau diberi uang 100 juta hari ini, buat apa?',
    'Pernah ga makan makanan yang udah jatuh lebih dari 5 detik?',
    'Siapa orang yang paling ingin kamu minta maaf sekarang?',
    'Apa ketakutan terbesar kamu yang terlihat sepele bagi orang lain?',
    'Pernah ga kamu ngabisin makanan orang lain terus pura-pura ga tahu?',
    'Pernah berpura-pura suka sama hadiah dari seseorang padahal benci?',
    'Apa foto paling memalukan yang ada di galeri HP kamu?',
    'Pernah ga kamu berak di celana waktu udah gede?',
    'Siapa nama gebetan kamu saat ini?',
    'Pernah ga kamu bikin akun palsu (fake account) buat stalking?',
    'Pernah ga kamu ngerasa salah jurusan/salah pekerjaan?',
    'Siapa orang yang paling kamu percayai saat ini?',
    'Apa fobia teraneh yang kamu miliki?',
    'Kapan terakhir kali kamu bohong hari ini?',
    'Pernah ga kirim chat salah kirim yang bikin malu setengah mati?',
    'Apa hal paling kekanak-kanakan yang masih kamu lakukan sampai sekarang?',
    'Pernah nangis gara-gara nonton film/anime? Film apa?',
    'Kalau harus tukar nasib sama 1 orang di grup ini, mau sama siapa?',
    'Sebutkan 3 sifat buruk kamu yang sulit diubah!'
  ];

  const randomTruth = listTruth[Math.floor(Math.random() * listTruth.length)];

  const teks = `🗣️ *TRUTH*\n\n` +
    `"${randomTruth}"\n\n` +
    `_Jawab dengan jujur di grup/chat ini!_`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
}

module.exports = truthCommand;
