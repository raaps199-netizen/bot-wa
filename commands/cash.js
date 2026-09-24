// File: commands/cash.js
const CASH_API_URL = process.env.BIONEST_CASH_API || "https://bionestone.vercel.app/api/cash";
const BOT_API_SECRET = process.env.BOT_API_SECRET;

const STUDENTS = [
["ahmad rafif hidayat","rafif"],["aisahra mayjasti aulia putri","aisahra"],["al mira berlian handayani","almira"],["alvian arkan iniesta","alvian"],["andrian pranata tambunan","andrian"],
["annisa zahra","anissa"],["ara ananda putri","ara"],["arya pratama","arya"],["ashabul khafi","khafi"],["askha fadhil raihan adinomo","fadhil"],
["aura rizky triyastuti","aura"],["avisha fakhiran anwar","avisha"],["brela terta zafina","brella"],["danendra orlen wasatha","orlen"],["dhirgam nawi hasib dhiya ul'haq","dhirgam"],
["dude ramadhan","dude"],["dzakii nizaar akmal","dzaki"],["effan zandra arya putra","effan"],["elang bari dermawan","elang"],["fathian khairul akbar","fathian"],
["fareal julyans zalfine","fareal"],["gibran ayatullah","gibran"],["harazaki yusuf rahardjo telaumbanua","yusuf"],["irfan asyraf musyaffa","irfan"],["jauharah tuhfah","jauharah"],
["kevin habiyal huda","kevin"],["keyla ajeng firmansyah","keyla"],["kirana intan permata","kirana"],["lutfan attaullah sultoni","lutfan"],["m daffa azalia","daffa"],
["meli anggraeni","meli"],["mikaela leona","mikaela"],["muhammad dzaky pradana","dzaky"],["muhammad fahri maulana","fahri"],["nishar soma maulana","nishar"],
["putri aulia","putri"],["reno ramzi nararya","reno"],["reva amalia achmad","reva"],["rifqi binangkit","rifqi"],["ridho saputra ependi","ridho"],
["rizky dwi saputra hidayat","rizky"],["sadam al fahri","sadam"],["salsabil fajrianita","salsabila"],["satria arjasena maulana","arjasena"],["satria putra pratama","satria"],
["surya melano","surya"],["tania fitri izati","tania"],["wisnu panji pratama","wisnu"],["yoga rizki ramadhan","yoga"],["zyella almaira sigit","zyella"]
];

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function resolveStudent(input) {
  const key = normalize(input);
  if (!key) return null;
  const exact = STUDENTS.find(([name, username]) => key === username || key === name);
  if (exact) return exact[1];
  const matches = STUDENTS.filter(([name, username]) => name.startsWith(key) || name.split(" ").some(part => part === key) || username.startsWith(key));
  return matches.length === 1 ? matches[0][1] : null;
}

function parseAmount(input) {
  if (!input) return 0;
  let value = String(input).toLowerCase().trim().replace(/rp/g, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  let multiplier = 1;
  if (value.endsWith("jt") || value.endsWith("juta")) { multiplier = 1000000; value = value.replace(/(jt|juta)$/, ""); }
  else if (value.endsWith("k")) { multiplier = 1000; value = value.slice(0, -1); }
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number * multiplier) : 0;
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

async function addCashTransaction(data) {
  if (!BOT_API_SECRET) throw new Error("BOT_API_SECRET belum diset di environment bot.");
  const response = await fetch(CASH_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + BOT_API_SECRET },
    body: JSON.stringify({ action: "add", student: data.student, category: data.category, amount: data.amount, month: data.month, description: (data.category === "kas" ? "Kas " : "Poe Ibu ") + data.month })
  });
  let result = {};
  try { result = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(result.error || ("HTTP " + response.status));
  return result;
}

