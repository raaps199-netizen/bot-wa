// 🎲 RNG AURA SYSTEM
const activeAuto = new Map();

const RARITIES = [
  { name:'Common', emoji:'⚪', oneIn:2 },
  { name:'Uncommon', emoji:'🟢', oneIn:5 },
  { name:'Rare', emoji:'🔵', oneIn:25 },
  { name:'Epic', emoji:'🟣', oneIn:100 },
  { name:'Legendary', emoji:'🟡', oneIn:500 },
  { name:'Mythic', emoji:'🔴', oneIn:2500 },
  { name:'Divine', emoji:'🌌', oneIn:10000 },
  { name:'Celestial', emoji:'✨', oneIn:50000 },
  { name:'Transcendent', emoji:'🌀', oneIn:250000 },
  { name:'Immortal', emoji:'👑', oneIn:1000000 },
  { name:'Boundless', emoji:'♾️', oneIn:10000000 }
];

const AURA_NAMES = [
'Dust','Stone','Mist','Leaf','Spark','Bubble','Shadow','Frost','Ember','Breeze',
'Aqua','Bloom','Glow','Cloud','Static','Toxic','Plasma','Inferno','Phantom','Thunder',
'Blizzard','Venom','Solar','Lunar','Spirit','Crimson','Azure','Voidling','Radiant','Tempest',
'Eclipse','Nebula','Aurora','Blood Moon','Starfall','Deep Sea','Soulfire','Cyber','Chrono','Gravity',
'Mirage','Rift','Comet','Wildfire','Thunderstorm','Celestia','Astral','Oblivion','Nightmare','Dreamwalker',
'Singularity','Dimension','Arcane','Overdrive','Cataclysm','Genesis','Requiem','Seraph','Leviathan','Ragnarok',
'Godspeed','Divine Flame','Eternity','Star Eater','World Ender','Timekeeper','Reality','Omniscient','Astral King','Void Emperor',
'Infinity','Absolute Zero','Eternal Night',"Heaven's Gate",'Hellborn','Cosmic Weaver','Fatebreaker','Reality Breaker','The Forgotten','End of Worlds',
'Primordial','Creation','Destruction','Divine Judgement','Cosmic God','Eternal Sovereign','The First Light','The Last Shadow','Absolute','Omnipotence',
'Akasha','Abyss','Paradox','Zero Point','Origin','Beyond','???','The Unwritten','Absolute Infinity','∅ — Nothingness'
];

const AURA_DATA = AURA_NAMES.map(function(name, i) {
  const rarityIndex = i < 15 ? 0 : i < 30 ? 1 : i < 45 ? 2 : i < 60 ? 3 : i < 70 ? 4 : i < 80 ? 5 : i < 90 ? 6 : i < 91 ? 7 : i < 96 ? 8 : i < 100 ? 9 : 10;
  const r = RARITIES[rarityIndex];
  return { id:i+1, name:name, rarity:r.name, emoji:r.emoji, oneIn:r.oneIn };
});

function getState(user) {
  if (!user.rng) user.rng = { rolls:0, luck:1, bestOneIn:2, equipped:null, collection:{}, history:[], rollMessageKey:null };
  user.rng.collection = user.rng.collection || {};
  user.rng.history = user.rng.history || [];
  if (!Object.prototype.hasOwnProperty.call(user.rng, 'rollMessageKey')) user.rng.rollMessageKey = null;
  user.rng.luck = Number(user.rng.luck) || 1;
  return user.rng;
}

function pickAura(state) {
  const luck = Math.min(Math.max(1, state.luck), 50);
  const pool = AURA_DATA.map(function(a) {
    const boost = a.oneIn >= 500 ? luck : Math.sqrt(luck);
    return { aura:a, score:1 / (a.oneIn / boost) };
  });
  const total = pool.reduce(function(s,x){ return s+x.score; },0);
  let n = Math.random()*total;
  for (const x of pool) { n -= x.score; if (n <= 0) return x.aura; }
  return AURA_DATA[0];
}

