document.addEventListener('DOMContentLoaded', () => {
  // === GitHub: обновления ===
  // Репозиторий публичный — токен не нужен.
  const GITHUB_REPO = 'Becca-hubx/Living-Proxy';
  const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
  const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000;  // 6 часов
  const UPDATE_DISMISS_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа

  // Сравнение версий вида "6.5" и "v6.6". Возвращает 1 / 0 / -1.
  function compareVersions(a, b) {
    const clean = (v) => String(v).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const A = clean(a);
    const B = clean(b);
    const len = Math.max(A.length, B.length);
    for (let i = 0; i < len; i++) {
      const x = A[i] || 0;
      const y = B[i] || 0;
      if (x > y) return 1;
      if (x < y) return -1;
    }
    return 0;
  }

  // === Элементы ===
  const mainTile = document.getElementById('mainTile');
  const statusText = document.getElementById('statusText');
  const hostDisplay = document.getElementById('hostDisplay');
  const tagInput = document.getElementById('tagInput');
  const tagsContainer = document.getElementById('tagsContainer');
  const accordionHeader = document.getElementById('accordionHeader');
  const accordionBody = document.getElementById('accordionBody');
  const settingsHeader = document.getElementById('settingsHeader');
  const settingsBody = document.getElementById('settingsBody');
  const proxyHostInput = document.getElementById('proxyHostInput');
  const proxyPortInput = document.getElementById('proxyPortInput');
  const saveOptionsBtn = document.getElementById('saveOptionsBtn');
  const realIpValue = document.getElementById('realIpValue');
  const flagDisplay = document.getElementById('flagDisplay');
  const refreshIpBtn = document.getElementById('refreshIpBtn');
  const toast = document.getElementById('toast');
  const body = document.body;
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabsIndicator = document.getElementById('tabsIndicator');
  const tabContents = {
    proxy: document.getElementById('tabProxy'),
    settings: document.getElementById('tabSettings')
  };
  const langBtns = document.querySelectorAll('.lang-btn');
  const schemeBtns = document.querySelectorAll('.scheme-btn');
  const addTagBtn = document.getElementById('addTagBtn');
  const pingValue = document.getElementById('pingValue');
  const pingDot = document.getElementById('pingDot');
  const pingChart = document.getElementById('pingChart');
  const logsList = document.getElementById('logsList');
  const copyLogsBtn = document.getElementById('copyLogsBtn');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const logsHeader = document.getElementById('logsHeader');
  const logsBody = document.getElementById('logsBody');
  const helpBtn = document.getElementById('helpBtn');
  const versionText = document.getElementById('versionText');
  const footerAuthor = document.querySelector('.author');

  // === Элементы баннера обновления ===
  const updateBanner = document.getElementById('updateBanner');
  const updateBannerVersion = document.getElementById('updateBannerVersion');
  const updateBannerClose = document.getElementById('updateBannerClose');

  // === Ссылки на элементы (эффекты) ===
  const particlesLayer = document.getElementById('particlesLayer');
  const toggleParticles = document.getElementById('toggleParticles');
  const toggleJoy = document.getElementById('toggleJoy');

  let isEnabled = false;
  let isProcessing = false;
  let bypassTags = [];
  let pingInterval = null;
  let errorLogs = [];
  let pingHistory = [];
  let lastSeenLogTimestamp = 0;

  // === Состояние эффектов ===
  let particlesEnabled = true;
  let joyEnabled = true;
  let isFirstEnableToday = false;

  // === Флаг прохождения туториала «Настройки» ===
  let tutorialSettingsShown = false;

  // === Toast (Popover API) ===
  let toastTimeout = null;
  function showToast(text, duration = 3500, iconOverride = null) {
    const maxLen = 80;
    const displayText = text.length > maxLen ? text.slice(0, maxLen) + '…' : text;

    let iconChar;
    let cleanText;
    if (iconOverride) {
      iconChar = iconOverride;
      cleanText = displayText;
    } else {
      iconChar = '✅';
      cleanText = displayText;
      const leading = displayText.match(/^([✅⚠️❌ℹ️]+)\s*/);
      if (leading) {
        iconChar = leading[1];
        cleanText = displayText.slice(leading[0].length);
      } else if (/ошибк|error|failed|не удал|неверн|введ|настрой|сначала|enter|configure/i.test(displayText)) {
        iconChar = '⚠️';
      }
    }

    toast.innerHTML = `
      <span class="toast-icon"></span>
      <span class="toast-text"></span>
      <span class="toast-progress"></span>
    `;
    toast.querySelector('.toast-icon').textContent = iconChar;
    toast.querySelector('.toast-text').textContent = cleanText;

    const progress = toast.querySelector('.toast-progress');
    progress.style.animation = 'none';
    progress.style.width = '100%';
    void progress.offsetWidth;
    progress.style.animation = `toastProgress ${duration}ms linear forwards`;

    try {
      if (!toast.matches(':popover-open')) toast.showPopover();
    } catch (e) { /* уже открыт */ }

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      try { toast.hidePopover(); } catch (e) { /* уже закрыт */ }
    }, duration);
  }

  // === Системные уведомления ===
  function showNotification(title, message) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon_off.png',
        title: title,
        message: message,
        priority: 2
      });
    }
  }

  // === Показ баннера, если на GitHub есть релиз новее текущей версии ===
  async function showUpdateBannerIfNewer(tag) {
    if (!updateBanner) return;
    const currentVersion = chrome.runtime.getManifest().version;
    const latestVersion = String(tag || '').replace(/^v/i, '');
    if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
      updateBanner.style.display = 'none';
      return;
    }

    // Проверяем, не закрыл ли пользователь баннер недавно.
    const data = await chrome.storage.local.get('updateDismissedUntil');
    if (data.updateDismissedUntil && Date.now() < data.updateDismissedUntil) {
      updateBanner.style.display = 'none';
      return;
    }

    updateBannerVersion.textContent = latestVersion;
    updateBanner.style.display = 'flex';
  }

  // Проверка обновлений на GitHub. Раз в 6 часов.
  async function checkForUpdates() {
    const now = Date.now();
    const data = await chrome.storage.local.get(['updateCheckLast', 'latestReleaseTag']);

    // Если недавно проверяли — используем сохранённый результат.
    if (now - (data.updateCheckLast || 0) < UPDATE_CHECK_INTERVAL) {
      if (data.latestReleaseTag) {
        showUpdateBannerIfNewer(data.latestReleaseTag);
      }
      return;
    }

    try {
      const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: {
          'Accept': 'application/vnd.github+json'
        }
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const release = await resp.json();
      const tag = release.tag_name || '';
      await chrome.storage.local.set({
        updateCheckLast: now,
        latestReleaseTag: tag
      });
      showUpdateBannerIfNewer(tag);
    } catch (e) {
      console.warn('Проверка обновлений не удалась:', e.message);
    }
  }

  // Ручная проверка обновлений — по кнопке в настройках.
  async function checkForUpdatesManual() {
    try {
      const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const release = await resp.json();
      const tag = release.tag_name || '';
      const latestVersion = String(tag).replace(/^v/i, '');
      const currentVersion = chrome.runtime.getManifest().version;

      if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
        showToast(I18n.t('updateLatest'), 2500);
        return;
      }

      // Есть новая версия — сбрасываем «отложку» и показываем баннер.
      await chrome.storage.local.remove('updateDismissedUntil');
      updateBannerVersion.textContent = latestVersion;
      updateBanner.style.display = 'flex';
      showToast(I18n.t('updateAvailable') + ' ' + latestVersion, 2500);
    } catch (e) {
      showToast(I18n.t('updateCheckError'), 2500);
      console.warn('Ручная проверка не удалась:', e.message);
    }
  }

  // Клик по баннеру — открыть страницу релиза.
  if (updateBanner) {
    updateBanner.addEventListener('click', (e) => {
      if (e.target.closest('.update-banner-close')) return;
      chrome.tabs.create({ url: GITHUB_RELEASES_URL });
    });
  }

  // Клик по крестику — скрыть баннер на 24 часа.
  if (updateBannerClose) {
    updateBannerClose.addEventListener('click', (e) => {
      e.stopPropagation();
      const until = Date.now() + UPDATE_DISMISS_INTERVAL;
      chrome.storage.local.set({ updateDismissedUntil: until });
      updateBanner.style.display = 'none';
    });
  }

  // Кнопка «Проверить обновления» в настройках.
  const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
  if (checkUpdatesBtn) {
    checkUpdatesBtn.addEventListener('click', checkForUpdatesManual);
  }

  // === Тема ===
  function applyLivingTheme() {
    if (window.LivingTheme) window.LivingTheme.start();
  }

  function updateDayNightClass() {
    const D = window.LivingThemeDebug;
    const isDay = (D && typeof D.isDayNow === 'function')
      ? D.isDayNow()
      : (() => { const h = new Date().getHours(); return h >= 7 && h < 19; })();
    body.classList.toggle('is-day', isDay);
    body.classList.toggle('is-night', !isDay);
  }

  function getGreetingKey() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'greetingMorning';
    if (h >= 12 && h < 18) return 'greetingDay';
    if (h >= 18 && h < 23) return 'greetingEvening';
    return 'greetingNight';
  }

  // Ждёт, пока туториал закроется (если он открыт сейчас).
  function waitForTutorialClose() {
    return new Promise(function (resolve) {
      var overlay = document.getElementById('tutorialOverlay');
      if (!overlay || overlay.style.display === 'none') {
        resolve();
        return;
      }
      var iv = setInterval(function () {
        var o = document.getElementById('tutorialOverlay');
        if (!o || o.style.display === 'none') {
          clearInterval(iv);
          resolve();
        }
      }, 500);
    });
  }

  // Приветствие при первом открытии попапа за день — через тост.
  async function showGreetingIfNeeded() {
    const today = new Date().toISOString().slice(0, 10);
    const data = await chrome.storage.local.get('lastGreetingDate');
    if (data.lastGreetingDate === today) return;

    const greetingKey = getGreetingKey();
    const greetingText = I18n.t(greetingKey);
    if (!greetingText || greetingText === greetingKey) return;

    // Ждём закрытия welcome-туториала, чтобы тост не перекрыл его.
    await waitForTutorialClose();

    await chrome.storage.local.set({ lastGreetingDate: today });

    const h = new Date().getHours();
    let emoji;
    if (h >= 5 && h < 12) emoji = '🌅';
    else if (h >= 12 && h < 18) emoji = '☀️';
    else if (h >= 18 && h < 23) emoji = '🌇';
    else emoji = '🌙';

    showToast(greetingText, 5000, emoji);
  }

  // Три клика по эмодзи сезона → открыть preview.html.
  let seasonClickCount = 0;
  let seasonClickTimer = null;

  function setupPreviewTrigger() {
    const el = document.getElementById('seasonIndicator');
    if (!el) return;
    el.style.cursor = 'pointer';

    el.addEventListener('click', () => {
      seasonClickCount++;
      clearTimeout(seasonClickTimer);

      seasonClickTimer = setTimeout(() => { seasonClickCount = 0; }, 2000);

      if (seasonClickCount >= 3) {
        seasonClickCount = 0;
        clearTimeout(seasonClickTimer);
        const url = chrome.runtime.getURL('preview.html');
        chrome.tabs.create({ url });
        window.close();
      }
    });
  }

  // Эмодзи текущего сезона + запись сезона на body.
  function updateSeasonIndicator() {
    const el = document.getElementById('seasonIndicator');
    const D = window.LivingThemeDebug;
    if (!D || typeof D.getSeason !== 'function') return;
    const season = D.getSeason(new Date());

    if (el) {
      const emoji = { winter: '❄️', spring: '🌸', summer: '☀️', autumn: '🍂' };
      el.textContent = emoji[season] || '';
    }

    body.dataset.season = season;
  }

  // === Сезонные частицы на фоне ===
  const PARTICLE_CONFIG = {
    winter: { emoji: '❄️', count: 42, animation: 'particleFall',   sizeMin: 12,  sizeMax: 16, durationMin: 10,  durationMax: 20 },
    spring: { emoji: '🌸', count: 36, animation: 'particleSpin',   sizeMin: 10, sizeMax: 16, durationMin: 10, durationMax: 20 },
    summer: { emoji: '✨', count: 32, animation: 'particleFloat',  sizeMin: 12,  sizeMax: 16, durationMin: 10,  durationMax: 20 },
    autumn: { emoji: '🍂', count: 46, animation: 'particleSpiral', sizeMin: 12, sizeMax: 18, durationMin: 12, durationMax: 20 }
  };

  function buildParticles() {
    if (!particlesLayer) return;
    particlesLayer.innerHTML = '';
    if (!particlesEnabled) return;

    const D = window.LivingThemeDebug;
    if (!D || typeof D.getSeason !== 'function') return;

    const season = D.getSeason(new Date());
    const cfg = PARTICLE_CONFIG[season];
    if (!cfg) return;

    particlesLayer.className = 'particles-layer particles-' + season;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    for (let i = 0; i < cfg.count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.textContent = cfg.emoji;

      const size     = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
      const duration = cfg.durationMin + Math.random() * (cfg.durationMax - cfg.durationMin);
      const delay    = -Math.random() * duration;
      const x        = Math.random() * 100;
      const drift    = (Math.random() - 0.5) * 40;
      const dx       = (Math.random() - 0.5) * 60;
      const dy       = (Math.random() - 0.5) * 40;

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

      particlesLayer.appendChild(p);
    }
  }

  // === Загрузка и сохранение галочек эффектов ===
  async function loadEffects() {
    const data = await chrome.storage.local.get(['particlesEnabled', 'joyEnabled']);
    particlesEnabled = data.particlesEnabled !== false;
    joyEnabled = data.joyEnabled !== false;
    if (toggleParticles) toggleParticles.checked = particlesEnabled;
    if (toggleJoy) toggleJoy.checked = joyEnabled;
    buildParticles();
  }

  if (toggleParticles) {
    toggleParticles.addEventListener('change', async () => {
      particlesEnabled = toggleParticles.checked;
      await chrome.storage.local.set({ particlesEnabled });
      buildParticles();
    });
  }

  if (toggleJoy) {
    toggleJoy.addEventListener('change', async () => {
      joyEnabled = toggleJoy.checked;
      await chrome.storage.local.set({ joyEnabled });
    });
  }

  // === Настроение — анимация при включении прокси ===
  async function checkFirstEnableToday() {
    const today = new Date().toISOString().slice(0, 10);
    const data = await chrome.storage.local.get('lastProxyEnableDate');
    return data.lastProxyEnableDate !== today;
  }

  function playJoyAnimation(long = false) {
    if (!joyEnabled || !mainTile) return;
    mainTile.classList.remove('joy', 'joy-long');
    void mainTile.offsetWidth;
    mainTile.classList.add(long ? 'joy-long' : 'joy');
    setTimeout(() => {
      mainTile.classList.remove('joy', 'joy-long');
    }, long ? 1400 : 900);
  }

  // === Язык ===
  async function loadLanguage() {
    await I18n.loadLanguage();
    const data = await chrome.storage.local.get('lang');
    const lang = data.lang || 'auto';
    langBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  // === Вкладки + скользящий индикатор ===
  function updateTabIndicator() {
    if (!tabsIndicator) return;
    const active = document.querySelector('.tab-btn.active');
    if (!active) return;
    const parent = active.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    tabsIndicator.style.width = rect.width + 'px';
    tabsIndicator.style.transform = `translateX(${rect.left - parentRect.left - 1}px)`;
  }

  function switchTab(tabId) {
    Object.values(tabContents).forEach(el => {
      el.style.display = 'none';
      el.classList.remove('active');
    });
    const activeTab = tabContents[tabId];
    if (activeTab) {
      activeTab.style.display = 'block';
      activeTab.classList.add('active');
    }
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    updateTabIndicator();
  }
  window.switchTab = switchTab;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      // Первый заход на «Настройки» → микро-туториал по настройкам.
      if (btn.dataset.tab === 'settings' && !tutorialSettingsShown) {
        tutorialSettingsShown = true;
        chrome.storage.local.set({ tutorialSettingsShown: true });
        setTimeout(() => {
          if (typeof window.startTutorial === 'function') {
            window.startTutorial('settings');
          }
        }, 150);
      }
    });
  });

  // === Пинг и график ===
  function pingColor(value) {
    if (value < 100) return '#22c55e';
    if (value < 300) return '#2ecc71';
    if (value < 600) return '#f39c12';
    return '#e63946';
  }

  function updatePingChart() {
    pingChart.innerHTML = '';
    const maxPoints = 30;
    const values = pingHistory.slice(-maxPoints);
    if (values.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'chart-empty';
      empty.textContent = '—';
      pingChart.appendChild(empty);
      return;
    }
    const maxVal = Math.max(500, ...values.map(v => v.value));
    values.forEach((item, i) => {
      const bar = document.createElement('span');
      bar.className = 'chart-dot chart-bar';
      bar.style.background = pingColor(item.value);
      const heightPct = Math.max(20, Math.min(100, (item.value / maxVal) * 100));
      bar.style.height = heightPct + '%';
      bar.title = `${item.value} мс`;
      if (i === values.length - 1) bar.classList.add('chart-bar-new');
      pingChart.appendChild(bar);
    });
  }

  async function measurePing() {
    if (!isEnabled) {
      pingValue.textContent = '—';
      pingDot.className = 'ping-dot';
      pingHistory = [];
      updatePingChart();
      return;
    }
    try {
      const start = performance.now();
      await fetch('https://api.ipify.org?format=json', { mode: 'no-cors' });
      const end = performance.now();
      const latency = Math.round(end - start);

      pingValue.textContent = latency;
      pingValue.classList.remove('ping-updating');
      void pingValue.offsetWidth;
      pingValue.classList.add('ping-updating');

      pingDot.style.background = pingColor(latency);
      pingDot.className = 'ping-dot active';

      void pingDot.offsetWidth;
      pingDot.classList.add('ping-pulse');
      setTimeout(() => pingDot.classList.remove('ping-pulse'), 420);

      pingHistory.push({ time: Date.now(), value: latency });
      if (pingHistory.length > 100) pingHistory.shift();
      updatePingChart();
    } catch (e) {
      pingValue.textContent = '∞';
      pingDot.className = 'ping-dot';
      if (isEnabled) {
        showNotification(I18n.t('proxyErrorTitle'), I18n.t('proxyUnreachable'));
      }
    }
  }

  function startPing() {
    if (pingInterval) clearInterval(pingInterval);
    measurePing();
    pingInterval = setInterval(measurePing, 10000);
  }

  function stopPing() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    pingValue.textContent = '—';
    pingDot.className = 'ping-dot';
    pingHistory = [];
    updatePingChart();
  }

  // === Логи ошибок ===
  function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  async function loadLogs() {
    const data = await chrome.storage.local.get('errorLogs');
    errorLogs = data.errorLogs || [];
    if (errorLogs.length > 0) {
      lastSeenLogTimestamp = Math.max(...errorLogs.map(l => l.timestamp));
    }
    renderLogs();
  }

  function renderLogs() {
    if (errorLogs.length === 0) {
      logsList.innerHTML = `<div class="log-empty" data-i18n="noLogs">${I18n.t('noLogs')}</div>`;
      return;
    }
    logsList.innerHTML = errorLogs.map((log, index) => {
      const timeStr = formatTime(log.timestamp);
      const msg = log.message.length > 80 ? log.message.slice(0, 80) + '…' : log.message;
      const isNew = log.timestamp > lastSeenLogTimestamp;
      return `<div class="log-entry${isNew ? ' log-new' : ''}" data-index="${index}">
                <span class="log-time">${timeStr}</span>
                <span class="log-icon">⚠️</span>
                <span class="log-msg">${msg}</span>
              </div>`;
    }).join('');
    if (errorLogs.length > 0) {
      lastSeenLogTimestamp = Math.max(...errorLogs.map(l => l.timestamp));
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key === 'noLogs' && el.textContent === I18n.t('noLogs')) return;
      el.textContent = I18n.t(key);
    });
  }

  async function addErrorLog(message) {
    const entry = { timestamp: Date.now(), message };
    errorLogs.push(entry);
    if (errorLogs.length > 50) errorLogs.shift();
    await chrome.storage.local.set({ errorLogs });
    renderLogs();
  }

  copyLogsBtn.addEventListener('click', async () => {
    if (errorLogs.length === 0) {
      showToast(I18n.t('noLogs'), 1500);
      return;
    }
    const text = errorLogs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(I18n.t('logCopied'));
    } catch (e) {
      showToast('Ошибка копирования', 1500);
    }
  });

  clearLogsBtn.addEventListener('click', async () => {
    if (errorLogs.length === 0) {
      showToast(I18n.t('noLogs'), 1500);
      return;
    }
    if (confirm(I18n.t('clearLogsConfirm'))) {
      errorLogs = [];
      await chrome.storage.local.set({ errorLogs });
      renderLogs();
      showToast(I18n.t('clearLogs'), 1500);
    }
  });

  // === Аккордеон для логов ===
  let expandedLogs = false;
  logsHeader.addEventListener('click', () => {
    expandedLogs = !expandedLogs;
    logsBody.classList.toggle('open', expandedLogs);
  });

  // === Конвертер кода страны в emoji-флаг ===
  function countryCodeToFlag(code) {
    if (!code) return '🌍';
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  }

  // === Обновление UI ===
  function updateUI(enabled) {
    if (enabled && isEnabled !== true) {
      const wasFirst = isFirstEnableToday;
      playJoyAnimation(wasFirst);
      if (wasFirst) {
        chrome.storage.local.set({ lastProxyEnableDate: new Date().toISOString().slice(0, 10) });
        isFirstEnableToday = false;
      }
    }
    updateDayNightClass();
    isEnabled = enabled;
    statusText.textContent = enabled ? I18n.t('statusOn') : I18n.t('statusOff');
    mainTile.classList.toggle('active', enabled);
    body.classList.toggle('proxy-on', enabled);
    if (enabled) {
      startPing();
    } else {
      stopPing();
    }
  }

  // === Отображение реального IP и флага ===
  function setIpInfo(ip, countryCode) {
    if (ip) {
      realIpValue.textContent = ip;
      flagDisplay.textContent = countryCodeToFlag(countryCode);
    } else {
      realIpValue.textContent = '—';
      flagDisplay.textContent = '🌍';
    }
  }

  // === Запрос внешнего IP и страны с кэшированием на 24 часа ===
  async function fetchIpInfo(forceRefresh = false) {
    const CACHE_KEY = 'ipCache';
    const CACHE_TTL = 24 * 60 * 60 * 1000;

    if (!forceRefresh) {
      const cached = await chrome.storage.local.get(CACHE_KEY);
      if (cached[CACHE_KEY]) {
        const { ip, countryCode, timestamp } = cached[CACHE_KEY];
        if (Date.now() - timestamp < CACHE_TTL) {
          return { ip, countryCode };
        }
      }
    }

    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      if (data.status === 'success') {
        const result = { ip: data.query, countryCode: data.countryCode };
        await chrome.storage.local.set({
          [CACHE_KEY]: { ...result, timestamp: Date.now() }
        });
        return result;
      } else {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const result = { ip: ipData.ip, countryCode: null };
        await chrome.storage.local.set({
          [CACHE_KEY]: { ...result, timestamp: Date.now() }
        });
        return result;
      }
    } catch (err) {
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const result = { ip: ipData.ip, countryCode: null };
        await chrome.storage.local.set({
          [CACHE_KEY]: { ...result, timestamp: Date.now() }
        });
        return result;
      } catch (e) {
        return { ip: null, countryCode: null };
      }
    }
  }

  // === Копирование адреса прокси ===
  hostDisplay.addEventListener('click', async (e) => {
    e.stopPropagation();
    const text = hostDisplay.textContent;
    if (text && text !== I18n.t('notConfigured')) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(I18n.t('copyAddress'));
        hostDisplay.classList.add('copied');
        setTimeout(() => hostDisplay.classList.remove('copied'), 750);
      } catch (err) {
        console.error(err);
      }
    }
  });

  // === Копирование реального IP ===
  const realIpContainer = document.getElementById('realIpContainer');
  realIpContainer.addEventListener('click', async (e) => {
    if (e.target.closest('.ip-refresh-btn')) return;
    const ipText = realIpValue.textContent;
    if (ipText && ipText !== '—') {
      try {
        await navigator.clipboard.writeText(ipText);
        showToast(I18n.t('copyIp'));
        realIpValue.classList.add('copied');
        setTimeout(() => realIpValue.classList.remove('copied'), 750);
      } catch (err) {
        console.error(err);
      }
    }
  });

  // === Кнопка обновления IP ===
  refreshIpBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    refreshIpBtn.textContent = '⟳';
    refreshIpBtn.disabled = true;
    const info = await fetchIpInfo(true);
    setIpInfo(info.ip, info.countryCode);
    refreshIpBtn.textContent = '↻';
    refreshIpBtn.disabled = false;
    showToast(I18n.t('refreshIp'), 1000);
  });

  // === Сохранение исключений ===
  async function saveBypassToStorage() {
    await chrome.storage.local.set({ bypassList: bypassTags });
  }

  // === Перезапуск прокси, если включён ===
  async function restartProxyIfNeeded() {
    const state = await chrome.storage.local.get('proxyEnabled');
    if (state.proxyEnabled) {
      const resp = await chrome.runtime.sendMessage({ type: 'enable-proxy' });
      if (!resp || !resp.ok) {
        const errMsg = I18n.t('restartError');
        showToast(errMsg, 2500);
        await addErrorLog(errMsg);
        await chrome.storage.local.set({ proxyEnabled: false });
        updateUI(false);
        showNotification(I18n.t('proxyErrorTitle'), I18n.t('proxyErrorMsg'));
        return false;
      }
      return true;
    }
    return true;
  }

  // ============= ВАЛИДАЦИЯ ИСКЛЮЧЕНИЙ =============
  // Строгая проверка: IPv4 без ведущих нулей, домен — сегменты начинаются
  // и заканчиваются alnum, дефисы только внутри. TLD — буквы 2–63 или punycode.
  function isValidDomain(input) {
    if (!input) return false;
    const s = String(input).toLowerCase();
    if (s === 'localhost') return true;

    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
    if (ipv4Regex.test(s)) return true;

    const domainRegex = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+([a-zA-Z]{2,63}|xn--[a-zA-Z0-9-]{2,59})$/;
    return domainRegex.test(s);
  }

  function markInputError(input) {
    input.classList.add('input-error');
    setTimeout(() => {
      input.classList.remove('input-error');
    }, 2000);
  }

  // === Drag-and-Drop для тегов ===
  let draggedIndex = null;

  function makeDraggable() {
    const tags = tagsContainer.querySelectorAll('.tag');
    tags.forEach((tag, index) => {
      tag.setAttribute('draggable', 'true');
      tag.dataset.index = index;
      tag.addEventListener('dragstart', handleDragStart);
      tag.addEventListener('dragend', handleDragEnd);
      tag.addEventListener('dragover', handleDragOver);
      tag.addEventListener('drop', handleDrop);
    });
  }

  function handleDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.tag.drag-over').forEach(el => el.classList.remove('drag-over'));
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.tag');
    if (target && target !== e.target) {
      document.querySelectorAll('.tag.drag-over').forEach(el => el.classList.remove('drag-over'));
      target.classList.add('drag-over');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.tag');
    if (!target || draggedIndex === null) return;
    const targetIndex = parseInt(target.dataset.index);
    if (draggedIndex === targetIndex) return;
    const [removed] = bypassTags.splice(draggedIndex, 1);
    bypassTags.splice(targetIndex, 0, removed);
    renderTags();
    saveBypassToStorage();
    restartProxyIfNeeded();
    draggedIndex = null;
  }

  // === Рендер тегов ===
  function renderTags(skipAnim = false) {
    tagsContainer.innerHTML = '';
    bypassTags.forEach(domain => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      if (skipAnim) tag.style.animation = 'none';
      tag.textContent = domain;
      const removeBtn = document.createElement('span');
      removeBtn.className = 'tag-remove';
      removeBtn.textContent = '×';
      removeBtn.dataset.domain = domain;
      tag.appendChild(removeBtn);
      tagsContainer.appendChild(tag);
    });
    makeDraggable();
    document.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        createRipple(e, btn);
        const domain = e.target.dataset.domain;
        const tagEl = e.target.closest('.tag');
        tagEl.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        tagEl.style.transform = 'scale(0.85)';
        tagEl.style.opacity = '0';
        setTimeout(async () => {
          await removeTag(domain);
        }, 200);
      });
    });
  }

  async function loadTags() {
    const data = await chrome.storage.local.get('bypassList');
    bypassTags = data.bypassList || [];
    renderTags();
  }

  async function addTag(domain) {
    domain = domain.trim().toLowerCase();
    if (!domain) {
      showToast(I18n.t('emptyInput'), 2000);
      markInputError(tagInput);
      return;
    }

    if (!isValidDomain(domain)) {
      const errMsg = I18n.t('invalidDomain') || 'Допустимы только домены или IPv4';
      showToast(errMsg, 2500);
      markInputError(tagInput);
      return;
    }

    if (bypassTags.includes(domain)) {
      showToast(I18n.t('alreadyExists'), 2000);
      markInputError(tagInput);
      return;
    }

    bypassTags.push(domain);
    renderTags();
    const newTag = tagsContainer.lastElementChild;
    if (newTag) {
      newTag.style.animation = 'tagAppear 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    await saveBypassToStorage();
    await restartProxyIfNeeded();
    tagInput.value = '';
  }

  async function removeTag(domain) {
    bypassTags = bypassTags.filter(d => d !== domain);
    renderTags(true);
    await saveBypassToStorage();
    await restartProxyIfNeeded();
  }

  // === Обработчики ввода тега ===
  tagInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const domain = tagInput.value.trim();
      if (domain) {
        await addTag(domain);
      }
    }
  });

  addTagBtn.addEventListener('click', async () => {
    const domain = tagInput.value.trim();
    if (domain) {
      await addTag(domain);
    }
  });

  // === Настройки прокси ===
  async function loadProxySettings() {
    const data = await chrome.storage.local.get(['proxyHost', 'proxyPort']);
    proxyHostInput.value = data.proxyHost || '';
    proxyPortInput.value = data.proxyPort || '';
  }

  function shakeInput(input) {
    input.classList.add('shake');
    setTimeout(() => {
      input.classList.remove('shake');
    }, 500);
  }

  async function saveProxySettings() {
    const host = proxyHostInput.value.trim();
    const port = proxyPortInput.value.trim();

    // Проверка хоста
    if (!host) {
      shakeInput(proxyHostInput);
      showToast(I18n.t('emptyInput'), 2000);
      return;
    }
    if (!isValidDomain(host)) {
      markInputError(proxyHostInput);
      showToast(I18n.t('invalidDomain'), 2500);
      return;
    }
    // Проверка порта
    if (!port || isNaN(port) || parseInt(port) < 1 || parseInt(port) > 65535) {
      shakeInput(proxyPortInput);
      showToast(I18n.t('invalid'), 2000);
      return;
    }

    try {
      await chrome.storage.local.set({ proxyHost: host, proxyPort: parseInt(port) });
      showToast(I18n.t('settingsSaved'));

      const state = await chrome.storage.local.get('proxyEnabled');
      if (state.proxyEnabled) {
        const resp = await chrome.runtime.sendMessage({ type: 'enable-proxy' });
        if (!resp || !resp.ok) {
          const errMsg = I18n.t('restartError');
          showToast(errMsg, 2500);
          await addErrorLog(errMsg);
          await chrome.storage.local.set({ proxyEnabled: false });
          updateUI(false);
          showNotification(I18n.t('proxyErrorTitle'), I18n.t('proxyErrorMsg'));
        }
      }
      const data = await chrome.storage.local.get(['proxyHost', 'proxyPort']);
      hostDisplay.textContent = (data.proxyHost && data.proxyPort) ? `${data.proxyHost}:${data.proxyPort}` : I18n.t('notConfigured');
    } catch (e) {
      const errMsg = I18n.t('saveErrorMsg') + e.message;
      showToast(errMsg, 2500);
      await addErrorLog(errMsg);
    }
  }

  saveOptionsBtn.addEventListener('click', saveProxySettings);

  // === Ripple-эффект ===
  function createRipple(event, element) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size/2) + 'px';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255,255,255,0.4)';
    ripple.style.pointerEvents = 'none';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'rippleAnim 0.6s ease-out forwards';
    element.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 700);
  }

  mainTile.addEventListener('click', (e) => {
    if (e.target.closest('.tile-host') || e.target.closest('.real-ip') || e.target.closest('.ping-container') || e.target.closest('.ping-chart')) return;
    createRipple(e, mainTile);
  });

  saveOptionsBtn.addEventListener('click', (e) => {
    createRipple(e, saveOptionsBtn);
  });

  document.querySelectorAll('.tab-btn, .lang-btn, .scheme-btn, .logs-btn, .add-tag-btn, .ip-refresh-btn, .help-btn, .update-banner-close, .check-updates-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      createRipple(e, this);
    });
  });

  // === Переключатель языка ===
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      I18n.setLanguage(lang);
      updateUI(isEnabled);
      (async () => {
        const data = await chrome.storage.local.get(['proxyHost', 'proxyPort']);
        hostDisplay.textContent = (data.proxyHost && data.proxyPort) ? `${data.proxyHost}:${data.proxyPort}` : I18n.t('notConfigured');
      })();
      langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
      renderLogs();
      requestAnimationFrame(updateTabIndicator);
      // Смена языка во время туториала → закрыть его.
      if (typeof window.closeTutorial === 'function') {
        window.closeTutorial();
      }
    });
  });

  // === Переключатель цветовой схемы ===
  schemeBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const scheme = btn.dataset.scheme;
      await chrome.storage.local.set({ colorScheme: scheme });
      if (window.LivingTheme && window.LivingTheme.setScheme) {
        window.LivingTheme.setScheme(scheme);
        window.LivingTheme.apply();
      }
      schemeBtns.forEach(b => b.classList.toggle('active', b.dataset.scheme === scheme));
    });
  });

  // === Аккордеоны ===
  let expandedExceptions = false;
  accordionHeader.addEventListener('click', () => {
    expandedExceptions = !expandedExceptions;
    accordionBody.classList.toggle('open', expandedExceptions);
  });

  let expandedSettings = false;
  settingsHeader.addEventListener('click', () => {
    expandedSettings = !expandedSettings;
    settingsBody.classList.toggle('open', expandedSettings);
  });

  // === Загрузка общего состояния ===
  async function loadState() {
    const data = await chrome.storage.local.get(['proxyEnabled', 'bypassList', 'proxyHost', 'proxyPort']);
    updateUI(data.proxyEnabled === true);
    if (data.bypassList) {
      bypassTags = data.bypassList;
      renderTags();
    }
    const host = data.proxyHost, port = data.proxyPort;
    hostDisplay.textContent = (host && port) ? `${host}:${port}` : I18n.t('notConfigured');

    proxyHostInput.value = host || '';
    proxyPortInput.value = port || '';

    const info = await fetchIpInfo(false);
    setIpInfo(info.ip, info.countryCode);
  }

  // === Отправка команды в background ===
  async function sendCommand(type) {
    try {
      const resp = await chrome.runtime.sendMessage({ type });
      if (resp && resp.ok === false) {
        const errMsg = I18n.t('errorTitle') + ': ' + resp.error;
        showToast(errMsg, 2500);
        await addErrorLog(errMsg);
        showNotification(I18n.t('proxyErrorTitle'), I18n.t('proxyErrorMsg'));
        updateUI(!isEnabled);
        await chrome.storage.local.set({ proxyEnabled: !isEnabled });
        mainTile.classList.remove('error');
        void mainTile.offsetWidth;
        mainTile.classList.add('error');
        setTimeout(() => mainTile.classList.remove('error'), 2200);
        return false;
      }
      return true;
    } catch (e) {
      const errMsg = I18n.t('errorTitle') + ': ' + I18n.t('saveError');
      showToast(errMsg, 2500);
      await addErrorLog(errMsg);
      showNotification(I18n.t('proxyErrorTitle'), I18n.t('proxyErrorMsg'));
      updateUI(!isEnabled);
      await chrome.storage.local.set({ proxyEnabled: !isEnabled });
      mainTile.classList.remove('error');
      void mainTile.offsetWidth;
      mainTile.classList.add('error');
      setTimeout(() => mainTile.classList.remove('error'), 2200);
      return false;
    }
  }

  // === Переключение прокси ===
  mainTile.addEventListener('click', async (e) => {
    if (e.target.closest('.tile-host') || e.target.closest('.real-ip') || e.target.closest('.ping-container') || e.target.closest('.ping-chart')) return;
    if (isProcessing) return;

    const data = await chrome.storage.local.get(['proxyHost', 'proxyPort']);
    if (!data.proxyHost || !data.proxyPort) {
      showToast(I18n.t('configureFirst'), 2500);
      switchTab('settings');
      if (!expandedSettings) {
        expandedSettings = true;
        settingsBody.classList.add('open');
      }
      return;
    }

    isProcessing = true;
    const newState = !isEnabled;
    updateUI(newState);
    await chrome.storage.local.set({ proxyEnabled: newState });

    await sendCommand(newState ? 'enable-proxy' : 'disable-proxy');

    const info = await fetchIpInfo(true);
    setIpInfo(info.ip, info.countryCode);

    isProcessing = false;
  });

  // === Показ Welcome-туториала при первом запуске ===
  async function showTutorialIfNeeded() {
    const data = await chrome.storage.local.get('tutorialWelcomeShown');
    if (!data.tutorialWelcomeShown) {
      if (typeof window.startTutorial === 'function') {
        window.startTutorial('welcome');
        await chrome.storage.local.set({ tutorialWelcomeShown: true });
      }
    }
  }

  // Кнопка «i» — запускает туториал по активной вкладке:
  // «Прокси» → welcome, «Настройки» → settings.
  // Флаг tutorialSettingsShown здесь не проверяется — ручной вызов работает всегда.
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      if (typeof window.startTutorial !== 'function') return;
      const activeTab = document.querySelector('.tab-btn.active');
      const tabId = activeTab ? activeTab.dataset.tab : 'proxy';
      window.startTutorial(tabId === 'settings' ? 'settings' : 'welcome');
    });
  }

  // ===== ПАСХАЛКА =====
  let authorClickCount = 0;
  let authorClickTimer = null;
  if (footerAuthor) {
    footerAuthor.style.cursor = 'pointer';
    footerAuthor.addEventListener('click', () => {
      authorClickCount++;
      clearTimeout(authorClickTimer);
      authorClickTimer = setTimeout(() => { authorClickCount = 0; }, 3000);
      if (authorClickCount >= 5) {
        showToast('🕵️ Секретный агент', 2500);
        authorClickCount = 0;
        clearTimeout(authorClickTimer);
      }
    });
  }

  // === Инициализация ===
  async function init() {
    await loadLanguage();

    // Читаем сохранённую цветовую схему ДО первой отрисовки темы.
    const sdata = await chrome.storage.local.get('colorScheme');
    const scheme = sdata.colorScheme || 'standard';
    if (window.LivingTheme && window.LivingTheme.setScheme) {
      window.LivingTheme.setScheme(scheme);
    }
    schemeBtns.forEach(b => b.classList.toggle('active', b.dataset.scheme === scheme));

    applyLivingTheme();
    updateDayNightClass();
    setupPreviewTrigger();
    updateSeasonIndicator();
    await loadEffects();
    isFirstEnableToday = await checkFirstEnableToday();
    await loadState();
    await loadProxySettings();
    await loadLogs();
    switchTab('proxy');
    requestAnimationFrame(updateTabIndicator);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => updateTabIndicator());
    }

    const manifest = chrome.runtime.getManifest();
    if (versionText) {
      versionText.textContent = manifest.version;
    }

    // Читаем флаг «Настройки» до показа Welcome.
    const tdata = await chrome.storage.local.get('tutorialSettingsShown');
    tutorialSettingsShown = tdata.tutorialSettingsShown === true;

    await showTutorialIfNeeded();

    // Проверка обновлений — без await, не блокируем инициализацию.
    checkForUpdates();

    // Приветствие показываем после возможного запуска welcome-туториала:
    // showGreetingIfNeeded сам дождётся закрытия оверлея.
    showGreetingIfNeeded();

    setInterval(() => {
      updateDayNightClass();
      updateSeasonIndicator();
    }, 5 * 60 * 1000);

    window.addEventListener('resize', updateTabIndicator);
  }
  init();
});