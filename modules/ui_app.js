// ============================================================
// APEX PREDATOR V9 — ui_app.js
// UI completa: fija facing input, pfBet, brainInput, render
// ============================================================

const HERO = 5;
const RV   = {A:14,K:13,Q:12,J:11,T:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2};
const SY   = {s:'♠',h:'♥',d:'♦',c:'♣'};
const RK   = 'AKQJT98765432';
const RE   = new Set(['h','d']);
const POS_LBL = {6:['BTN','SB','BB','UTG','HJ','CO'],5:['BTN','SB','BB','UTG','CO'],4:['BTN','SB','BB','CO'],3:['BTN','SB','BB'],2:['BTN','BB']};
const ACLS = {check:'ck',call:'cc',bet:'acb',raise:'cr',open:'cr',limp:'ck','3bet':'cr',fold:'cf2'};
const PC   = {BTN:'#fbbf24',SB:'#94a3b8',BB:'#64748b',UTG:'#f87171',HJ:'#fb923c',CO:'#4ade80'};

// ── Global State ──
let T = {
  seats: Array.from({length:6},(_,i)=>i===HERO?{name:'HERO',isHero:true}:{name:''}),
  btnSeat: 0
};

let H = {
  actions: {}, editSeat: null,
  h: [null,null], b: Array(5).fill(null),
  pk: null, pr: null,
  stack: 100, pot: 5,
  facing: 0,       // ← FIXED: apuesta enfrentada
  pfBet: 3,        // ← FIXED: tamaño del raise preflop
  history: [],
  dbSearchTerm: '', dbSearchResults: [],
  showDB: false, showSettings: false,
  showStrategyCenter: false
};

// ── Helpers ──
function street() { const n=H.b.filter(Boolean).length; return n===0?'pre':n<=3?'flop':n===4?'turn':'river'; }
function usedCards() { return [...H.h,...H.b].filter(Boolean); }
function isUsed(r,s) { return usedCards().some(c=>c.r===r&&c.s===s); }
function cardHTML(c,big=false) {
  if(!c) return '';
  const col=RE.has(c.s)?'#ef4444':'#1e293b';
  return `<div class="c-r${big?' big':''}" style="color:${col}">${c.r}</div><div class="c-s${big?' big':''}" style="color:${col}">${SY[c.s]}</div>`;
}
function getOcc() { const o=[]; for(let i=0;i<6;i++){const si=(T.btnSeat+i)%6; if(T.seats[si].isHero||T.seats[si].name) o.push(si);} return o; }
function posMap() { const o=getOcc(),lb=POS_LBL[o.length]||POS_LBL[6],m={}; o.forEach((si,i)=>{if(lb[i]) m[si]=lb[i];}); return m; }
function isFolded(si) { const sts=['pre','flop','turn','river'],ci=sts.indexOf(street()); for(let i=0;i<=ci;i++) if(H.actions[si]?.[sts[i]]==='fold') return true; return false; }

function profLabel(vpip) {
  if(!vpip) return null;
  const v=+vpip;
  if(v>65) return {l:'Maniac🔥',c:'#dc2626'};
  if(v>50) return {l:'Fish🐟',c:'#3b82f6'};
  if(v>38) return {l:'Loose🐠',c:'#f59e0b'};
  if(v<12) return {l:'Nit🪨',c:'#94a3b8'};
  if(v>=18&&v<=28) return {l:'Reg⚙️',c:'#10b981'};
  return {l:'Loose',c:'#f59e0b'};
}

