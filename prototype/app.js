/* ========================================================
   Reiseküche – Klick-Prototyp
   Persistenz: localStorage
   ======================================================== */

// ── Utils ──────────────────────────────────────────────
const uuid = () => crypto.randomUUID();
const fmt  = d => new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { weekday:'short', day:'2-digit', month:'short' });
const fmtFull = d => new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day:'2-digit', month:'long', year:'numeric' });

function daysBetween(von, bis) {
  const days = [];
  let cur = new Date(von + 'T00:00:00');
  const end = new Date(bis + 'T00:00:00');
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// ── State ──────────────────────────────────────────────
let state = {
  zeitraeume:      [], // { id, reiseort, datum_von, datum_bis, personen: [{id,vorname,nachname}] }
  mahlzeiten:      [], // { id, zeitraum_id, datum, typ, name, personen }
  kochzuweisungen: [], // { id, zeitraum_id, datum, person_id }
  einkaufsliste:   [], // { id, name, menge, kategorie, done }
};

function save() { localStorage.setItem('reisekueche', JSON.stringify(state)); }
function load() {
  const raw = localStorage.getItem('reisekueche');
  if (raw) state = JSON.parse(raw);
}

// ── Navigation ─────────────────────────────────────────
let currentView = 'zeitraeume';

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    currentView = tab.dataset.view;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + currentView).classList.remove('hidden');
    if (currentView === 'speiseplan')    renderSpeiseplan();
    if (currentView === 'einkaufsliste') renderEinkaufsliste();
  });
});

// ════════════════════════════════════════════════════════
// EPIC 1 – ZEITRÄUME
// ════════════════════════════════════════════════════════
let editingZeitraumId = null;
let tmpPersonen = [];

document.getElementById('btn-new-zeitraum').addEventListener('click', () => openZeitraumModal());
document.getElementById('btn-cancel-zeitraum').addEventListener('click', closeZeitraumModal);
document.getElementById('btn-save-zeitraum').addEventListener('click', saveZeitraum);
document.getElementById('btn-add-person').addEventListener('click', addPersonToTmp);

document.getElementById('person-vorname').addEventListener('keydown', e => { if (e.key === 'Enter') addPersonToTmp(); });
document.getElementById('person-nachname').addEventListener('keydown', e => { if (e.key === 'Enter') addPersonToTmp(); });

function openZeitraumModal(id = null) {
  editingZeitraumId = id;
  const modal = document.getElementById('modal-zeitraum');
  document.getElementById('modal-zeitraum-title').textContent = id ? 'Zeitraum bearbeiten' : 'Zeitraum anlegen';

  if (id) {
    const zr = state.zeitraeume.find(z => z.id === id);
    document.getElementById('zr-ort').value = zr.reiseort;
    document.getElementById('zr-von').value = zr.datum_von;
    document.getElementById('zr-bis').value = zr.datum_bis;
    tmpPersonen = zr.personen.map(p => ({ ...p }));
  } else {
    document.getElementById('zr-ort').value = '';
    document.getElementById('zr-von').value = '';
    document.getElementById('zr-bis').value = '';
    tmpPersonen = [];
  }
  renderTmpPersonen();
  modal.classList.remove('hidden');
  document.getElementById('zr-ort').focus();
}

function closeZeitraumModal() {
  document.getElementById('modal-zeitraum').classList.add('hidden');
  editingZeitraumId = null;
  tmpPersonen = [];
}

function addPersonToTmp() {
  const vorname  = document.getElementById('person-vorname').value.trim();
  const nachname = document.getElementById('person-nachname').value.trim();
  if (!vorname && !nachname) return;
  tmpPersonen.push({ id: uuid(), vorname: vorname || '–', nachname: nachname || '' });
  document.getElementById('person-vorname').value = '';
  document.getElementById('person-nachname').value = '';
  renderTmpPersonen();
  document.getElementById('person-vorname').focus();
}

function renderTmpPersonen() {
  const list = document.getElementById('personen-list');
  list.innerHTML = '';
  tmpPersonen.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'person-chip';
    div.innerHTML = `<span>${p.vorname} ${p.nachname}</span>
      <button data-i="${i}" title="Entfernen">×</button>`;
    div.querySelector('button').addEventListener('click', () => {
      tmpPersonen.splice(i, 1);
      renderTmpPersonen();
    });
    list.appendChild(div);
  });
}

