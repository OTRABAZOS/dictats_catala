# Changelog — dictats_catala

## [1.0.0] — 2026-03-22 — Lanzamiento inicial

### Añadido
- Autenticación via MySQL `BrandWaiUserProfile` (mismo sistema que FeedScale)
- 3 niveles predefinidos (Bàsic, Intermedi, Avançat) con 15 textos en catalán
- Nivel "Els meus textos" para textos personales (SQLite)
- Dictado por síntesis de voz (Web Speech API, voz ca-ES)
- Modo editor (textarea) y modo papel con subida de foto opcional
- Corrección por texto y por foto (Claude Vision API)
- Escala motivadora por nº de errores: Excel·lent / Molt bé / Bé / Progressant / Segueix!
- Historial de dictados por usuario con estadísticas
- Vista móvil optimizada (`/mobile`)
- Página de perfil con historial ordenado por errores (`/profile`)
- Avatar con dropdown (perfil + logout)
