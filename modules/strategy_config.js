// ================================================================
// APEX PREDATOR V9 — strategy_config.js
// Centro de Configuración: fuente de verdad para todas las decisiones
// Todos los módulos leen de aquí. Nada hardcodeado en engine_core.
// ================================================================
window.StrategyConfig = {
  KEY:   'apex_strategy_v1',
  P_KEY: 'apex_strategy_profiles_v1',

  // ── VALORES POR DEFECTO (GTO NL25/NL50 6-Max 100BB) ──
  D: {
    stackDepth: 100,  // 100 / 150 / 200
    sizing: {
      // Open sizing (BB absolutas)
      openUTG: 2.5, openHJ: 2.5, openCO: 2.5, openBTN: 2.5, openSB: 3.0,
      // 3-Bet sizing (multiplicador del open del rival)
      threeBetIP:  3.2,   // en posición
      threeBetOOP: 5.0,   // fuera de posición
      // 4-Bet sizing (multiplicador del 3-bet del rival)
      fourBet: 2.8,
      // Squeeze sizing (multiplicador)
      squeeze: 3.5,
      // Postflop sizing (% del bote)
      cbetFlop: 33, cbetTurn: 66, cbetRiver: 75,
      valueBetFlop: 66, valueBetTurn: 75, valueBetRiver: 75,
      bluffFlop: 50, bluffTurn: 66, bluffRiver: 66,
      overbetTurn: 125, overbetRiver: 125,
    },
    postflop: {
      aggression: 60,       // 0=pasivo/100=maniaco — escala global
      freqCbetDry: 100,     // % frecuencia cbet board seco
      freqCbetWet: 66,      // % frecuencia cbet board húmedo
      freqCbetMono: 40,     // % frecuencia cbet board monotone
      freqCbetPaired: 80,   // % frecuencia cbet board pareado
      bluffRiverOn: true,   // permitir recomendaciones de farol river
      barrelOn: true,       // permitir barrel en scare cards
      probeOn: true,        // permitir probe bet turn
      spr_commit: 3,        // SPR ≤ X = ZONA COMMIT (sin fold TPTK)
      spr_control: 6,       // SPR ≤ X = ZONA CONTROL
      spr_deep: 10,         // SPR ≤ X = ZONA DEEP (TPTK peligrosa)
    },
    villain: {
      // Umbrales de clasificación
      fishVPIP:        50,  // VPIP > X → Fish
      stationWTSD:     32,  // WTSD > X → Calling Station
      stationFoldCbet: 35,  // FoldCbet < X → Station
      nitVPIP:         12,  // VPIP < X → Nit
      lagPFR:          22,  // PFR > X → LAG
      lagThreeBet:     10,  // 3Bet% > X → LAG
    },
    exploits: {
      lawOfRiver:  true,  // Overfold TPTK− vs river raise/triple barrel
      probeTurn:   true,  // Attack IP check con 80% del rango
      multiway:    true,  // Juego honesto en botes multiway
      deepTPTK:    true,  // Advertir TPTK vs deep stack (SPR>10)
      fishValue:   true,  // Value thin vs fish (thin bet even TP)
      nitFold:     true,  // Fold fácil vs Nit aggression
      lagInduce:   true,  // Check strong hands vs LAG para inducir
    }
  },

  cfg: null,

  // ── INIT ──
  init() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      // Deep merge: defaults base + saved overrides (por sección)
      this.cfg = { ...JSON.parse(JSON.stringify(this.D)), ...parsed };
      ['sizing','postflop','villain','exploits'].forEach(k => {
        this.cfg[k] = { ...JSON.parse(JSON.stringify(this.D[k])), ...(parsed[k]||{}) };
      });
    } catch(e) {
      this.cfg = JSON.parse(JSON.stringify(this.D));
    }
  },

  // ── GET (path: 'sizing.openBTN') ──
  g(path) {
    if (!this.cfg) this.init();
    return path.split('.').reduce((o,k)=>o?.[k], this.cfg);
  },

  // ── SET ──
  s(path, val) {
    if (!this.cfg) this.init();
    const parts = path.split('.');
    let o = this.cfg;
    for (let i=0; i<parts.length-1; i++) o = o[parts[i]];
    o[parts[parts.length-1]] = val;
    this.save();
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.cfg)); }
    catch(e) { console.error('StrategyConfig save error',e); }
  },

  reset() {
    this.cfg = JSON.parse(JSON.stringify(this.D));
    this.save();
  },

  // ── HELPER: Open size para posición ──
  openSize(pos) {
    const map = { UTG:'openUTG', HJ:'openHJ', CO:'openCO', BTN:'openBTN', SB:'openSB' };
    return this.g('sizing.' + (map[pos]||'openUTG'));
  },

  // ── HELPER: SPR zone key ──
  sprZone(spr) {
    if (spr <= this.g('postflop.spr_commit'))  return 'COMMIT';
    if (spr <= this.g('postflop.spr_control')) return 'CONTROL';
    if (spr <= this.g('postflop.spr_deep'))    return 'DEEP';
    return 'VERY_DEEP';
  },

  sprMsg(spr) {
    const z = this.sprZone(spr);
    const msgs = {
      COMMIT:    'SPR ≤'+this.g('postflop.spr_commit')+': COMPROMISO. TPTK = nuts.',
      CONTROL:   'SPR ≤'+this.g('postflop.spr_control')+': ZONA GRIS. Controla el bote.',
      DEEP:      'SPR ≤'+this.g('postflop.spr_deep')+': DEEP. Cuidado con raises.',
      VERY_DEEP: 'SPR > '+this.g('postflop.spr_deep')+': ZONA RIO. TPTK = basura vs presión.'
    };
    return msgs[z];
  },

  sprColor(spr) {
    const colors = { COMMIT:'#4ade80', CONTROL:'#fbbf24', DEEP:'#fb923c', VERY_DEEP:'#f87171' };
    return colors[this.sprZone(spr)] || '#94a3b8';
  },

  // ── PROFILES ──
  getProfiles() {
    try { return JSON.parse(localStorage.getItem(this.P_KEY)||'{}'); }
    catch(e) { return {}; }
  },

  saveProfile(name) {
    if (!this.cfg) this.init();
    const profs = this.getProfiles();
    const ranges = (() => {
      try { return JSON.parse(localStorage.getItem('apex_vp_ranges_v2')||'{}'); }
      catch(e) { return {}; }
    })();
    profs[name] = { config: JSON.parse(JSON.stringify(this.cfg)), ranges, savedAt: Date.now() };
    try { localStorage.setItem(this.P_KEY, JSON.stringify(profs)); return true; }
    catch(e) { return false; }
  },

  loadProfile(name) {
    const profs = this.getProfiles();
    if (!profs[name]) return false;
    const p = profs[name];
    if (p.config) {
      this.cfg = p.config;
      // Ensure all sections exist
      ['sizing','postflop','villain','exploits'].forEach(k => {
        this.cfg[k] = { ...JSON.parse(JSON.stringify(this.D[k])), ...(this.cfg[k]||{}) };
      });
      this.save();
    }
    if (p.ranges) {
      try { localStorage.setItem('apex_vp_ranges_v2', JSON.stringify(p.ranges)); } catch(e){}
      if (window.RangeDB) { window.RangeDB.db = null; window.RangeDB.init(); }
    }
    return true;
  },

  deleteProfile(name) {
    const profs = this.getProfiles();
    delete profs[name];
    try { localStorage.setItem(this.P_KEY, JSON.stringify(profs)); } catch(e){}
  },

  // ── EXPORT / IMPORT ──
  exportFull() {
    if (!this.cfg) this.init();
    const ranges = (() => {
      try { return JSON.parse(localStorage.getItem('apex_vp_ranges_v2')||'{}'); }
      catch(e) { return {}; }
    })();
    const players = (() => {
      try { return JSON.parse(localStorage.getItem('apex_player_db_v9')||'{}'); }
      catch(e) { return {}; }
    })();
    const payload = JSON.stringify({
      config:  this.cfg,
      ranges,
      players,
      version: 'APEX_V9',
      ts:      Date.now()
    }, null, 2);
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(payload);
    a.download = 'apex_full_config_' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
  },

  importFull(jsonStr) {
    try {
      const d = JSON.parse(jsonStr);
      if (d.config) {
        this.cfg = d.config;
        ['sizing','postflop','villain','exploits'].forEach(k => {
          this.cfg[k] = { ...JSON.parse(JSON.stringify(this.D[k])), ...(this.cfg[k]||{}) };
        });
        this.save();
      }
      if (d.ranges) { localStorage.setItem('apex_vp_ranges_v2', JSON.stringify(d.ranges)); }
      if (d.players) { localStorage.setItem('apex_player_db_v9', JSON.stringify(d.players)); }
      if (window.RangeDB) { window.RangeDB.db = null; window.RangeDB.init(); }
      if (window.PlayerDB) { window.PlayerDB.db = {}; window.PlayerDB.load(); }
      return true;
    } catch(e) { console.error('Import error', e); return false; }
  }
};

window.StrategyConfig.init();