function saveZeitraum() {
  const ort = document.getElementById('zr-ort').value.trim();
  const von = document.getElementById('zr-von').value;
  const bis = document.getElementById('zr-bis').value;
  if (!ort || !von || !bis) { alert('Bitte Reiseort und Datum ausfüllen.'); return; }
  if (von > bis) { alert('"Von" muss vor "Bis" liegen.'); return; }

  if (editingZeitraumId) {
    const zr = state.zeitraeume.find(z => z.id === editingZeitraumId);
    zr.reiseort   = ort;
    zr.datum_von  = von;
    zr.datum_bis  = bis;
    zr.personen   = tmpPersonen;
  } else {
    state.zeitraeume.push({ id: uuid(), reiseort: ort, datum_von: von, datum_bis: bis, personen: tmpPersonen });
  }
  save();
  closeZeitraumModal();
  renderZeitraeume();
}

function deleteZeitraum(id) {
  if (!confirm('Zeitraum und alle zugehörigen Daten löschen?')) return;
  state.zeitraeume      = state.zeitraeume.filter(z => z.id !== id);
  state.mahlzeiten      = state.mahlzeiten.filter(m => m.zeitraum_id !== id);
  state.kochzuweisungen = state.kochzuweisungen.filter(k => k.zeitraum_id !== id);
  save();
  renderZeitraeume();
}

function renderZeitraeume() {
  const list = document.getElementById('zeitraum-list');
  if (state.zeitraeume.length === 0) {
    list.innerHTML = '<p class="empty-state">Noch keine Zeiträume angelegt.</p>';
    return;
  }
  list.innerHTML = '';
  state.zeitraeume.forEach(zr => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${zr.reiseort}</div>
          <div class="card-meta">
            <span>📅 ${fmtFull(zr.datum_von)} – ${fmtFull(zr.datum_bis)}</span>
            <span>👥 ${zr.personen.length} Person${zr.personen.length !== 1 ? 'en' : ''}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost btn-sm" data-edit="${zr.id}">Bearbeiten</button>
          <button class="btn btn-danger btn-sm" data-del="${zr.id}">Löschen</button>
        </div>
      </div>
      ${zr.personen.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${zr.personen.map(p => `<span class="badge">${p.vorname} ${p.nachname}</span>`).join('')}</div>` : ''}
    `;
    div.querySelector('[data-edit]').addEventListener('click', () => openZeitraumModal(zr.id));
    div.querySelector('[data-del]').addEventListener('click', () => deleteZeitraum(zr.id));
    list.appendChild(div);
  });
}

// ════════════════════════════════════════════════════════
// EPIC 2 – SPEISEPLAN
// ════════════════════════════════════════════════════════
let editingMahlzeitCtx = null; // { zeitraum_id, datum }
let editingKochCtx     = null;

document.getElementById('btn-cancel-mahlzeit').addEventListener('click', () => document.getElementById('modal-mahlzeit').classList.add('hidden'));
document.getElementById('btn-save-mahlzeit').addEventListener('click', saveMahlzeit);
document.getElementById('btn-cancel-koch').addEventListener('click', () => document.getElementById('modal-koch').classList.add('hidden'));
document.getElementById('btn-save-koch').addEventListener('click', saveKoch);

document.getElementById('speiseplan-zeitraum-select').addEventListener('change', renderSpeiseplanDays);

function renderSpeiseplan() {
  const sel = document.getElementById('speiseplan-zeitraum-select');
  const prev = sel.value;
  sel.innerHTML = state.zeitraeume.length === 0
    ? '<option value="">– Kein Zeitraum vorhanden –</option>'
    : state.zeitraeume.map(z => `<option value="${z.id}">${z.reiseort} (${fmtFull(z.datum_von)})</option>`).join('');
  if (prev && state.zeitraeume.find(z => z.id === prev)) sel.value = prev;
  renderSpeiseplanDays();
}