function meetsTarget(aura, target) {
  const q = String(target || '').toLowerCase();
  const rarity = RARITIES.findIndex(function(r){ return r.name.toLowerCase() === q; });
  if (rarity >= 0) return RARITIES.findIndex(function(r){ return r.name === aura.rarity; }) >= rarity;
  const num = Number(q.replace(/[^0-9]/g,''));
  if (num > 0) return aura.oneIn >= num;
  return aura.name.toLowerCase() === q;
}

async function save(){ if(typeof global.saveDatabase === 'function') await global.saveDatabase(); }

async function sendEdited(sock, jid, key, text) {
  if (key) {
    try {
      await sock.sendMessage(jid, { text, edit: key });
      return key;
    } catch (err) {
      // Kalau pesan pertama sudah dihapus/tidak valid, buat satu pesan pengganti.
      const sent = await sock.sendMessage(jid, { text });
      return sent.key;
    }
  }
  const sent = await sock.sendMessage(jid, { text });
  return sent.key;
}

async function gachaRoll(sock, msg, senderId, auto = false, existingKey = null) {
  const user = global.db && global.db.users && global.db.users[senderId];
  if (!user) return null;
  const state = getState(user);
  const jid = msg.key.remoteJid;

  const frames = [
    '🎰 *ROLLING...*\n\n⚪ ⚪ ⚪ ⚪ ⚪',
    '🎰 *ROLLING...*\n\n🟢 🔵 🟣 🟡 🔴',
    '🎰 *ROLLING...*\n\n✨ 🌀 👑 🌌 ✨',
    '🎰 *ROLLING...*\n\n🔮 ❓ 🔮 ❓ 🔮'
  ];

  // Semua .rng roll memakai satu pesan pertama yang dibuat bot.
  let editKey = existingKey || state.rollMessageKey || null;
  for (const frame of frames) {
    editKey = await sendEdited(sock, jid, editKey, frame);
    await new Promise(function(resolve){ setTimeout(resolve, 450); });
  }

  const aura = pickAura(state);
  state.rolls++;
  state.collection[aura.id] = (state.collection[aura.id] || 0) + 1;
  state.bestOneIn = Math.max(state.bestOneIn || 2, aura.oneIn);
  state.history.unshift({id:aura.id,at:Date.now()});
  state.history = state.history.slice(0,20);
  await save();

  let result = (auto ? '🎲 *AUTO ROLL #' : '🎲 *ROLL #') + state.rolls.toLocaleString('id-ID') + '*\n\n';
  if (aura.oneIn >= 10000) result += '╔════════════════════════╗\n';
  result += aura.emoji + ' *' + aura.name + '*\n\n';
  result += 'Rarity: *' + aura.rarity + '*\n';
  result += 'Chance: *1 in ' + aura.oneIn.toLocaleString('id-ID') + '*\n';
  result += 'Collection: *' + state.collection[aura.id] + 'x*\n';
  result += '🍀 Luck: *' + state.luck + 'x*';
  if (aura.oneIn >= 10000) result += '\n╚════════════════════════╝';

  editKey = await sendEdited(sock, jid, editKey, result);
  state.rollMessageKey = editKey;
  await save();
  return { aura:aura, state:state, key:editKey, text:result };
}

async function autoRoll(sock, msg, senderId, target, max){
  const jid = msg.key.remoteJid;
  if(activeAuto.has(senderId)) return sock.sendMessage(jid,{text:'⚠️ Auto Roll lu masih jalan. Ketik *.rng stop*.'});

  const session = { running:true, key:null, count:0 };
  activeAuto.set(senderId, session);

  try {
    session.key = await sendEdited(sock, jid, null, '🎲 *AUTO ROLL DIMULAI...*\n\n🎰 Menyiapkan roll...');

    while(session.running && (!max || session.count < max)){
      const last = await gachaRoll(sock, msg, senderId, true, session.key);
      if(!last) break;

      session.key = last.key;
      session.count++;

      if(target && meetsTarget(last.aura,target)){
        session.running = false;
        await sendEdited(
          sock,
          jid,
          session.key,
          last.text + '\n\n🎯 *TARGET TERCAPAI!*\nAuto berhenti setelah *' +
          session.count.toLocaleString('id-ID') + ' roll*.'
        );
        return;
      }

      await new Promise(function(resolve){ setTimeout(resolve, 700); });
    }

    if(session.key){
      const finalText = session.running
        ? '⏹️ *AUTO ROLL SELESAI*\n\nRoll sesi: *' + session.count.toLocaleString('id-ID') + '*'
        : '⏹️ *AUTO ROLL DIHENTIKAN*\n\nRoll sesi: *' + session.count.toLocaleString('id-ID') + '*';
      await sendEdited(sock, jid, session.key, finalText);
    }
  } finally {
    activeAuto.delete(senderId);
  }
}

