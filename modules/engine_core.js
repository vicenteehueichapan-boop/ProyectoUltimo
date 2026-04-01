// ============================================================
// APEX PREDATOR V9 — engine_core.js
// Bucle de 5 Fases: SPR → Textura → Sizing → MDA → Salida
// ============================================================
window.EngineCore = {

  // ───── Constantes de Rango ─────
  PM:    new Set(['AA','KK','QQ','JJ','AKs','AKo']),
  PUSH_RANGES: {
    UTG: new Set(['AA','KK','QQ','JJ','TT','99','AKs','AKo','AQs','AJs','ATs','KQs']),
    HJ:  new Set(['AA','KK','QQ','JJ','TT','99','88','AKs','AKo','AQs','AJs','ATs','A9s','KQs','KJs','AQo']),
    CO:  new Set(['AA','KK','QQ','JJ','TT','99','88','77','AKs','AKo','AQs','AJs','ATs','A9s','A8s','A5s','KQs','KJs','KTs','QJs','AQo','AJo','KQo']),
    BTN: new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','AKs','AKo','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','T9s','98s','87s','76s','65s','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','JTo']),
    SB:  new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','AKs','AKo','AQs','AJs','ATs','A9s','A8s','A5s','KQs','KJs','KTs','QJs','JTs','AQo','AJo','ATo','KQo','KJo']),
    BB:  new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','AKs','AKo','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','T9s','98s','87s','AQo','AJo','ATo','A9o','KQo','KJo','KTo'])
  },

  // ── StrategyConfig helper ──
  sc: function(path, fallback) {
    const v = window.StrategyConfig ? window.StrategyConfig.g(path) : undefined;
    return (v !== undefined && v !== null) ? v : fallback;
  },

  getRangeMap: function() { return {}; },

  getHeroKey: function(cards) {
    if (!cards||!cards[0]||!cards[1]) return null;
    const v={A:14,K:13,Q:12,J:11,T:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2};
    let c1=cards[0],c2=cards[1];
    if (v[c2.r]>v[c1.r]){let t=c1;c1=c2;c2=t;}
    if (c1.r===c2.r) return c1.r+c2.r;
    return c1.r+c2.r+(c1.s===c2.s?'s':'o');
  },

  // ───── MAIN PROCESS ─────
  process: function(state) {

    const bd  = (state.boardCards||[]).filter(Boolean);
    const nB  = bd.length;
    const street = nB===0?'PREFLOP':nB<=3?'FLOP':nB===4?'TURN':'RIVER';
    const pot    = Math.max(+state.pot||5, 1);
    const stack  = +state.stack||100;
    const facing = +state.facing||0;
    const pfBet  = +state.pfBet||3;
    const spr    = parseFloat((stack/pot).toFixed(1));

    // Villain profiles
    const {activeVillains, exploitHtml, vFlags} = this.analyzeVillains(state);

    // Build HTML output
    let html = '';

    if (street === 'PREFLOP') {
      html = this.processPreflop(state, pfBet, facing, stack, exploitHtml, vFlags);
    } else {
      html = this.processPostflop(state, street, bd, pot, stack, facing, spr, exploitHtml, vFlags);
    }

    return html;
  },

  // ───── VILLAIN ANALYSIS ─────
  analyzeVillains: function(state) {
    const active = [];
    const vFlags = {isWeak:false, isNit:false, isLAG:false, isFish:false, isStation:false, avgFold3b:0, fold3bCount:0};

    if (!state.seats||!state.actions) return {activeVillains:active, exploitHtml:'', vFlags};

    // Use SC thresholds (with fallback)
    const fishTh  = this.sc('villain.fishVPIP',  50);
    const nitTh   = this.sc('villain.nitVPIP',   12);
    const lagPFR  = this.sc('villain.lagPFR',    22);
    const lag3B   = this.sc('villain.lagThreeBet',10);
    const stWTSD  = this.sc('villain.stationWTSD',32);
    const stFC    = this.sc('villain.stationFoldCbet',35);

    for (let i=0;i<5;i++) {
      const seat = state.seats[i];
      if (!seat||!seat.name) continue;
      let folded=false;
      for (const st of ['pre','flop','turn','river'])
        if (state.actions[i]?.[st]==='fold'){folded=true;break;}
      if (folded) continue;

      const db = window.PlayerDB ? window.PlayerDB.get(seat.name) : null;
      const d  = db ? {...seat,...db} : seat;
      active.push(d);

      const vpip   = +d.vpip||0;
      const pfr    = +d.pfr||0;
      const threeb = +d.threeb||0;
      const fold3b = +d.fold3b||0;
      const wtsd   = +d.wtsd||0;
      const fcbet  = +d.foldCbet||0;

      if (fold3b > 0) { vFlags.avgFold3b += fold3b; vFlags.fold3bCount++; }
      if (vpip>fishTh||wtsd>stWTSD) { vFlags.isFish=true; }
      if (vpip>40||(fcbet>0&&fcbet<stFC)) { vFlags.isStation=true; }
      if (vpip<nitTh) { vFlags.isNit=true; }
      if (pfr>lagPFR||threeb>lag3B) { vFlags.isLAG=true; }
      if (vpip>28&&vpip<=50) { vFlags.isWeak=true; }
    }

    if (vFlags.fold3bCount>0) vFlags.avgFold3b=Math.round(vFlags.avgFold3b/vFlags.fold3bCount);

    const exOn = window.StrategyConfig ? window.StrategyConfig.g('exploits')||{} : {};
    let exploitHtml = '';
    active.forEach(d => {
      const vpip=+d.vpip||0, pfr=+d.pfr||0, threeb=+d.threeb||0, wtsd=+d.wtsd||0;
      const nm = `<span style="color:#f8fafc;font-weight:700">${d.name}</span>`;
      if ((exOn.fishValue!==false)&&(vpip>fishTh||wtsd>stWTSD)) {
        exploitHtml += `<div class="xp-badge fish">🎣 FISH ${nm} VPIP${vpip?vpip+'%':''} — Value thin siempre. NUNCA farolees.</div>`;
      } else if ((exOn.nitFold!==false)&&vpip>0&&vpip<nitTh) {
        exploitHtml += `<div class="xp-badge nit">🪨 NIT ${nm} VPIP${vpip}% — Si 3-bet tiene Nuts. Foldea top pair fácil.</div>`;
      } else if ((exOn.lagInduce!==false)&&(pfr>lagPFR||threeb>lag3B)) {
        exploitHtml += `<div class="xp-badge lag">🔥 LAG ${nm} 3B${threeb||'?'}% — Checkea strong. Induce bluffs.</div>`;
      } else if (vpip>=18&&vpip<=28&&threeb<5) {
        exploitHtml += `<div class="xp-badge reg">🧠 REG ${nm} VPIP${vpip}/PFR${pfr||'?'} — Juego estándar GTO.</div>`;
      }
    });

    return {activeVillains:active, exploitHtml, vFlags};
  },

  // ───── PREFLOP ENGINE ─────
  processPreflop: function(state, pfBet, facing, stack, exploitHtml, vFlags) {
    const k    = this.getHeroKey(state.heroCards);
    const pos  = state.heroPos||'BB';

    let adv = null;

    // ── Push/Fold < 20BB ──
    if (stack < 20) {
      const pRange = this.PUSH_RANGES[pos];
      if (k && pRange && pRange.has(k)) {
        adv = {ac:'ALL-IN 🚀 PUSH',cl:'R',sz:stack+'BB',why:`Push/Fold con ${stack}BB. Rango de push para ${pos}.`};
      } else {
        adv = {ac:'FOLD',cl:'F',sz:'',why:`Fuera de rango push ${pos} con ${stack}BB.`};
      }
    }

    if (!adv) {
      if (!k) { return this.buildAdvHTML('PREFLOP', {ac:'— Selecciona cartas —',cl:'K',sz:'',why:'Elige tus hole cards arriba.'}, exploitHtml, null, 0, 0); }

      let dC='open', eO=false, nA=0, hR=false, hCa=false, rPos=-1;
      const acts = state.actions||{};
      for (let i=0;i<5;i++) {
        const act=acts[i]?.pre;
        if (!act) continue;
        const p = state.posMap?.[i]||'';
        if (act==='3bet') { dC='3bet'; rPos=i; nA++; }
        else if (act==='open'||act==='raise') { if(dC!=='3bet') dC='raise'; rPos=i; hR=true; nA++; }
        else if (act==='call'||act==='limp') { if(dC==='open') dC='limpers'; hCa=true; nA++; }
      }

      // Resolver Escenario Exacto para RangeDB
      let scene = `RFI_${pos}`;
      const psName = state.posMap?.[rPos]||'UTG';
      if (dC === 'raise') {
        if (nA >= 2 && hR && hCa) scene = `SQZ_${pos}`;
        else scene = `vs${psName}_${pos}`;
      } else if (dC === '3bet') {
        scene = `${pos}_vs_3B`;
      }

      // Carga directa de la matriz de GTO interactiva
      if (window.RangeDB) {
        const rng = window.RangeDB.get(scene);
        if (rng && Object.keys(rng).length > 0) {
          const actChoice = rng[k];
          if (actChoice === 'R') {
            let sz = '';
            if (dC==='open'||dC==='limpers') {
               sz = this.sc('sizing.open'+pos, 2.5) + 'BB';
            } else if (dC==='raise') {
               if (nA >= 2 && hR && hCa) sz = Math.round(pfBet * this.sc('sizing.squeeze', 4)) + 'BB';
               else sz = Math.round(pfBet * (['SB','BB'].includes(pos) ? this.sc('sizing.threeBetOOP', 4.5) : this.sc('sizing.threeBetIP', 3.2))) + 'BB';
            } else if (dC==='3bet') {
               sz = Math.round(pfBet * this.sc('sizing.fourBet', 2.5)) + 'BB';
            }
            adv = {ac:dC==='open'?'OPEN RAISE 🚀':dC==='raise'?'3-BET VALOR 🚀':'4-BET / 5-BET 🚀', cl:'R', sz, why:`Dictado empíricamente por tu tabla (${scene}).`};
          }
          else if (actChoice === 'C') {
            adv = {ac:dC==='open'?'LIMP (Raro)':'CALL', cl:'C', sz:pfBet+'BB', why:`Pagar según tabla empírica (${scene}).`};
          }
          else {
            adv = {ac:'FOLD', cl:'F', sz:'', why:`Fuera de tabla empírica conectada (${scene}).`};
          }
        }
      }

      // CAÍDA A LÓGICA EMPÍRICA ANTIGUA (Si el usuario borró o no ha pintado la tabla)
      if (!adv) {
        const isOB  =['AKo','AQo','AJo','ATo','A9o','KQo','KJo','QJo','JTo'].includes(k);
        const isPP  =['22','33','44','55','66','77','88','99','TT','JJ','QQ','KK','AA'].includes(k);
        const isSC  =['54s','65s','76s','87s','98s','T9s','JTs','QJs','KQs'].includes(k);
        const isSA  =['A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs'].includes(k);
        const f3A   = vFlags.avgFold3b; const hLA = vFlags.isLAG; const vW = vFlags.isFish||vFlags.isWeak||vFlags.isStation; const vT = vFlags.isNit;

        if (dC==='3bet') {
          if(['AA','KK'].includes(k)) adv={ac:'4-BET / ALL-IN 🚀',cl:'R',sz:Math.round(pfBet*3)+'BB',why:'Premium. 4-bet siempre. No flat nunca AA/KK.'};
          else if(k==='AKs') adv={ac:'4-BET',cl:'R',sz:Math.round(pfBet*3)+'BB',why:'AKs. 4-bet valor. Domina rango 3-bet.'};
          else if(k==='QQ') adv={ac:'CALL 3-BET',cl:'C',sz:pfBet+'BB',why:'QQ. Call, evitar dominación por AA/KK.'};
          else if(k==='AKo') adv={ac:'CALL',cl:'C',sz:pfBet+'BB',why:'AKo. Flat para set-mine y extraer.'};
          else adv={ac:'FOLD',cl:'F',sz:'',why:'No aguanta 3-bet sin matriz editable configurada.'};
        }
        else if(dC==='raise') {
          if (hR&&hCa&&nA>=2) {
            const sqzSz = Math.round(pfBet * (nA + 2));
            if(this.PM.has(k)||['AKs','AQs','AJs','KQs'].includes(k)) adv={ac:'SQUEEZE 💥',cl:'R',sz:sqzSz+'BB',why:'Open+call. Squeeze dinámico.'};
            else if(['A5s','A4s','A3s'].includes(k)&&!vT) adv={ac:'SQUEEZE BLUFF',cl:'R',sz:sqzSz+'BB',why:'Blocker As. Squeeze bluff.'};
          }
          if (!adv) {
            if(this.PM.has(k)) adv={ac:'3-BET VALOR 🚀',cl:'R',sz:(['SB','BB'].includes(pos)?Math.round(pfBet*5.5):Math.round(pfBet*3.5))+'BB',why:'Premium. 3-bet siempre.'};
            else if(f3A>55&&['A2s','A3s','A4s','A5s'].includes(k)) adv={ac:'3-BET BLUFF',cl:'R',sz:Math.round(pfBet*4)+'BB',why:'Blockers As + fold equity alta.'};
            else if(['BTN','CO'].includes(pos)&&(isPP||isSC||isSA)) adv={ac:'CALL 🎯',cl:'C',sz:pfBet+'BB',why:'IP con posición. Extrae con sets.'};
            else adv={ac:'FOLD',cl:'F',sz:'',why:'OOP o marginal vs raise. Pinta la Matriz GTO primero.'};
          }
        }
        else if(dC==='limpers') {
          adv={ac:'ISO-RAISE 🎯',cl:'R',sz:((nA+2)*2.5).toFixed(0)+'BB',why:'Castiga limpers si tu rango lo permite.'};
        }
        else {
          adv={ac:'FOLD',cl:'F',sz:'',why:`Fuera de rango en backup de emergencia (Pinta la tabla: ${scene}).`};
        }
      }
    }

    return this.buildAdvHTML('PREFLOP', adv, exploitHtml, null, 0, 0);
  },

  // ───── POSTFLOP ENGINE ─────
  processPostflop: function(state, street, bd, pot, stack, facing, spr, exploitHtml, vFlags) {
    const ev  = window.EngineHand ? window.EngineHand.evHand(state.heroCards, bd) : null;
    const tex = window.EngineHand ? window.EngineHand.boardTexture(bd) : null;
    const textureKey = window.EngineTexture ? window.EngineTexture.classifyBoard(bd) : 'UNKNOWN';
    const stratFlop  = window.EngineStrategy?.DB[textureKey];
    const sprZone = window.StrategyConfig ? {
      zone:  window.StrategyConfig.sprZone(spr),
      color: window.StrategyConfig.sprColor(spr),
      msg:   window.StrategyConfig.sprMsg(spr)
    } : window.EngineStrategy?.SPR?.getZone(spr);

    const vW  = vFlags.isFish||vFlags.isStation||vFlags.isWeak;
    const vT  = vFlags.isNit;
    const vLA = vFlags.isLAG;
    const isMW= Object.values(state.actions||{}).filter(a=>a&&!Object.values(a).includes('fold')).length >= 2;

    let adv = null;
    const bsz  = facing > 0 ? facing : 0;
    const potOdds = bsz > 0 ? Math.round(bsz/(pot+bsz)*100) : 0;
    const isFB   = bsz > 0;
    const stL    = street.toLowerCase();

    if (!ev) {
      // Sin cartas del héroe: dar consejo de textura
      adv = stratFlop
        ? {ac:`${stratFlop.rec.freq}`, cl:'C', sz:stratFlop.rec.sz, why:stratFlop.reason||textureKey, hand:'Sin cartas seleccionadas'}
        : {ac:'CHECK / BET 33%', cl:'K', sz:'', why:'Selecciona tus cartas para análisis exacto.', hand:''};
      return this.buildAdvHTML(street, adv, exploitHtml, sprZone, potOdds, spr);
    }

    // ── FACING BET ──
    if (isFB) {
      adv = this.getCallFoldAction(ev, stL, bsz, pot, potOdds, spr, vW, vT, isMW, tex);
    }
    // ── WE BET / NO BET FACING ──
    else {
      adv = this.getBetAction(ev, stL, tex, textureKey, stratFlop, spr, pot, stack, vW, vT, vLA, isMW, bd);
    }

    return this.buildAdvHTML(street, adv, exploitHtml, sprZone, potOdds, spr);
  },

  // ───── CALL/FOLD vs Facing Bet ─────
  getCallFoldAction: function(ev, street, bsz, pot, potOdds, spr, vW, vT, isMW, tex) {
    const st=ev.st, nm=ev.nm, ot=ev.ot;
    const bszPct = pot>0 ? Math.round(bsz/pot*100) : 0;

    // ── FATAL GUARDS: Escudos de relatividad contra boards letales ──
    if (tex && bszPct > 45) {
      if (tex.isPaired && st < 7.0 && st >= 5.0) return {ac:'CAUTION / FOLD 🚨',cl:'F',sz:'',hand:nm,why:'Riesgo matemático de Full House. Tu '+nm+' corre peligro mortal vs agresión.'};
      if (tex.flushComplete && st < 6.0 && st >= 2.4 && ot < 9) return {ac:'FOLD 📉',cl:'F',sz:'',hand:nm,why:'Board completa COLOR (o Monótono). Rendir mano sin equity profunda.'};
      if (tex.minGap <= 1 && st < 5.0 && st >= 2.4) return {ac:'POT CONTROL / FOLD',cl:'F',sz:'',hand:nm,why:'Textura híper-conectada (peligro nativo de Escalera). Fold recomendado.'};
    }

    // Monsters: siempre raise/all-in
    if (st >= 7.0)  return {ac:'ALL-IN / RAISE 🚀',cl:'R',sz:'MAX',hand:nm,why:'Mano monster (Full+). Extrae el máximo absoluto.'};
    if (st >= 6.13) return {ac:'ALL-IN / RAISE 🚀',cl:'R',sz:'MAX',hand:nm,why:'Nut Flush. Vas por delante de su rango fuerte.'};
    if (st >= 6.0) {
      if (street==='river' && bszPct>80) return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'Color sin-nuts vs overbet.'};
      return {ac:'RAISE / CALL',cl:'R',sz:'2.5x',hand:nm,why:'Color (Flush). Sube por valor pero cuida de over-flushes.'};
    }
    if (st >= 5.0)  return {ac:'RAISE / CALL',cl:'R',sz:'2.5x',hand:nm,why:'Escalera. Extrae gran valor protegiendo equity.'};

    // Set: raise en flop/turn, call en river
    if (st >= 4.3) {
      if (street==='flop') return {ac:'RAISE 💥',cl:'R',sz:Math.round(bsz*3)+'BB',hand:nm,why:'Set en flop. Raise para proteger y construir bote.'};
      if (street==='turn') return {ac:'RAISE / CALL',cl:'R',sz:'2.5x',hand:nm,why:'Set en turn. Construir para river.'};
      return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'Set en river. No raise para mantener su rango de bluff.'};
    }

    // Trips
    if (st >= 3.8) return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'Trips. Call para mantener su rango amplio.'};

    // Combo draw fuerte
    if (ot >= 14) return {ac:'ALL-IN SEMI-BLUFF',cl:'R',sz:'MAX',hand:nm,why:`Combo draw ~50% equity. Presión máxima.`};

    // Two pair / Overpair
    if (st >= 3.5) {
      if (street==='river'&&bszPct>80&&!vW) return {ac:'FOLD 📉',cl:'F',sz:'',hand:nm,why:'River overbet vs rango honesto. Two pair pierde vs nuts.'};
      return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'Two pair / Overpair. EV positivo vs rango del rival.'};
    }

    // Overpair
    if (st >= 3.1) {
      if (street==='river'&&bszPct>50&&!vW) return {ac:'FOLD',cl:'F',sz:'',hand:nm,why:'Overpair river vs bet grande. Muy pocos bluffs.'};
      return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'Overpair. Precio justificado.'};
    }

    // TPTK
    if (st >= 2.65) {
      if (street==='river') {
        if (vW) return {ac:'CALL EXPLOIT 🎣',cl:'C',sz:bsz+'BB',hand:nm,why:'Fish bluffea más. TPTK +EV vs fish.'};
        return {ac:'FOLD (TPTK) 📉',cl:'F',sz:'',hand:nm,why:'NL micros no farolean river. TPTK pierde.'};
      }
      return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'TPTK flop/turn. Precio aceptable.'};
    }

    // Top pair standard
    if (st >= 2.4) {
      if (street==='river') return {ac:'FOLD',cl:'F',sz:'',hand:nm,why:'TP débil en river. Rango rival muy fuerte.'};
      if (potOdds < 28) return {ac:'CALL',cl:'C',sz:bsz+'BB',hand:nm,why:'TP con buen precio ('+potOdds+'% pot odds).'};
      return {ac:'FOLD',cl:'F',sz:'',hand:nm,why:'TP sin precio suficiente ('+potOdds+'% pot odds).'};
    }

    // Draws
    const dEq = ot * (street==='flop'?4:2);
    if (ot >= 8 && dEq >= potOdds) return {ac:'CALL DRAW 🎯',cl:'C',sz:bsz+'BB',hand:nm,why:`${ot} outs → ~${dEq}% vs ${potOdds}% pot odds. Precio correcto.`};
    if (ot >= 6 && dEq >= potOdds-5) return {ac:'CALL DRAW',cl:'C',sz:bsz+'BB',hand:nm,why:`${ot} outs → ~${dEq}% borderline.`};

    // River raise = FOLD (ley del river MDA)
    if (street==='river') return {ac:'FOLD 🚨',cl:'F',sz:'',hand:nm,why:'Ley del River: freq bluff rival < 8%. Overfold TPTK−.'};

    return {ac:'FOLD',cl:'F',sz:'',hand:nm,why:`Insuficiente. ${ot} outs → ~${dEq}% vs ${potOdds}%.`};
  },

  // ───── BET ACTION (no facing bet) ─────
  getBetAction: function(ev, street, tex, textureKey, stratFlop, spr, pot, stack, vW, vT, vLA, isMW, bd) {
    const st=ev.st, nm=ev.nm, ot=ev.ot;
    const SC = window.StrategyConfig;
    const sprZoneKey = SC ? SC.sprZone(spr) : (spr>10?'VERY_DEEP':spr>6?'DEEP':spr>3?'CONTROL':'COMMIT');
    let szCF  = this.sc('sizing.cbetFlop',33);
    let szCT  = this.sc('sizing.cbetTurn',66);
    let szCR  = this.sc('sizing.cbetRiver',75);
    const szOB  = this.sc('sizing.overbetTurn',125);
    const blOn  = this.sc('postflop.bluffRiverOn',true);
    const brOn  = this.sc('postflop.barrelOn',true);
    const aggr  = this.sc('postflop.aggression',60);
    const fDry  = this.sc('postflop.freqCbetDry',100);
    const fWet  = this.sc('postflop.freqCbetWet',66);
    const fMono = this.sc('postflop.freqCbetMono',40);

    // ── NÚCLEO EXPLOTATIVO (MALICIOUS MULTIPLIERS MDA) ──
    if (!isMW) {
       if (st >= 4.3 && vW) { szCF += 20; szCT += 15; szCR += 10; } 
       if (st < 2.4 && vT)  { szCF -= 10; szCT -= 15; szCR -= 15; } 
       szCF = Math.max(szCF, 20); szCT = Math.max(szCT, 25);
    }

    const pct   = v => `${Math.round(v)}%`;

    // ── RIVER ──
    if (street==='river') {
      if (st >= 7.0) return {ac:'OVERBET 💥',cl:'R',sz:spr<=2?'ALL-IN':pct(szOB),hand:nm,why:'Monstruo en river (Full+).'};
      if (st >= 6.13) return {ac:'OVERBET 💥',cl:'R',sz:spr<=2?'ALL-IN':'125%',hand:nm,why:'Nut Flush. Polariza tu rango al máximo.'};
      if (st >= 6.0) return {ac:'BET VALOR',cl:'R',sz:vW?pct(szCR+5):pct(szCR),hand:nm,why:'Color medio/bajo. Bet sizing estándar.'};
      if (st >= 5.0) return {ac:'BET VALOR',cl:'R',sz:pct(szCR),hand:nm,why:'Escalera fuerte.'};
      if (st >= 4.3) return {ac:'BET VALOR',cl:'R',sz:vW?pct(szCR+5):pct(szCR),hand:nm,why:'Set+. Value fuerte.'};
      if (st >= 3.0) return {ac:'BET VALOR',cl:'R',sz:pct(Math.round(szCR*0.67)),hand:nm,why:'Two pair+. Value bet.'};
      if (st >= 2.65) return {ac:`VALUE BET ${vW?'75%':'40%'}`,cl:'R',sz:vW?pct(Math.round(szCR*0.9)):pct(Math.round(szCR*0.53)),hand:nm,why:vW?'Fish paga thin.':'TPTK. Bet fino.',note:vW?'⚡ Fish activo: value thin.':''};
      if (st >= 2.4) return {ac:vW?'BET FINO':'CHECK',cl:vW?'R':'K',sz:vW?'33%':'',hand:nm,why:vW?'Fish paga débil.':'TP débil. Showdown value > bet.'};
      if (ot===0&&!vW&&!isMW) return {ac:'BLUFF 🎭',cl:'R',sz:blOn?pct(szCR):'',hand:nm,why:'Draw falló. Buena posición para bluff.',note:'⚠️ NUNCA vs Fish. Solo vs regulares.'};
      return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Sin equity. Control de bote.'};
    }

    // ── TURN ──
    if (street==='turn') {
      const turnCard = bd[3];
      const tc = turnCard ? window.EngineHand?.classifyTurnCard(turnCard, bd.slice(0,3)) : null;

      if (st >= 7.0) return {ac:'OVERBET 💥',cl:'R',sz:sprZoneKey==='VERY_DEEP'?pct(szOB):'ALL-IN',hand:nm,why:'Monstruo (Full+). Extraer máximo deep.'};
      if (st >= 6.13) return {ac:'OVERBET 💥',cl:'R',sz:sprZoneKey==='VERY_DEEP'?'100%':'ALL-IN',hand:nm,why:'Nut flush turn. Línea pilar para stackear.'};
      if (st >= 6.0) return {ac:'BET FUERTE',cl:'R',sz:pct(szCT+9),hand:nm,why:'Color en turn.'};
      if (st >= 5.0) return {ac:'BET FUERTE',cl:'R',sz:sprZoneKey==='VERY_DEEP'?'100%':pct(szCT+9),hand:nm,why:'Escalera turn. Construir bote.'};
      if (st >= 4.3) return {ac:'BET FUERTE',cl:'R',sz:sprZoneKey==='VERY_DEEP'?'100%':pct(szCT),hand:nm,why:'Set turn. Construir bote.'};
      if (st >= 3.0) return {ac:'BET',cl:'R',sz:pct(szCT),hand:nm,why:'Two pair+. Denegar equity y construir.'};
      if (st >= 2.65) return {ac:'BET VALOR',cl:'R',sz:pct(Math.round(szCT*0.76)),hand:nm,why:'TPTK turn. Value y protección.'};
      if (st >= 2.4) return {ac:'BET',cl:'R',sz:pct(Math.round(szCT*0.61)),hand:nm,why:'Top pair. Value fino en turn.'};

      // Scare card barrel
      if (tc&&(tc.isOvercard||tc.isAce||tc.isKing)&&st<2.0&&!vW) {
        return {ac:'BARREL BLUFF 🎭',cl:'R',sz:brOn?pct(szCT):'',hand:nm,why:`${tc.isAce?'As':tc.isKing?'Rey':'Overcard'} de turn: scare card. Presión.`};
      }
      if (ot >= 12) return {ac:'SEMI-BLUFF DRAW',cl:'R',sz:pct(szCT),hand:nm,why:`${ot} outs combo. Semi-bluff fuerte.`};
      if (ot >= 8)  return {ac:'SEMI-BLUFF',cl:'R',sz:pct(Math.round(szCT*0.76)),hand:nm,why:`${ot} outs. Draw fuerte.`};
      return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Control de bote. Sin equity suficiente.'};
    }

    // ── FLOP ──
    if (street==='flop') {
      if (!tex) return {ac:'BET 33%',cl:'R',sz:'33%',hand:nm,why:'Flop default.'};

      // Monotone
      if (tex.isMonotone) {
        if (st >= 6.13) return {ac:'BET VALOR',cl:'R',sz:pct(szCF),hand:nm,why:'Nut Flush en monotone. C-bet pequeña para mantener rangos amplios.'};
        if (st >= 6.0)  return {ac:'CHECK / CALL',cl:'K',sz:'',hand:nm,why:'Flush débil en monotone. Control de bote súper necesario.'};
        if (st >= 5.0)  return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Escalera en monotone es marginal. Jugar pasivo.'};
        if (ev.dr.some(d=>d.n.includes('Flush'))) return {ac:'SEMI-BLUFF',cl:'R',sz:pct(szCF),hand:nm,why:'FD en monotone. Semi-bluff.'};
        return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Monotone sin palo. Muy peligroso.'};
      }

      // Usar frecuencia/sizing del DB de texturas
      if (stratFlop) {
        const freq = stratFlop.rec.freq;
        const szDB = stratFlop.rec.sz;
        // Map DB sizing strings → SC user config values
        let sz;
        const szN = parseFloat(szDB);
        if(szDB==='Range Check'||szDB==='-') sz='';
        else if(!isNaN(szN)&&szN<=35) sz=pct(szCF);
        else if(!isNaN(szN)&&szN<=55) sz=pct(Math.round(szCF*1.5));
        else if(!isNaN(szN)&&szN<=80) sz=pct(szCF+33);
        else if(!isNaN(szN)&&szN<=105) sz=pct(100);
        else if(szDB.includes('OVERBET')||szDB.includes('125')) sz=pct(szOB);
        else if(szDB.includes('33')||szDB.includes('25')) sz=pct(szCF);
        else sz=pct(szCF);
        const betFreq = parseFloat(freq.split('/')[0]) || (freq.includes('%') ? parseFloat(freq) : 50);
        const adjFreq = Math.min(100, betFreq * (aggr / 60));

        if (adjFreq >= 70) {
          // Alta frecuencia de bet
          if (st >= 2.4) return {ac:'BET VALOR',cl:'R',sz:sz,hand:nm,why:`${freq} freq. ${stratFlop.reason||''}`};
          if (ot >= 8)   return {ac:'SEMI-BLUFF',cl:'R',sz:sz,hand:nm,why:`Draw fuerte. ${freq} freq en este board.`};
          return {ac:'BET 🎭',cl:'R',sz:sz,hand:nm,why:`Range bet en este tablero. ${stratFlop.reason||''}`};
        } else {
          // Frecuencia mixta → usar fuerza de mano
          if (st >= 7.0) return {ac:'OVERBET 💥',cl:'R',sz:pct(szOB),hand:nm,why:'Monstruo.'};
          if (st >= 6.0) return {ac:'BET FUERTE',cl:'R',sz:'100%',hand:nm,why:'Color flopeado. Sizing agresivo.'};
          if (st >= 5.0) return {ac:'BET FUERTE',cl:'R',sz:pct(Math.min(szCF+47,100)),hand:nm,why:'Escalera flopeada.'};
          if (st >= 4.3) return {ac:'BET FUERTE',cl:'R',sz:pct(Math.min(szCF+47,100)),hand:nm,why:'Set. Construir bote.'};
          if (st >= 3.5) return {ac:'BET',cl:'R',sz:sz,hand:nm,why:`Two pair+. ${freq} freq.`};
          if (st >= 2.4) {
            if (tex.isWet) return {ac:'BET',cl:'R',sz:sz,hand:nm,why:'TP en board húmedo. Denegar equity.'};
            return {ac:'BET',cl:'R',sz:sz,hand:nm,why:`TP. ${freq} freq en este tablero.`};
          }
          if (ot >= 12)  return {ac:'SEMI-BLUFF FUERTE',cl:'R',sz:sz,hand:nm,why:`Combo draw ${ot} outs.`};
          if (ot >= 8)   return {ac:'SEMI-BLUFF',cl:'R',sz:sz,hand:nm,why:`Draw ${ot} outs.`};
          return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:`Rango débil. Check en ${freq} freq board.`};
        }
      }

      // Fallback por textura genérica
      if (tex.isDry) {
        if (st >= 2.4) return {ac:'BET',cl:'R',sz:pct(szCF),hand:nm,why:'Board seco. C-bet pequeña eficiente.'};
        if (ot >= 8)   return {ac:'SEMI-BLUFF',cl:'R',sz:pct(szCF),hand:nm,why:'Draw en board seco.'};
        return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Board seco. Sin equity.'};
      }
      if (tex.isWet) {
        if (st >= 3.5) return {ac:'BET',cl:'R',sz:pct(szCF+42),hand:nm,why:'Mano fuerte. Board húmedo. Denegar equity.'};
        if (st >= 2.4) return {ac:'BET',cl:'R',sz:pct(szCF+17),hand:nm,why:'TP board húmedo.'};
        if (ot >= 12)  return {ac:'SEMI-BLUFF',cl:'R',sz:pct(szCF+33),hand:nm,why:'Combo draw board húmedo.'};
        if (ot >= 8)   return {ac:'SEMI-BLUFF',cl:'R',sz:pct(szCF+17),hand:nm,why:'Draw fuerte.'};
        return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Board húmedo sin equity.'};
      }
      if (st >= 2.4)  return {ac:'BET',cl:'R',sz:pct(szCF+7),hand:nm,why:'TP+ value.'};
      if (ot >= 8)    return {ac:'SEMI-BLUFF',cl:'R',sz:pct(szCF+12),hand:nm,why:'Draw.'};
      return {ac:'CHECK',cl:'K',sz:'',hand:nm,why:'Sin equity suficiente.'};
    }

    return {ac:'CHECK',cl:'K',sz:'',hand:nm||'',why:'Default: check.'};
  },

  // ───── HTML BUILDER ─────
  buildAdvHTML: function(street, adv, exploitHtml, sprZone, potOdds, spr) {
    const C = {
      R:{border:'#16a34a',bg:'rgba(22,163,74,0.08)',acc:'#4ade80',lbl:'#86efac'},
      C:{border:'#2563eb',bg:'rgba(37,99,235,0.08)',acc:'#60a5fa',lbl:'#93c5fd'},
      F:{border:'#dc2626',bg:'rgba(220,38,38,0.08)',acc:'#f87171',lbl:'#fca5a5'},
      K:{border:'#475569',bg:'rgba(71,85,105,0.08)',acc:'#94a3b8',lbl:'#cbd5e1'}
    };
    const c = C[adv.cl]||C.K;

    let h = `<div style="border:2px solid ${c.border};background:${c.bg};border-radius:12px;padding:16px;">`;
    h += `<div style="font-size:10px;font-weight:800;color:${c.lbl};letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">${street}</div>`;
    h += `<div style="font-size:22px;font-weight:900;color:${c.acc};line-height:1.1;margin-bottom:4px">${adv.ac}</div>`;
    if (adv.sz) h += `<div style="font-size:13px;font-weight:700;color:${c.lbl};margin-bottom:8px">${adv.sz}</div>`;
    if (adv.hand) h += `<div style="font-size:12px;font-weight:700;color:#f1f5f9;margin-bottom:6px">🃏 ${adv.hand}</div>`;
    h += `<div style="font-size:12px;color:#cbd5e1;line-height:1.5">${adv.why}</div>`;

    // SPR + Pot Odds chips
    if (street !== 'PREFLOP') {
      h += `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">`;
      if (sprZone) {
        h += `<span style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;background:rgba(0,0,0,0.3);color:${sprZone.color}">SPR ${spr}</span>`;
      }
      if (potOdds > 0) {
        h += `<span style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;background:rgba(0,0,0,0.3);color:#fbbf24">Pot Odds ${potOdds}%</span>`;
      }
      if (sprZone) {
        h += `<span style="font-size:10px;font-weight:600;padding:4px 10px;border-radius:20px;background:rgba(0,0,0,0.2);color:#94a3b8">${sprZone.msg}</span>`;
      }
      h += `</div>`;
    }

    if (adv.note) h += `<div style="font-size:11px;padding:8px 10px;background:rgba(255,255,255,0.05);border-radius:6px;margin-top:8px;color:#fbbf24">${adv.note}</div>`;

    // Exploit HTML
    if (exploitHtml) {
      h += `<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.07);padding-top:10px">`;
      h += `<div style="font-size:9px;font-weight:800;color:#fbbf24;letter-spacing:.1em;margin-bottom:6px">EXPLOIT ACTIVO</div>`;
      h += exploitHtml;
      h += `</div>`;
    }

    h += `</div>`;
    return h;
  }
};
