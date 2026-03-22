const express = require('express');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const requireAuth = require('../middleware/requireAuth');
const db = require('../lib/db');
const texts = require('../../data/texts');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Escala motivadora ────────────────────────────────────────
function getScale(errorsCount) {
  if (errorsCount === 0) return { label: 'Excel·lent!', sub: 'Cap error. Perfecte!', cls: 'scale-excellent' };
  if (errorsCount <= 2)  return { label: 'Molt bé!',    sub: 'Quasi perfecte',       cls: 'scale-great' };
  if (errorsCount <= 5)  return { label: 'Bé!',         sub: 'Bon progrés',          cls: 'scale-good' };
  if (errorsCount <= 9)  return { label: 'Progressant!',sub: 'Continua practicant',  cls: 'scale-ok' };
  return                        { label: 'Segueix!',    sub: 'Amb pràctica ho aconseguiràs', cls: 'scale-keep' };
}

// ── Texts predefinits ────────────────────────────────────────
router.get('/texts/:level', requireAuth, (req, res) => {
  const { level } = req.params;
  if (!texts[level]) return res.status(400).json({ error: 'Nivell no vàlid' });
  const list = texts[level].map(t => ({
    id: t.id, title: t.title, description: t.description,
    wordCount: t.text.replace(/\|\|/g, '').split(/\s+/).length,
  }));
  res.json(list);
});

router.get('/texts/:level/:id', requireAuth, (req, res) => {
  const { level, id } = req.params;
  if (!texts[level]) return res.status(400).json({ error: 'Nivell no vàlid' });
  const text = texts[level].find(t => t.id === id);
  if (!text) return res.status(404).json({ error: 'Text no trobat' });
  res.json(text);
});

// ── Textos personals ─────────────────────────────────────────
router.get('/user-texts', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT id, title, text, created_at FROM user_texts WHERE email = ? ORDER BY created_at DESC'
  ).all(req.session.profile.email);
  const list = rows.map(r => ({
    id: 'personal_' + r.id,
    dbId: r.id,
    title: r.title,
    text: r.text,
    description: 'Text personal',
    wordCount: r.text.replace(/\|\|/g, '').split(/\s+/).length,
    created_at: r.created_at,
  }));
  res.json(list);
});

