// ============================================================
// APEX PREDATOR V9 — engine_hand.js
// Evaluador de Mano Completo: evHand, boardTexture, classifyTurnCard
// ============================================================
window.EngineHand = {
  RV: {A:14,K:13,Q:12,J:11,T:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2},

  // ─────────────────────────────────────────────────────────
  // evHand(heroCards, boardCards)
  // Retorna { tp, nm, st, dr, ot }
  // st = fuerza numérica (0–9+), dr = draws activos, ot = outs
  // ─────────────────────────────────────────────────────────
  evHand: function(heroCards, boardCards) {
    const RV = this.RV;
    const hl = (heroCards  || []).filter(Boolean);
    const bd = (boardCards || []).filter(Boolean);
    const all = [...hl, ...bd];
    if (all.length < 2) return null;

    const vl = all.map(c => RV[c.r]);
    const su = all.map(c => c.s);

    // Conteos
    const rc = {}, sc = {};
    vl.forEach(v => rc[v] = (rc[v]||0)+1);
    su.forEach(s => sc[s] = (sc[s]||0)+1);

    const sR   = Object.entries(rc).sort((a,b)=> b[1]-a[1] || +b[0]-+a[0]);
    const cn   = sR.map(e => e[1]);
    const mS   = Math.max(...Object.values(sc));
    const uv   = [...new Set(vl)].sort((a,b)=>b-a);
    if(uv.includes(14)) uv.push(1); // Support para Wheel

    // Escalera check
    let hSt = false;
    for (let i=0; i<=uv.length-5; i++)
      if (uv[i]-uv[i+4]===4){hSt=true;break;}

    const hFl = mS >= 5;

    // ── Clasificación de mano ──
    let tp, nm, st;
    if (hFl && hSt)       { tp='sf';   nm='Escalera color';      st=9.0; }
    else if (cn[0]===4)   { tp='qd';   nm='Poker';               st=8.0; }
    else if (cn[0]===3 && cn[1]>=2) { tp='fh'; nm='Full house';  st=7.0; }
    else if (hFl) { 
      tp='fl'; nm='Color'; st=6.0; 
      const fSuit = Object.keys(sc).find(s => sc[s] >= 5);
      const hfCards = hl.filter(c => c.s === fSuit).map(c => RV[c.r]);
      if (hfCards.length) st += Math.max(...hfCards) / 100; // Relatividad de color (ej. 6.14 Nut Flush)
    }
    else if (hSt)         { tp='sj';   nm='Escalera';            st=5.0; }
    else if (cn[0]===3) {
      const tv   = +sR[0][0];
      const hv2  = hl.map(c=>RV[c.r]);
      if (hv2.filter(v=>v===tv).length >= 2) { tp='set'; nm='Set';   st=4.3; }
      else                                   { tp='trip';nm='Trips'; st=3.8; }
    }
    else if (cn[0]===2 && cn[1]===2) {
      const pV  = sR.filter(e=>e[1]===2).map(e=>+e[0]).sort((a,b)=>b-a);
      const hv2 = hl.map(c=>RV[c.r]);
      const bv2 = bd.map(c=>RV[c.r]).sort((a,b)=>b-a);
      const tB  = bv2[0]||0, sB = bv2[1]||0;
      tp='2p';
      if      (hv2[0]===hv2[1] && pV[0]>tB)    { nm='Overpair + pares';  st=3.7; }
      else if (pV[0]===tB && pV[1]===sB)         { nm='Top two pair';      st=3.5; }
      else if (pV[0]===tB)                        { nm='Top + bottom pair'; st=3.2; }
      else                                        { nm='Doble par bajo';    st=3.0; }
    }
    else if (cn[0]===2) {
      const pv  = +sR[0][0];
      const hv2 = hl.map(c=>RV[c.r]);
      const bv2 = bd.map(c=>RV[c.r]);
      const tB  = bv2.length ? Math.max(...bv2) : 0;
      if (hv2.includes(pv)) {
        if (!bv2.length)   { tp='pk'; nm='Pocket pair';   st=2.8; }
        else if (pv > tB)  { tp='op'; nm='Overpair';      st=3.1; }
        else if (pv === tB) {
          const kk = hv2.find(v=>v!==pv)||0;
          tp='tp';
          if (kk>=14)      { nm='Top pair (kicker As)';   st=2.75;}
          else if (kk>=12) { nm='Top pair (kicker top)';  st=2.65;}
          else             { nm='Top pair';               st=2.4; }
        } else {
          const sBv = [...bv2].sort((a,b)=>b-a);
          if (sBv.length>=2 && pv===sBv[1]){ tp='sp'; nm='Second pair';  st=2.0; }
          else                              { tp='lp'; nm='Par bajo';     st=1.5; }
        }
      } else { tp='bp'; nm='Par del tablero'; st=0.8; }
    }
    else { tp='hi'; nm='Carta alta'; st=0.0; }

    // ── Draws ──
    const hs   = hl.map(c=>c.s);
    const hv   = hl.map(c=>RV[c.r]);
    const bv   = bd.map(c=>RV[c.r]);
    const dr   = [];
    let ot     = 0;
    const bSC  = {};
    bd.forEach(c => bSC[c.s] = (bSC[c.s]||0)+1);
    const mBS  = bd.length ? Math.max(...Object.values(bSC)) : 0;

    if (bd.length > 0 && bd.length < 5) {
      let hasFD = false;
      // ── Flush draws ──
      if (st < 6) {
        // Nut/strong FD: ambas cartas del héroe del mismo palo con 2+ en tablero
        if (hs.length===2 && hs[0]===hs[1] && (bSC[hs[0]]||0)>=2) {
          dr.push({n:'Flush draw',o:9}); ot=9; hasFD=true;
        }
        // FD con una carta del héroe
        if (!hasFD) {
          for (const hc of hl) {
            if ((bSC[hc.s]||0)>=3) {
              dr.push({n:'FD (1 carta)',o:9}); ot=Math.max(ot,9); hasFD=true; break;
            }
          }
        }
        // Backdoor FD (solo en flop, bd.length<=3)
        if (!hasFD && bd.length<=3) {
          for (const hc of hl) {
            const tot = (hs.filter(s=>s===hc.s).length) + (bSC[hc.s]||0);
            if (tot===3) { dr.push({n:'Backdoor FD',o:1.5}); ot=Math.max(ot,1.5); break; }
          }
        }
      }
      // ── Straight draws ──
      if (st < 5) {
        const av = [...new Set([...hv,...bv])].sort((a,b)=>a-b);
        if (av.includes(14)) av.unshift(1); // Support para Wheel
        let fO   = false;
        // OESD
        for (let i=0; i<=av.length-4; i++) {
          const sl = av.slice(i,i+4);
          if (sl[3]-sl[0]===3) {
            const isAKQJ = sl[3] === 14 && sl[0] === 11;
            const isA234 = sl[3] === 4  && sl[0] === 1;
            if (!isAKQJ && !isA234) {
              const outs = mBS>=3 ? 6 : 8;
              dr.push({n:'OESD',o:outs}); ot=Math.max(ot,outs); fO=true; break;
            }
          }
        }
        // Gutshot (incluye AKQJ y A234)
        if (!fO) {
          for (let i=0; i<=av.length-4; i++) {
            const sl = av.slice(i,i+4);
            const span = sl[3]-sl[0];
            const isAKQJ = span === 3 && sl[3]===14 && sl[0]===11;
            const isA234 = span === 3 && sl[3]===4 && sl[0]===1;
            if (span === 4 || isAKQJ || isA234) {
              const outs = mBS>=3 ? 3 : 4;
              const name = isAKQJ ? 'Gutshot Supremo' : isA234 ? 'Gutshot Wheel' : 'Gutshot';
              dr.push({n:name,o:outs}); ot=Math.max(ot,outs); break;
            }
          }
        }
      }
      // ── Combo draw ──
      if (hasFD) {
        const oesd = dr.find(d=>d.n==='OESD');
        const gut  = dr.find(d=>d.n==='Gutshot');
        if (oesd) {
          ot = 9 + oesd.o;
          dr.push({n:'COMBO DRAW (FD+OESD)',o:ot});
          if (st < 4.3) st = ot>=14 ? 4.5 : 3.5;
        } else if (gut) {
          ot = 9 + gut.o;
          dr.push({n:'COMBO (FD+Gut)',o:ot});
          if (st < 3.5) st = 3.5;
        }
      }
    }
    return { tp, nm, st, dr, ot };
  },

  // ─────────────────────────────────────────────────────────
  // boardTexture(boardCards)
  // Retorna objeto con propiedades de textura del tablero
  // ─────────────────────────────────────────────────────────
  boardTexture: function(boardCards) {
    const RV = this.RV;
    if (!boardCards || boardCards.length < 3) return null;
    const cards = boardCards.filter(Boolean);
    const vals  = cards.map(c=>RV[c.r]).sort((a,b)=>b-a);
    const suits = cards.map(c=>c.s);
    const sC = {};
    suits.forEach(s=>sC[s]=(sC[s]||0)+1);
    const mxS = Math.max(...Object.values(sC));
    const gaps = [];
    for (let i=0;i<vals.length-1;i++) gaps.push(vals[i]-vals[i+1]);
    const mnG  = gaps.length ? Math.min(...gaps) : 99;
    const nBW  = vals.filter(v=>v>=10).length;
    const isPaired = vals.length > new Set(vals).size;
    return {
      highCard:      vals[0],
      vals,
      isMonotone:    mxS >= 3,
      isTwoTone:     mxS === 2,
      isRainbow:     mxS === 1,
      isPaired,
      isDry:         mxS <= 1 && mnG >= 3 && nBW <= 1,
      // isWet: twotone+connected OR low/mid rainbow (vals[0]<12) with tight gaps
      // AK7r is DRY (broadway rainbow). 987r is WET (low connected rainbow).
      isWet:         (mxS >= 2 && mnG <= 2) || (mxS === 1 && mnG <= 1 && vals[0] < 12),
      isHighBoard:   vals[0] >= 12 && (vals[1]||0) >= 10,
      isLowBoard:    vals[0] <= 9,
      numBroadway:   nBW,
      minGap:        mnG,
      hasFD:         mxS >= 2 && cards.length <= 4,
      flushComplete: mxS >= 3 && cards.length >= 4,
      maxSuit:       mxS
    };
  },

  // ─────────────────────────────────────────────────────────
  // classifyTurnCard(turnCard, flopCards)
  // Retorna propiedades de la carta de turn
  // ─────────────────────────────────────────────────────────
  classifyTurnCard: function(turnCard, flopCards) {
    const RV = this.RV;
    if (!turnCard || !flopCards || flopCards.length < 3) return null;
    const tv   = RV[turnCard.r];
    const fv   = flopCards.filter(Boolean).map(c=>RV[c.r]).sort((a,b)=>b-a);
    const fSC  = {};
    flopCards.filter(Boolean).forEach(c=>fSC[c.s]=(fSC[c.s]||0)+1);
    const completesFlush = (fSC[turnCard.s]||0) >= 2;
    const completesStrait = (()=>{
      const av = [...new Set([...fv,tv])].sort((a,b)=>a-b);
      if (av.includes(14)) av.unshift(1); // Support para wheel
      const tvVals = tv === 14 ? [14, 1] : [tv];
      // Full 5-card straight (river context)
      for (let i=0;i<=av.length-5;i++)
        if (av[i+4]-av[i]===4) return true;
      // 4-card sequence including turn card = straight IS possible con 1 carta de hero
      for (let i=0;i<=av.length-4;i++){
        const sl=av.slice(i,i+4);
        if (sl[3]-sl[0]===3 && tvVals.some(v=>sl.includes(v))) return true;
      }
      return false;
    })();
    return {
      val:            tv,
      isOvercard:     tv > fv[0],
      isSecondOvercard: tv > fv[1] && tv <= fv[0],
      completesFlush,
      completesStrait,
      pairsBoard:     fv.includes(tv),
      // Brick = no overcard, doesn't pair, doesn't complete flush or straight
      isBrick:        tv < fv[0] && !fv.includes(tv) && !completesFlush && !completesStrait,
      isBroadway:     tv >= 10,
      isAce:          tv === 14,
      isKing:         tv === 13,
      isDynamic:      completesFlush || completesStrait || (tv >= 10 && fv[0] >= 10),
    };
  }
};