function renderSpeiseplanDays() {
  const content = document.getElementById('speiseplan-content');
  const zeitraumId = document.getElementById('speiseplan-zeitraum-select').value;
  const zr = state.zeitraeume.find(z => z.id === zeitraumId);
  if (!zr) { content.innerHTML = '<p class="empty-state">Bitte zuerst einen Zeitraum anlegen.</p>'; return; }

  const days = daysBetween(zr.datum_von, zr.datum_bis);
  content.innerHTML = '';

  days.forEach(datum => {
    const meals = state.mahlzeiten.filter(m => m.zeitraum_id === zeitraumId && m.datum === datum);
    const kochEintrag = state.kochzuweisungen.find(k => k.zeitraum_id === zeitraumId && k.datum === datum);
    const kochName = kochEintrag
      ? (() => { const p = zr.personen.find(p => p.id === kochEintrag.person_id); return p ? `${p.vorname} ${p.nachname}` : '?'; })()
      : null;

    const day = document.createElement('div');
    day.className = 'day-card';
    day.innerHTML = `
      <div class="day-header">
        <span class="day-title">${fmt(datum)}</span>
        <span class="day-koch" data-datum="${datum}" data-zr="${zeitraumId}">
          ${kochName ? `👨‍🍳 ${kochName}` : '+ Koch zuweisen'}
        </span>
      </div>
      <div class="day-meals">
        ${meals.length === 0 ? '<span class="empty-state" style="padding:8px 0;text-align:left">Noch keine Mahlzeiten geplant.</span>' : ''}
        ${meals.map(m => `
          <div class="meal-row">
            <span class="meal-typ">${m.typ}</span>
            <span class="meal-name">${m.name}</span>
            <span class="meal-personen">👥 ${m.personen}</span>
            <button class="meal-del" data-mid="${m.id}">×</button>
          </div>`).join('')}
      </div>
      <div class="add-meal-btn">
        <button class="btn btn-secondary btn-sm" data-add-datum="${datum}" data-add-zr="${zeitraumId}">+ Mahlzeit</button>
      </div>
    `;

    day.querySelector('.day-koch').addEventListener('click', () => openKochModal(zeitraumId, datum, zr));
    day.querySelector('[data-add-datum]').addEventListener('click', () => openMahlzeitModal(zeitraumId, datum, zr));
    day.querySelectorAll('.meal-del').forEach(btn => btn.addEventListener('click', () => {
      state.mahlzeiten = state.mahlzeiten.filter(m => m.id !== btn.dataset.mid);
      save(); renderSpeiseplanDays();
    }));

    content.appendChild(day);
  });
}

function openMahlzeitModal(zeitraumId, datum, zr) {
  editingMahlzeitCtx = { zeitraumId, datum };
  document.getElementById('mz-name').value = '';
  document.getElementById('mz-personen').value = zr.personen.length;
  document.getElementById('mz-typ').value = 'Abendessen';
  document.getElementById('modal-mahlzeit').classList.remove('hidden');
  document.getElementById('mz-name').focus();
}

function saveMahlzeit() {
  const name     = document.getElementById('mz-name').value.trim();
  const personen = parseInt(document.getElementById('mz-personen').value, 10);
  const typ      = document.getElementById('mz-typ').value;
  if (!name) { alert('Bitte einen Namen eingeben.'); return; }
  state.mahlzeiten.push({
    id: uuid(),
    zeitraum_id: editingMahlzeitCtx.zeitraumId,
    datum: editingMahlzeitCtx.datum,
    typ, name, personen: personen || 1
  });
  save();
  document.getElementById('modal-mahlzeit').classList.add('hidden');
  renderSpeiseplanDays();
}

function openKochModal(zeitraumId, datum, zr) {
  editingKochCtx = { zeitraumId, datum };
  document.getElementById('koch-datum-label').textContent = `Tag: ${fmtFull(datum)}`;
  const sel = document.getElementById('koch-person-select');
  sel.innerHTML = zr.personen.map(p => `<option value="${p.id}">${p.vorname} ${p.nachname}</option>`).join('');
  const existing = state.kochzuweisungen.find(k => k.zeitraum_id === zeitraumId && k.datum === datum);
  if (existing) sel.value = existing.person_id;
  document.getElementById('modal-koch').classList.remove('hidden');
}

function saveKoch() {
  const { zeitraumId, datum } = editingKochCtx;
  const person_id = document.getElementById('koch-person-select').value;
  state.kochzuweisungen = state.kochzuweisungen.filter(k => !(k.zeitraum_id === zeitraumId && k.datum === datum));
  state.kochzuweisungen.push({ id: uuid(), zeitraum_id: zeitraumId, datum, person_id });
  save();
  document.getElementById('modal-koch').classList.add('hidden');
  renderSpeiseplanDays();
}

// ════════════════════════════════════════════════════════
// EPIC 3 – EINKAUFSLISTE
// ════════════════════════════════════════════════════════
document.getElementById('btn-add-item').addEventListener('click', addManualItem);
document.getElementById('new-item-name').addEventListener('keydown', e => { if (e.key === 'Enter') addManualItem(); });
document.getElementById('btn-generate-list').addEventListener('click', generateList);
document.getElementById('btn-reset-list').addEventListener('click', () => {
  if (confirm('Einkaufsliste wirklich leeren?')) { state.einkaufsliste = []; save(); renderEinkaufsliste(); }
});

