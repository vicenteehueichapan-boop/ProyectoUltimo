// ============================================================
// APEX PREDATOR V9 — player_db.js
// Base de datos de jugadores con localStorage
// ============================================================
window.PlayerDB = {
  db: {},

  init() { this.load(); },

  load() {
    try {
      const data = localStorage.getItem('apex_player_db_v9');
      if (data) this.db = JSON.parse(data);
    } catch(e) { this.db = {}; }
  },

  save() {
    try { localStorage.setItem('apex_player_db_v9', JSON.stringify(this.db)); }
    catch(e) { console.error('PlayerDB save error', e); }
  },

  normalize(name) { return name ? name.trim().toLowerCase() : ''; },

  get(name) { return this.db[this.normalize(name)] || null; },

  getAll() { return Object.values(this.db).sort((a,b)=>a.name.localeCompare(b.name)); },

  upsert(name, data) {
    const key = this.normalize(name);
    if (!key) return null;
    if (!this.db[key]) this.db[key] = { name: name.trim(), created: Date.now() };
    this.db[key] = { ...this.db[key], ...data, updated: Date.now() };
    this.save();
    return this.db[key];
  },

  delete(name) {
    const key = this.normalize(name);
    if (this.db[key]) { delete this.db[key]; this.save(); return true; }
    return false;
  },

  search(prefix) {
    const term = this.normalize(prefix);
    if (!term || term.length < 1) return [];
    return Object.values(this.db)
      .filter(p => this.normalize(p.name).includes(term))
      .sort((a,b)=>a.name.localeCompare(b.name))
      .slice(0,6);
  },

  count() { return Object.keys(this.db).length; },

  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.db, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'apex_players_backup.json');
    document.body.appendChild(a);
    a.click(); a.remove();
  },

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object') {
        this.db = { ...this.db, ...parsed };
        this.save(); return true;
      }
    } catch(e) { console.error('Import error', e); }
    return false;
  }
};

window.PlayerDB.init();
