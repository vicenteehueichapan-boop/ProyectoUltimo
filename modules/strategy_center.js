// ================================================================
// APEX PREDATOR V9 — strategy_center.js
// Centro de Estrategia Completo: 5 pestañas, todo configurable
// ================================================================
window.StrategyCenter = {

  // ── State ──
  activeTab:   'preflop',
  activeScene: 'RFI_BTN',
  brush:       'R',
  isPainting:  false,
  showProfiles: false,
  heroKey: null,  // current hero hand key (highlight)

  // ── Helpers ──
  sc: function(path)  { return window.StrategyConfig ? window.StrategyConfig.g(path) : null; },
  ss: function(path,v){ if(window.StrategyConfig) window.StrategyConfig.s(path,v); },

  setHeroKey: function(k) { this.heroKey = k; },

  // ═══════════════════════════════════════════════════
  // RENDER MAIN
  // ═══════════════════════════════════════════════════
  render: function() {
    const SC = window.StrategyConfig;
    const RDB = window.RangeDB;
    if(!SC||!RDB) return '<div style="padding:20px;color:#f87171">Error: módulos no cargados.</div>';

    const tabs = [
      {id:'preflop',  label:'🎴 Rangos Preflop',   color:'#3b82f6'},
      {id:'sizing',   label:'📐 Sizing Lab',         color:'#ef4444'},
      {id:'postflop', label:'⚡ Control Postflop',   color:'#7c3aed'},
      {id:'villains', label:'🕵️ Villanos',            color:'#d97706'},
      {id:'profiles', label:'💾 Perfiles',            color:'#10b981'},
    ];

    let html = `<div id="sc-wrap" style="background:#0d0f12;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 60px);max-height:700px">`;

    // ── Tab Bar ──
    html += `<div style="display:flex;background:#17191e;border-bottom:1px solid #1e2128;flex-shrink:0">`;
    tabs.forEach(t => {
      const act = this.activeTab === t.id;
      html += `<button data-sctab="${t.id}" style="flex:1;padding:10px 4px;border:none;background:${act?'#0d0f12':'transparent'};color:${act?t.color:'#475569'};font-size:10px;font-weight:800;cursor:pointer;border-bottom:2px solid ${act?t.color:'transparent'};transition:.15s;letter-spacing:.03em">${t.label}</button>`;
    });
    html += `</div>`;

    // ── Tab Content ──
    html += `<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">`;
    switch(this.activeTab) {
      case 'preflop':  html += this.renderPreflop();  break;
      case 'sizing':   html += this.renderSizing();   break;
      case 'postflop': html += this.renderPostflop(); break;
      case 'villains': html += this.renderVillains(); break;
      case 'profiles': html += this.renderProfiles(); break;
    }
    html += `</div></div>`;
    return html;
  },

  // ═══════════════════════════════════════════════════
  // TAB 1: PREFLOP RANGES
  // ═══════════════════════════════════════════════════
  renderPreflop: function() {
    const RDB = window.RangeDB;
    const rng = RDB.get(this.activeScene);
    const stats = RDB.countCombos(this.activeScene);
    const label = RDB.SCENE_LABELS?.[this.activeScene] || this.activeScene;

    let html = `<div style="display:flex;flex:1;overflow:hidden">`;

    // ── Sidebar ──
    html += `<div style="width:160px;background:#13151a;border-right:1px solid #1e2128;overflow-y:auto;flex-shrink:0;padding:6px 4px">`;
    RDB.CATEGORIES.forEach(cat => {
      html += `<div style="font-size:8px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.06em;padding:8px 8px 4px">${cat.cat}</div>`;
      cat.items.forEach(id => {
        const isAct = id === this.activeScene;
        const sc = RDB.countCombos(id);
        const lbl = RDB.SCENE_LABELS?.[id] || id;
        html += `<button data-scscene="${id}" style="display:block;width:100%;text-align:left;padding:6px 8px;font-size:10px;font-weight:${isAct?800:600};background:${isAct?'#2563eb':'transparent'};color:${isAct?'#fff':'#94a3b8'};border:none;border-radius:5px;cursor:pointer;margin-bottom:1px">
          ${lbl}
          <span style="float:right;font-size:9px;color:${isAct?'#93c5fd':'#475569'}">${sc.pct}%</span>
        </button>`;
      });
    });
    html += `</div>`;

    // ── Main area ──
    html += `<div style="flex:1;display:flex;flex-direction:column;overflow:hidden">`;

    // Stats bar
    html += `<div style="padding:8px 12px;background:#17191e;border-bottom:1px solid #1e2128;display:flex;align-items:center;gap:12px;flex-shrink:0">`;
    html += `<span style="font-size:13px;font-weight:800;color:#f8fafc">${label}</span>`;
    html += `<span style="font-size:11px;font-weight:700;padding:2px 8px;background:rgba(239,68,68,0.15);border-radius:4px;color:#f87171">R: ${stats.raise} combos</span>`;
    html += `<span style="font-size:11px;font-weight:700;padding:2px 8px;background:rgba(59,130,246,0.15);border-radius:4px;color:#60a5fa">C: ${stats.call} combos</span>`;
    html += `<span style="font-size:11px;font-weight:700;padding:2px 8px;background:rgba(71,85,105,0.15);border-radius:4px;color:#94a3b8">Total: ${stats.pct}% VPIP</span>`;
    html += `</div>`;

    // Brush toolbar
    html += `<div style="padding:6px 12px;background:#17191e;border-bottom:1px solid #1e2128;display:flex;align-items:center;gap:8px;flex-shrink:0">`;
    html += `<span style="font-size:9px;color:#475569;font-weight:800;letter-spacing:.08em">PINCEL:</span>`;
    [['R','Raise','#ef4444'],['C','Call','#3b82f6'],['F','Fold','#475569']].forEach(([v,l,c]) => {
      const act = this.brush === v;
      html += `<button data-scbrush="${v}" style="padding:5px 12px;border-radius:5px;border:2px solid ${act?c:'transparent'};background:${act?c+'22':'#1e2128'};color:${act?c:'#64748b'};font-size:10px;font-weight:800;cursor:pointer">${l}</button>`;
    });
    html += `<div style="flex:1"></div>`;
    html += `<button data-scresetscene style="padding:5px 10px;border-radius:5px;border:1px solid #374151;background:transparent;color:#64748b;font-size:10px;font-weight:700;cursor:pointer">↺ GTO Base</button>`;
    html += `<button data-scclearscene style="padding:5px 10px;border-radius:5px;border:1px solid #374151;background:transparent;color:#64748b;font-size:10px;font-weight:700;cursor:pointer">🗑 Limpiar</button>`;
    html += `</div>`;

    // ── Grid 13×13 ──
    const RKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
    html += `<div id="sc-grid-wrap" style="flex:1;overflow:auto;padding:10px">`;
    html += `<div id="sc-grid" style="display:grid;grid-template-columns:repeat(13,1fr);gap:2px;user-select:none;-webkit-user-select:none">`;

    RKS.forEach((r,ri) => {
      RKS.forEach((c,ci) => {
        let hd, type;
        if(ri===ci)       { hd=r+c;     type='pair'; }
        else if(ci>ri)    { hd=r+c+'s'; type='suit'; }
        else               { hd=c+r+'o'; type='off';  }

        const act = rng[hd];
        const isHero = this.heroKey === hd;
        let bg='#13151a', color='rgba(255,255,255,0.25)', border='transparent';
        if(act==='R')      { bg='rgba(239,68,68,0.75)'; color='#fff'; }
        else if(act==='C') { bg='rgba(59,130,246,0.75)'; color='#fff'; }
        if(isHero)         { border='#fbbf24'; bg=act?bg:'rgba(251,191,36,0.25)'; color='#fbbf24'; }

        html += `<div data-schd="${hd}" style="aspect-ratio:1;border-radius:3px;border:2px solid ${border};background:${bg};color:${color};font-size:7px;font-weight:800;display:flex;align-items:center;justify-content:center;cursor:crosshair;touch-action:none">${hd}</div>`;
      });
    });

    html += `</div></div>`;

    // Legend
    html += `<div style="padding:6px 12px;border-top:1px solid #1e2128;display:flex;gap:12px;flex-shrink:0;background:#13151a">`;
    html += `<span style="font-size:9px;display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:#ef4444;display:inline-block"></span><span style="color:#94a3b8">Raise</span></span>`;
    html += `<span style="font-size:9px;display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:#3b82f6;display:inline-block"></span><span style="color:#94a3b8">Call</span></span>`;
    html += `<span style="font-size:9px;display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:#13151a;border:1px solid #374151;display:inline-block"></span><span style="color:#94a3b8">Fold</span></span>`;
    if(this.heroKey) html += `<span style="font-size:9px;display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;border:2px solid #fbbf24;display:inline-block"></span><span style="color:#fbbf24">Tu mano: ${this.heroKey}</span></span>`;
    html += `<span style="margin-left:auto;font-size:9px;color:#475569">Arrastra para pintar múltiples celdas</span>`;
    html += `</div>`;

    html += `</div></div>`;
    return html;
  },

  // ═══════════════════════════════════════════════════
  // TAB 2: SIZING LAB
  // ═══════════════════════════════════════════════════
  renderSizing: function() {
    const SC = window.StrategyConfig;
    const g = p => SC.g(p);
    const inp = (path, label, min, max, step, unit='BB') =>
      `<div style="background:#17191e;border:1px solid #1e2128;border-radius:8px;padding:10px 12px">
        <div style="font-size:9px;font-weight:800;color:#64748b;letter-spacing:.07em;margin-bottom:6px">${label}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="range" data-scpath="${path}" min="${min}" max="${max}" step="${step}" value="${g(path)}"
            style="flex:1;accent-color:#ef4444">
          <span data-scval="${path}" style="font-size:16px;font-weight:900;color:#ef4444;min-width:52px;text-align:right">${g(path)}${unit}</span>
        </div>
      </div>`;

    let html = `<div style="overflow-y:auto;flex:1;padding:14px">`;

    // ── Open Sizing ──
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Open Raise Size (BB)</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += inp('sizing.openUTG','UTG Open',2,5,0.5);
    html += inp('sizing.openHJ','HJ Open',2,5,0.5);
    html += inp('sizing.openCO','CO Open',2,5,0.5);
    html += inp('sizing.openBTN','BTN Open',2,5,0.5);
    html += inp('sizing.openSB','SB Open (vs BB)',2.5,5,0.5);
    html += `</div>`;

    // ── 3-Bet / 4-Bet ──
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">3-Bet / 4-Bet (multiplicador x)</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += inp('sizing.threeBetIP', '3-Bet IP (mult)',2,5,0.1,'x');
    html += inp('sizing.threeBetOOP','3-Bet OOP (mult)',3,7,0.1,'x');
    html += inp('sizing.fourBet',    '4-Bet (mult)',2.2,4,0.1,'x');
    html += inp('sizing.squeeze',    'Squeeze (mult)',2.5,5,0.1,'x');
    html += `</div>`;

    // ── Postflop Sizing ──
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">C-Bet Size (% del bote)</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += inp('sizing.cbetFlop', 'C-Bet Flop',20,100,1,'%');
    html += inp('sizing.cbetTurn', 'C-Bet Turn',33,150,1,'%');
    html += inp('sizing.cbetRiver','C-Bet River',33,150,1,'%');
    html += inp('sizing.overbetTurn','Overbet Turn/River',100,200,5,'%');
    html += `</div>`;

    html += `<div style="text-align:center;margin-top:8px">
      <button data-screset style="padding:10px 24px;background:#374151;border:none;border-radius:8px;color:#94a3b8;font-size:12px;font-weight:700;cursor:pointer">↺ Restaurar Defaults GTO</button>
    </div>`;
    html += `</div>`;
    return html;
  },

  // ═══════════════════════════════════════════════════
  // TAB 3: POSTFLOP CONTROL
  // ═══════════════════════════════════════════════════
  renderPostflop: function() {
    const SC = window.StrategyConfig;
    const g = p => SC.g(p);

    const slider = (path, label, min, max, step, unit='%', color='#7c3aed') =>
      `<div style="background:#17191e;border:1px solid #1e2128;border-radius:8px;padding:10px 12px">
        <div style="font-size:9px;font-weight:800;color:#64748b;letter-spacing:.07em;margin-bottom:6px">${label}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="range" data-scpath="${path}" min="${min}" max="${max}" step="${step}" value="${g(path)}"
            style="flex:1;accent-color:${color}">
          <span data-scval="${path}" style="font-size:16px;font-weight:900;color:${color};min-width:48px;text-align:right">${g(path)}${unit}</span>
        </div>
      </div>`;

    const toggle = (path, label) => {
      const val = g(path);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#17191e;border:1px solid #1e2128;border-radius:8px">
        <span style="font-size:11px;font-weight:700;color:#e2e8f0">${label}</span>
        <button data-sctoggle="${path}" style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;background:${val?'#7c3aed':'#374151'};position:relative;transition:.2s">
          <span style="position:absolute;top:3px;${val?'right:3px':'left:3px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s"></span>
        </button>
      </div>`;
    };

    let html = `<div style="overflow-y:auto;flex:1;padding:14px">`;

    // Aggression Master
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Agresividad Global</div>`;
    const aggr = g('postflop.aggression');
    const aggrLabel = aggr<35?'Muy Pasivo':aggr<50?'Pasivo':aggr<65?'TAG':aggr<80?'LAG':'Maniac';
    html += `<div style="background:#17191e;border:1px solid #7c3aed;border-radius:8px;padding:12px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:9px;color:#64748b;font-weight:800;letter-spacing:.07em">AGGRESSION MASTER</span>
        <span style="font-size:13px;font-weight:800;color:#c084fc">${aggr}% — ${aggrLabel}</span>
      </div>
      <input type="range" data-scpath="postflop.aggression" min="10" max="100" step="5" value="${aggr}" style="width:100%;accent-color:#7c3aed">
      <div style="display:flex;justify-content:space-between;font-size:8px;color:#475569;margin-top:4px">
        <span>Pasivo</span><span>TAG</span><span>LAG</span><span>Maniac</span>
      </div>
    </div>`;

    // C-bet Frequencies
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Frecuencia C-Bet por Textura</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += slider('postflop.freqCbetDry',  'Board Seco',   0, 100, 5, '%', '#4ade80');
    html += slider('postflop.freqCbetWet',  'Board Húmedo', 0, 100, 5, '%', '#fb923c');
    html += slider('postflop.freqCbetMono', 'Board Mono',   0, 100, 5, '%', '#f87171');
    html += slider('postflop.freqCbetPaired','Board Pareado',0, 100, 5, '%', '#fbbf24');
    html += `</div>`;

    // SPR Zones
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">SPR Zones (Stack-to-Pot Ratio)</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += slider('postflop.spr_commit', 'COMMIT (TPTK=nuts) ≤', 1, 5, 0.5, '', '#4ade80');
    html += slider('postflop.spr_control','CONTROL (bote ctrl) ≤', 3, 10, 0.5, '', '#fbbf24');
    html += slider('postflop.spr_deep',   'DEEP (TPTK peligrosa) ≤', 6, 20, 1, '', '#f87171');
    html += `</div>`;

    // Toggles
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Comportamientos</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += toggle('postflop.bluffRiverOn','Bluffs de River');
    html += toggle('postflop.barrelOn',    'Barrel en Scare Cards');
    html += toggle('postflop.probeOn',     'Probe Bet en Turn');
    html += `</div>`;

    html += `</div>`;
    return html;
  },

  // ═══════════════════════════════════════════════════
  // TAB 4: VILLAIN PROFILES
  // ═══════════════════════════════════════════════════
  renderVillains: function() {
    const SC = window.StrategyConfig;
    const g = p => SC.g(p);

    const numInput = (path, label, min, max, unit='%') =>
      `<div style="background:#17191e;border:1px solid #1e2128;border-radius:8px;padding:10px 12px">
        <div style="font-size:9px;font-weight:800;color:#64748b;letter-spacing:.07em;margin-bottom:6px">${label}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" data-scpath="${path}" min="${min}" max="${max}" value="${g(path)}"
            style="flex:1;background:#0d0f12;border:1px solid #374151;border-radius:5px;color:#fbbf24;font-size:16px;font-weight:900;padding:6px 10px;outline:none">
          <span style="color:#64748b;font-size:12px">${unit}</span>
        </div>
      </div>`;

    const exToggle = (path, label, desc) => {
      const val = g(path);
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;background:#17191e;border:1px solid #1e2128;border-radius:8px">
        <button data-sctoggle="${path}" style="flex-shrink:0;width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;background:${val?'#d97706':'#374151'};position:relative;transition:.2s;margin-top:2px">
          <span style="position:absolute;top:3px;${val?'right:3px':'left:3px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s"></span>
        </button>
        <div>
          <div style="font-size:11px;font-weight:700;color:#e2e8f0">${label}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px">${desc}</div>
        </div>
      </div>`;
    };

    let html = `<div style="overflow-y:auto;flex:1;padding:14px">`;

    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Umbrales de Clasificación</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += numInput('villain.fishVPIP',        'Fish  VPIP >',1,100);
    html += numInput('villain.stationWTSD',     'Station  WTSD >',1,60);
    html += numInput('villain.stationFoldCbet', 'Station  Fold Cbet <',1,80);
    html += numInput('villain.nitVPIP',         'Nit  VPIP <',1,30);
    html += numInput('villain.lagPFR',          'LAG  PFR >',1,50);
    html += numInput('villain.lagThreeBet',     'LAG  3Bet% >',1,25);
    html += `</div>`;

    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Exploits MDA</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += exToggle('exploits.lawOfRiver',  'Ley del River',      'Overfold TPTK− vs triple barrel / river raise');
    html += exToggle('exploits.probeTurn',   'Probe Turn',         'Atacar IP check con 80% del rango');
    html += exToggle('exploits.deepTPTK',    'Alerta TPTK Deep',   'Advertir cuando TPTK peligrosa (SPR alto)');
    html += exToggle('exploits.fishValue',   'Value Fish',         'Bet fino siempre vs Fish/Station');
    html += exToggle('exploits.nitFold',     'Fold vs Nit',        'Foldeamos TPTK vs agresión de Nit');
    html += exToggle('exploits.lagInduce',   'Induce vs LAG',      'Checkear manos fuertes vs LAG para inducir');
    html += exToggle('exploits.multiway',    'Honesto Multiway',   'No bluffear en botes de 3+ jugadores');
    html += `</div>`;

    html += `</div>`;
    return html;
  },

  // ═══════════════════════════════════════════════════
  // TAB 5: PROFILES
  // ═══════════════════════════════════════════════════
  renderProfiles: function() {
    const SC = window.StrategyConfig;
    const profs = SC.getProfiles();
    const names = Object.keys(profs).sort();

    let html = `<div style="overflow-y:auto;flex:1;padding:14px">`;

    // Save current
    html += `<div style="margin-bottom:20px">
      <div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Guardar Configuración Actual</div>
      <div style="display:flex;gap:8px">
        <input id="sc-prof-name" type="text" placeholder="Nombre del perfil (ej: NL25 Fish Tables)" style="flex:1;background:#17191e;border:1px solid #334155;border-radius:8px;color:#f8fafc;font-size:13px;padding:10px 14px;outline:none">
        <button data-scsaveprof style="padding:10px 18px;background:#10b981;border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:800;cursor:pointer;flex-shrink:0">💾 Guardar</button>
      </div>
    </div>`;

    // Saved profiles
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Perfiles Guardados (${names.length})</div>`;
    if(names.length===0){
      html += `<div style="padding:20px;text-align:center;color:#374151;font-size:12px">No hay perfiles guardados.<br>Configura tu estrategia y guárdala aquí.</div>`;
    } else {
      names.forEach(name => {
        const p = profs[name];
        const date = p.savedAt ? new Date(p.savedAt).toLocaleDateString('es') : '';
        html += `<div style="background:#17191e;border:1px solid #1e2128;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:800;color:#f8fafc">${name}</div>
            <div style="font-size:10px;color:#475569;margin-top:2px">${date}</div>
          </div>
          <button data-scloadprof="${name}" style="padding:7px 14px;background:#1d4ed8;border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:800;cursor:pointer">Cargar</button>
          <button data-scdelprof="${name}" style="padding:7px 10px;background:transparent;border:1px solid #374151;border-radius:6px;color:#64748b;font-size:11px;cursor:pointer">✕</button>
        </div>`;
      });
    }

    // Export / Import
    html += `<div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;margin-top:20px">Exportar / Importar</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += `<button data-scexportfull style="padding:12px;background:#1e2128;border:1px solid #334155;border-radius:8px;color:#60a5fa;font-size:11px;font-weight:700;cursor:pointer">⬆ Exportar JSON Completo<br><span style="font-size:9px;color:#475569">Config + Rangos + Jugadores</span></button>`;
    html += `<label style="padding:12px;background:#1e2128;border:1px solid #334155;border-radius:8px;color:#4ade80;font-size:11px;font-weight:700;cursor:pointer;text-align:center">⬇ Importar JSON<br><span style="font-size:9px;color:#475569">Reemplaza configuración actual</span><input type="file" accept=".json" data-scimport style="display:none"></label>`;
    html += `</div>`;

    // Reset all
    html += `<div style="text-align:center;margin-top:8px">
      <button data-scresetall style="padding:10px 24px;background:#7f1d1d;border:1px solid #991b1b;border-radius:8px;color:#f87171;font-size:11px;font-weight:800;cursor:pointer">⚠️ Reset Total — Volver a Defaults GTO</button>
    </div>`;

    html += `</div>`;
    return html;
  },

  // ═══════════════════════════════════════════════════
  // BIND EVENTS
  // ═══════════════════════════════════════════════════
  bind: function(container) {
    const SC  = window.StrategyConfig;
    const RDB = window.RangeDB;

    // Tab switching
    container.querySelectorAll('[data-sctab]').forEach(el => {
      el.addEventListener('click', () => {
        this.activeTab = el.dataset.sctab;
        this.rerender(container);
      });
    });

    // Scene switching
    container.querySelectorAll('[data-scscene]').forEach(el => {
      el.addEventListener('click', () => {
        this.activeScene = el.dataset.scscene;
        this.rerender(container);
      });
    });

    // Brush selection
    container.querySelectorAll('[data-scbrush]').forEach(el => {
      el.addEventListener('click', () => {
        this.brush = el.dataset.scbrush;
        this.rerender(container);
      });
    });

    // Reset / Clear scene
    container.querySelectorAll('[data-scresetscene]').forEach(el => {
      el.addEventListener('click', () => { RDB.resetPos(this.activeScene); this.rerender(container); });
    });
    container.querySelectorAll('[data-scclearscene]').forEach(el => {
      el.addEventListener('click', () => { RDB.updatePos(this.activeScene,{}); this.rerender(container); });
    });

    // ── Grid painting (mouse + touch) ──
    const grid = container.querySelector('#sc-grid');
    if(grid) {
      const paint = (el) => {
        const hd = el?.dataset?.schd;
        if(!hd) return;
        const curObj = RDB.get(this.activeScene);
        if(this.brush==='F') delete curObj[hd];
        else curObj[hd] = this.brush;
        RDB.updatePos(this.activeScene, curObj);
        // Update cell visually without full re-render
        let bg='#13151a', color='rgba(255,255,255,0.25)', border='2px solid transparent';
        const act = curObj[hd];
        if(act==='R')  { bg='rgba(239,68,68,0.75)'; color='#fff'; }
        if(act==='C')  { bg='rgba(59,130,246,0.75)'; color='#fff'; }
        if(this.heroKey===hd) { border='2px solid #fbbf24'; }
        el.style.background=bg; el.style.color=color; el.style.border=border;
        // Update stats display
        const stats = RDB.countCombos(this.activeScene);
        container.querySelectorAll('[data-scstats]').forEach(s=>s.textContent=`${stats.pct}% VPIP`);
      };

      grid.addEventListener('mousedown',  e=>{ if(e.target.dataset.schd){this.isPainting=true; paint(e.target);} });
      grid.addEventListener('mouseover',  e=>{ if(this.isPainting&&e.buttons===1) paint(e.target); });
      grid.addEventListener('mouseup',    ()=>{ this.isPainting=false; });
      grid.addEventListener('mouseleave', ()=>{ this.isPainting=false; });

      // Touch support
      const getTouchEl = e => { const t=e.touches[0]; return document.elementFromPoint(t.clientX,t.clientY); };
      grid.addEventListener('touchstart', e=>{ e.preventDefault(); this.isPainting=true; paint(getTouchEl(e)); }, {passive:false});
      grid.addEventListener('touchmove',  e=>{ e.preventDefault(); if(this.isPainting) paint(getTouchEl(e)); }, {passive:false});
      grid.addEventListener('touchend',   ()=>{ this.isPainting=false; });
    }

    // ── Range/Slider/Number inputs → live update ──
    container.querySelectorAll('[data-scpath]').forEach(el => {
      const update = () => {
        const val = el.type==='range' ? parseFloat(el.value) : parseFloat(el.value)||el.value;
        SC.s(el.dataset.scpath, val);
        // Update display span
        const display = container.querySelector(`[data-scval="${el.dataset.scpath}"]`);
        if(display) display.textContent = val + (el.type==='range' && el.dataset.scpath.includes('sizing')? (el.dataset.scpath.startsWith('sizing.open')||el.dataset.scpath.includes('Bet')||el.dataset.scpath.includes('three')||el.dataset.scpath.includes('four')||el.dataset.scpath.includes('squeeze')? '':'%') : '');
        // Refresh aggression label
        if(el.dataset.scpath==='postflop.aggression') this.rerender(container);
      };
      el.addEventListener('input',  update);
      el.addEventListener('change', update);
    });

    // ── Toggles ──
    container.querySelectorAll('[data-sctoggle]').forEach(el => {
      el.addEventListener('click', () => {
        const path = el.dataset.sctoggle;
        SC.s(path, !SC.g(path));
        this.rerender(container);
      });
    });

    // ── Profile actions ──
    container.querySelectorAll('[data-scsaveprof]').forEach(el => {
      el.addEventListener('click', () => {
        const inp = container.querySelector('#sc-prof-name');
        const name = inp?.value?.trim();
        if(!name){ inp.style.borderColor='#ef4444'; setTimeout(()=>inp.style.borderColor='#334155',1500); return; }
        SC.saveProfile(name);
        if(inp) inp.value='';
        this.rerender(container);
      });
    });
    container.querySelectorAll('[data-scloadprof]').forEach(el => {
      el.addEventListener('click', () => {
        if(SC.loadProfile(el.dataset.scloadprof)) { this.rerender(container); }
      });
    });
    container.querySelectorAll('[data-scdelprof]').forEach(el => {
      el.addEventListener('click', () => { SC.deleteProfile(el.dataset.scdelprof); this.rerender(container); });
    });
    container.querySelectorAll('[data-scexportfull]').forEach(el => {
      el.addEventListener('click', () => SC.exportFull());
    });
    container.querySelectorAll('[data-scimport]').forEach(el => {
      el.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if(SC.importFull(ev.target.result)) { alert('Configuración importada con éxito.'); this.rerender(container); }
          else alert('Error al importar. Verifica que el archivo sea JSON válido.');
        };
        reader.readAsText(file);
      });
    });

    // Reset buttons
    container.querySelectorAll('[data-screset]').forEach(el => {
      el.addEventListener('click', () => { SC.reset(); this.rerender(container); });
    });
    container.querySelectorAll('[data-scresetall]').forEach(el => {
      el.addEventListener('click', () => {
        if(confirm('¿Resetear TODA la configuración a defaults GTO?')) { SC.reset(); RDB.resetAll(); this.rerender(container); }
      });
    });
  },

  // ── Re-render in place ──
  rerender: function(container) {
    container.innerHTML = this.render();
    this.bind(container);
    // Fix display values for sliders after re-render
    const SC = window.StrategyConfig;
    if(!SC) return;
    container.querySelectorAll('[data-scpath]').forEach(el => {
      const v = SC.g(el.dataset.scpath);
      if(v !== undefined) el.value = v;
    });
    container.querySelectorAll('[data-scval]').forEach(el => {
      const v = SC.g(el.dataset['scval']);
      if(v !== undefined) el.textContent = v + (typeof v === 'number' && el.dataset['scval'].includes('cbet') ? '%' : typeof v === 'number' && el.dataset['scval'].includes('open') ? 'BB' : typeof v === 'number' && el.dataset['scval'].includes('three') || el.dataset['scval'].includes('four') || el.dataset['scval'].includes('squeeze') ? 'x' : '');
    });
  }
};
