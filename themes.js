// themes.js — «Живая тема» v2.
// 24 часовые темы (HOUR_THEMES) + 4 сезонных модификатора (SEASON_MODS).
// Интерполяция — по минутам между текущим и следующим часом.
// Атмосфера (звёзды/дымка) — через CSS-переменные на body.

// ============ СЕЗОННЫЕ МОДИФИКАТОРЫ (три схемы) ============
// «Стандартная» — текущая.
// «Пастель» — приглушённые, светлые тона.
// «Контраст» — насыщенные, резкие.
const SEASON_MODS_STANDARD = {
  winter: { hueShift: +10, satMul: 0.7, lightShift: +2 },
  spring: { hueShift: -5,  satMul: 1.0, lightShift: 0 },
  summer: { hueShift: -10, satMul: 1.2, lightShift: -2 },
  autumn: { hueShift: +15, satMul: 0.9, lightShift: -1 }
};

const SEASON_MODS_PASTEL = {
  winter: { hueShift: +10, satMul: 0.7,  lightShift: +5 },
  spring: { hueShift: -5,  satMul: 0.85, lightShift: +3 },
  summer: { hueShift: -10, satMul: 0.95, lightShift: +1 },
  autumn: { hueShift: +15, satMul: 0.8,  lightShift: +3 }
};

const SEASON_MODS_CONTRAST = {
  winter: { hueShift: +10, satMul: 1.0, lightShift: -2 },
  spring: { hueShift: -5,  satMul: 1.3, lightShift: -3 },
  summer: { hueShift: -10, satMul: 1.5, lightShift: -5 },
  autumn: { hueShift: +15, satMul: 1.2, lightShift: -4 }
};

const SCHEMES = {
  standard: SEASON_MODS_STANDARD,
  pastel:   SEASON_MODS_PASTEL,
  contrast: SEASON_MODS_CONTRAST
};

// Текущая активная схема. По умолчанию — standard.
let currentScheme = 'standard';

function setColorScheme(name) {
  if (SCHEMES[name]) currentScheme = name;
}

// ============ СПЕЦИФИКАЦИЯ 24 ЧАСОВЫХ ТЕМ ============
// Формат: [bgH, bgS, bgL, accH, accS, accL]
const HOUR_SPEC = [
  /* 00 */ [230, 40,  8, 195, 55, 55], // глубокая ночь — тёмно-синий
  /* 01 */ [232, 38,  8, 195, 55, 55], // тёмно-синий
  /* 02 */ [234, 36,  9, 195, 55, 55], // тёмно-синий
  /* 03 */ [236, 36, 10, 195, 55, 55], // тёмно-синий
  /* 04 */ [238, 38, 13, 200, 55, 55], // предрассвет — синий светлеет
  /* 05 */ [240, 42, 20, 200, 55, 55], // предрассвет — синий
  /* 06 */ [ 30, 55, 28,  25, 65, 55], // рассвет — оранжево-красный
  /* 07 */ [ 25, 62, 45,  25, 70, 55], // пик рассвета — оранжевый
  /* 08 */ [ 20, 65, 62,  30, 70, 55], // золотой час — оранжево-золотой
  /* 09 */ [ 35, 60, 78,  30, 70, 50], // утро — жёлто-оранжевый
  /* 10 */ [ 55, 55, 88,  35, 65, 45], // жёлтый
  /* 11 */ [140, 30, 90, 200, 40, 45], // переход к голубому
  /* 12 */ [210, 25, 95, 210, 35, 40], // полдень — голубой
  /* 13 */ [212, 20, 96, 212, 30, 40], // полдень
  /* 14 */ [215, 18, 96, 215, 25, 42], // послеполуденное
  /* 15 */ [215, 18, 95, 215, 25, 45], // послеполуденное
  /* 16 */ [215, 20, 92, 215, 28, 45], // послеполуденное
  /* 17 */ [220, 25, 85, 220, 30, 48], // послеполуденное — голубой
  /* 18 */ [230, 35, 65, 230, 40, 55], // к закату — сине-голубой
  /* 19 */ [ 30, 55, 50,  25, 65, 55], // закат — оранжевый
  /* 20 */ [ 20, 60, 38,  25, 70, 55], // поздний закат — оранжево-красный
  /* 21 */ [ 15, 65, 28,  25, 70, 55], // закат догорает — красный
  /* 22 */ [  5, 55, 18, 200, 50, 55], // сумерки — красновато-фиолетовые
  /* 23 */ [230, 48, 12, 195, 50, 55]  // вечер — синий
];