router.post('/user-texts', requireAuth, (req, res) => {
  const { title, text } = req.body;
  if (!title || !text) return res.status(400).json({ error: 'Cal títol i text' });
  const result = db.prepare(
    'INSERT INTO user_texts (email, title, text) VALUES (?, ?, ?)'
  ).run(req.session.profile.email, title.trim(), text.trim());
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.delete('/user-texts/:id', requireAuth, (req, res) => {
  db.prepare(
    'DELETE FROM user_texts WHERE id = ? AND email = ?'
  ).run(req.params.id, req.session.profile.email);
  res.json({ ok: true });
});

// ── Correcció text ───────────────────────────────────────────
const CORRECTION_PROMPT = (cleanOriginal, userText) => `Ets un professor de català expert en ortografia. L'alumne ha fet un dictado i has de corregir-lo.

TEXT ORIGINAL (correcte):
"${cleanOriginal}"

TEXT DE L'ALUMNE:
"${userText}"

La teva tasca:
1. Compara el text de l'alumne amb l'original i identifica TOTES les diferències.
2. Classifica cada error com: ortografia, accentuació, puntuació, paraula incorrecta, paraula omesa, o paraula afegida.
3. Retorna un JSON estrictament amb aquest format:

{
  "score": <número del 0 al 100>,
  "totalWords": <nombre total de paraules de l'original>,
  "correctWords": <nombre de paraules correctes>,
  "errors": [
    {
      "position": <índex de la paraula (0-based)>,
      "original": <paraula original correcte>,
      "userWrote": <el que ha escrit l'alumne>,
      "type": <"ortografia" | "accentuació" | "puntuació" | "paraula incorrecta" | "paraula omesa" | "paraula afegida">,
      "explanation": <breu explicació en català>
    }
  ],
  "feedback": <missatge de retroalimentació en català, màxim 2 frases, animant l'alumne>
}

Retorna NOMÉS el JSON, sense cap altre text.`;

function parseClaudeJSON(responseText) {
  try { return JSON.parse(responseText.trim()); }
  catch {
    const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    throw new Error('Resposta invàlida de Claude');
  }
}

router.post('/correct', requireAuth, async (req, res) => {
  const { originalText, userText, level, textId, textTitle } = req.body;
  if (!originalText || !userText) return res.status(400).json({ error: 'Falten dades' });

  const cleanOriginal = originalText.replace(/\|\|/g, '').replace(/\s+/g, ' ').trim();

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: CORRECTION_PROMPT(cleanOriginal, userText) }],
    });

    const correction = parseClaudeJSON(message.content[0].text);
    const scale = getScale(correction.errors?.length || 0);
    correction.scale = scale;

    try {
      db.prepare(`
        INSERT INTO user_progress (email, text_id, text_title, level, score, errors_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.session.profile.email, textId || 'unknown', textTitle || '', level || 'unknown', correction.score, correction.errors?.length || 0);
    } catch (dbErr) { console.error('DB error:', dbErr.message); }

    res.json(correction);
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Error en la correcció. Torna a provar.' });
  }
});

// ── Correcció per foto ───────────────────────────────────────
router.post('/correct-image', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Cal adjuntar una foto' });
  const { originalText, level, textId, textTitle } = req.body;
  if (!originalText) return res.status(400).json({ error: 'Falta el text original' });

  const cleanOriginal = originalText.replace(/\|\|/g, '').replace(/\s+/g, ' ').trim();
  const imageBase64 = req.file.buffer.toString('base64');
  const mediaType = req.file.mimetype || 'image/jpeg';

  const prompt = `Ets un professor de català expert en ortografia.

TEXT ORIGINAL (correcte):
"${cleanOriginal}"

L'alumne ha escrit el dictado a mà en paper. A la imatge pots veure el que ha escrit.

La teva tasca:
1. Transcriu exactament el que veies escrit a la imatge (camp "transcription").
2. Compara la transcripció amb el TEXT ORIGINAL i identifica TOTES les diferències.
3. Classifica cada error com: ortografia, accentuació, puntuació, paraula incorrecta, paraula omesa, o paraula afegida.
4. Retorna un JSON amb aquest format:

{
  "transcription": <text transcrit de la imatge>,
  "score": <número del 0 al 100>,
  "totalWords": <nombre total de paraules de l'original>,
  "correctWords": <nombre de paraules correctes>,
  "errors": [
    {
      "position": <índex de la paraula (0-based)>,
      "original": <paraula original correcte>,
      "userWrote": <el que ha escrit l'alumne>,
      "type": <"ortografia" | "accentuació" | "puntuació" | "paraula incorrecta" | "paraula omesa" | "paraula afegida">,
      "explanation": <breu explicació en català>
    }
  ],
  "feedback": <missatge de retroalimentació en català, màxim 2 frases, animant l'alumne>
}

Retorna NOMÉS el JSON, sense cap altre text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });

    const correction = parseClaudeJSON(message.content[0].text);
    const scale = getScale(correction.errors?.length || 0);
    correction.scale = scale;

    try {
      db.prepare(`
        INSERT INTO user_progress (email, text_id, text_title, level, score, errors_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.session.profile.email, textId || 'unknown', textTitle || '', level || 'unknown', correction.score, correction.errors?.length || 0);
    } catch (dbErr) { console.error('DB error:', dbErr.message); }

    res.json(correction);
  } catch (err) {
    console.error('Claude vision error:', err.message);
    res.status(500).json({ error: 'Error en la correcció. Torna a provar.' });
  }
});

// ── Perfil / historial ───────────────────────────────────────
router.get('/profile', requireAuth, (req, res) => {
  const email = req.session.profile.email;
  const rows = db.prepare(`
    SELECT text_id, text_title, level, score, errors_count, completed_at
    FROM user_progress
    WHERE email = ?
    ORDER BY errors_count ASC, completed_at DESC
    LIMIT 50
  `).all(email);

  const withScale = rows.map(r => ({ ...r, scale: getScale(r.errors_count || 0) }));

  const total = rows.length;
  const avgErrors = total ? Math.round(rows.reduce((s, r) => s + (r.errors_count || 0), 0) / total) : 0;
  const best = rows.length ? rows[rows.length - 1] : null; // sorted ASC so last = most errors

  res.json({
    email,
    first_name: req.session.profile.first_name,
    stats: { total, avgErrors, bestErrors: rows[0]?.errors_count ?? null },
    history: withScale,
  });
});

// ── Progrés ──────────────────────────────────────────────────
router.get('/progress', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT text_id, text_title, level, score, errors_count, completed_at
    FROM user_progress WHERE email = ? ORDER BY completed_at DESC LIMIT 20
  `).all(req.session.profile.email);
  res.json(rows);
});

module.exports = router;
