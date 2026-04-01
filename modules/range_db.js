// ================================================================
// APEX PREDATOR V9 — range_db.js
// Base de Rangos Preflop GTO — NL25/NL50 6-Max 100BB
// 40+ escenas: RFI / vs Open / vs 3-Bet / Squeeze
// ================================================================
window.RangeDB = {
  key: 'apex_vp_ranges_v2',

  CATEGORIES: [
    { cat: 'RFI — Open Raise', items: ['RFI_UTG','RFI_HJ','RFI_CO','RFI_BTN','RFI_SB'] },
    { cat: 'vs UTG Open', items: ['vsUTG_HJ','vsUTG_CO','vsUTG_BTN','vsUTG_SB','vsUTG_BB'] },
    { cat: 'vs HJ Open',  items: ['vsHJ_CO','vsHJ_BTN','vsHJ_SB','vsHJ_BB'] },
    { cat: 'vs CO Open',  items: ['vsCO_BTN','vsCO_SB','vsCO_BB'] },
    { cat: 'vs BTN Open', items: ['vsBTN_SB','vsBTN_BB'] },
    { cat: 'vs SB Open',  items: ['vsSB_BB'] },
    { cat: 'vs 3-Bet (Hero abrió)', items: ['UTG_vs_3B','HJ_vs_3B','CO_vs_3B','BTN_vs_3B','SB_vs_3B'] },
    { cat: 'Squeeze (Open + Callers)', items: ['SQZ_CO','SQZ_BTN','SQZ_SB','SQZ_BB','SQZ_HJ'] }
  ],

  SCENE_LABELS: {
    RFI_UTG:'UTG Open',RFI_HJ:'HJ Open',RFI_CO:'CO Open',RFI_BTN:'BTN Open',RFI_SB:'SB Open',
    vsUTG_HJ:'HJ vs UTG',vsUTG_CO:'CO vs UTG',vsUTG_BTN:'BTN vs UTG',vsUTG_SB:'SB vs UTG',vsUTG_BB:'BB vs UTG',
    vsHJ_CO:'CO vs HJ',vsHJ_BTN:'BTN vs HJ',vsHJ_SB:'SB vs HJ',vsHJ_BB:'BB vs HJ',
    vsCO_BTN:'BTN vs CO',vsCO_SB:'SB vs CO',vsCO_BB:'BB vs CO',
    vsBTN_SB:'SB vs BTN',vsBTN_BB:'BB vs BTN',
    vsSB_BB:'BB vs SB',
    UTG_vs_3B:'UTG vs 3B',HJ_vs_3B:'HJ vs 3B',CO_vs_3B:'CO vs 3B',BTN_vs_3B:'BTN vs 3B',SB_vs_3B:'SB vs 3B',
    SQZ_CO:'SQZ CO',SQZ_BTN:'SQZ BTN',SQZ_SB:'SQZ SB',SQZ_BB:'SQZ BB',SQZ_HJ:'SQZ HJ'
  },

  DR: {},
  db: null,

  _R: function(r,c){ const o={}; (r||[]).forEach(h=>o[h]='R'); (c||[]).forEach(h=>o[h]='C'); return o; },

  _buildDefaults: function() {
    const R=this._R.bind(this);
    this.DR['RFI_UTG']=R(['AA','KK','QQ','JJ','TT','99','88','AKs','AQs','AJs','ATs','A9s','KQs','KJs','QJs','JTs','AKo','AQo'],[]);
    this.DR['RFI_HJ']=R(['AA','KK','QQ','JJ','TT','99','88','77','AKs','AQs','AJs','ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','AKo','AQo','AJo','KQo'],[]);
    this.DR['RFI_CO']=R(['AA','KK','QQ','JJ','TT','99','88','77','66','55','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','87s','76s','65s','AKo','AQo','AJo','ATo','A9o','KQo','KJo','QJo'],[]);
    this.DR['RFI_BTN']=R(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','T7s','98s','97s','96s','87s','86s','85s','76s','75s','65s','64s','54s','AKo','AQo','AJo','ATo','A9o','A8o','A7o','KQo','KJo','KTo','QJo','QTo','JTo','J9o','T9o'],[]);
    this.DR['RFI_SB']=R(['AA','KK','QQ','JJ','TT','99','88','77','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s','65s','AKo','AQo','AJo','ATo','KQo','KJo'],[]);
    this.DR['vsUTG_HJ']=R(['AA','KK','QQ','JJ','AKs','AKo'],['TT','99','88','AQs','AJs','KQs','JTs']);
    this.DR['vsUTG_CO']=R(['AA','KK','QQ','JJ','AKs','AQs','AKo'],['TT','99','88','77','AJs','ATs','KQs','KJs','QJs','JTs','T9s']);
    this.DR['vsUTG_BTN']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','A5s','A4s','AKo'],['99','88','77','66','55','AJs','ATs','A9s','KQs','KJs','KTs','QJs','JTs','T9s','98s','87s','76s','65s']);
    this.DR['vsUTG_SB']=R(['AA','KK','QQ','JJ','AKs','AKo'],['TT','99','AQs','AJs','KQs']);
    this.DR['vsUTG_BB']=R(['AA','KK','QQ','JJ','AKs','A5s','A4s','A3s'],['TT','99','88','77','66','55','44','33','22','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','J9s','T9s','T8s','98s','87s','76s','65s','AQo','AJo','ATo','KQo','KJo']);
    this.DR['vsHJ_CO']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','A5s','AKo'],['99','88','77','AJs','ATs','KQs','KJs','QJs','JTs','T9s','98s']);
    this.DR['vsHJ_BTN']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','AKo'],['99','88','77','66','55','ATs','A9s','KQs','KJs','KTs','QJs','JTs','T9s','98s','87s','76s','65s']);
    this.DR['vsHJ_SB']=R(['AA','KK','QQ','JJ','AKs','AKo'],['TT','99','AQs','KQs']);
    this.DR['vsHJ_BB']=R(['AA','KK','QQ','JJ','AKs','A5s','A4s','A3s'],['TT','99','88','77','66','55','44','33','22','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','T9s','98s','87s','76s','65s','AQo','AJo','ATo','A9o','KQo','KJo']);
    this.DR['vsCO_BTN']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','AKo'],['99','88','77','66','55','44','ATs','A9s','KQs','KJs','KTs','QJs','JTs','T9s','98s','87s','76s','65s','54s']);
    this.DR['vsCO_SB']=R(['AA','KK','QQ','JJ','AKs','AKo'],['TT','99','AQs','AJs','KQs']);
    this.DR['vsCO_BB']=R(['AA','KK','QQ','JJ','AKs','A5s','A4s','A3s','A2s'],['TT','99','88','77','66','55','44','33','22','AQs','AJs','ATs','A9s','A8s','A7s','A6s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','J9s','T9s','T8s','98s','87s','76s','65s','AQo','AJo','ATo','A9o','KQo','KJo','QJo']);
    this.DR['vsBTN_SB']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','AKo','AQo'],['99','88','77','66','55','ATs','A9s','KQs','KJs','KTs','QJs','JTs','T9s','98s','87s','76s','65s']);
    this.DR['vsBTN_BB']=R(['AA','KK','QQ','AKs','A9s','A8s','A5s','A4s','A3s','A2s'],['JJ','TT','99','88','77','66','55','44','33','22','AQs','AJs','ATs','A7s','A6s','KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','AJo','ATo','A9o','KQo','KJo','QJo']);
    this.DR['vsSB_BB']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','A3s','AKo'],['99','88','77','66','55','44','33','22','ATs','A9s','A8s','A7s','A6s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','J9s','T9s','98s','87s','76s','65s','AQo','AJo','ATo','KQo','KJo']);
    this.DR['UTG_vs_3B']=R(['AA','KK','AKs','AKo'],['QQ','JJ','AQs','AJs']);
    this.DR['HJ_vs_3B']=R(['AA','KK','QQ','AKs','AKo'],['JJ','TT','AQs','AJs','KQs','JTs']);
    this.DR['CO_vs_3B']=R(['AA','KK','QQ','AKs','AKo'],['JJ','TT','99','AQs','AJs','ATs','KQs','KJs']);
    this.DR['BTN_vs_3B']=R(['AA','KK','QQ','AKs','A5s','A4s','AKo'],['JJ','TT','99','88','AQs','AJs','ATs','KQs','KJs','QJs','JTs','T9s']);
    this.DR['SB_vs_3B']=R(['AA','KK','QQ','AKs','AKo'],['JJ','TT','99','AQs','AJs','KQs','KJs']);
    this.DR['SQZ_HJ']=R(['AA','KK','QQ','JJ','AKs','AQs'],['TT','99','AJs','KQs']);
    this.DR['SQZ_CO']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','A5s','A4s','AKo'],['99','88','AJs','KQs','KJs','JTs']);
    this.DR['SQZ_BTN']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','A3s','KQs','AKo'],['99','88','77','66','ATs','KJs','QJs','JTs','T9s']);
    this.DR['SQZ_SB']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','AJs','A5s','A4s','AKo','AQo'],['99','88','77','ATs','KQs','KJs']);
    this.DR['SQZ_BB']=R(['AA','KK','QQ','JJ','TT','AKs','AQs','A5s','A4s','A3s','A2s'],['99','88','77','AJs','ATs','KQs','KJs','QJs','JTs']);
  },

  init: function() {
    this.CATEGORIES.forEach(c=>c.items.forEach(i=>{if(!this.DR[i])this.DR[i]={};}));
    this._buildDefaults();
    const raw = localStorage.getItem(this.key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.db = {};
        this.CATEGORIES.forEach(c=>c.items.forEach(i=>{
          this.db[i] = parsed[i]!==undefined ? parsed[i] : JSON.parse(JSON.stringify(this.DR[i]||{}));
        }));
      } catch(e) { this.db=JSON.parse(JSON.stringify(this.DR)); }
    } else {
      this.db = JSON.parse(JSON.stringify(this.DR));
      this.save();
    }
  },

  _saveTimeout: null,
  save: function(immediate=false) { 
    if(immediate) {
      try{localStorage.setItem(this.key,JSON.stringify(this.db));}catch(e){}
      return;
    }
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      try{localStorage.setItem(this.key,JSON.stringify(this.db));}catch(e){}
    }, 350);
  },
  get: function(scene) { if(!this.db)this.init(); return this.db[scene]||{}; },
  updatePos: function(scene,mapObj) { if(!this.db)this.init(); this.db[scene]=mapObj; this.save(); },
  resetPos: function(scene) { if(!this.db)this.init(); this.db[scene]=JSON.parse(JSON.stringify(this.DR[scene]||{})); this.save(); },
  resetAll: function() { this.db=JSON.parse(JSON.stringify(this.DR)); this.save(); },

  countCombos: function(scene) {
    const rng=this.get(scene); let r=0,c=0;
    for(const[hd,act]of Object.entries(rng)){
      const n=hd.length===2?6:hd.endsWith('s')?4:12;
      if(act==='R')r+=n; else if(act==='C')c+=n;
    }
    return {raise:r,call:c,total:r+c,pct:Math.round((r+c)/1326*100)};
  }
};

// Protección contra pérdida de datos al cerrar la pestaña repentinamente
window.addEventListener('beforeunload', () => {
  if (window.RangeDB && window.RangeDB._saveTimeout) {
    window.RangeDB.save(true);
  }
});