async function handleCashCommand(sock, msg, args, category, isOwner) {
  const remoteJid = msg.key.remoteJid;
  const commandName = category === "kas" ? "kas" : "poe";
  if (!isOwner) return sock.sendMessage(remoteJid, { text: "❌ Command pembayaran hanya bisa dipakai owner/admin bot." }, { quoted: msg });

  if (category === "kas") {
    if (args.length !== 2) {
      return sock.sendMessage(remoteJid, { text: "⚠️ Format salah.\n\nContoh:\n*.kas Yusuf Oktober*\n*.kas almira September*" }, { quoted: msg });
    }

    const studentInput = args[0];
    const monthInput = args[1];
    const student = resolveStudent(studentInput);
    const months = {
      januari: "Januari", februari: "Februari", maret: "Maret", april: "April",
      mei: "Mei", juni: "Juni", juli: "Juli", agustus: "Agustus",
      september: "September", oktober: "Oktober", november: "November", desember: "Desember"
    };
    const month = months[normalize(monthInput)];

    if (!student) {
      return sock.sendMessage(remoteJid, { text: "❌ Nama siswa tidak ditemukan atau terlalu ambigu: *" + studentInput + "*" }, { quoted: msg });
    }
    if (!month) {
      return sock.sendMessage(remoteJid, { text: "❌ Bulan tidak valid.\n\nContoh: *Agustus*, *September*, atau *Oktober*." }, { quoted: msg });
    }

    try {
      await addCashTransaction({ student, category: "kas", amount: 10000, month });
      return sock.sendMessage(remoteJid, { text: "✅ *Kas tercatat!*\n\n👤 Siswa: *" + student + "*\n💰 Kas: *Rp10.000*\n📅 Bulan: *" + month + "*\n\n_Data sudah dikirim ke Bionest._" }, { quoted: msg });
    } catch (error) {
      console.error("❌ CASH API ERROR:", error);
      return sock.sendMessage(remoteJid, { text: "❌ Gagal mencatat kas ke Bionest.\nDetail: " + error.message }, { quoted: msg });
    }
  }

  if (args.length < 2) {
    return sock.sendMessage(remoteJid, { text: "⚠️ Format salah.\n\nContoh:\n*.poe Yusuf 20k*\n*.poe Yusuf 10000*\n*.poe Yusuf 10.000*" }, { quoted: msg });
  }

  const amountInput = args[args.length - 1];
  const studentInput = args.slice(0, -1).join(" ");
  const student = resolveStudent(studentInput);
  const amount = parseAmount(amountInput);
  if (!student) return sock.sendMessage(remoteJid, { text: "❌ Nama siswa tidak ditemukan atau terlalu ambigu: *" + studentInput + "*\n\nGunakan username, nama depan yang unik, atau nama lengkap." }, { quoted: msg });
  if (amount <= 0) return sock.sendMessage(remoteJid, { text: "❌ Nominal tidak valid: *" + amountInput + "*\n\nContoh nominal: *20k*, *10.000*, atau *20000*." }, { quoted: msg });
  const month = new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "Asia/Jakarta" }).format(new Date());

  try {
    await addCashTransaction({ student, category: "poe", amount, month });
    return sock.sendMessage(remoteJid, { text: "✅ *Pembayaran tercatat!*\n\n👤 Siswa: *" + student + "*\n💰 Poe Ibu: *" + formatRupiah(amount) + "*\n📅 Bulan: *" + month + "*\n\n_Data sudah dikirim ke Bionest._" }, { quoted: msg });
  } catch (error) {
    console.error("❌ CASH API ERROR:", error);
    return sock.sendMessage(remoteJid, { text: "❌ Gagal mencatat pembayaran ke Bionest.\nDetail: " + error.message }, { quoted: msg });
  }
}
async function kasCommand(sock, msg, args, isOwner) { return handleCashCommand(sock, msg, args, "kas", isOwner); }
async function poeCommand(sock, msg, args, isOwner) { return handleCashCommand(sock, msg, args, "poe", isOwner); }

module.exports = { kasCommand, poeCommand };