async function handleRngCommand(sock,msg,args){
  const jid=msg.key.remoteJid;
  const senderId=msg.key.participant || jid;
  const user=global.db && global.db.users && global.db.users[senderId];
  if(!user) return;
  const state=getState(user);
  const sub=String(args[0]||'help').toLowerCase();
  if(sub==='help') return sock.sendMessage(jid,{text:'╭━━〔 🎲 *AURA RNG* 〕━━╮\n┃ .rng roll\n┃ .rng inv\n┃ .rng profile\n┃ .rng list\n┃ .rng equip <aura>\n┃ .rng auto <target> [max]\n┃ .rng stop\n╰━━━━━━━━━━━━━━━━━━╯'},{quoted:msg});
  if(sub==='stop'){ const session=activeAuto.get(senderId); if(!session) return sock.sendMessage(jid,{text:'⚠️ Gak ada Auto Roll aktif.'},{quoted:msg}); session.running=false; if(session.key) await sendEdited(sock,jid,session.key,'⏹️ *AUTO ROLL DIHENTIKAN.*\n\nRoll sesi: *'+session.count.toLocaleString('id-ID')+'*'); return; }
  if(sub==='roll' || sub==='r'){ return gachaRoll(sock,msg,senderId,false); }
  if(sub==='auto'){ const target=args[1]; const max=Math.max(0,Number(args[2])||0); if(!target) return sock.sendMessage(jid,{text:'⚠️ Contoh: *.rng auto Mythic* atau *.rng auto 10000 500*'},{quoted:msg}); return autoRoll(sock,msg,senderId,target,max); }
  if(sub==='inv' || sub==='inventory' || sub==='collection'){
    const owned=AURA_DATA.filter(function(a){return state.collection[a.id];});
    let text='📚 *AURA COLLECTION*\n\n'+owned.length+'/100 ditemukan.\n\n';
    text += owned.length ? owned.map(function(a){return a.emoji+' '+a.name+' ×'+state.collection[a.id]+' ['+a.rarity+']';}).join('\n') : 'Belum ada aura. Ketik *.rng roll*.';
    return sock.sendMessage(jid,{text:text},{quoted:msg});
  }
  if(sub==='profile' || sub==='stats'){
    const equipped=AURA_DATA.find(function(a){return a.id===state.equipped;});
    return sock.sendMessage(jid,{text:'👤 *RNG PROFILE*\n\n🎲 Total Roll: *'+state.rolls.toLocaleString('id-ID')+'*\n🍀 Luck: *'+state.luck+'x*\n🏆 Best: *1 in '+state.bestOneIn.toLocaleString('id-ID')+'*\n📚 Collection: *'+Object.keys(state.collection).length+'/100*\n✨ Equipped: *'+(equipped?equipped.name:'None')+'*'},{quoted:msg});
  }
  if(sub==='list'){ return sock.sendMessage(jid,{text:'🎲 *RARITY TIERS*\n\n'+RARITIES.map(function(r){return r.emoji+' '+r.name+' — 1 in '+r.oneIn.toLocaleString('id-ID');}).join('\n')},{quoted:msg}); }
  if(sub==='equip'){ const q=args.slice(1).join(' ').toLowerCase(); const aura=AURA_DATA.find(function(a){return a.name.toLowerCase()===q;}); if(!aura || !state.collection[aura.id]) return sock.sendMessage(jid,{text:'❌ Aura itu belum lu punya.'},{quoted:msg}); state.equipped=aura.id; await save(); return sock.sendMessage(jid,{text:'✨ Aura aktif: *'+aura.name+'* '+aura.emoji},{quoted:msg}); }
  return sock.sendMessage(jid,{text:'❌ Subcommand gak dikenal. Ketik *.rng help*.'},{quoted:msg});
}

module.exports=handleRngCommand;