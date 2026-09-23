// preview.js — вся логика страницы превью «Живой темы».

(function () {
  'use strict';

  var D = window.LivingThemeDebug;
  if (!D) {
    document.body.innerHTML =
      '<p style="color:#f66;padding:20px;font-family:sans-serif">' +
      'themes.js не загружен. Проверьте, что файл лежит рядом с preview.html.</p>';
    return;
  }

  // === Ссылки на элементы ===
  var slider          = document.getElementById('timeSlider');
  var timeDisplay     = document.getElementById('timeDisplay');
  var nowBtn          = document.getElementById('nowBtn');
  var playBtn         = document.getElementById('playBtn');
  var nowMarker       = document.getElementById('nowMarker');
  var seasonBtns      = document.querySelectorAll('.season-btn');
  var fakePopup       = document.getElementById('fakePopup');
  var fakeTabsInd     = document.getElementById('fakeTabsIndicator');
  var seasonCompare   = document.getElementById('seasonCompare');
  var elementsPreview = document.getElementById('elementsPreview');
  var grid            = document.getElementById('grid');
  var indicatorStates = document.getElementById('indicatorStates');
  var sealStates      = document.getElementById('sealStates');
  var infoTime        = document.getElementById('infoTime');
  var infoSeason      = document.getElementById('infoSeason');
  var infoDayNight    = document.getElementById('infoDayNight');
  var infoNextChange  = document.getElementById('infoNextChange');

  // === Состояние ===
  var currentSeason = D.getSeason(new Date());
  var isPlaying = false;
  var playInterval = null;

  var SEASONS = ['winter', 'spring', 'summer', 'autumn'];
  var SEASON_LABELS = { winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' };
  var SEASON_RU = { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' };

  // === Применение темы к элементу ===
  function applyTheme(el, date, season) {
    var theme = D.getThemeForDate(date, season);
    var css = D.themeToCSS(theme);

    var hourFrac = date.getHours() + date.getMinutes() / 60;
    var atmos = D.atmosphereAt(hourFrac);
    css['--stars-opacity'] = atmos.stars.toFixed(3);
    css['--glow-opacity']  = atmos.glowOpacity.toFixed(3);
    css['--glow-x']        = atmos.glowX.toFixed(2) + '%';
    css['--glow-y']        = atmos.glowY.toFixed(2) + '%';
    css['--glow-color']    = atmos.glowColor;

    for (var k in css) el.style.setProperty(k, css[k]);
    return theme;
  }

  function isDayTheme(theme) {
    return (theme.bg1[2] + theme.bg2[2]) / 2 > 55;
  }

  // === Индикатор для таблетки ===
  function applyIndicatorFor(tabsEl) {
    var indicator = tabsEl.querySelector('.tabs-indicator');
    var active = tabsEl.querySelector('.tab-btn.active');
    if (!indicator || !active) return;
    var parentRect = tabsEl.getBoundingClientRect();
    var rect = active.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = 'translateX(' + (rect.left - parentRect.left - 1) + 'px)';
  }

  function updateFakeTabsIndicator() {
    if (!fakePopup) return;
    var tabs = fakePopup.querySelector('.tabs');
    if (tabs) applyIndicatorFor(tabs);
  }

  function updateAllIndicators() {
    document.querySelectorAll('[data-indicator-auto]').forEach(applyIndicatorFor);
    updateFakeTabsIndicator();
  }

  // === Переключение вкладок внутри fake-popup ===
  function switchFakeTab(tabId) {
    if (!fakePopup) return;

    fakePopup.querySelectorAll('.tab-content').forEach(function (el) {
      el.style.display = 'none';
      el.classList.remove('active');
    });
    var target = fakePopup.querySelector('[data-fake-content="' + tabId + '"]');
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }

    fakePopup.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.fakeTab === tabId);
    });

    updateFakeTabsIndicator();
  }

  var particlesSeason = null;

  // === Сезонные частицы для fake-popup ===
  function buildFakeParticles(date, season) {
    if (particlesSeason === season) return;
    particlesSeason = season;

    var layer = document.getElementById('fakeParticlesLayer');
    if (!layer) return;
    layer.innerHTML = '';

    var PARTICLE_CONFIG = {
      winter: { emoji: '❄️', count: 42, sizeMin: 12,  sizeMax: 16, durationMin: 10,  durationMax: 20 },
      spring: { emoji: '🌸', count: 36, sizeMin: 10, sizeMax: 16, durationMin: 10, durationMax: 20 },
      summer: { emoji: '✨', count: 32, sizeMin: 12,  sizeMax: 16, durationMin: 10,  durationMax: 20 },
      autumn: { emoji: '🍂', count: 46, sizeMin: 12, sizeMax: 18, durationMin: 12, durationMax: 20 }
    };
    var cfg = PARTICLE_CONFIG[season];
    if (!cfg) return;

    layer.className = 'particles-layer particles-' + season;

    for (var i = 0; i < cfg.count; i++) {
      var p = document.createElement('span');
      p.className = 'particle';
      p.textContent = cfg.emoji;

      var size     = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
      var duration = cfg.durationMin + Math.random() * (cfg.durationMax - cfg.durationMin);
      var delay    = -Math.random() * duration;
      var x        = Math.random() * 100;
      var drift    = (Math.random() - 0.5) * 40;
      var dx       = (Math.random() - 0.5) * 60;
      var dy       = (Math.random() - 0.5) * 40;

      p.style.setProperty('--size', size.toFixed(1) + 'px');
      p.style.setProperty('--duration', duration.toFixed(2) + 's');
      p.style.setProperty('--delay', delay.toFixed(2) + 's');
      p.style.setProperty('--x', x.toFixed(2) + '%');
      p.style.setProperty('--drift', drift.toFixed(1) + 'px');
      p.style.setProperty('--dx', dx.toFixed(1) + 'px');
      p.style.setProperty('--dy', dy.toFixed(1) + 'px');

      if (season === 'summer') {
        p.style.top = (Math.random() * 100).toFixed(1) + '%';
      }

      layer.appendChild(p);
    }
  }

  // === Копия попапа ===
  function renderFakePopup(date, season) {
    var theme = applyTheme(fakePopup, date, season);
    var isDay = isDayTheme(theme);
    fakePopup.setAttribute('data-season', season);
    fakePopup.classList.add('proxy-on');
    fakePopup.classList.toggle('is-day', isDay);
    fakePopup.classList.toggle('is-night', !isDay);

    buildFakeParticles(date, season);

    requestAnimationFrame(function () {
      updateFakeTabsIndicator();
    });
  }

  // === Сравнение сезонов ===
  function buildSeasonCompare() {
    seasonCompare.innerHTML = SEASONS.map(function (s) {
      return '' +
        '<div class="season-compare-tile">' +
          '<div class="tile tile-large active mini-popup theme-surface proxy-on" data-season="' + s + '">' +
            '<div class="tile-seal" aria-hidden="true"></div>' +
            '<div class="tile-content">' +
              '<div class="tile-title">ПРОКСИ</div>' +
              '<div class="tile-status">ВКЛ</div>' +
              '<div class="tile-host">127.0.0.1:8080</div>' +
            '</div>' +
            '<div class="status-indicator"></div>' +
          '</div>' +
          '<span class="season-label">' + SEASON_LABELS[s] + '</span>' +
        '</div>';
    }).join('');
  }

  function renderSeasonCompare(date) {
    SEASONS.forEach(function (s) {
      var tile = seasonCompare.querySelector('.mini-popup[data-season="' + s + '"]');
      if (!tile) return;
      var theme = applyTheme(tile, date, s);
      var isDay = isDayTheme(theme);
      tile.classList.add('proxy-on');
      tile.classList.toggle('is-day', isDay);
      tile.classList.toggle('is-night', !isDay);
    });
  }

  // === Элементы интерфейса ===
  function renderElementsPreview(date, season) {
    applyTheme(elementsPreview, date, season);
  }

  // === Сетка 24 часов ===
  function renderGrid(date, season) {
    grid.innerHTML = '';
    for (var h = 0; h < 24; h++) {
      var d = new Date(2024, 5, 15, h, 0, 0, 0);
      var tile = document.createElement('div');
      tile.className = 'tile-mini';
      var hh = (h < 10 ? '0' : '') + h;
      tile.innerHTML =
        '<span class="mini-hour">' + hh + ':00</span>' +
        '<span class="mini-status">ON</span>' +
        '<span class="mini-dot"></span>';
      applyTheme(tile, d, season);
      grid.appendChild(tile);
    }
  }

  // === Состояния индикатора ===
  function renderIndicatorStates(date, season) {
    var boxes = indicatorStates.querySelectorAll('.indicator-state-box');
    boxes.forEach(function (box) {
      applyTheme(box, date, season);
    });
  }

  // === Сезонная печать ===
  function renderSealStates(date, season) {
    if (!sealStates) return;
    var boxes = sealStates.querySelectorAll('.seal-state-box');
    boxes.forEach(function (box) {
      var boxSeason = box.getAttribute('data-seal-season');
      applyTheme(box, date, boxSeason);
      var isDay = isDayTheme(D.getThemeForDate(date, boxSeason));
      box.classList.toggle('is-day', isDay);
      box.classList.toggle('is-night', !isDay);
    });
  }

  // === Инфо-строка ===
  function findNextTransition(date, season) {
    var theme = D.getThemeForDate(date, season);
    var currentIsDay = isDayTheme(theme);
    var startMins = date.getHours() * 60 + date.getMinutes();

    for (var i = 5; i <= 1440; i += 5) {
      var probeMins = (startMins + i) % 1440;
      var probeDate = new Date(2024, 5, 15, Math.floor(probeMins / 60), probeMins % 60, 0, 0);
      var probeTheme = D.getThemeForDate(probeDate, season);
      var probeIsDay = isDayTheme(probeTheme);
      if (probeIsDay !== currentIsDay) {
        return { minutes: i, targetIsDay: probeIsDay };
      }
    }
    return null;
  }

  function formatDuration(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var parts = [];
    if (h > 0) parts.push(h + ' ч');
    if (m > 0) parts.push(m + ' мин');
    return parts.join(' ') || '0 мин';
  }

  function renderInfo(date, season) {
    var hh = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var mm = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    infoTime.textContent = hh + ':' + mm;
    infoSeason.textContent = SEASON_RU[season] || season;

    var theme = D.getThemeForDate(date, season);
    var isDay = isDayTheme(theme);
    infoDayNight.textContent = isDay ? 'день' : 'ночь';

    var trans = findNextTransition(date, season);
    if (!trans) {
      infoNextChange.textContent = '—';
      return;
    }
    var word = trans.targetIsDay ? 'рассвета' : 'заката';
    infoNextChange.textContent = 'до ' + word + ' ' + formatDuration(trans.minutes);
  }

  // === Метка реального времени ===
  function updateNowMarker() {
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    nowMarker.style.left = (mins / 1439 * 100) + '%';
  }

  // === Ползунок ===
  function sliderMinutes() {
    return parseInt(slider.value, 10) || 0;
  }

  function updateTimeDisplay(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    timeDisplay.textContent =
      (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function updateSeasonButtons() {
    seasonBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.season === currentSeason);
    });
  }

  // === Главный рендер ===
  function renderAll() {
    var mins = sliderMinutes();
    var date = new Date(2024, 5, 15, Math.floor(mins / 60), mins % 60, 0, 0);
    updateTimeDisplay(mins);
    renderFakePopup(date, currentSeason);
    renderSeasonCompare(date);
    renderElementsPreview(date, currentSeason);
    renderSealStates(date, currentSeason);
    renderGrid(date, currentSeason);
    renderIndicatorStates(date, currentSeason);
    renderInfo(date, currentSeason);
  }

  // === Слушатели ===
  slider.addEventListener('input', renderAll);

  nowBtn.addEventListener('click', function () {
    var now = new Date();
    slider.value = now.getHours() * 60 + now.getMinutes();
    renderAll();
  });

  playBtn.addEventListener('click', function () {
    if (isPlaying) {
      clearInterval(playInterval);
      playInterval = null;
      isPlaying = false;
      playBtn.textContent = '▶';
    } else {
      isPlaying = true;
      playBtn.textContent = '⏸';
      playInterval = setInterval(function () {
        var v = sliderMinutes() + 5;
        if (v > 1439) v = 0;
        slider.value = v;
        renderAll();
      }, 100);
    }
  });

  seasonBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentSeason = btn.dataset.season;
      updateSeasonButtons();
      renderAll();
    });
  });

  // === Переключение вкладок в fake-popup ===
  document.querySelectorAll('#fakePopup .tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchFakeTab(btn.dataset.fakeTab);
    });
  });

  // === Инициализация ===
  currentSeason = D.getSeason(new Date());
  var now = new Date();
  slider.value = now.getHours() * 60 + now.getMinutes();
  updateTimeDisplay(sliderMinutes());
  updateSeasonButtons();
  buildSeasonCompare();
  updateNowMarker();
  renderAll();

  window.addEventListener('resize', function () {
    updateAllIndicators();
  });

  requestAnimationFrame(function () {
    updateAllIndicators();
  });

  setInterval(updateNowMarker, 60000);

  // === Переключатель цветовой схемы ===
  var schemePreviewBtns = document.querySelectorAll('.scheme-preview-btn');
  schemePreviewBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (typeof D.setColorScheme === 'function') {
        D.setColorScheme(btn.dataset.scheme);
      }
      schemePreviewBtns.forEach(function (b) {
        b.classList.toggle('active', b.dataset.scheme === btn.dataset.scheme);
      });
      renderAll();
    });
  });

  // ============================================================
  // ТЕСТОВАЯ ПАНЕЛЬ (DRY RUN)
  // ============================================================

  var dryRun = document.getElementById('dryRun');
  var dryLog = document.getElementById('dryRunLog');
  var dryValidateInput = document.getElementById('dryValidateInput');
  var dryToastEl = null;
  var dryToastTimer = null;
  var dryErrorCounter = 0;

  function logEvent(text) {
    if (!dryLog) return;
    var d = new Date();
    var hh = ('0' + d.getHours()).slice(-2);
    var mm = ('0' + d.getMinutes()).slice(-2);
    var ss = ('0' + d.getSeconds()).slice(-2);
    var entry = document.createElement('div');
    entry.className = 'dry-log-entry';
    var time = document.createElement('span');
    time.className = 'dry-log-time';
    time.textContent = hh + ':' + mm + ':' + ss;
    var msg = document.createElement('span');
    msg.textContent = text;
    entry.appendChild(time);
    entry.appendChild(msg);
    dryLog.insertBefore(entry, dryLog.firstChild);
    while (dryLog.children.length > 50) {
      dryLog.removeChild(dryLog.lastChild);
    }
  }

  // Создать (однократно) #dryToast с разметкой тоста.
  function ensureDryToast() {
    if (dryToastEl && document.body.contains(dryToastEl)) return dryToastEl;
    dryToastEl = document.createElement('div');
    dryToastEl.id = 'dryToast';
    dryToastEl.className = 'toast';
    dryToastEl.setAttribute('popover', 'manual');
    dryToastEl.innerHTML =
      '<span class="toast-icon"></span>' +
      '<span class="toast-text"></span>' +
      '<span class="toast-progress"></span>';
    document.body.appendChild(dryToastEl);
    return dryToastEl;
  }

  // Упрощённый мок showToast из popup.js.
  function mockToast(text, duration, iconOverride) {
    duration = duration || 3500;
    text = text || '';

    var iconChar = '✅';
    var cleanText = text;
    if (iconOverride) {
      iconChar = iconOverride;
    } else {
      var leading = text.match(/^([✅⚠️❌ℹ️]+)\s*/);
      if (leading) {
        iconChar = leading[1];
        cleanText = text.slice(leading[0].length);
      }
    }

    logEvent('Тост: "' + cleanText + '" ' + iconChar);

    var t = ensureDryToast();
    t.querySelector('.toast-icon').textContent = iconChar;
    t.querySelector('.toast-text').textContent = cleanText;

    var progress = t.querySelector('.toast-progress');
    progress.style.animation = 'none';
    progress.style.width = '100%';
    void progress.offsetWidth;
    progress.style.animation = 'toastProgress ' + duration + 'ms linear forwards';

    try {
      if (!t.matches(':popover-open')) t.showPopover();
    } catch (e) { /* уже открыт */ }

    clearTimeout(dryToastTimer);
    dryToastTimer = setTimeout(function () {
      try { t.hidePopover(); } catch (e) {}
    }, duration);
  }

  // Приветствие — мок showGreetingIfNeeded.
  function mockGreeting(period) {
    var h = new Date().getHours();
    if (!period) {
      if (h >= 5 && h < 12) period = 'morning';
      else if (h >= 12 && h < 18) period = 'day';
      else if (h >= 18 && h < 23) period = 'evening';
      else period = 'night';
    }
    var map = {
      morning: { emoji: '🌅', text: 'Доброе утро' },
      day:     { emoji: '☀️', text: 'Добрый день' },
      evening: { emoji: '🌇', text: 'Добрый вечер' },
      night:   { emoji: '🌙', text: 'Доброй ночи' }
    };
    var cfg = map[period] || map.morning;
    mockToast(cfg.text, 5000, cfg.emoji);
  }

  // Копия playJoyAnimation из popup.js.
  function mockJoy(long) {
    logEvent('Joy ' + (long ? 'длинная' : 'короткая'));
    if (!fakePopup) return;
    var tile = fakePopup.querySelector('.tile-large');
    if (!tile) return;
    tile.classList.remove('joy', 'joy-long');
    void tile.offsetWidth;
    tile.classList.add(long ? 'joy-long' : 'joy');
    setTimeout(function () {
      tile.classList.remove('joy', 'joy-long');
    }, long ? 1400 : 900);
  }

  function mockTileError() {
    logEvent('Ошибка плитки');
    if (!fakePopup) return;
    var tile = fakePopup.querySelector('.tile-large');
    if (!tile) return;
    tile.classList.remove('error');
    void tile.offsetWidth;
    tile.classList.add('error');
    setTimeout(function () {
      tile.classList.remove('error');
    }, 2200);
  }

  function mockPing() {
    logEvent('Обновить пинг');
    if (!fakePopup) return;
    var pv = fakePopup.querySelector('.ping-value');
    var dot = fakePopup.querySelector('.ping-dot');
    if (!pv || !dot) return;

    var latency = 20 + Math.floor(Math.random() * 580);
    pv.textContent = latency;
    pv.classList.remove('ping-updating');
    void pv.offsetWidth;
    pv.classList.add('ping-updating');

    dot.classList.add('active');
    void dot.offsetWidth;
    dot.classList.add('ping-pulse');
    setTimeout(function () { dot.classList.remove('ping-pulse'); }, 420);
    setTimeout(function () { pv.classList.remove('ping-updating'); }, 500);
  }

  function mockIp() {
    logEvent('Обновить IP');
    if (!fakePopup) return;
    var ipEl = fakePopup.querySelector('.ip-value');
    var flagEl = fakePopup.querySelector('.flag');
    if (!ipEl || !flagEl) return;

    var ip = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    ].join('.');

    var flags = ['🇺🇸', '🇩🇪', '🇫🇷', '🇳🇱', '🇯🇵', '🇬🇧'];
    var flag = flags[Math.floor(Math.random() * flags.length)];

    ipEl.textContent = ip;
    flagEl.textContent = flag;

    ipEl.classList.remove('copied');
    void ipEl.offsetWidth;
    ipEl.classList.add('copied');
    setTimeout(function () { ipEl.classList.remove('copied'); }, 750);
  }

  function mockAddLog() {
    dryErrorCounter++;
    logEvent('Добавить лог №' + dryErrorCounter);
    switchFakeTab('settings');
    if (!fakePopup) return;
    var list = fakePopup.querySelector('.logs-list');
    if (!list) return;

    var empty = list.querySelector('.log-empty');
    if (empty) empty.remove();

    var d = new Date();
    var hh = ('0' + d.getHours()).slice(-2);
    var mm = ('0' + d.getMinutes()).slice(-2);
    var ss = ('0' + d.getSeconds()).slice(-2);

    var entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML =
      '<span class="log-time">' + hh + ':' + mm + ':' + ss + '</span>' +
      '<span class="log-icon">⚠️</span>' +
      '<span class="log-msg">Тестовая ошибка №' + dryErrorCounter + '</span>';
    list.appendChild(entry);

    while (list.children.length > 20) {
      list.removeChild(list.firstChild);
    }
  }

  function mockClearLogs() {
    logEvent('Очистить логи');
    switchFakeTab('settings');
    if (!fakePopup) return;
    var list = fakePopup.querySelector('.logs-list');
    if (!list) return;
    list.innerHTML = '<div class="log-empty">Нет ошибок</div>';
  }

  // Дублирует isValidDomain из popup.js — синхронизировать при изменении.
  function validateAddress(input) {
    if (input === undefined || input === null || String(input).trim() === '') {
      return { ok: false, reason: 'пустой ввод' };
    }
    var s = String(input).trim().toLowerCase();

    if (s === 'localhost') return { ok: true };

    // IPv4 без ведущих нулей.
    var ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
    if (ipv4Regex.test(s)) return { ok: true };

    // Если похоже на IPv4 — сообщаем конкретную причину.
    if (/^[0-9.]+$/.test(s)) {
      if (/^0[0-9]/.test(s) || /\.0[0-9]/.test(s)) {
        return { ok: false, reason: 'ведущие нули в IP недопустимы' };
      }
      var parts = s.split('.');
      if (parts.length === 4) {
        for (var i = 0; i < parts.length; i++) {
          var n = parseInt(parts[i], 10);
          if (parts[i] === '' || isNaN(n) || n > 255) {
            return { ok: false, reason: 'октет вне диапазона 0–255' };
          }
        }
      }
      return { ok: false, reason: 'неверный формат IP' };
    }

    // Домен.
    var domainRegex = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+([a-zA-Z]{2,63}|xn--[a-zA-Z0-9-]{2,59})$/;
    if (domainRegex.test(s)) return { ok: true };

    // Диагностика.
    if (s.indexOf('*') !== -1) return { ok: false, reason: 'wildcard не поддерживается' };
    if (s.indexOf('://') !== -1) return { ok: false, reason: 'URL с протоколом не поддерживается' };
    if (s.indexOf('/') !== -1) return { ok: false, reason: 'подсети не поддерживаются' };
    if (s.indexOf('..') !== -1) return { ok: false, reason: 'двойная точка недопустима' };
    if (s.indexOf(':') !== -1) return { ok: false, reason: 'домен с портом не поддерживается' };
    if (/^-/.test(s) || /\.-/.test(s)) return { ok: false, reason: 'сегмент не может начинаться с дефиса' };
    if (/-$/.test(s) || /-\./.test(s)) return { ok: false, reason: 'сегмент не может заканчиваться дефисом' };
    if (s.indexOf('.') === -1) return { ok: false, reason: 'нет TLD' };

    return { ok: false, reason: 'неверный формат домена' };
  }

  function mockValidate() {
    var raw = dryValidateInput ? dryValidateInput.value.trim() : '';
    var result = validateAddress(raw);
    if (result.ok) {
      logEvent('✅ «' + raw + '» — валидно');
    } else {
      logEvent('⚠️ «' + raw + '» — не валидно: ' + result.reason);
    }
  }

  // Единый обработчик кликов по dry-run панели.
  if (dryRun) {
    dryRun.addEventListener('click', function (e) {
      var btn = e.target.closest('.dry-btn');
      if (!btn) return;
      var action = btn.dataset.action;
      switch (action) {
        case 'toast-success':  mockToast('Настройки сохранены', 3500, '✅'); break;
        case 'toast-error':    mockToast('Прокси-сервер недоступен', 3500, '⚠️'); break;
        case 'toast-critical': mockToast('Не удалось включить прокси', 3500, '❌'); break;
        case 'toast-info':     mockToast('Обновление готово', 3500, 'ℹ️'); break;

        case 'greet-morning':  mockGreeting('morning'); break;
        case 'greet-day':      mockGreeting('day'); break;
        case 'greet-evening':  mockGreeting('evening'); break;
        case 'greet-night':    mockGreeting('night'); break;
        case 'greet-auto':     mockGreeting(); break;

        case 'joy-short':      mockJoy(false); break;
        case 'joy-long':       mockJoy(true); break;
        case 'tile-error':     mockTileError(); break;

        case 'ping':           mockPing(); break;
        case 'ip':             mockIp(); break;

        case 'log-add':        mockAddLog(); break;
        case 'log-clear':      mockClearLogs(); break;

        case 'tab-proxy':      logEvent('Вкладка: Прокси'); switchFakeTab('proxy'); break;
        case 'tab-settings':   logEvent('Вкладка: Настройки'); switchFakeTab('settings'); break;

        case 'validate':       mockValidate(); break;
      }
    });
  }

  // Создаём #dryToast заранее и логируем готовность.
  ensureDryToast();
  logEvent('Тестовая панель готова');

})();