// Сборка полного объекта темы из компактной спецификации.
function buildHourTheme(bgH, bgS, bgL, accH, accS, accL) {
  const isLight = bgL > 55;
  const bg2H = (bgH + 8) % 360;
  const bg2S = Math.min(100, bgS + 8);
  // Светлая тема → второй стоп темнее (пятно в углу становится «тенью»),
  // тёмная тема → второй стоп светлее.
  const bg2L = isLight
    ? Math.max(0, bgL - 14)
    : Math.min(100, bgL + 14);

  return {
    bg1: [bgH, bgS, bgL],
    bg2: [bg2H, bg2S, bg2L],
    text: [bgH, 15, isLight ? 12 : 95],

    tileBg:          [bgH, bgS, Math.min(100, bgL + 8),  isLight ? 0.35 : 0.5],
    tileBorder:      [bgH, bgS, Math.min(100, bgL + 25), 0.25],
    tileHoverBg:     [bgH, bgS, Math.min(100, bgL + 14), isLight ? 0.45 : 0.6],
    tileHoverBorder: [bgH, bgS, Math.min(100, bgL + 32), 0.35],

    tileLargeBg:           [bgH, bgS, Math.min(100, bgL + 8),  isLight ? 0.35 : 0.5],
    tileLargeBorder:       [bgH, bgS, Math.min(100, bgL + 28), 0.35],
    tileLargeActiveBg:     [accH, accS, accL, 0.22],
    tileLargeActiveBorder: [accH, accS, accL, 0.5],

    inputBg:     [bgH, bgS, Math.max(0, bgL - 5),    0.35],
    inputBorder: [bgH, bgS, Math.min(100, bgL + 22), 0.25],
    inputFocus:  [accH, accS, accL],

    tagBg:     [accH, accS, accL, 0.2],
    tagBorder: [accH, accS, accL, 0.35],

    btnBg:           [bgH, bgS, Math.min(100, bgL + 10), 0.08],
    btnBorder:       [bgH, bgS, Math.min(100, bgL + 30), 0.25],
    btnActiveBg:     [accH, accS, accL, 0.7],
    btnActiveBorder: [accH, accS, accL],
    btnActiveColor:  accL < 50 ? [0, 0, 100] : [0, 0, 15]
  };
}

const HOUR_THEMES = HOUR_SPEC.map(s => buildHourTheme(...s));

// ============ УТИЛИТЫ ============

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Интерполяция оттенка по кратчайшей дуге окружности.
function lerpHue(a, b, t) {
  let diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

// Определение сезона по номеру недели года.
function getSeason(date) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / 86400000) + 1;
  const week = Math.min(52, Math.max(1, Math.ceil(dayOfYear / 7)));
  if (week <= 8 || week >= 47) return 'winter';
  if (week <= 21) return 'spring';
  if (week <= 34) return 'summer';
  return 'autumn';
}

// Применение сезонного модификатора ко всем цветам темы.
// Текст не сезонно-модифицируем — он должен всегда оставаться читаемым.
function applySeason(theme, mod) {
  const out = {};
  for (const k in theme) {
    const c = theme[k];
    if (k === 'text') {
      out[k] = c.slice();
      continue;
    }
    const h = (((c[0] + mod.hueShift) % 360) + 360) % 360;
    const s = Math.max(0, Math.min(100, c[1] * mod.satMul));
    const l = Math.max(0, Math.min(100, c[2] + mod.lightShift));
    out[k] = c.length >= 4 ? [h, s, l, c[3]] : [h, s, l];
  }
  return out;
}

// Интерполяция двух тем: канал H — по кратчайшей дуге, остальные — линейно.
function interpolateTheme(a, b, t) {
  const out = {};
  for (const key in a) {
    const ca = a[key];
    const cb = b[key] || ca;
    const len = Math.max(ca.length, cb.length);
    const res = [];
    for (let i = 0; i < len; i++) {
      const def = (i === 3) ? 1 : 0;
      const va = ca[i] !== undefined ? ca[i] : def;
      const vb = cb[i] !== undefined ? cb[i] : def;
      res.push(i === 0 ? lerpHue(va, vb, t) : lerp(va, vb, t));
    }
    out[key] = res;
  }
  return out;
}

