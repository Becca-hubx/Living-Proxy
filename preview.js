// preview.js — логика страницы превью «Живой темы» (двухколоночная версия).

(function () {
  'use strict';

  var D = window.LivingThemeDebug;
  if (!D) {
    document.body.innerHTML =
      '<p style="color:#f66;padding:20px;font-family:sans-serif">' +
      'themes.js не загружен. Проверьте, что файл лежит рядом с preview.html.</p>';
    return;
  }

  // ============================================================
  // Ссылки на элементы
  // ============================================================

  // --- Копия попапа ---
  var fakePopup         = document.getElementById('fakePopup');
  var fakeMainTile      = document.getElementById('fakeMainTile');
  var fakeStatusText    = document.getElementById('fakeStatusText');
  var fakeHostDisplay   = document.getElementById('fakeHostDisplay');
  var fakeRealIpValue   = document.getElementById('fakeRealIpValue');
  var fakeFlagDisplay   = document.getElementById('fakeFlagDisplay');
  var fakePingValue     = document.getElementById('fakePingValue');
  var fakePingDot       = document.getElementById('fakePingDot');
  var fakePingChart     = document.getElementById('fakePingChart');
  var fakeTabsIndicator = document.getElementById('fakeTabsIndicator');
  var fakeTagsContainer = document.getElementById('fakeTagsContainer');
  var fakeTagInput      = document.getElementById('fakeTagInput');
  var fakeAddTagBtn     = document.getElementById('fakeAddTagBtn');
  var fakeProxyHostInput= document.getElementById('fakeProxyHostInput');
  var fakeProxyPortInput= document.getElementById('fakeProxyPortInput');
  var fakeSaveBtn       = document.getElementById('fakeSaveBtn');
  var fakeLogsList      = document.getElementById('fakeLogsList');
  var fakeCopyLogsBtn   = document.getElementById('fakeCopyLogsBtn');
  var fakeClearLogsBtn  = document.getElementById('fakeClearLogsBtn');
  var fakeRefreshIpBtn  = document.getElementById('fakeRefreshIpBtn');
  var fakeToggleParticles = document.getElementById('fakeToggleParticles');
  var fakeToggleJoy     = document.getElementById('fakeToggleJoy');
  var fakeSeasonInd     = document.getElementById('fakeSeasonIndicator');

  // --- Правая колонка ---
  var slider            = document.getElementById('timeSlider');
  var timeDisplay       = document.getElementById('timeDisplay');
  var nowBtn            = document.getElementById('nowBtn');
  var playBtn           = document.getElementById('playBtn');
  var nowMarker         = document.getElementById('nowMarker');
  var seasonBtns        = document.querySelectorAll('.season-btn');
  var schemePreviewBtns = document.querySelectorAll('.scheme-preview-btn');
  var infoTime          = document.getElementById('infoTime');
  var infoSeason        = document.getElementById('infoSeason');
  var infoDayNight      = document.getElementById('infoDayNight');
  var infoNextChange    = document.getElementById('infoNextChange');
  var dryValidateInput  = document.getElementById('dryValidateInput');

  // --- Витрина ---
  var seasonCompare     = document.getElementById('seasonCompare');
  var elementsPreview   = document.getElementById('elementsPreview');
  var sealStates        = document.getElementById('sealStates');
  var grid              = document.getElementById('grid');
  var indicatorStates   = document.getElementById('indicatorStates');

  // --- Лог-панель ---
  var dryLogToggle      = document.getElementById('dryLogToggle');
  var dryLogPanel       = document.getElementById('dryLogPanel');
  var dryLogClear       = document.getElementById('dryLogClear');
  var dryLogClose       = document.getElementById('dryLogClose');
  var dryRunLog         = document.getElementById('dryRunLog');

  // ============================================================
  // Состояние
  // ============================================================
  var currentSeason = D.getSeason(new Date());
  var isPlaying = false;
  var playInterval = null;

  // Копия попапа
  var fakeStatus = 'off';       // 'on' | 'off' | 'error' | 'not-configured'
  var fakeTags = ['example.com', '192.168.1.1'];
  var fakeHost = '127.0.0.1';
  var fakePort = '8080';
  var fakeIp = '8.8.8.8';
  var fakeFlag = '🇺🇸';
  var fakePingVal = 120;
  var fakeLogsEmpty = false;
  var fakeLogs = [
    { time: '14:32:01', msg: 'Не удалось выполнить команду' },
    { time: '12:08:45', msg: 'Прокси-сервер недоступен' }
  ];

  // Схема
  var currentSchemeName = 'standard';

  var SEASONS = ['winter', 'spring', 'summer', 'autumn'];
  var SEASON_LABELS = { winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' };
  var SEASON_RU = { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' };
  var SEASON_EMOJI = { winter: '❄️', spring: '🌸', summer: '☀️', autumn: '🍂' };

  var dryErrorCounter = 0;

  // ============================================================
  // Утилиты
  // ============================================================
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pingColor(value) {
    if (value < 100) return '#22c55e';
    if (value < 300) return '#2ecc71';
    if (value < 600) return '#f39c12';
    return '#e63946';
  }

  // ============================================================
  // Тема — применение к элементу
  // ============================================================
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

  // ============================================================
  // Таблетки-индикаторы
  // ============================================================
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

  // ============================================================
  // Fake popup — табы, состояние, i18n
  // ============================================================
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
    requestAnimationFrame(updateFakeTabsIndicator);
  }

  function updateFakeStatusText() {
    if (!fakeStatusText) return;
    var key = 'statusOff';
    if (fakeStatus === 'on') key = 'statusOn';
    else if (fakeStatus === 'error') key = 'statusError';
    fakeStatusText.textContent = I18n.t(key);
  }

  function updateFakeHostDisplay() {
    if (!fakeHostDisplay) return;
    if (fakeStatus === 'not-configured') {
      fakeHostDisplay.textContent = I18n.t('notConfigured');
    } else {
      fakeHostDisplay.textContent = fakeHost + ':' + fakePort;
    }
  }

  function updateFakeIpDisplay() {
    if (fakeIp) {
      fakeRealIpValue.textContent = fakeIp;
      fakeFlagDisplay.textContent = fakeFlag;
    } else {
      fakeRealIpValue.textContent = '—';
      fakeFlagDisplay.textContent = '🌍';
    }
  }

  function renderFakeLogs() {
    if (!fakeLogsList) return;
    if (fakeLogsEmpty || fakeLogs.length === 0) {
      fakeLogsList.innerHTML = '<div class="log-empty">' + escapeHtml(I18n.t('noLogs')) + '</div>';
      return;
    }
    fakeLogsList.innerHTML = fakeLogs.map(function (l) {
      return '<div class="log-entry">' +
        '<span class="log-time">' + escapeHtml(l.time) + '</span>' +
        '<span class="log-icon">⚠️</span>' +
        '<span class="log-msg">' + escapeHtml(l.msg) + '</span>' +
        '</div>';
    }).join('');
  }

  function renderFakePingChart(values) {
    if (!fakePingChart) return;
    fakePingChart.innerHTML = '';
    if (!values || values.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'chart-empty';
      empty.textContent = '—';
      fakePingChart.appendChild(empty);
      return;
    }
    var maxVal = Math.max(500, Math.max.apply(null, values));
    values.forEach(function (v, i) {
      var bar = document.createElement('span');
      bar.className = 'chart-dot chart-bar';
      bar.style.background = pingColor(v);
      var h = Math.max(20, Math.min(100, (v / maxVal) * 100));
      bar.style.height = h + '%';
      bar.title = v + ' мс';
      if (i === values.length - 1) bar.classList.add('chart-bar-new');
      fakePingChart.appendChild(bar);
    });
  }

  // Полное обновление динамики fake popup
  function refreshFakeDynamic() {
    updateFakeStatusText();
    updateFakeHostDisplay();
    updateFakeIpDisplay();

    if (fakeStatus === 'on') {
      fakeMainTile.classList.add('active');
      fakeMainTile.classList.remove('error');
      fakePingValue.textContent = String(fakePingVal);
      fakePingDot.classList.add('active');
      var sample = [];
      for (var i = 0; i < 20; i++) sample.push(60 + Math.round(Math.random() * 200));
      renderFakePingChart(sample);
    } else if (fakeStatus === 'error') {
      fakeMainTile.classList.remove('active');
      fakeMainTile.classList.add('error');
      fakePingValue.textContent = '∞';
      fakePingDot.classList.remove('active');
      renderFakePingChart([]);
    } else {
      fakeMainTile.classList.remove('active', 'error');
      fakePingValue.textContent = '—';
      fakePingDot.classList.remove('active');
      renderFakePingChart([]);
    }
    fakePopup.classList.toggle('proxy-on', fakeStatus === 'on');
  }

  function setFakeStatus(status) {
    fakeStatus = status;
    refreshFakeDynamic();
    logEvent('Состояние попапа: ' + status);
  }

  function setFakeEmptyIp() {
    fakeIp = null;
    fakeFlag = null;
    updateFakeIpDisplay();
    logEvent('Состояние попапа: пустой IP');
  }

  function setFakeNoLogs() {
    fakeLogsEmpty = true;
    renderFakeLogs();
    logEvent('Состояние попапа: нет логов');
  }

  // Теги fake popup
  function renderFakeTags() {
    if (!fakeTagsContainer) return;
    fakeTagsContainer.innerHTML = fakeTags.map(function (t) {
      return '<span class="tag">' + escapeHtml(t) +
        '<span class="tag-remove" data-tag="' + escapeHtml(t) + '">×</span></span>';
    }).join('');
    fakeTagsContainer.querySelectorAll('.tag-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = btn.dataset.tag;
        fakeTags = fakeTags.filter(function (t) { return t !== tag; });
        renderFakeTags();
        logEvent('Удалён тег: ' + tag);
      });
    });
  }

  // ============================================================
  // Частицы в fake popup
  // ============================================================
  var particlesSeason = null;

  function buildFakeParticles(season) {
    if (particlesSeason === season) return;
    particlesSeason = season;

    var layer = document.getElementById('fakeParticlesLayer');
    if (!layer) return;
    layer.innerHTML = '';

    var cfg = {
      winter: { emoji: '❄️', count: 42, sizeMin: 12,  sizeMax: 16, durationMin: 10, durationMax: 20 },
      spring: { emoji: '🌸', count: 36, sizeMin: 10, sizeMax: 16, durationMin: 10, durationMax: 20 },
      summer: { emoji: '✨', count: 32, sizeMin: 12,  sizeMax: 16, durationMin: 10, durationMax: 20 },
      autumn: { emoji: '🍂', count: 46, sizeMin: 12, sizeMax: 18, durationMin: 12, durationMax: 20 }
    }[season];
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
      if (season === 'summer') p.style.top = (Math.random() * 100).toFixed(1) + '%';

      layer.appendChild(p);
    }
  }

  // ============================================================
  // Отрисовка fake popup
  // ============================================================
  function renderFakePopup(date, season) {
    if (!fakePopup) return;
    var theme = applyTheme(fakePopup, date, season);
    var isDay = isDayTheme(theme);
    fakePopup.setAttribute('data-season', season);
    fakePopup.classList.toggle('is-day', isDay);
    fakePopup.classList.toggle('is-night', !isDay);
    buildFakeParticles(season);

    if (fakeSeasonInd) fakeSeasonInd.textContent = SEASON_EMOJI[season] || '';

    requestAnimationFrame(updateFakeTabsIndicator);
  }

  // ============================================================
  // Витрина
  // ============================================================
  function buildSeasonCompare() {
    if (!seasonCompare) return;
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

  function renderElementsPreview(date, season) {
    if (elementsPreview) applyTheme(elementsPreview, date, season);
  }

  function renderGrid(date, season) {
    if (!grid) return;
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

  function renderIndicatorStates(date, season) {
    if (!indicatorStates) return;
    indicatorStates.querySelectorAll('.indicator-state-box').forEach(function (box) {
      applyTheme(box, date, season);
    });
  }

  function renderSealStates(date, season) {
    if (!sealStates) return;
    sealStates.querySelectorAll('.seal-state-box').forEach(function (box) {
      var boxSeason = box.getAttribute('data-seal-season');
      applyTheme(box, date, boxSeason);
      var isDay = isDayTheme(D.getThemeForDate(date, boxSeason));
      box.classList.toggle('is-day', isDay);
      box.classList.toggle('is-night', !isDay);
    });
  }

  // ============================================================
  // Инфо-строка
  // ============================================================
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
    if (!infoTime) return;
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

  // ============================================================
  // Ползунок времени
  // ============================================================
  function updateNowMarker() {
    if (!nowMarker) return;
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    nowMarker.style.left = (mins / 1439 * 100) + '%';
  }

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

  // ============================================================
  // Главный рендер
  // ============================================================
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

  // ============================================================
  // Тост превью (мок showToast из popup.js)
  // ============================================================
  var dryToastEl = document.getElementById('dryToast');
  var dryToastTimer = null;

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

    dryToastEl.querySelector('.toast-icon').textContent = iconChar;
    dryToastEl.querySelector('.toast-text').textContent = cleanText;

    var progress = dryToastEl.querySelector('.toast-progress');
    progress.style.animation = 'none';
    progress.style.width = '100%';
    void progress.offsetWidth;
    progress.style.animation = 'toastProgress ' + duration + 'ms linear forwards';

    try {
      if (!dryToastEl.matches(':popover-open')) dryToastEl.showPopover();
    } catch (e) { /* уже открыт */ }

    clearTimeout(dryToastTimer);
    dryToastTimer = setTimeout(function () {
      try { dryToastEl.hidePopover(); } catch (e) {}
    }, duration);
  }

  // ============================================================
  // Валидация адреса (дублирует popup.js isValidDomain)
  // ============================================================
  function validateAddress(input) {
    if (input === undefined || input === null || String(input).trim() === '') {
      return { ok: false, reason: 'пустой ввод' };
    }
    var s = String(input).trim().toLowerCase();
    if (s === 'localhost') return { ok: true };

    var ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
    if (ipv4Regex.test(s)) return { ok: true };

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

    var domainRegex = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+([a-zA-Z]{2,63}|xn--[a-zA-Z0-9-]{2,59})$/;
    if (domainRegex.test(s)) return { ok: true };

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

  // ============================================================
  // Лог тестов — панель
  // ============================================================
  function logEvent(text) {
    if (!dryRunLog) return;
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
    dryRunLog.insertBefore(entry, dryRunLog.firstChild);
    while (dryRunLog.children.length > 200) {
      dryRunLog.removeChild(dryRunLog.lastChild);
    }
  }

  function openLogPanel()  { dryLogPanel.classList.add('open'); }
  function closeLogPanel() { dryLogPanel.classList.remove('open'); }

  if (dryLogToggle) {
    dryLogToggle.addEventListener('click', function () {
      dryLogPanel.classList.toggle('open');
    });
  }
  if (dryLogClose) {
    dryLogClose.addEventListener('click', closeLogPanel);
  }
  if (dryLogClear) {
    dryLogClear.addEventListener('click', function () {
      dryRunLog.innerHTML = '';
      logEvent('Лог очищен');
    });
  }

  // ============================================================
  // Мок-функции
  // ============================================================
  function mockGreeting(period) {
    var h = new Date().getHours();
    if (!period) {
      if (h >= 5 && h < 12) period = 'morning';
      else if (h >= 12 && h < 18) period = 'day';
      else if (h >= 18 && h < 23) period = 'evening';
      else period = 'night';
    }
    var map = {
      morning: { emoji: '🌅', text: I18n.t('greetingMorning') },
      day:     { emoji: '☀️', text: I18n.t('greetingDay') },
      evening: { emoji: '🌇', text: I18n.t('greetingEvening') },
      night:   { emoji: '🌙', text: I18n.t('greetingNight') }
    };
    var cfg = map[period] || map.morning;
    mockToast(cfg.text, 5000, cfg.emoji);
  }

  function mockJoy(long) {
    logEvent('Joy ' + (long ? 'длинная' : 'короткая'));
    if (!fakeMainTile) return;
    fakeMainTile.classList.remove('joy', 'joy-long');
    void fakeMainTile.offsetWidth;
    fakeMainTile.classList.add(long ? 'joy-long' : 'joy');
    setTimeout(function () {
      fakeMainTile.classList.remove('joy', 'joy-long');
    }, long ? 1400 : 900);
  }

  function mockTileError() {
    logEvent('Ошибка плитки');
    if (!fakeMainTile) return;
    fakeMainTile.classList.remove('error');
    void fakeMainTile.offsetWidth;
    fakeMainTile.classList.add('error');
    setTimeout(function () {
      fakeMainTile.classList.remove('error');
    }, 2200);
  }

  function mockPing() {
    logEvent('Обновить пинг');
    if (!fakePingValue || !fakePingDot) return;
    var latency = 20 + Math.floor(Math.random() * 580);
    fakePingVal = latency;
    fakePingValue.textContent = latency;
    fakePingValue.classList.remove('ping-updating');
    void fakePingValue.offsetWidth;
    fakePingValue.classList.add('ping-updating');

    fakePingDot.classList.add('active');
    fakePingDot.style.background = pingColor(latency);
    void fakePingDot.offsetWidth;
    fakePingDot.classList.add('ping-pulse');
    setTimeout(function () { fakePingDot.classList.remove('ping-pulse'); }, 420);
    setTimeout(function () { fakePingValue.classList.remove('ping-updating'); }, 500);
  }

  function mockIp() {
    logEvent('Обновить IP');
    if (!fakeRealIpValue) return;
    var ip = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    ].join('.');
    var flags = ['🇺🇸', '🇩🇪', '🇫🇷', '🇳🇱', '🇯🇵', '🇬🇧'];
    var flag = flags[Math.floor(Math.random() * flags.length)];
    fakeIp = ip;
    fakeFlag = flag;
    fakeRealIpValue.textContent = ip;
    fakeFlagDisplay.textContent = flag;
    fakeRealIpValue.classList.remove('copied');
    void fakeRealIpValue.offsetWidth;
    fakeRealIpValue.classList.add('copied');
    setTimeout(function () { fakeRealIpValue.classList.remove('copied'); }, 750);
  }

  function mockAddTag() {
    var raw = (fakeTagInput && fakeTagInput.value || '').trim();
    if (!raw) {
      mockToast(I18n.t('emptyInput'), 2000, '⚠️');
      return;
    }
    var res = validateAddress(raw);
    if (!res.ok) {
      mockToast(I18n.t('invalidDomain'), 2500, '⚠️');
      logEvent('Тег "' + raw + '" — не валидно: ' + res.reason);
      return;
    }
    var lower = raw.toLowerCase();
    if (fakeTags.indexOf(lower) !== -1) {
      mockToast(I18n.t('alreadyExists'), 2000, '⚠️');
      return;
    }
    fakeTags.push(lower);
    renderFakeTags();
    fakeTagInput.value = '';
    logEvent('Добавлен тег: ' + lower);
  }

  function mockRemoveTag() {
    if (fakeTags.length === 0) {
      logEvent('Нет тегов для удаления');
      return;
    }
    var removed = fakeTags.pop();
    renderFakeTags();
    logEvent('Удалён тег: ' + removed);
  }

  function mockSaveSettings() {
    var host = (fakeProxyHostInput && fakeProxyHostInput.value || '').trim();
    var port = (fakeProxyPortInput && fakeProxyPortInput.value || '').trim();

    if (!host) {
      mockToast(I18n.t('emptyInput'), 2000, '⚠️');
      logEvent('Save: пустой host');
      return;
    }
    var res = validateAddress(host);
    if (!res.ok) {
      mockToast(I18n.t('invalidDomain'), 2500, '⚠️');
      logEvent('Save: host не валиден — ' + res.reason);
      return;
    }
    if (!port || isNaN(port) || parseInt(port, 10) < 1 || parseInt(port, 10) > 65535) {
      mockToast(I18n.t('invalid'), 2000, '⚠️');
      logEvent('Save: неверный порт');
      return;
    }
    fakeHost = host;
    fakePort = String(parseInt(port, 10));
    updateFakeHostDisplay();
    mockToast(I18n.t('settingsSaved'), 2500, '✅');
    logEvent('Настройки сохранены: ' + fakeHost + ':' + fakePort);
  }

  function mockCopyIp() {
    if (!fakeIp) {
      mockToast(I18n.t('emptyInput'), 1500, '⚠️');
      return;
    }
    mockToast(I18n.t('copyIp'), 2000, '✅');
  }

  function mockCopyAddress() {
    if (fakeStatus === 'not-configured' || !fakeHost) {
      mockToast(I18n.t('emptyInput'), 1500, '⚠️');
      return;
    }
    mockToast(I18n.t('copyAddress'), 2000, '✅');
  }

  function mockValidate() {
    var raw = (dryValidateInput && dryValidateInput.value || '').trim();
    var result = validateAddress(raw);
    if (result.ok) {
      logEvent('✅ «' + raw + '» — валидно');
    } else {
      logEvent('⚠️ «' + raw + '» — не валидно: ' + result.reason);
    }
  }

  // Туториал
  function startTut(mode) {
    if (typeof window.startTutorial === 'function') {
      try {
        window.startTutorial(mode);
        logEvent('Туториал: запущен (' + mode + ') — оверлей поверх всей страницы');
      } catch (e) {
        logEvent('Ошибка запуска туториала: ' + e.message);
      }
    } else {
      logEvent('tutorial.js не загружен — туториал недоступен');
    }
  }
  function closeTut() {
    if (typeof window.closeTutorial === 'function') {
      try {
        window.closeTutorial();
        logEvent('Туториал закрыт');
      } catch (e) {
        logEvent('Ошибка закрытия туториала: ' + e.message);
      }
    } else {
      logEvent('tutorial.js не загружен');
    }
  }

  // ============================================================
  // Единый обработчик кнопок sidebar
  // ============================================================
  function handleDryAction(action) {
    switch (action) {
      case 'state-on':              setFakeStatus('on'); break;
      case 'state-off':             setFakeStatus('off'); break;
      case 'state-error':           setFakeStatus('error'); break;
      case 'state-not-configured':  setFakeStatus('not-configured'); break;
      case 'state-empty-ip':        setFakeEmptyIp(); break;
      case 'state-no-logs':         setFakeNoLogs(); break;

      case 'save-settings':  mockSaveSettings(); break;
      case 'add-tag':        mockAddTag(); break;
      case 'remove-tag':     mockRemoveTag(); break;
      case 'ip':             mockIp(); break;
      case 'ping':           mockPing(); break;
      case 'copy-ip':        mockCopyIp(); break;
      case 'copy-address':   mockCopyAddress(); break;

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

      case 'tutorial-welcome':  startTut('welcome'); break;
      case 'tutorial-settings': startTut('settings'); break;
      case 'tutorial-close':    closeTut(); break;

      case 'validate':       mockValidate(); break;
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.dry-btn');
    if (btn && btn.dataset.action) handleDryAction(btn.dataset.action);
  });

  // ============================================================
  // Схема
  // ============================================================
  function setScheme(name) {
    currentSchemeName = name;
    if (typeof D.setColorScheme === 'function') D.setColorScheme(name);
    schemePreviewBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.scheme === name);
    });
    fakePopup.querySelectorAll('.scheme-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.scheme === name);
    });
    renderAll();
    logEvent('Схема: ' + name);
  }

  schemePreviewBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setScheme(btn.dataset.scheme); });
  });

  // ============================================================
  // Слушатели — время, сезоны, play
  // ============================================================
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
      particlesSeason = null; // форсируем пересборку частиц
      renderAll();
    });
  });

  // ============================================================
  // Обработчики внутри #fakePopup
  // ============================================================
  fakePopup.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchFakeTab(btn.dataset.fakeTab);
      logEvent('Попап: вкладка ' + btn.dataset.fakeTab);
    });
  });

  fakePopup.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.dataset.lang;
      I18n.setLanguage(lang);
      // applyLocale уже прошёлся по всему документу.
      // Переприменяем динамику.
      refreshFakeDynamic();
      renderFakeLogs();
      renderFakeTags();
      // Обновим лейблы вкладок и т.д. — applyLocale уже это сделал.
      logEvent('Язык попапа: ' + lang);
    });
  });

  fakePopup.querySelectorAll('.scheme-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setScheme(btn.dataset.scheme); });
  });

  if (fakeToggleParticles) {
    fakeToggleParticles.addEventListener('change', function () {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ particlesEnabled: this.checked });
      }
      logEvent('Toggle частиц: ' + this.checked);
    });
  }
  if (fakeToggleJoy) {
    fakeToggleJoy.addEventListener('change', function () {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ joyEnabled: this.checked });
      }
      logEvent('Toggle joy: ' + this.checked);
    });
  }

  if (fakeSaveBtn)      fakeSaveBtn.addEventListener('click', mockSaveSettings);
  if (fakeAddTagBtn)    fakeAddTagBtn.addEventListener('click', mockAddTag);
  if (fakeRefreshIpBtn) fakeRefreshIpBtn.addEventListener('click', mockIp);
  if (fakeCopyLogsBtn)  fakeCopyLogsBtn.addEventListener('click', function () {
    mockToast(I18n.t('logCopied'), 2000, '✅');
    logEvent('Логи скопированы (мок)');
  });
  if (fakeClearLogsBtn) fakeClearLogsBtn.addEventListener('click', function () {
    fakeLogs = [];
    fakeLogsEmpty = false;
    renderFakeLogs();
    mockToast(I18n.t('clearLogs'), 1500, '✅');
    logEvent('Логи очищены');
  });

  if (fakeTagInput) {
    fakeTagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        mockAddTag();
      }
    });
  }

  // Клик по главной плитке — toggle вкл/выкл
  if (fakeMainTile) {
    fakeMainTile.addEventListener('click', function (e) {
      if (e.target.closest('.tile-host') ||
          e.target.closest('.real-ip') ||
          e.target.closest('.ping-container') ||
          e.target.closest('.ping-chart')) return;
      if (fakeStatus === 'on') setFakeStatus('off');
      else setFakeStatus('on');
    });
  }

  // Клик по hostDisplay — «копирование»
  if (fakeHostDisplay) {
    fakeHostDisplay.addEventListener('click', function (e) {
      e.stopPropagation();
      mockCopyAddress();
    });
  }

  // Клик по realIpValue — «копирование IP»
  if (fakeRealIpValue) {
    fakeRealIpValue.addEventListener('click', function (e) {
      e.stopPropagation();
      mockCopyIp();
    });
  }

  // ============================================================
  // Витрина: аккордеоны
  // ============================================================
  document.querySelectorAll('.showcase-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var section = header.closest('.showcase-section');
      var body = section.querySelector('.showcase-body');
      body.classList.toggle('open');
      section.classList.toggle('collapsed');
      setTimeout(updateAllIndicators, 320);
    });
  });

  // ============================================================
  // Применение языка к копии попапа
  // ============================================================
  function applyLocaleToFake() {
    // I18n.applyLocale() уже прошёлся по всему документу,
    // осталось только обновить динамические тексты.
    refreshFakeDynamic();
    renderFakeLogs();
    renderFakeTags();
  }

  // ============================================================
  // Инициализация
  // ============================================================
  function initialSetup() {
    // Синхронизация языка в кнопках копии попапа
    var storedLang = I18n.currentLang || 'auto';
    fakePopup.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === storedLang);
    });

    currentSeason = D.getSeason(new Date());
    var now = new Date();
    slider.value = now.getHours() * 60 + now.getMinutes();
    updateTimeDisplay(sliderMinutes());
    updateSeasonButtons();
    buildSeasonCompare();
    updateNowMarker();

    // Начальные значения fake popup
    if (fakeProxyHostInput) fakeProxyHostInput.value = fakeHost;
    if (fakeProxyPortInput) fakeProxyPortInput.value = fakePort;
    renderFakeTags();
    renderFakeLogs();
    refreshFakeDynamic();

    renderAll();

    window.addEventListener('resize', function () {
      updateAllIndicators();
    });

    requestAnimationFrame(function () {
      updateAllIndicators();
    });

    setInterval(updateNowMarker, 60000);

    logEvent('Превью готово');
  }

  async function boot() {
    if (window.I18n) {
      try {
        await I18n.loadLanguage();
      } catch (e) {
        // ignore
      }
    }
    initialSetup();
  }

  boot();

})();