// ─────────────────────────────────────────────────────────────
// RENDER PRINCIPAL
// ─────────────────────────────────────────────────────────────
function render() {
  const pos=posMap(), hp=pos[HERO]||'—', st=street();
  const bd=H.b.filter(Boolean);
  let o='';

  // ── HEADER ──
  o += `<div class="app-header">
    <div class="logo-block">
      <div class="logo-dot">A</div>
      <div>
        <div class="logo-title">APEX PREDATOR <span class="logo-v">V9</span></div>
        <div class="logo-sub">NL DEEPSTACK SOLVER</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <button id="sc-btn" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border:none;border-radius:8px;padding:7px 12px;color:#fff;font-size:11px;font-weight:800;cursor:pointer;letter-spacing:.03em">⚡ Estrategia</button>
      <div class="hdr-btn" id="tools-btn">⚙️</div>
    </div>
  </div>`;

  // ── TOOLS POPUP ──
  o += `<div class="tools-menu hidden" id="t-menu">
    <button class="t-btn" id="t-undo">↩ Deshacer</button>
    <button class="t-btn" id="t-new">↺ Nueva Mano</button>
    <button class="t-btn" id="t-clear">🃏 Limpiar Board</button>
    <div class="t-sep"></div>
    <button class="t-btn green" id="t-db">📖 Jugadores (${window.PlayerDB?.count()||0})</button>
    <button class="t-btn blue" id="t-exp">💾 Exportar Jugadores</button>
  </div>`;

  // ── MESA ──
  o += `<div class="tbl-wrap">`;
  o += `  <div class="felt">`;
  if(+H.pot>0) o+=`<div class="pot-lbl">${H.pot} BB</div>`;

  // Board cards
  o += `<div class="board-row">`;
  const bLbl=['F1','F2','F3','T','R'];
  for(let i=0;i<5;i++){
    const c=H.b[i], ia=H.pk&&H.pk.t==='b'&&H.pk.i===i;
    if(c) o+=`<div class="bc filled ${RE.has(c.s)?'red':'dark'}" data-t="b" data-i="${i}">${cardHTML(c)}</div>`;
    else  o+=`<div class="bc empty${ia?' active':''}" data-t="b" data-i="${i}"><span class="bc-lbl">${bLbl[i]}</span></div>`;
  }
  o += `</div>`;

  // Villain seats
  const vSlots=[[0,'vp0'],[1,'vp1'],[2,'vp2'],[3,'vp3'],[4,'vp4']];
  vSlots.forEach(([si,cls])=>{
    const s=T.seats[si],has=!!s.name,fd=has&&isFolded(si),p=pos[si]||'',pr=has?profLabel(s.vpip):null;
    const pcol=PC[p]||'#94a3b8';
    o+=`<div class="vst ${cls}" data-seat="${si}">
      <div class="v-av${!has?' empty':''}${fd?' folded':''}">
        ${has?`<div class="v-av-inner"></div>`:'+'}
        ${p==='BTN'?`<div class="dlr">D</div>`:''}
        ${has&&p?`<div class="pos-pip" style="background:${pcol}">${p}</div>`:''}
      </div>
      <div class="v-nm-box">
        ${has?`<div class="v-nm">${s.name}</div><div class="v-st">${pr?`<span style="color:${pr.c}">${pr.l}</span>`:''}</div>`:`<div class="v-nm empty">+ Añadir</div>`}
      </div>
    </div>`;
  });

  // Hero
  o+=`<div class="hero-seat">
    <div class="hero-cards">`;
  [0,1].forEach(i=>{
    const c=H.h[i],ia=H.pk&&H.pk.t==='h'&&H.pk.i===i;
    if(c) o+=`<div class="hc filled ${RE.has(c.s)?'red':'dark'}" data-t="h" data-i="${i}">${cardHTML(c,true)}</div>`;
    else  o+=`<div class="hc empty${ia?' active':''}" data-t="h" data-i="${i}"><span class="hc-lbl">?</span></div>`;
  });
  o+=`    </div>
    <div class="hero-info">
      <span class="v-nm">HERO</span>
      <span class="pos-pill" style="background:${PC[hp]||'#334155'}">${hp}</span>
    </div>
  </div>`;
  o+=`  </div></div>`; // end felt + tbl-wrap

  // ── CARD PICKER ──
  if(H.pk){
    o+=`<div class="pkr">`;
    if(!H.pr){
      o+=`<div class="pkr-hint">VALOR</div><div class="rg">`;
      for(const r of RK){
        const allU=['s','h','d','c'].every(s=>isUsed(r,s));
        o+=`<button class="rb${allU?' used':''}" data-r="${r}">${r}</button>`;
      }
      o+=`</div>`;
    } else {
      o+=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="font-size:26px;font-weight:900;color:#f8fafc">${H.pr}</span>
            <span class="pkr-hint">PALO</span>
          </div>
          <div class="sgr">`;
      [['s','♠','dark'],['h','♥','red'],['d','♦','red'],['c','♣','dark']].forEach(([s,sm,cl])=>{
        const u=isUsed(H.pr,s);
        o+=`<button class="sbtn ${cl}${u?' used':''}" data-s="${s}">${sm}</button>`;
      });
      o+=`</div>`;
    }
    o+=`</div>`;
  }

  // ── PLAYER MODAL ──
  if(H.editSeat!==null&&H.editSeat!==HERO){
    const si=H.editSeat, s=T.seats[si];
    o+=`<div class="modal-overlay" data-cx></div>
      <div class="profile-modal">
        <div class="pm-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="pm-avatar">${s.name?s.name[0].toUpperCase():'?'}</div>
            <div style="position:relative">
              <input type="text" class="pm-name-input" data-sn="${si}" value="${s.name||''}" placeholder="Nombre jugador..." autocomplete="off">
              ${H.dbSearchResults.length>0?
                `<div class="ac-drop">${H.dbSearchResults.map(u=>`<div class="ac-item" data-ac="${u.name}">${u.name} <span style="color:#64748b;font-size:10px">${u.vpip?'VPIP '+u.vpip+'%':''}</span></div>`).join('')}</div>`
              :''}
            </div>
          </div>
          <button class="pm-close" data-cx>✕</button>
        </div>
        <div class="pm-content">
          <div class="pm-grid">
            ${pmCell(si,'vpip','VPIP',s.vpip)} ${pmCell(si,'pfr','PFR',s.pfr)}
            ${pmCell(si,'threeb','3BET',s.threeb)} ${pmCell(si,'fold3b','Fold 3B',s.fold3b)}
            ${pmCell(si,'cbet','CBET',s.cbet)} ${pmCell(si,'foldCbet','Fold CB',s.foldCbet)}
            ${pmCell(si,'wtsd','WTSD',s.wtsd)} ${pmCell(si,'wsd','W$SD',s.wsd)}
          </div>
          <textarea class="pm-notes" data-snt="${si}" placeholder="Notas del jugador...">${s.notes||''}</textarea>
          <div class="pm-actions">
            <button class="pm-save" id="btn-save-prof" data-sv="${si}">💾 Guardar</button>
            <button class="pm-del" data-clr="${si}">🗑 Vaciar</button>
          </div>
        </div>
      </div>`;
  }

  // ── DATABASE MODAL ──
  if(H.showDB){
    const all=window.PlayerDB.getAll();
    o+=`<div class="modal-overlay" data-closedb></div>
      <div class="db-modal">
        <div class="db-head">
          <span>🗃 Bóveda (${all.length})</span>
          <button class="pm-close" data-closedb>✕</button>
        </div>
        <div class="db-body">`;
    if(!all.length) o+=`<div class="db-empty">No hay jugadores guardados aún.</div>`;
    else all.forEach(p=>{
      const pr=profLabel(p.vpip);
      o+=`<div class="db-row">
        <div class="db-row-name">${p.name} ${pr?`<span style="color:${pr.c};font-size:10px">${pr.l}</span>`:''}</div>
        <div class="db-row-stats">VPIP:${p.vpip||'—'} PFR:${p.pfr||'—'} 3B:${p.threeb||'—'}</div>
      </div>`;
    });
    o+=`    </div>
      </div>`;
  }

  // ── STRATEGY CENTER MODAL ──
  if(H.showStrategyCenter && window.StrategyCenter){
    // Sync hero key for highlight
    const hk = window.EngineCore ? window.EngineCore.getHeroKey(H.h.filter(Boolean)) : null;
    window.StrategyCenter.setHeroKey(hk);
    o+=`<div class="sc-overlay" id="sc-overlay"></div>
      <div class="sc-modal" id="sc-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#17191e;border-bottom:1px solid #1e2128;flex-shrink:0">
          <div style="font-size:13px;font-weight:900;color:#c084fc">⚡ APEX Strategy Center</div>
          <button id="sc-close" style="background:transparent;border:none;color:#64748b;font-size:20px;cursor:pointer;padding:2px 6px">✕</button>
        </div>
        <div id="sc-content" style="flex:1;overflow:hidden;display:flex;flex-direction:column">${window.StrategyCenter.render()}</div>
      </div>`;
  }

  // ── (Legacy range editor removed - use Strategy Center) ──

  // ── GEOMETRY INPUTS ──
  const stLabel=st.toUpperCase();
  o+=`<div class="geo-row">
    <div class="geo-cell">
      <label>Stack (BB)</label>
      <input type="number" id="sI" value="${H.stack}" min="1" max="1000">
    </div>
    <div class="geo-cell">
      <label>Bote (BB)</label>
      <input type="number" id="pI" value="${H.pot}" min="0" max="2000">
    </div>
    <div class="geo-cell">
      <label>Facing Bet (BB)</label>
      <input type="number" id="fI" value="${H.facing}" min="0" max="1000" placeholder="0">
    </div>
    <div class="geo-cell">
      <label>${st==='pre'?'Raise rival (BB)':'—'}</label>
      <input type="number" id="pfI" value="${H.pfBet}" min="1" max="200" ${st!=='pre'?'disabled style="opacity:.4"':''}>
    </div>
    <button id="main-rotate-btn" class="rotate-btn" title="Nueva mano">🔄</button>
  </div>`;

  // ── ACTION BUTTONS ──
  const PRE =[['limp','Limp'],['open','Open'],['call','Call'],['3bet','3Bet'],['fold','Fold']];
  const POST=[['check','Chk'],['bet','Bet'],['call','Call'],['raise','Raise'],['fold','Fold']];
  const acts = st==='pre' ? PRE : POST;

  o+=`<div class="sec-lbl">Acciones Rivales — ${stLabel}</div>`;
  T.seats.forEach((s,i)=>{
    if(i===HERO||!s.name) return;
    const p=pos[i]||'?', fd=isFolded(i), ca=H.actions[i]?.[st];
    const pcol=PC[p]||'#94a3b8';
    o+=`<div class="act-row${fd?' fd':''}">
      <div class="act-lbl"><span style="color:${pcol};font-weight:800">${p}</span> <span style="opacity:.6">${s.name}</span></div>`;
    if(!fd){
      o+=`<div class="act-btns">`;
      acts.forEach(([a,l])=>{
        const sel=ca===a?(ACLS[a]||'ck'):'';
        o+=`<button class="ac-btn ${sel}" data-va="${i}:${a}">${l}</button>`;
      });
      o+=`</div>`;
    } else {
      o+=`<div class="folded-tag">FOLD</div>`;
    }
    o+=`</div>`;
  });

  // ── BRAIN OUTPUT ──
  const brainInput = {
    stack:    +H.stack,
    pot:      +H.pot,
    facing:   +H.facing,    // ← FIXED
    pfBet:    +H.pfBet,     // ← FIXED
    boardCards: bd,
    heroCards:  H.h.filter(Boolean),
    actions:    H.actions,
    seats:      T.seats,
    posMap:     pos,
    heroPos:    pos[HERO]||'BB'
  };

  if(window.EngineCore){
    const advice = window.EngineCore.process(brainInput);
    o+=`<div class="brain-wrap" id="brain-wrap-container">${advice}</div>`;
  } else {
    o+=`<div class="brain-wrap" id="brain-wrap-container"></div>`;
  }

  // MDA alerts
  if(street()!=='pre'&&window.EngineStrategy?.MDA){
    const mda=window.EngineStrategy.MDA;
    o+=`<div class="mda-section">`;
    o+=`<div class="sec-lbl">MDA EXPLOIT ALERTS</div>`;
    o+=`<div class="mda-card">${mda.RIVER_RAISE}</div>`;
    if(st==='turn') o+=`<div class="mda-card green">${mda.PROBE_TURN}</div>`;
    o+=`</div>`;
  }

  document.getElementById('app').innerHTML = o;
  bind();
}

// ─────────────────────────────────────────────────────────────
// UPDATE BRAIN ONLY (O(1) DOM Injection)
// ─────────────────────────────────────────────────────────────
function updateBrain() {
  const bCont = document.getElementById('brain-wrap-container');
  if(!bCont || !window.EngineCore) return;
  const brainInput = {
    stack: +H.stack, pot: +H.pot, facing: +H.facing, pfBet: +H.pfBet,
    boardCards: H.b.filter(Boolean), heroCards: H.h.filter(Boolean),
    actions: H.actions, seats: T.seats, posMap: posMap(), heroPos: posMap()[HERO]||'BB'
  };
  bCont.innerHTML = window.EngineCore.process(brainInput);
}

function pmCell(si,field,label,val){
  return `<div class="pm-cell">
    <div class="pm-val"><input type="number" data-ss="${si}:${field}" value="${val||''}" placeholder="—"></div>
    <div class="pm-lbl">${label}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// BIND EVENTOS
// ─────────────────────────────────────────────────────────────
function bind(){
  const $=id=>document.getElementById(id);

  // Tools menu
  $('tools-btn')?.addEventListener('click',()=>$('t-menu').classList.toggle('hidden'));

  // Tool actions
  $('t-undo')?.addEventListener('click',()=>{
    if(H.history.length){const p=H.history.pop();H.h=p.h;H.b=p.b;H.pk=null;H.pr=null;render();}
    $('t-menu').classList.add('hidden');
  });
  $('t-new')?.addEventListener('click',()=>{
    T.btnSeat=(T.btnSeat+1)%6;
    H={...H,actions:{},h:[null,null],b:Array(5).fill(null),pk:null,pr:null,facing:0,history:[]};
    render();
    $('t-menu').classList.add('hidden');
  });
  $('t-clear')?.addEventListener('click',()=>{H.b=Array(5).fill(null);H.pk=null;render();$('t-menu').classList.add('hidden');});
  $('t-db')?.addEventListener('click',()=>{H.showDB=true;$('t-menu').classList.add('hidden');render();});
  $('t-exp')?.addEventListener('click',()=>{window.PlayerDB.exportJSON();});

  // ── Strategy Center Button ──
  $('sc-btn')?.addEventListener('click',()=>{
    H.showStrategyCenter=true;
    render();
  });

  // ── Strategy Center Modal ──
  $('sc-close')?.addEventListener('click',e=>{e.stopPropagation();H.showStrategyCenter=false;render();});
  $('sc-overlay')?.addEventListener('click',()=>{H.showStrategyCenter=false;render();});

  const scContent = $('sc-content');
  if(scContent && window.StrategyCenter){
    window.StrategyCenter.bind(scContent);
  }

  // Geometry inputs — FIXED: facing + pfBet
  $('sI')?.addEventListener('input',e=>{H.stack=+e.target.value;updateBrain();});
  $('pI')?.addEventListener('input',e=>{H.pot=+e.target.value;updateBrain();});
  $('fI')?.addEventListener('input',e=>{H.facing=+e.target.value;updateBrain();});
  $('pfI')?.addEventListener('input',e=>{H.pfBet=+e.target.value;updateBrain();});

  $('main-rotate-btn')?.addEventListener('click',()=>{
    T.btnSeat=(T.btnSeat+1)%6;
    H={...H,actions:{},h:[null,null],b:Array(5).fill(null),pk:null,pr:null,facing:0,history:[]};
    render();
  });

  // Seat clicks
  document.querySelectorAll('[data-seat]').forEach(el=>el.addEventListener('click',()=>{
    H.editSeat=+el.dataset.seat;
    H.dbSearchTerm=T.seats[H.editSeat].name||'';
    H.dbSearchResults=[];
    H.showDB=false;
    render();
  }));

  // Modal close
  document.querySelectorAll('[data-cx]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();H.editSeat=null;render();}));
  document.querySelectorAll('[data-closedb]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();H.showDB=false;render();}));
  document.querySelectorAll('[data-clr]').forEach(el=>el.addEventListener('click',e=>{
    const si=+el.dataset.clr;T.seats[si]={name:''};H.editSeat=null;render();
  }));

  // Save profile
  document.querySelectorAll('#btn-save-prof').forEach(el=>el.addEventListener('click',()=>{
    const si=+el.dataset.sv, s=T.seats[si];
    if(s.name) window.PlayerDB.upsert(s.name,s);
    H.editSeat=null;render();
  }));

  // Autocomplete input
  document.querySelectorAll('.pm-name-input').forEach(el=>{
    el.addEventListener('input',e=>{
      const val=e.target.value;
      const si=+el.dataset.sn;
      T.seats[si].name=val;
      H.dbSearchResults=window.PlayerDB.search(val);
      render();
    });
    // Keep focus
    el.focus();
    el.setSelectionRange(el.value.length,el.value.length);
  });

  // Autocomplete select
  document.querySelectorAll('.ac-item').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    const name=el.dataset.ac, si=H.editSeat;
    const p=window.PlayerDB.get(name);
    if(p) T.seats[si]={...p};
    else T.seats[si].name=name;
    H.dbSearchResults=[];
    render();
  }));

  // Stats inputs in modal
  document.querySelectorAll('[data-ss]').forEach(el=>el.addEventListener('change',e=>{
    const [si,f]=el.dataset.ss.split(':');
    T.seats[+si][f]=e.target.value;
    render();
  }));

  // Notes
  document.querySelectorAll('[data-snt]').forEach(el=>el.addEventListener('input',e=>{
    T.seats[+el.dataset.snt].notes=e.target.value;
  }));

  // Dealer rotate from D chip
  document.querySelectorAll('.dlr').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    T.btnSeat=(T.btnSeat+1)%6;
    H={...H,actions:{},h:[null,null],b:Array(5).fill(null),pk:null,pr:null,facing:0,history:[]};
    render();
  }));

  // Villain action buttons
  document.querySelectorAll('[data-va]').forEach(el=>el.addEventListener('click',()=>{
    const[si,a]=el.dataset.va.split(':');
    const st=street();
    if(!H.actions[+si]) H.actions[+si]={};
    H.actions[+si][st]=a;
    render();
  }));

  // Card slot click
  document.querySelectorAll('[data-t][data-i]').forEach(el=>el.addEventListener('click',()=>{
    const t=el.dataset.t,i=+el.dataset.i;
    if(H.pk&&H.pk.t===t&&H.pk.i===i) H.pk=null;
    else { H.pk={t,i}; H.pr=null; }
    render();
  }));

  // Rank select
  document.querySelectorAll('[data-r]').forEach(el=>el.addEventListener('click',()=>{
    if(!el.classList.contains('used')) { H.pr=el.dataset.r; render(); }
  }));

  // Suit select
  document.querySelectorAll('[data-s]').forEach(el=>el.addEventListener('click',()=>{
    if(!H.pk||!H.pr||el.classList.contains('used')) return;
    const card={r:H.pr,s:el.dataset.s};
    if(isUsed(card.r,card.s)) return;
    H.history.push({h:[...H.h],b:[...H.b]});
    if(H.pk.t==='h'){
      H.h[H.pk.i]=card;
      H.pk=!H.h[0]?{t:'h',i:0}:!H.h[1]?{t:'h',i:1}:null;
    } else {
      H.b[H.pk.i]=card;
      const nx=[0,1,2,3,4].find(j=>j!==H.pk.i&&!H.b[j]);
      H.pk=nx!==undefined?{t:'b',i:nx}:null;
    }
    H.pr=null;
    render();
  }));

  // Se elimina el listener global de bind() para evitar Memory Leaks
}

window.onload=()=>{
  render();
  // Global click listener safe binding
  document.addEventListener('click', e=>{
    const menu=document.getElementById('t-menu');
    const btn=document.getElementById('tools-btn');
    if(menu&&!menu.contains(e.target)&&btn&&!btn.contains(e.target)){
      menu.classList.add('hidden');
    }
  });
};