// HSL-компоненты → строка hsl(...) / hsla(...).
function hslStr(c) {
  const h = c[0].toFixed(1);
  const s = c[1].toFixed(1);
  const l = c[2].toFixed(1);
  if (c.length >= 4 && c[3] < 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${c[3].toFixed(3)})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// HSL-компоненты → строка hsla(...) с заданной альфой.
function hslaFromHsl(c, alpha) {
  const h = c[0].toFixed(1);
  const s = c[1].toFixed(1);
  const l = c[2].toFixed(1);
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

// ============ ВЫЧИСЛЕНИЕ ТЕКУЩЕЙ ТЕМЫ ============

function getThemeForDate(date = new Date(), seasonOverride = null) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const t = minute / 60;
  const nextHour = (hour + 1) % 24;

  const season = seasonOverride || getSeason(date);
  const mod = SCHEMES[currentScheme][season];

  const a = applySeason(HOUR_THEMES[hour], mod);
  const b = applySeason(HOUR_THEMES[nextHour], mod);
  return interpolateTheme(a, b, t);
}

function getCurrentTheme(date = new Date()) {
  return getThemeForDate(date);
}

// Возвращает true, если текущая тема считается «светлой» (день).
// Использует тот же критерий, что и themeToCSS: средняя светлота фона > 55.
function isDayNow(date = new Date()) {
  const theme = getCurrentTheme(date);
  const bgL = (theme.bg1[2] + theme.bg2[2]) / 2;
  return bgL > 55;
}

// ============ АТМОСФЕРА (звёзды / дымка) ============

function atmosForHour(h) {
  // Звёзды: ярко ночью, слабо на границах, иначе 0.
  let stars = 0;
  if (h >= 23 || h <= 3) stars = 0.9;
  else if (h === 4 || h === 5 || h === 22) stars = 0.3;

  // Дымка: положение, цвет, прозрачность.
  let glowX = 50, glowY = 50;
  let glowColor = 'transparent';
  let glowOpacity = 0;

  if (h >= 5 && h <= 7) {
    glowX = 15; glowY = 85;
    glowColor = 'hsl(25, 85%, 60%)';
    glowOpacity = 0.35;
  } else if (h >= 8 && h <= 16) {
    glowX = 50; glowY = 50;
    glowColor = 'hsl(45, 60%, 85%)';
    glowOpacity = 0.05;
  } else if (h >= 17 && h <= 19) {
    glowX = 85; glowY = 85;
    glowColor = 'hsl(15, 85%, 55%)';
    glowOpacity = 0.4;
  } else if (h >= 20 && h <= 21) {
    glowX = 85; glowY = 85;
    glowColor = 'hsl(320, 60%, 50%)';
    glowOpacity = 0.25;
  }

  return { stars, glowX, glowY, glowColor, glowOpacity };
}

// Интерполяция атмосферы между двумя соседними часами.
// Цвет дымки выбираем у того часа, где она «активнее» — так рывок
// происходит в момент разгорания/гасения, а не в середине часа.
function atmosphereAt(fractionalHour) {
  const h0 = Math.floor(fractionalHour) % 24;
  const h1 = (h0 + 1) % 24;
  const t = fractionalHour - Math.floor(fractionalHour);
  const a = atmosForHour(h0);
  const b = atmosForHour(h1);

  const glowColor = a.glowOpacity >= b.glowOpacity ? a.glowColor : b.glowColor;

  return {
    stars: lerp(a.stars, b.stars, t),
    glowX: lerp(a.glowX, b.glowX, t),
    glowY: lerp(a.glowY, b.glowY, t),
    glowColor: glowColor,
    glowOpacity: lerp(a.glowOpacity, b.glowOpacity, t)
  };
}

// ============ ПРЕОБРАЗОВАНИЕ ТЕМЫ В CSS-ПЕРЕМЕННЫЕ ============

function themeToCSS(theme) {
  const bgL = (theme.bg1[2] + theme.bg2[2]) / 2;
  const isLight = bgL > 55;
  const textIsLight = !isLight;

  const textHue = theme.text[0].toFixed(1);
  const textSat = theme.text[1].toFixed(1);
  const textL = isLight ? 12 : 95;
  const textStr = `hsl(${textHue}, ${textSat}%, ${textL}%)`;

  const shadowA = isLight ? 0.08 : 0.25;
  const wideBodyShadowA = isLight ? 0.1 : 0.2;

  const inputFocusStr = hslStr(theme.inputFocus);
  const focusHi = [
    theme.inputFocus[0],
    theme.inputFocus[1],
    Math.min(90, theme.inputFocus[2] + 25)
  ];

  const indicatorL = isLight ? 60 : 33;
  const offL1 = isLight ? 55 : 60;
  const offL2 = isLight ? 75 : 80;

  const accL = theme.inputFocus[2];
  // Порог 65 учитывает полупрозрачность фона активной кнопки (0.7 alpha):
  // реальная светлота под текстом ≈ 0.7 × accL + 0.3 × bgL.
  const btnActiveColorStr = accL < 65
    ? 'hsl(0, 0%, 100%)'
    : 'hsl(0, 0%, 15%)';

  const btnBorderStr = `hsla(${textHue}, 20%, ${textL}%, 0.3)`;

  const inkBorder   = `hsla(${textHue}, ${textSat}%, ${textL}%, 0.15)`;
  const inkDivider  = `hsla(${textHue}, ${textSat}%, ${textL}%, 0.10)`;
  const inkHeaderHv = `hsla(${textHue}, ${textSat}%, ${textL}%, 0.08)`;
  const headerBgStr = `hsla(${theme.bg1[0].toFixed(1)}, ${theme.bg1[1].toFixed(1)}%, ${Math.min(100, theme.bg1[2] + 5).toFixed(1)}%, 0.25)`;

  return {
    '--bg-gradient': `radial-gradient(circle at 20% 25%, ${hslStr(theme.bg1)}, ${hslStr(theme.bg2)} 75%)`,
    '--text-color': textStr,

    '--tile-bg': hslStr(theme.tileBg),
    '--tile-border': hslStr(theme.tileBorder),
    '--tile-shadow': `0 8px 32px rgba(0, 0, 0, ${shadowA})`,
    '--tile-hover-bg': hslStr(theme.tileHoverBg),
    '--tile-hover-border': hslStr(theme.tileHoverBorder),
    '--tile-hover-shadow': `0 12px 40px rgba(0, 0, 0, ${shadowA})`,

    '--tile-large-bg': hslStr(theme.tileLargeBg),
    '--tile-large-border': hslStr(theme.tileLargeBorder),
    '--tile-large-active-bg': hslStr(theme.tileLargeActiveBg),
    '--tile-large-active-border': hslStr(theme.tileLargeActiveBorder),
    '--tile-large-active-shadow':
      `0 8px 40px ${hslaFromHsl(theme.inputFocus, 0.35)}, ` +
      `inset 0 0 30px ${hslaFromHsl(theme.inputFocus, 0.1)}`,
    '--tile-large-hover-shadow':
      `0 12px 48px rgba(0, 0, 0, ${shadowA}), ` +
      `inset 0 0 20px rgba(255, 255, 255, 0.05)`,
    '--tile-large-active-hover-shadow':
      `0 12px 48px ${hslaFromHsl(theme.inputFocus, 0.45)}, ` +
      `inset 0 0 40px ${hslaFromHsl(theme.inputFocus, 0.15)}`,

    '--status-indicator-bg': `hsl(0, 0%, ${indicatorL}%)`,
    '--status-indicator-active': hslStr(theme.inputFocus),
    '--status-gradient-off':
      `linear-gradient(90deg, hsl(0, 0%, ${offL1}%), hsl(0, 0%, ${offL2}%), hsl(0, 0%, ${offL1}%))`,
    '--status-gradient-on':
      `linear-gradient(90deg, ${hslStr(theme.inputFocus)}, ${hslStr(focusHi)}, ${hslStr(theme.inputFocus)})`,

    '--tile-wide-bg': hslStr([theme.tileBg[0], theme.tileBg[1], theme.tileBg[2], 0.18]),
    '--tile-wide-body-shadow': `0 4px 20px rgba(0, 0, 0, ${wideBodyShadowA})`,
    '--tile-wide-border': inkBorder,
    '--tile-wide-header-bg': headerBgStr,
    '--tile-wide-header-hover': inkHeaderHv,
    '--tile-wide-divider': inkDivider,

    '--input-bg': hslStr(theme.inputBg),
    '--input-border': hslStr(theme.inputBorder),
    '--input-focus-border': hslStr(theme.inputFocus),
    '--input-focus-shadow': `0 0 0 3px ${hslaFromHsl(theme.inputFocus, 0.15)}`,

    '--tag-bg': hslStr(theme.tagBg),
    '--tag-border': hslStr(theme.tagBorder),
    '--tag-hover-bg': hslStr([
      theme.tagBg[0], theme.tagBg[1], theme.tagBg[2],
      Math.min(1, (theme.tagBg[3] || 1) + 0.1)
    ]),
    '--tag-remove-color': isLight ? 'hsl(0, 70%, 40%)' : 'hsl(0, 70%, 65%)',

    '--btn-bg': `hsla(${theme.btnBg[0].toFixed(1)}, ${theme.btnBg[1].toFixed(1)}%, ${theme.btnBg[2].toFixed(1)}%, 0.08)`,
    '--btn-border': btnBorderStr,
    '--btn-active-bg': hslaFromHsl(theme.inputFocus, 0.7),
    '--btn-active-border': hslStr(theme.inputFocus),
    '--btn-active-color': btnActiveColorStr,

    '--tab-bg': hslStr(theme.tileBg),
    '--tab-border': hslStr(theme.tileBorder),
    '--tab-active-bg': hslStr(theme.tileHoverBg),
    '--tab-active-border': hslStr(theme.inputFocus),

    '--log-entry-bg': hslStr(theme.tileBg),
    '--log-entry-border': hslStr(theme.tileBorder),
    '--log-time-color': `hsla(${textHue}, 15%, ${textL}%, 0.5)`,

    '--msg-error-color': isLight ? 'hsl(0, 70%, 40%)' : 'hsl(0, 70%, 65%)',
    '--drag-over-bg': hslStr(theme.tagBorder),
    '--ripple-bg': isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.3)',
    '--tile-ripple-bg': isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.2)',

    '--toast-bg': textIsLight ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    '--toast-color': textIsLight ? '#ffffff' : '#222222',

    '--tutorial-overlay-bg': isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    '--tutorial-box-bg': isLight ? 'rgba(245, 245, 245, 0.95)' : 'rgba(20, 20, 30, 0.95)',
    '--tutorial-box-border': isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    '--tutorial-text': isLight ? '#1e1e1e' : '#ffffff',
    '--tutorial-btn-bg': isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
    '--tutorial-btn-hover': isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)',
    '--tutorial-highlight-shadow':
      `0 0 0 3px ${inputFocusStr}, ` +
      `0 0 20px ${hslaFromHsl(theme.inputFocus, 0.4)}`,

    '--stars-opacity': '0',
    '--glow-opacity': '0',
    '--glow-x': '50%',
    '--glow-y': '50%',
    '--glow-color': 'transparent'
  };
}

