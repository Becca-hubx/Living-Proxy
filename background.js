// === Определение сезона по номеру недели года. Логика 1-в-1 как в themes.js ===
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

// Сезонные эмодзи для иконки включённого прокси.
const SEASON_EMOJI = {
  winter: '❄️',
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂'
};

// Рисует эмодзи на offscreen-canvas и возвращает ImageData.
// Размер 32×32 (Chrome сам сожмёт до нужного).
async function emojiToImageData(emoji, size = 32) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${Math.floor(size * 0.85)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
  return ctx.getImageData(0, 0, size, size);
}

// Обновление иконки. Включён — сезонный эмодзи. Выключен — icon_off.png.
// Бейдж снимается; устанавливается он отдельно только при ошибке.
async function updateIcon(enabled) {
  if (!enabled) {
    chrome.action.setIcon({ path: 'icons/icon_off.png' });
    chrome.action.setBadgeText({ text: '' }); // на всякий — снять старый бейдж
    return;
  }
  const emoji = SEASON_EMOJI[getSeason(new Date())] || '☀️';
  try {
    const imageData = await emojiToImageData(emoji);
    chrome.action.setIcon({ imageData });
    chrome.action.setBadgeText({ text: '' });
  } catch (e) {
    // Если canvas почему-то не сработал — откатываемся на старую icon_on.png
    chrome.action.setIcon({ path: 'icons/icon_on.png' });
  }
}

async function getProxyConfig() {
  const data = await chrome.storage.local.get(['proxyHost', 'proxyPort', 'bypassList']);
  const host = data.proxyHost;
  const port = data.proxyPort;
  if (!host || !port) throw new Error('Настройки не заданы');
  return {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: "http", host, port: parseInt(port) },
      bypassList: ["<local>", ...(data.bypassList || [])]
    }
  };
}

async function enableProxy() {
  try {
    const config = await getProxyConfig();
    await chrome.proxy.settings.set({ value: config, scope: 'regular' });
    await chrome.storage.local.set({ proxyEnabled: true });
    await updateIcon(true);
    return { ok: true };
  } catch (err) {
    await chrome.storage.local.set({ proxyEnabled: false });
    await updateIcon(false);
    // Красный бейдж «!» как маркер ошибки
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#e81123' });
    throw err;
  }
}

async function disableProxy() {
  await chrome.proxy.settings.clear({ scope: 'regular' });
  await chrome.storage.local.set({ proxyEnabled: false });
  await updateIcon(false);
  return { ok: true };
}

// === Восстановление состояния при старте браузера ===
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get('proxyEnabled');
  if (data.proxyEnabled === true) {
    try {
      await enableProxy();
    } catch (e) {
      console.warn('Не удалось восстановить прокси при старте:', e.message);
    }
  } else {
    await updateIcon(false);
  }
});

// === Обработка сообщений ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'enable-proxy') {
    enableProxy().then(result => sendResponse(result)).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg.type === 'disable-proxy') {
    disableProxy().then(result => sendResponse(result));
    return true;
  }
});