const axios = require('axios');

const API = process.env.COLLECTION_API_URL || 'https://bionestone.vercel.app/api/collection';
const KEY = process.env.COLLECTION_BOT_KEY || process.env.LIBRARY_BOT_KEY || '';
const OWNER_JID = '6289531307627@s.whatsapp.net';

async function fetchReports(){
  if(!KEY)return [];
  const response=await axios.get(API,{headers:{'x-collection-bot-key':KEY},timeout:15000});
  return Array.isArray(response.data?.items)?response.data.items:[];
}

async function acknowledge(id){
  await axios.post(API,{action:'ack',id,bot_key:KEY},{timeout:15000});
}

function formatReport(report){
  const students=Array.isArray(report.students)?report.students:[];
  const verified=students.filter(x=>x.status==='TERVERIFIKASI');
  const noPhone=students.filter(x=>x.status==='TIDAK BAWA HP');
  const absent=students.filter(x=>x.status==='TIDAK MASUK');
  const noInfo=students.filter(x=>x.status==='TIDAK ADA KETERANGAN');
  const lines=[
    '📱 *LAPORAN PENGUMPULAN HP*','',
    `🏫 Kelas: *${report.class||'XI.B1'}*`,
    `📅 Tanggal: *${report.date||'-'}*`,
    `🕐 Waktu: *${report.time||'-'}*`,
    `👤 Operator: *${report.operator||'-'}*`,'',
    `📊 Total siswa: *${students.length}*`,
    `✅ Terverifikasi: *${verified.length}*`,
    `📵 Tidak bawa HP: *${noPhone.length}*`,
    `🚫 Tidak masuk: *${absent.length}*`,
    `❓ Tidak ada keterangan: *${noInfo.length}*`
  ];
  const addGroup=(title,list)=>{
    if(!list.length)return;
    lines.push('',`*${title}*`);
    for(const s of list) lines.push(`${String(s.absen).padStart(2,'0')}. ${s.full_name}${s.note?` — ${s.note}`:''}`);
  };
  addGroup('📵 TIDAK BAWA HP',noPhone);
  addGroup('🚫 TIDAK MASUK',absent);
  addGroup('❓ TIDAK ADA KETERANGAN',noInfo);
  lines.push('','_Laporan dikirim otomatis dari sistem Bionest One._');
  return lines.join('\n');
}

async function checkCollectionReports(sock){
  try{
    const reports=await fetchReports();
    for(const report of reports){
      try{
        await sock.sendMessage(OWNER_JID,{text:formatReport(report)});
        await acknowledge(report.id);
        console.log('📱 Laporan pengumpulan terkirim:',report.id);
      }catch(error){
        console.error('❌ Gagal mengirim laporan pengumpulan:',error?.response?.data||error.message||error);
      }
    }
  }catch(error){
    console.error('❌ Collection notifier:',error?.response?.data||error.message||error);
  }
}

function startCollectionNotifier(sock){
  if(!KEY){console.warn('⚠️ Collection notifier tidak aktif: COLLECTION_BOT_KEY belum diset.');return;}
  checkCollectionReports(sock);
  if(global.collectionNotifierTimer)clearInterval(global.collectionNotifierTimer);
  global.collectionNotifierTimer=setInterval(()=>checkCollectionReports(sock),10000);
  console.log('📱 Collection notifier aktif.');
}

module.exports={startCollectionNotifier,formatReport};