// ============ ПРИМЕНЕНИЕ К BODY ============

function applyLivingTheme() {
  const now = new Date();
  const theme = getCurrentTheme(now);
  const css = themeToCSS(theme);

  const hourFrac = now.getHours() + now.getMinutes() / 60;
  const atmos = atmosphereAt(hourFrac);
  css['--stars-opacity'] = atmos.stars.toFixed(3);
  css['--glow-opacity'] = atmos.glowOpacity.toFixed(3);
  css['--glow-x'] = atmos.glowX.toFixed(2) + '%';
  css['--glow-y'] = atmos.glowY.toFixed(2) + '%';
  css['--glow-color'] = atmos.glowColor;

  document.body.classList.add('theme-living');
  for (const key in css) {
    document.body.style.setProperty(key, css[key]);
  }
}

function clearLivingTheme() {
  const sample = themeToCSS(HOUR_THEMES[0]);
  for (const key in sample) {
    document.body.style.removeProperty(key);
  }
  document.body.classList.remove('theme-living');
}

// ============ ЖИЗНЕННЫЙ ЦИКЛ ============

let livingIntervalId = null;

// Запуск живой темы. Плавность достигается частотой применения:
// фон меняется небольшими порциями каждые 30 с.
function startLivingTheme(intervalMs = 30000) {
  if (livingIntervalId !== null) {
    clearInterval(livingIntervalId);
    livingIntervalId = null;
  }
  applyLivingTheme();
  livingIntervalId = setInterval(applyLivingTheme, intervalMs);
}

function stopLivingTheme() {
  if (livingIntervalId !== null) {
    clearInterval(livingIntervalId);
    livingIntervalId = null;
  }
  clearLivingTheme();
}

// Экспорт — сигнатура не меняется (используется в popup.js).
window.LivingTheme = {
  start: startLivingTheme,
  stop: stopLivingTheme,
  apply: applyLivingTheme,
  setScheme: setColorScheme
};

// Дополнительный экспорт утилит для preview.html.
window.LivingThemeDebug = {
  HOUR_THEMES,
  HOUR_SPEC,
  SEASON_MODS_STANDARD,
  SEASON_MODS_PASTEL,
  SEASON_MODS_CONTRAST,
  SCHEMES,
  setColorScheme,
  getSeason,
  getThemeForDate,
  getCurrentTheme,
  isDayNow,
  themeToCSS,
  atmosphereAt,
  atmosForHour,
  lerpHue,
  lerp
};