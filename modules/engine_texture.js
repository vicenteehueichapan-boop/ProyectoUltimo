// ============================================================
// APEX PREDATOR V9 — engine_texture.js
// Clasificador de Texturas del Tablero (30+ firmas exactas)
// ============================================================
window.EngineTexture = {
  classifyBoard: function(cards) {
    if (!cards || cards.length < 3) return "UNKNOWN";
    const ranks = {A:14,K:13,Q:12,J:11,T:10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2};
    const sorted = [...cards].filter(Boolean).sort((a,b)=>ranks[b.r]-ranks[a.r]);
    const r1=sorted[0].r, r2=sorted[1].r, r3=sorted[2].r;
    let suits={};
    cards.filter(Boolean).forEach(c=>suits[c.s]=(suits[c.s]||0)+1);
    const maxSuit=Math.max(...Object.values(suits));
    const isMono=maxSuit>=3, isTwotone=maxSuit===2, isRainbow=maxSuit===1;
    const sfx=isMono?'m':isTwotone?'s':'r';
    const sig=r1+r2+r3+sfx;
    const rk=r=>ranks[r]||0;

    // ── Boards doblados específicos ──
    if (r1===r2){
      if (r1==='A' && rk(r3)<=6) return "AA_low";
      if (r1==='A' && rk(r3)>=7 && rk(r3)<=9) return "AA_mid";
      if (r1==='K') return "KK_low";
      if (r1==='Q') return "QQ_low";
    }
    if (r2===r3){
      if (r1==='A' && rk(r2)>=7 && rk(r2)<=9) return "A77-A99";
      if (r1==='A' && rk(r2)<7) return "A22-A66";
    }

    // ── Firmas exactas de estrategia.txt ──
    const exact={
      'AQQs':'AQQs','AQQr':'AQQr','A33r':'A33r','AKKs':'AKKs','AK6s':'AK6s',
      'AJTs':'AJTs','A83r':'A83r','A23r':'A23r','AJ5r':'AJ5r',
      'K83r':'K83r','K83s':'K83s','KJ3r':'KJ3r','KJ3s':'KJ3s','KJ8s':'KJ8s',
      'KQTr':'KQT','KQTs':'KQT','KT2m':'KT2m',
      'Q73r':'Q73r','J73r':'J73r','J54s':'J54s','JT9s':'JT9s',
      'T72r':'T72r','T72s':'T72s','T92s':'T92s','T87s':'T87s',
      '982s':'982s','952s':'952s','862r':'862r','992r':'992r','992s':'992s',
      '755s':'755s','765s':'765s','874r':'874','874s':'874','732r':'732r'
    };
    if (exact[sig]) return exact[sig];

    // ── Fallbacks inteligentes ──
    if (r1===r2||r2===r3) return "PAIRED";
    if (r1==='A')  return "A_HIGH_"+(isTwotone?'WET':'DRY');
    if (r1==='K')  return "K_HIGH_"+(isTwotone?'WET':'DRY');
    if (r1==='Q'||r1==='J') return "BROADWAY_"+(isTwotone?'WET':'DRY');
    if (ranks[r1]<=9&&ranks[r1]>=6) return isTwotone?"MID_COORDINATED_WET":"MID_COORDINATED";
    if (ranks[r1]<=5) return "LOW_BOARD";
    return "UNKNOWN_BOARD";
  }
};
