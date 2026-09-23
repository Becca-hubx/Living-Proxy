const LOCALES = {
  ru: {
    proxyTitle: 'ПРОКСИ',
    greetingMorning: 'Доброе утро',
    greetingDay: 'Добрый день',
    greetingEvening: 'Добрый вечер',
    greetingNight: 'Доброй ночи',
    statusOn: 'ВКЛЮЧЕН',
    statusOff: 'ВЫКЛЮЧЕН',
    statusError: 'ОШИБКА',
    notConfigured: 'не настроено',
    yourIp: 'Ваш IP',
    exceptionsTitle: 'ИСКЛЮЧЕНИЯ',
    settingsTitle: 'НАСТРОЙКИ ПРОКСИ',
    inputPlaceholder: 'Введите домен или IP и нажмите Enter',
    emptyInput: 'Введите адрес',
    copyAddress: 'Адрес скопирован',
    copyIp: 'IP скопирован',
    alreadyExists: '⚠️ Уже есть',
    configureFirst: 'Сначала настройте прокси (Настройки).',
    errorTitle: 'Ошибка',
    saveError: 'Не удалось выполнить команду. Проверьте настройки прокси (Настройки).',
    optionsIpLabel: 'IP-адрес или домен',
    optionsIpPlaceholder: 'например, X.X.X.X',
    optionsPortLabel: 'Порт',
    optionsPortPlaceholder: 'например, 8080',
    optionsSaveBtn: 'Сохранить',
    saved: '✅ Настройки сохранены',
    settingsSaved: '✅ Настройки сохранены',
    invalid: '⚠️ Неверный IP или порт (1–65535)',
    restartError: '⚠️ Перезапуск прокси не удался. Попробуйте вручную.',
    saveErrorMsg: '❌ Ошибка: ',
    languageLabel: 'Язык',
    langRu: 'Русский',
    langEn: 'English',
    langAuto: 'Авто',
    // Цветовая схема
    colorSchemeLabel: 'Цветовая схема',
    colorSchemeStandard: 'Стандартная',
    colorSchemePastel: 'Пастель',
    colorSchemeContrast: 'Контраст',
    tabProxy: 'Прокси',
    tabSettings: 'Настройки',
    invalidDomain: '⚠️ Домен или IPv4',
    logsTitle: 'ЛОГИ ОШИБОК',
    noLogs: 'Нет ошибок',
    copyLogs: 'Копировать логи',
    clearLogs: 'Очистить логи',
    logCopied: 'Логи скопированы',
    ping: 'Задержка',
    clearLogsConfirm: 'Очистить все логи?',
    proxyErrorTitle: 'Ошибка прокси',
    proxyErrorMsg: 'Не удалось включить прокси. Проверьте настройки.',
    proxyUnreachable: 'Прокси-сервер недоступен',
    refreshIp: 'Обновить IP',
    hintDomain: 'Допустимы: домен (example.com) или IPv4 (192.168.1.1)',
    effectParticles: 'Сезонные частицы',
    effectJoy: 'Анимация включения',
    // === Туториал ===
    tutorialNext: 'Далее',
    tutorialPrev: 'Назад',
    tutorialSkip: 'Пропустить',
    tutorialDone: 'Готово',
    tutorialWelcomeTitle: 'Добро пожаловать!',
    tutorialWelcomeText: 'Это Proxy Switch — быстрое включение и выключение прокси.',
    tutorialTileTitle: 'Включение прокси',
    tutorialTileText: 'Нажмите на большую плитку, чтобы включить или выключить.',
    tutorialTabsTitle: 'Переключение вкладок',
    tutorialTabsText: 'Внизу переключатель между Прокси и Настройками.',
    tutorialSettingsTitle: 'Настройки прокси',
    tutorialSettingsText: 'Введите адрес сервера и порт.',
    tutorialExceptionsTitle: 'Сайты без прокси',
    tutorialExceptionsText: 'Домены, для которых прокси не применяется.',
    tutorialLogsTitle: 'Журнал ошибок',
    tutorialLogsText: 'Здесь видны проблемы с подключением.',
    tutorialSchemeTitle: 'Цветовая схема',
    tutorialSchemeText: 'Выберите оформление: Стандартная, Пастель или Контраст.',
    // === Проверка обновлений ===
    updateAvailable: 'Доступна версия',
    updateOpen: 'Обновить',
    updateDismiss: 'Скрыть',
    updateLatest: '✅ Установлена последняя версия',
    updateCheckBtn: 'Проверить обновления',
    updateCheckError: '⚠️ Не удалось проверить обновления',
    // === Панель логов превью ===
    showLog: 'Показать лог',
    clearLog: 'Очистить лог',
    logPanelTitle: 'Лог тестов'
  },
  en: {
    proxyTitle: 'PROXY',
    greetingMorning: 'Good morning',
    greetingDay: 'Good afternoon',
    greetingEvening: 'Good evening',
    greetingNight: 'Good night',
    statusOn: 'ON',
    statusOff: 'OFF',
    statusError: 'ERROR',
    notConfigured: 'not configured',
    yourIp: 'Your IP',
    exceptionsTitle: 'EXCEPTIONS',
    settingsTitle: 'PROXY SETTINGS',
    inputPlaceholder: 'Enter domain or IP and press Enter',
    emptyInput: 'Enter address',
    copyAddress: 'Address copied',
    copyIp: 'IP copied',
    alreadyExists: '⚠️ Already exists',
    configureFirst: 'Configure proxy first (Settings).',
    errorTitle: 'Error',
    saveError: 'Command failed. Check proxy settings (Settings).',
    optionsIpLabel: 'IP address or domain',
    optionsIpPlaceholder: 'e.g., X.X.X.X',
    optionsPortLabel: 'Port',
    optionsPortPlaceholder: 'e.g., 8080',
    optionsSaveBtn: 'Save',
    saved: '✅ Settings saved',
    settingsSaved: '✅ Settings saved',
    invalid: '⚠️ Invalid IP or port (1-65535)',
    restartError: '⚠️ Proxy restart failed. Try manually.',
    saveErrorMsg: '❌ Error: ',
    languageLabel: 'Language',
    langRu: 'Russian',
    langEn: 'English',
    langAuto: 'Auto',
    // Color scheme
    colorSchemeLabel: 'Color scheme',
    colorSchemeStandard: 'Standard',
    colorSchemePastel: 'Pastel',
    colorSchemeContrast: 'Contrast',
    tabProxy: 'Proxy',
    tabSettings: 'Settings',
    invalidDomain: '⚠️ Domain or IPv4',
    logsTitle: 'ERROR LOGS',
    noLogs: 'No errors',
    copyLogs: 'Copy logs',
    clearLogs: 'Clear logs',
    logCopied: 'Logs copied',
    ping: 'Ping',
    clearLogsConfirm: 'Clear all logs?',
    proxyErrorTitle: 'Proxy error',
    proxyErrorMsg: 'Failed to enable proxy. Check settings.',
    proxyUnreachable: 'Proxy server unreachable',
    refreshIp: 'Refresh IP',
    hintDomain: 'Allowed: domain (example.com) or IPv4 (192.168.1.1)',
    effectParticles: 'Seasonal particles',
    effectJoy: 'Activation animation',
    // === Tutorial ===
    tutorialNext: 'Next',
    tutorialPrev: 'Back',
    tutorialSkip: 'Skip',
    tutorialDone: 'Done',
    tutorialWelcomeTitle: 'Welcome!',
    tutorialWelcomeText: 'This is Proxy Switch — quickly enable and disable a proxy.',
    tutorialTileTitle: 'Turning proxy on/off',
    tutorialTileText: 'Click the large tile to enable or disable.',
    tutorialTabsTitle: 'Switching tabs',
    tutorialTabsText: 'Use the switcher below to go between Proxy and Settings.',
    tutorialSettingsTitle: 'Proxy settings',
    tutorialSettingsText: 'Enter the server address and port.',
    tutorialExceptionsTitle: 'Sites without proxy',
    tutorialExceptionsText: 'Domains where the proxy is not applied.',
    tutorialLogsTitle: 'Error log',
    tutorialLogsText: 'Connection problems appear here.',
    tutorialSchemeTitle: 'Color scheme',
    tutorialSchemeText: 'Choose a style: Standard, Pastel, or Contrast.',
    // === Update check ===
    updateAvailable: 'New version',
    updateOpen: 'Update',
    updateDismiss: 'Dismiss',
    updateLatest: '✅ Latest version installed',
    updateCheckBtn: 'Check for updates',
    updateCheckError: '⚠️ Could not check for updates',
    // === Preview log panel ===
    showLog: 'Show log',
    clearLog: 'Clear log',
    logPanelTitle: 'Test log'
  }
};

const I18n = {
  currentLang: 'en',
  translations: LOCALES.en,

  t(key) {
    return this.translations[key] || key;
  },

  setLanguage(lang) {
    this.currentLang = lang;
    let displayLang = lang;
    if (lang === 'auto') {
      displayLang = navigator.language.startsWith('ru') ? 'ru' : 'en';
    }
    this.translations = LOCALES[displayLang] || LOCALES.en;
    chrome.storage.local.set({ lang: lang });
    this.applyLocale();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  },

  async loadLanguage() {
    const data = await chrome.storage.local.get('lang');
    const storedLang = data.lang || null;
    let lang = storedLang;
    if (!lang) {
      lang = 'auto';
      await chrome.storage.local.set({ lang: 'auto' });
    }
    this.setLanguage(lang);
  },

  applyLocale() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const key = btn.dataset.lang === 'ru' ? 'langRu' : (btn.dataset.lang === 'en' ? 'langEn' : 'langAuto');
      btn.textContent = this.t(key);
    });
  }
};