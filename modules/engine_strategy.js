// ============================================================
// APEX PREDATOR V9 — engine_strategy.js
// Base de Conocimiento: GTO Frequencies, Sizings, Turn Scenarios
// Basado en estrategia.txt + TÁCTICA_POSTFLOP + SISTEMA_OPERATIVO
// ============================================================
window.EngineStrategy = {

  // ── FLOP: Frecuencias y Sizings por textura ──
  DB: {
    "AA_low":  {desc:"AA + carta baja",    rec:{freq:"100%",    sz:"33%"},   reason:"Nut advantage total. Range bet obligatorio."},
    "AA_mid":  {desc:"AA + carta media",   rec:{freq:"100%",    sz:"33%"},   reason:"Ventaja sigue siendo alta. Range bet."},
    "A77-A99": {desc:"As + par medio",     rec:{freq:"60/40",   sz:"33%"},   reason:"Rival conecta más con 77-99. Baja ventaja."},
    "A22-A66": {desc:"As + par bajo",      rec:{freq:"70/30",   sz:"33%"},   reason:"Nut advantage pero rival menos conectado."},
    "AQQs":    {desc:"AQQ twotone",        rec:{freq:"40/60",   sz:"125% OVERBET"}, reason:"Polarización extrema. Denegar equity FD."},
    "AQQr":    {desc:"AQQ rainbow",        rec:{freq:"60/40",   sz:"33%"},   reason:"Sin FD, menos urgencia de overbet."},
    "A33r":    {desc:"A33 rainbow",        rec:{freq:"30/70",   sz:"33%"},   reason:"Baja conectividad del rival."},
    "AKKs":    {desc:"AKK twotone",        rec:{freq:"50/50",   sz:"33%"},   reason:"FD presente, mezcla."},
    "AK6s":    {desc:"AK6 twotone",        rec:{freq:"50/50",   sz:"125% OVERBET"}, reason:"6 añade textura polar. Overbet filtra."},
    "AJTs":    {desc:"AJT twotone",        rec:{freq:"80/20",   sz:"100%"},  reason:"Board muy coordinado. High freq. Denegar draws."},
    "A83r":    {desc:"A83 rainbow",        rec:{freq:"40/60",   sz:"33%"},   reason:"Board seco. Baja frecuencia."},
    "A23r":    {desc:"A23 rainbow",        rec:{freq:"40/60",   sz:"125%"},  reason:"Board polarizado. Overbet por conectividad baja."},
    "AJ5r":    {desc:"AJ5 rainbow",        rec:{freq:"40/60",   sz:"125%"},  reason:"Overbet filtra basura. Solo pagan Ax fuertes."},
    "KK_low":  {desc:"KK + carta baja",    rec:{freq:"100%",    sz:"33%"},   reason:"Nut advantage en KK boards."},
    "QQ_low":  {desc:"QQ + carta baja",    rec:{freq:"80%",     sz:"33%"},   reason:"Ventaja de rango alta."},
    "K83r":    {desc:"K83 rainbow",        rec:{freq:"100%",    sz:"33%"},   reason:"Board seco, range bet pequeño."},
    "K83s":    {desc:"K83 twotone",        rec:{freq:"80/20",   sz:"33%"},   reason:"FD presente, reducir frecuencia ligeramente."},
    "KJ3r":    {desc:"KJ3 rainbow",        rec:{freq:"100%",    sz:"25%"},   reason:"Board seco. Apuesta muy pequeña eficiente."},
    "KJ3s":    {desc:"KJ3 twotone",        rec:{freq:"40/60",   sz:"125% OVERBET"}, reason:"FD polariza estrategia."},
    "KJ8s":    {desc:"KJ8 twotone",        rec:{freq:"40/60",   sz:"125% OVERBET"}, reason:"Board muy húmedo. Denegar equity."},
    "KQT":     {desc:"KQT broadway",       rec:{freq:"100%",    sz:"25%"},   reason:"Nut advantage broadway. Bet eficiente."},
    "KT2m":    {desc:"KT2 monotone",       rec:{freq:"0%",      sz:"Range Check"}, reason:"Monotone puro: rival tiene ventaja de flush."},
    "Q73r":    {desc:"Q73 rainbow",        rec:{freq:"100%",    sz:"33%"},   reason:"Board seco. Range bet."},
    "J73r":    {desc:"J73 rainbow",        rec:{freq:"100%",    sz:"33%"},   reason:"Board seco."},
    "J54s":    {desc:"J54 twotone",        rec:{freq:"66/33",   sz:"33%"},   reason:"Board coordinado medio."},
    "JT9s":    {desc:"JT9 twotone",        rec:{freq:"80/20",   sz:"33%"},   reason:"Board muy húmedo."},
    "T72r":    {desc:"T72 rainbow",        rec:{freq:"100%",    sz:"50%"},   reason:"Board seco. C-bet media."},
    "T72s":    {desc:"T72 twotone",        rec:{freq:"60/40",   sz:"100%"},  reason:"FD aumenta presión necesaria."},
    "T92s":    {desc:"T92 twotone",        rec:{freq:"50/50",   sz:"125%"},  reason:"Rango polar. Overbet o check."},
    "T87s":    {desc:"T87 twotone",        rec:{freq:"50/50",   sz:"50%"},   reason:"Board muy húmedo pero TP débiles dominan."},
    "982s":    {desc:"982 twotone",        rec:{freq:"50/50",   sz:"125%"},  reason:"Coordinado bajo. Overbet o check."},
    "952s":    {desc:"952 twotone",        rec:{freq:"40/60",   sz:"100%"},  reason:"Board con draws medios."},
    "862r":    {desc:"862 rainbow",        rec:{freq:"60/40",   sz:"50–75%"},reason:"Board bajo coordinado."},
    "992r":    {desc:"992 paired",         rec:{freq:"100%",    sz:"33%"},   reason:"Paired board. Range bet."},
    "992s":    {desc:"992 twotone",        rec:{freq:"50/50",   sz:"33%"},   reason:"FD presente en paired."},
    "755s":    {desc:"755 twotone",        rec:{freq:"60/40",   sz:"33%"},   reason:"Board bajo paired."},
    "765s":    {desc:"765 twotone",        rec:{freq:"20/80",   sz:"100%"},  reason:"Board muy conectado. Range check o potbet polar."},
    "874":     {desc:"874 coordinado",     rec:{freq:"50/50",   sz:"50%"},   reason:"Board medio coordinado."},
    "732r":    {desc:"732 rainbow",        rec:{freq:"100%",    sz:"33%"},   reason:"Board bajo seco."},
    // Fallbacks
    "PAIRED":              {rec:{freq:"Alta freq Range Bet", sz:"33%"}},
    "A_HIGH_WET":          {rec:{freq:"50/50 polarizado",    sz:"75%+"}},
    "A_HIGH_DRY":          {rec:{freq:"Alta freq C-bet",     sz:"33% block"}},
    "K_HIGH_WET":          {rec:{freq:"Mix 50/50",           sz:"66–75%"}},
    "K_HIGH_DRY":          {rec:{freq:"Alta freq",           sz:"33%"}},
    "BROADWAY_WET":        {rec:{freq:"Mix",                 sz:"75–100%"}},
    "BROADWAY_DRY":        {rec:{freq:"100%",                sz:"33%"}},
    "MID_COORDINATED_WET": {rec:{freq:"Baja freq + check",   sz:"100%+ si agredes"}},
    "MID_COORDINATED":     {rec:{freq:"Baja freq + check",   sz:"100%+ si agredes"}},
    "LOW_BOARD":           {rec:{freq:"Alta freq",           sz:"50%"}},
    "UNKNOWN_BOARD":       {rec:{freq:"GTO Standard",        sz:"33–50%"}}
  },

  // ── TURN: Estrategias por contexto ──
  TURN: {
    // Tras cbet 1/3 en flop
    "AXX_BROADWAY_TURN": {
      desc: "Axx twotone → Turn broadway (Q/K/T)",
      sizing:"150%", freq:"50/50",
      bet: "AJ+, dobles, trips, backdoor str+FD, TP fuertes sin bloquers",
      check:"Aire, TP+BP, second pairs"
    },
    "AXX_FLUSH_COMPLETE_TURN": {
      desc:"Axx twotone → Turn completa color",
      sizing:"50% polar", freq:"30/70",
      bet:"AQ+, dobles (no TP+BP), backdoor str+fl, trips",
      check:"Aire, FDs sin str draw, AJ−, TP+BP"
    },
    "AXX_STRAIGHT_COMPLETE_TURN": {
      desc:"Axx twotone → Turn completa escalera",
      sizing:"100%", freq:"30/70",
      bet:"AQ+, dobles (no TP+BP), bdoor str+flush, trips",
      check:"Aire, FDs sin str, AJ−, TP+BP"
    },
    "T72_OVERCARD_TURN": {
      desc:"T72r → Turn overcard (Q/K)",
      sizing:"125%", freq:"60/40",
      bet:"Todas overcards, bdoor str, overpairs, trips, TP+, 2nd pair kicker T+, Ax débil, air",
      check:"Pockets debajo 2nd par, 3ras parejas, backdoor suits bajos, 2nd pair kicker débil"
    },
    "T92_BLANK_TURN": {
      desc:"T92s → Turn ladrillo (2-7)",
      sizing:"Overbet 125%", freq:"55/45",
      bet:"TPGK+, FDs que hacen fold a FDs mejores (no K/A palo), faroles sin bloquer FD",
      check:"KFD, AFD, aire"
    },
    "LOW_BLANK_TURN": {
      desc:"Turn ladrillo bajo (2-6)",
      sizing:"75%", freq:"60/40",
      bet:"TP+, draws fuertes, overpairs",
      check:"Draws medios, pares bajos"
    },
    "DYNAMIC_TURN": {
      desc:"Turn dinámico (completa proyecto)",
      sizing:"Fold MÁS vs probe, apuesta cuando rival chekea",
      freq:"Exploitativo: overfold vs bet, bet agresivo si chequean",
      bet:"TP+ cuando rival checkea",
      check:"Manos medias vs probe"
    }
  },

  // ── MDA: Cheat Codes 2024–2025 ──
  MDA: {
    RIVER_RAISE:    "🚨 LEY DEL RIVER: Freq bluff rival < 8%. OVERFOLD MASIVO a TPTK. Defiende solo Sets y Nuts.",
    PROBE_TURN:     "💡 DEBILIDAD DEL CHECK (IP): Fold a probe del rival > 55%. Ataca Turn con 80% de rango.",
    MULTIWAY:       "⚠️ BOTE MULTIWAY: La gente NO farolea. Juega 100% honesto. Nada de hero calls.",
    DEEP_TPTK:      "⚠️ DEEP STACK: TPTK no vale un stack (SPR>10). Protege tu dinero.",
    RIVER_BLANK:    "📊 TURN/RIVER BLANCOS: Meta sobre-foldea. Barrel agresivo con blockers.",
    FISH_CALL:      "🎣 FISH DETECTADO: Value-bet fino siempre. NUNCA farolees. Extraer máximo.",
    NIT_FOLD:       "🪨 NIT DETECTADO: Steal sus ciegas. Si resubé → tiene Nuts. Foldea fácil.",
    LAG_INDUCE:     "🔥 LAG DETECTADO: Checka tus manos fuertes para inducir. Paga sus bluffs.",
    STATION_VALUE:  "🎯 STATION: Apuesta delgado con pares medios. Te paga con cualquier cosa."
  },

  // ── SPR Zones ──
  SPR: {
    getZone: function(spr) {
      if (spr <= 3)  return {zone:'COMMIT',   color:'#4ade80', msg:'SPR ≤ 3: COMPROMISO. TPTK es nuts. No hay fold.'};
      if (spr <= 6)  return {zone:'CONTROL',  color:'#fbbf24', msg:'SPR 3–6: ZONA GRIS. TPTK requiere control de bote.'};
      if (spr <= 10) return {zone:'DEEP',      color:'#fb923c', msg:'SPR 6–10: DEEP. Cuidado con raises. Prefiere draws.'};
      return               {zone:'VERY_DEEP', color:'#f87171', msg:'SPR > 10: ZONA DEEP RIO. TPTK = basura vs presión.'};
    }
  }
};