const KATEGORIEN_MAP = {
  'pasta': 'Nudeln & Reis', 'nudel': 'Nudeln & Reis', 'reis': 'Nudeln & Reis',
  'salat': 'Gemüse & Salat', 'gemüse': 'Gemüse & Salat', 'tomate': 'Gemüse & Salat', 'zwiebel': 'Gemüse & Salat',
  'fleisch': 'Fleisch & Fisch', 'hähnchen': 'Fleisch & Fisch', 'fisch': 'Fleisch & Fisch', 'hack': 'Fleisch & Fisch',
  'käse': 'Milchprodukte', 'milch': 'Milchprodukte', 'sahne': 'Milchprodukte', 'butter': 'Milchprodukte', 'joghurt': 'Milchprodukte',
  'brot': 'Bäckerei', 'brötchen': 'Bäckerei',
  'öl': 'Öle & Gewürze', 'gewürz': 'Öle & Gewürze', 'salz': 'Öle & Gewürze', 'pfeffer': 'Öle & Gewürze',
};
function guessKategorie(name) {
  const n = name.toLowerCase();
  for (const [key, cat] of Object.entries(KATEGORIEN_MAP)) {
    if (n.includes(key)) return cat;
  }
  return 'Sonstiges';
}

function addManualItem() {
  const name  = document.getElementById('new-item-name').value.trim();
  const menge = document.getElementById('new-item-menge').value.trim();
  if (!name) return;
  state.einkaufsliste.push({ id: uuid(), name, menge, kategorie: guessKategorie(name), done: false });
  document.getElementById('new-item-name').value = '';
  document.getElementById('new-item-menge').value = '';
  save();
  renderEinkaufsliste();
  document.getElementById('new-item-name').focus();
}

function generateList() {
  const names = state.mahlzeiten.map(m => m.name);
  if (names.length === 0) { alert('Noch keine Mahlzeiten im Speiseplan.'); return; }
  let added = 0;
  names.forEach(n => {
    if (!state.einkaufsliste.find(i => i.name.toLowerCase() === n.toLowerCase())) {
      state.einkaufsliste.push({ id: uuid(), name: n, menge: '', kategorie: guessKategorie(n), done: false });
      added++;
    }
  });
  save();
  renderEinkaufsliste();
  if (added === 0) alert('Alle Mahlzeiten sind bereits in der Liste.');
  else alert(`${added} Position${added !== 1 ? 'en' : ''} hinzugefügt.`);
}

function toggleItem(id) {
  const item = state.einkaufsliste.find(i => i.id === id);
  if (item) { item.done = !item.done; save(); renderEinkaufsliste(); }
}

function deleteItem(id) {
  state.einkaufsliste = state.einkaufsliste.filter(i => i.id !== id);
  save();
  renderEinkaufsliste();
}

function renderEinkaufsliste() {
  const content = document.getElementById('einkaufsliste-content');
  if (state.einkaufsliste.length === 0) {
    content.innerHTML = '<p class="empty-state">Die Einkaufsliste ist leer.</p>';
    return;
  }

  // Gruppieren nach Kategorie
  const cats = {};
  state.einkaufsliste.forEach(item => {
    if (!cats[item.kategorie]) cats[item.kategorie] = [];
    cats[item.kategorie].push(item);
  });

  content.innerHTML = '';
  const ORDER = ['Gemüse & Salat','Fleisch & Fisch','Milchprodukte','Nudeln & Reis','Bäckerei','Öle & Gewürze','Sonstiges'];
  const sortedCats = [...new Set([...ORDER, ...Object.keys(cats)])].filter(c => cats[c]);

  sortedCats.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'einkauf-kategorie';
    section.innerHTML = `<div class="einkauf-kategorie-title">${cat}</div>`;
    cats[cat].forEach(item => {
      const row = document.createElement('div');
      row.className = 'einkauf-item' + (item.done ? ' done' : '');
      row.innerHTML = `
        <input type="checkbox" ${item.done ? 'checked' : ''} data-id="${item.id}" />
        <span class="item-name">${item.name}</span>
        ${item.menge ? `<span class="item-menge">${item.menge}</span>` : ''}
        <button class="item-del" data-id="${item.id}">×</button>
      `;
      row.querySelector('input').addEventListener('change', () => toggleItem(item.id));
      row.querySelector('.item-del').addEventListener('click', () => deleteItem(item.id));
      section.appendChild(row);
    });
    content.appendChild(section);
  });
}

// ── Init ───────────────────────────────────────────────
load();
renderZeitraeume();
