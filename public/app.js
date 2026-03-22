/* ─────────────────────────────────────────────────────────
   Dictats en Català — Frontend principal
   ───────────────────────────────────────────────────────── */

const LEVEL_LABELS = {
  basic: 'Nivell Bàsic',
  intermedi: 'Nivell Intermedi',
  avancat: 'Nivell Avançat',
  personal: 'Els meus textos',
};

const PAUSE_DURATION_MS = 5000;
const SPEECH_RATE = 0.75;

const state = {
  email: '',
  firstName: '',
  level: 'basic',
  selectedText: null,
  phrases: [],
  currentPhraseIdx: 0,
  isSpeaking: false,
  dictationDone: false,
  mode: 'editor', // 'editor' | 'paper'
  photoFile: null,
};

const $ = id => document.getElementById(id);
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $('view-' + name).classList.add('active');
}

// ── Init ─────────────────────────────────────────────────
async function init() {
  const res = await fetch('/api/me');
  if (!res.ok) { window.location.href = '/login'; return; }
  const { email, first_name } = await res.json();
  state.email = email;
  state.firstName = first_name || email;

  const initials = (first_name || email).slice(0, 2).toUpperCase();
  $('header-avatar').textContent = initials;
  $('avatar-email').textContent = email;

  // Avatar dropdown
  $('header-avatar').addEventListener('click', (e) => {
    e.stopPropagation();
    $('avatar-dropdown').classList.toggle('open');
  });
  document.addEventListener('click', () => $('avatar-dropdown').classList.remove('open'));

  $('btn-logout').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  // Level cards
  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.level = card.dataset.level;
      loadTextList(state.level);
    });
  });

  // Mode toggle
  $('mode-editor').addEventListener('click', () => setMode('editor'));
  $('mode-paper').addEventListener('click', () => setMode('paper'));

  // Photo input
  $('photo-input').addEventListener('change', onPhotoSelected);
  $('btn-remove-photo').addEventListener('click', removePhoto);

  // Back buttons
  $('btn-back-select').addEventListener('click', () => showView('select'));
  $('btn-back-dictation').addEventListener('click', () => showView('dictation'));
  $('btn-new-dictation').addEventListener('click', () => { resetDictation(); showView('select'); });

  // Dictation controls
  $('btn-start-dictation').addEventListener('click', startDictation);
  $('btn-repeat-phrase').addEventListener('click', repeatCurrentPhrase);
  $('btn-clear-text').addEventListener('click', () => {
    $('user-text').value = '';
    updateCorrectBtn();
  });
  $('btn-correct').addEventListener('click', submitCorrection);

  $('user-text').addEventListener('input', updateCorrectBtn);

  // Add personal text modal
  $('btn-add-text').addEventListener('click', () => { $('modal-add-text').style.display = 'flex'; });
  $('btn-cancel-add-text').addEventListener('click', () => { $('modal-add-text').style.display = 'none'; });
  $('btn-save-text').addEventListener('click', savePersonalText);

  await loadTextList('basic');
}

// ── Mode toggle ───────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  state.photoFile = null;
  $('mode-editor').classList.toggle('active', mode === 'editor');
  $('mode-paper').classList.toggle('active', mode === 'paper');
  $('editor-zone').style.display = mode === 'editor' ? '' : 'none';
  $('paper-zone').style.display = mode === 'paper' ? '' : 'none';
  $('photo-preview-wrap').style.display = 'none';
  $('photo-label-text').textContent = 'Pujar foto del paper (opcional)';
  $('photo-input').value = '';
  updateCorrectBtn();
}

function updateCorrectBtn() {
  if (state.mode === 'editor') {
    $('btn-correct').disabled = $('user-text').value.trim().length < 3;
  } else {
    // Paper mode: enabled always when dictation done (photo is optional)
    $('btn-correct').disabled = !state.dictationDone;
  }
}

function onPhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  state.photoFile = file;
  $('photo-label-text').textContent = file.name;
  const reader = new FileReader();
  reader.onload = ev => {
    $('photo-preview').src = ev.target.result;
    $('photo-preview-wrap').style.display = '';
  };
  reader.readAsDataURL(file);
  updateCorrectBtn();
}

function removePhoto() {
  state.photoFile = null;
  $('photo-input').value = '';
  $('photo-preview-wrap').style.display = 'none';
  $('photo-label-text').textContent = 'Pujar foto del paper (opcional)';
  updateCorrectBtn();
}

// ── Text list ─────────────────────────────────────────────
async function loadTextList(level) {
  const isPersonal = level === 'personal';
  $('text-list-title').textContent = `Textos disponibles — ${LEVEL_LABELS[level]}`;
  $('btn-add-text').style.display = isPersonal ? '' : 'none';
  $('text-list').innerHTML = '<div style="color:var(--text-muted);font-size:.875rem">Carregant textos…</div>';

  const url = isPersonal ? '/api/user-texts' : `/api/texts/${level}`;
  const res = await fetch(url);
  if (!res.ok) { $('text-list').innerHTML = '<div style="color:var(--error)">Error carregant els textos</div>'; return; }
  const texts = await res.json();

  if (isPersonal && texts.length === 0) {
    $('text-list').innerHTML = '<div style="color:var(--text-muted);font-size:.875rem">No tens cap text personal. Usa el botó "+ Afegir text" per crear-ne un.</div>';
    return;
  }

  $('text-list').innerHTML = texts.map(t => `
    <div class="text-item" data-id="${t.id}" data-dbid="${t.dbId || ''}">
      <div style="flex:1">
        <div class="text-title">${t.title}</div>
        <div class="text-meta">${t.description}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="text-words">${t.wordCount} paraules</div>
        ${isPersonal ? `<button class="btn btn-ghost btn-sm delete-personal" data-dbid="${t.dbId}" title="Eliminar">✕</button>` : ''}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.text-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.classList.contains('delete-personal')) return;
      selectText(item.dataset.id, isPersonal);
    });
  });

  document.querySelectorAll('.delete-personal').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Eliminar aquest text?')) return;
      await fetch(`/api/user-texts/${btn.dataset.dbid}`, { method: 'DELETE' });
      loadTextList('personal');
    });
  });
}

// ── Select text ───────────────────────────────────────────
async function selectText(id, isPersonal) {
  let text;
  if (isPersonal) {
    const res = await fetch('/api/user-texts');
    const list = await res.json();
    text = list.find(t => t.id === id);
  } else {
    const [level, ...rest] = [state.level];
    const res = await fetch(`/api/texts/${state.level}/${id}`);
    if (!res.ok) return;
    text = await res.json();
  }
  if (!text) return;

  state.selectedText = text;
  state.phrases = text.text.split('||').map(s => s.trim()).filter(Boolean);

  $('dictation-title').textContent = text.title;
  $('dictation-level-badge').textContent = LEVEL_LABELS[state.level];
  $('user-text').value = '';
  resetDictationUI();
  showView('dictation');
}

// ── Personal texts ────────────────────────────────────────
async function savePersonalText() {
  const title = $('new-text-title').value.trim();
  const text = $('new-text-body').value.trim();
  if (!title || !text) return alert('Cal títol i text');

  const res = await fetch('/api/user-texts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, text }),
  });
  if (res.ok) {
    $('modal-add-text').style.display = 'none';
    $('new-text-title').value = '';
    $('new-text-body').value = '';
    loadTextList('personal');
  }
}

// ── Dictation logic ───────────────────────────────────────
function resetDictationUI() {
  state.currentPhraseIdx = 0;
  state.isSpeaking = false;
  state.dictationDone = false;
  state.photoFile = null;
  $('progress-bar').style.width = '0%';
  $('phrase-indicator').textContent = '';
  $('status-badge').innerHTML = '';
  $('btn-start-dictation').style.display = '';
  $('btn-repeat-phrase').style.display = 'none';
  $('btn-correct').disabled = true;
  setMode('editor');
  cancelSpeech();
}

function resetDictation() {
  resetDictationUI();
  state.selectedText = null;
  state.phrases = [];
}

function cancelSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function getVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang.startsWith('ca')) || voices.find(v => v.lang.startsWith('es')) || null;
}

function speak(text, onEnd) {
  cancelSpeech();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ca-ES';
  utter.rate = SPEECH_RATE;
  const voice = getVoice();
  if (voice) utter.voice = voice;
  utter.onend = onEnd;
  utter.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(utter);
}

function setStatusSpeaking(phraseNum, total) {
  $('status-badge').innerHTML = `<span class="speaking-badge"><span class="dot"></span>Llegint frase ${phraseNum} de ${total}</span>`;
}
function setStatusPausing(seconds) {
  $('status-badge').innerHTML = `<span class="pause-badge">⏸ Pausa de ${seconds}s — escriu ara!</span>`;
}
function setStatusDone() {
  $('status-badge').innerHTML = `<span class="speaking-badge" style="background:var(--success-light);color:var(--success)">✓ Dictado completat</span>`;
}

async function startDictation() {
  if (!state.phrases.length) return;
  if (!window.speechSynthesis) { alert('El teu navegador no suporta la síntesi de veu. Prova Chrome.'); return; }
  $('btn-start-dictation').style.display = 'none';
  $('btn-repeat-phrase').style.display = '';
  state.isSpeaking = true;
  state.currentPhraseIdx = 0;
  speakNextPhrase();
}

function speakNextPhrase() {
  const idx = state.currentPhraseIdx;
  const total = state.phrases.length;

  if (idx >= total) {
    state.isSpeaking = false;
    state.dictationDone = true;
    $('progress-bar').style.width = '100%';
    $('phrase-indicator').textContent = `Dictado complet (${total} frases)`;
    $('btn-repeat-phrase').style.display = 'none';
    setStatusDone();
    updateCorrectBtn();
    return;
  }

  const phrase = state.phrases[idx];
  $('progress-bar').style.width = `${(idx / total) * 100}%`;
  $('phrase-indicator').textContent = `Frase ${idx + 1} de ${total}`;
  setStatusSpeaking(idx + 1, total);

  speak(phrase, () => {
    if (total - idx - 1 > 0) {
      setStatusPausing(PAUSE_DURATION_MS / 1000);
      setTimeout(() => { state.currentPhraseIdx++; speakNextPhrase(); }, PAUSE_DURATION_MS);
    } else {
      state.currentPhraseIdx++;
      speakNextPhrase();
    }
  });
}

function repeatCurrentPhrase() {
  if (!state.phrases.length) return;
  const idx = Math.max(0, state.currentPhraseIdx - 1);
  cancelSpeech();
  speak(state.phrases[idx] || state.phrases[state.phrases.length - 1], null);
}

// ── Correction ────────────────────────────────────────────
async function submitCorrection() {
  if (!state.selectedText) return;

  $('btn-correct').disabled = true;
  $('correction-loading').style.display = '';
  cancelSpeech();

  try {
    let correction;

    if (state.mode === 'paper' && state.photoFile) {
      // Photo correction
      $('loading-msg').textContent = 'Claude està llegint la foto i corregint…';
      const formData = new FormData();
      formData.append('photo', state.photoFile);
      formData.append('originalText', state.selectedText.text);
      formData.append('level', state.level);
      formData.append('textId', state.selectedText.id || 'unknown');
      formData.append('textTitle', state.selectedText.title || '');

      const res = await fetch('/api/correct-image', { method: 'POST', body: formData });
      if (!res.ok) { const { error } = await res.json(); throw new Error(error); }
      correction = await res.json();
    } else if (state.mode === 'paper' && !state.photoFile) {
      // Paper mode, no photo — just show original without correction
      $('correction-loading').style.display = 'none';
      renderResultsNoCorrección();
      showView('results');
      return;
    } else {
      // Text editor correction
      $('loading-msg').textContent = 'Claude està corregint el text…';
      const userText = $('user-text').value.trim();
      const res = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: state.selectedText.text,
          userText,
          level: state.level,
          textId: state.selectedText.id || 'unknown',
          textTitle: state.selectedText.title || '',
        }),
      });
      if (!res.ok) { const { error } = await res.json(); throw new Error(error); }
      correction = await res.json();
    }

    $('correction-loading').style.display = 'none';
    renderResults(correction);
    showView('results');
  } catch (err) {
    $('correction-loading').style.display = 'none';
    $('btn-correct').disabled = false;
    alert(err.message || 'Error de connexió. Torna a provar.');
  }
}

// ── Results ───────────────────────────────────────────────
function renderResultsNoCorrección() {
  $('result-scale-label').textContent = 'Dictado completat';
  $('result-scale-label').className = 'scale-label scale-good';
  $('result-scale-sub').textContent = 'Has fet el dictado en paper. Pujar una foto per veure la correcció.';
  $('result-stats').textContent = '';
  $('result-transcription').style.display = 'none';
  $('errors-section').style.display = 'none';
  $('feedback-box').textContent = 'Bon treball! Has completat el dictado.';

  const cleanOriginal = state.selectedText.text.replace(/\|\|/g, '').replace(/\s+/g, ' ').trim();
  $('original-marked').innerHTML = cleanOriginal.split(/\s+/).map(w => `<span class="word-ok">${escapeHtml(w)}</span>`).join(' ');
}

function renderResults(correction) {
  const errors = correction.errors || [];
  const scale = correction.scale || { label: '—', sub: '', cls: 'scale-good' };

  $('result-scale-label').textContent = scale.label;
  $('result-scale-label').className = 'scale-label ' + scale.cls;
  $('result-scale-sub').textContent = scale.sub;
  $('result-stats').textContent = `${correction.correctWords ?? '—'} de ${correction.totalWords ?? '—'} paraules correctes · ${errors.length} error${errors.length !== 1 ? 's' : ''}`;

  // Show transcription if from photo
  if (correction.transcription) {
    $('result-transcription').style.display = '';
    $('result-transcription').innerHTML = `<strong>Text transcrit de la foto:</strong><br>${escapeHtml(correction.transcription)}`;
  } else {
    $('result-transcription').style.display = 'none';
  }

  const cleanOriginal = state.selectedText.text.replace(/\|\|/g, '').replace(/\s+/g, ' ').trim();
  const words = cleanOriginal.split(/\s+/);
  const errorMap = {};
  errors.forEach(e => { errorMap[e.position] = e; });

  $('original-marked').innerHTML = words.map((word, i) => {
    if (errorMap[i]) {
      const err = errorMap[i];
      return `<span class="word-error" title="${escapeHtml(err.explanation || '')}">${escapeHtml(word)}</span>`;
    }
    return `<span class="word-ok">${escapeHtml(word)}</span>`;
  }).join(' ');

  if (errors.length === 0) {
    $('errors-section').style.display = 'none';
  } else {
    $('errors-section').style.display = '';
    $('errors-list-items').innerHTML = errors.map(err => `
      <div class="error-item">
        <span class="error-type">${escapeHtml(err.type || 'error')}</span>
        <div class="error-detail">
          <div class="error-words">
            <span class="wrong">${escapeHtml(err.userWrote || '(omès)')}</span>
            <span class="arrow">→</span>
            <span class="right">${escapeHtml(err.original || '')}</span>
          </div>
          <div class="error-explanation">${escapeHtml(err.explanation || '')}</div>
        </div>
      </div>
    `).join('');
  }

  $('feedback-box').textContent = correction.feedback || '';
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

init();
