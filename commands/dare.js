async function dareCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  const listDare = [
    'Kirim VN (Voice Note) bernyanyi lagu balonku dengan vokal "O" semua!',
    'Chat mantan kamu sekarang dan bilang "Aku kangen banget sama kamu".',
    'Ganti foto profil WA kamu jadi foto konyol/meme selama 1 jam!',
    'Kirim VN bilang "Aku sayang kamu" ke kontak ke-3 di daftar chat WA kamu!',
    'Ganti status/sw WA kamu jadi: "Aku kebelet berak tapi ga ada air" selama 30 menit!',
    'Kirim stiker paling aneh ke grup keluarga kamu!',
    'VN tawa jahat selama 10 detik lalu kirim ke grup ini!',
    'Tanyakan ke kontak acak di WA: "Kamu kenal aku ga?" lalu screenshot balesannya!',
    'Kirim foto selfie muka paling konyol/jelek kamu tanpa filter ke grup ini!',
    'VN mengaji atau bernyanyi lagu nasional selama 15 detik!',
    'Chat gebetan kamu dan bilang "Sebenarnya aku udah lama suka sama kamu".',
    'Bikin status WA pakai puisi buatan sendiri buat orang yang kamu taksir!',
    'Kirim chat ke nomor acak: "Mas/Mbak, baksonya masih ada?"',
    'VN tirukan suara hewan (kucing, anjing, atau ayam) selama 10 detik!',
    'Puji orang terakhir yang dichat dengan kalimat paling lebay!',
    'Ganti nama profil WA kamu jadi "Pemuja Rahasia" selama 1 hari!',
    'Minta uang 500 ribu secara acak ke kontak di WA kamu!',
    'Sebutkan 5 kebaikan dari orang yang ada di atas chat kamu di grup ini!',
    'Kirim pesan "Aku tahu rahasiamu..." ke salah satu temanmu lalu screenshot responnya!',
    'VN bilang "I love you" ke admin grup ini!',
    'Kirim foto galeri ke-5 dari atas tanpa diedit!',
    'Ganti bio WA kamu jadi "Sedang mencari jodoh gaib" selama 24 jam!',
    'Kirim teks "Maafin aku ya, kita putus aja" ke kontak acak!',
    'Spam 10 stiker berbeda di grup ini!',
    'VN berpura-pura menangis histeris selama 10 detik!',
    'Pura-pura salah kirim chat romantis ke grup kerjaan/sekolah!',
    'Posting foto terjelek kamu di status WhatsApp!',
    'VN niruin gaya bicara penjual jamu atau penjual keliling!',
    'Chat dosen/guru/atasan kamu bilang "Selamat pagi ganteng/cantik" (Screenshot responnya)!',
    'Telepon teman kamu dan langsung matikan saat dia jawab!',
    'VN ceritain lelucon paling garing yang kamu tahu!',
    'Ganti nama grup ini jadi nama yang aneh (kalau kamu admin)!',
    'Kirim emoji "🤡" ke 5 kontak terakhir di WA kamu!',
    'VN sebutkan alfabet dari Z sampai A secepat mungkin!',
    'Kirim foto kaki kamu ke grup ini!',
    'Buat status WA: "Mau open donasi buat beli otak baru"!',
    'Chat orang yang kamu benci dan bilang "Semoga harimu menyenangkan!"',
    'VN nyanyi lagu anak-anak tapi pakai nada lagu metal/rock!',
    'Screenshot layar utama (home screen) HP kamu lalu kirim ke grup!',
    'Kirim teks "Aku hamil/istriku hamil" ke teman dekatmu!',
    'VN acting lagi jualan obat kuat selama 15 detik!',
    'Kirim sticker meme ke obrolan teratas tanpa memberikan penjelasan!',
    'Kirim VN bilang "Gua itu sebenernya robot" dengan suara datar!',
    'Tanya ke orang tuamu lewat chat: "Boleh ga aku nikah besok?"',
    'Kirim foto isi kulkas atau meja makan rumahmu sekarang!',
    'Ganti wallpaper obrolan WA kamu jadi foto teman di grup ini!',
    'Kirim VN bilang "Mbak/Mas paketnya udah di depan rumah" ke nomor temanmu!',
    'Bikin status WA "Lagi butuh uang 10 juta, yang ada chat ya"!',
    'Tirukan suara tokoh kartun favoritmu di VN!',
    'Kirim VN pantun gombalan termaut yang kamu punya!'
  ];

  const randomDare = listDare[Math.floor(Math.random() * listDare.length)];

  const teks = `🎯 *DARE*\n\n` +
    `"${randomDare}"\n\n` +
    `_Lakukan tantangan di atas dan buktikan di grup/chat ini!_`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
}

module.exports = dareCommand;
