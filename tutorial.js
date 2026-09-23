// tutorial.js — пошаговые подсказки. Обращение — на «Вы».

// Реестр микро-туториалов.
// target — селектор элемента, на который указываем (null — без указателя).
// open — селектор tile-body, который надо раскрыть (если аккордеон закрыт).
// clickable — можно ли нажимать на цель (= следующий шаг). По умолчанию true.
var TUTORIALS = {
  welcome: [
    { icon: '👋', title: 'tutorialWelcomeTitle', text: 'tutorialWelcomeText', target: null },
    { icon: '🎯', title: 'tutorialTileTitle',    text: 'tutorialTileText',    target: '#mainTile' },
    { icon: '⚙️', title: 'tutorialTabsTitle',    text: 'tutorialTabsText',    target: '.tabs', clickable: false }
  ],
  settings: [
    { icon: '🌐', title: 'tutorialSettingsTitle',   text: 'tutorialSettingsText',   target: '#settingsHeader',  open: '#settingsBody' },
    { icon: '🚫', title: 'tutorialExceptionsTitle', text: 'tutorialExceptionsText', target: '#accordionHeader', open: '#accordionBody' },
    { icon: '📋', title: 'tutorialLogsTitle',       text: 'tutorialLogsText',       target: '#logsHeader',      open: '#logsBody' },
    { icon: '🎨', title: 'tutorialSchemeTitle',     text: 'tutorialSchemeText',     target: '#schemeGroup' }
  ]
};

var overlay = null;
var box = null;
var spotlight = null;
var arrow = null;
var content = null;
var iconEl = null;
var titleEl = null;
var textEl = null;
var prevBtn = null;
var nextBtn = null;
var skipBtn = null;
var dotsEl = null;
var progressBar = null;

var currentTutorial = null;
var currentSteps = [];
var currentIndex = 0;
var targetClickHandler = null;

// Таймер отложенного позиционирования ореола — чтобы отменять старый.
var spotlightTimer = null;

// Кешируем ссылки на элементы разметки.
function initElements() {
  overlay     = document.getElementById('tutorialOverlay');
  box         = document.getElementById('tutorialBox');
  spotlight   = document.getElementById('tutorialSpotlight');
  arrow       = document.getElementById('tutorialArrow');
  content     = document.getElementById('tutorialContent');
  iconEl      = document.getElementById('tutorialIcon');
  titleEl     = document.getElementById('tutorialTitle');
  textEl      = document.getElementById('tutorialText');
  prevBtn     = document.getElementById('tutorialPrev');
  nextBtn     = document.getElementById('tutorialNext');
  skipBtn     = document.getElementById('tutorialSkip');
  dotsEl      = document.getElementById('tutorialDots');
  progressBar = document.getElementById('tutorialProgressBar');
}

// Запуск микро-туториала по имени («welcome» или «settings»).
function startTutorial(name) {
  if (!TUTORIALS[name]) return;
  if (!overlay) initElements();
  if (!overlay) return;

  currentTutorial = name;
  currentSteps = TUTORIALS[name];
  currentIndex = 0;

  buildDots();
  overlay.style.display = 'block';
  renderStep(0);

  // Обработчики
  prevBtn.onclick = prevStep;
  nextBtn.onclick = nextStep;
  skipBtn.textContent = I18n.t('tutorialSkip');
  skipBtn.onclick = closeTutorial;

  // Снимаем старый keydown перед добавлением — иначе повторный запуск дублирует обработчик.
  document.removeEventListener('keydown', onKeydown, true);
  document.addEventListener('keydown', onKeydown, true);
}

function onKeydown(e) {
  if (!overlay || overlay.style.display === 'none') return;
  if (e.key === 'Escape') { closeTutorial(); }
  else if (e.key === 'ArrowRight') { nextStep(); }
  else if (e.key === 'ArrowLeft') { prevStep(); }
}

// Создаём точки-индикаторы по числу шагов.
function buildDots() {
  dotsEl.innerHTML = '';
  currentSteps.forEach(function (_, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'tutorial-dot';
    d.addEventListener('click', function () { renderStep(i); });
    dotsEl.appendChild(d);
  });
}

function updateDots() {
  var dots = dotsEl.querySelectorAll('.tutorial-dot');
  dots.forEach(function (d, i) {
    d.classList.toggle('active', i === currentIndex);
  });
}

// Отрисовка шага: тексты, прогресс, кнопки, подсветка.
function renderStep(index) {
  if (index < 0 || index >= currentSteps.length) return;
  currentIndex = index;
  var step = currentSteps[index];

  // Снимаем старый клик-обработчик с целевого элемента (учитываем capture).
  if (targetClickHandler) {
    targetClickHandler.el.removeEventListener(
      'click', targetClickHandler.fn, targetClickHandler.capture
    );
    targetClickHandler = null;
  }

  // Раскрываем аккордеон, если надо
  if (step.open) {
    var body = document.querySelector(step.open);
    if (body && !body.classList.contains('open')) body.classList.add('open');
  }

  // Тексты (перезапускаем анимацию появления)
  content.classList.remove('step-changing');
  void content.offsetWidth;
  content.classList.add('step-changing');

  iconEl.textContent = step.icon;
  titleEl.textContent = I18n.t(step.title);
  textEl.textContent  = I18n.t(step.text);

  // Прогресс-бар
  var pct = ((index + 1) / currentSteps.length) * 100;
  progressBar.style.width = pct + '%';

  // Кнопки
  prevBtn.textContent = I18n.t('tutorialPrev');
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === currentSteps.length - 1
    ? I18n.t('tutorialDone')
    : I18n.t('tutorialNext');

  updateDots();

  // Подсветка целевого элемента — с задержкой (ждём scrollIntoView и анимацию окна)
  hideSpotlight();
  if (step.target) {
    var targetEl = document.querySelector(step.target);
    if (targetEl) {
      targetEl.scrollIntoView({ block: 'center', behavior: 'smooth' });

      // Решаем, где будет окно: если цель в нижней половине экрана — окно сверху.
      var targetRect = targetEl.getBoundingClientRect();
      var viewportMid = window.innerHeight / 2;
      var targetCenterY = targetRect.top + targetRect.height / 2;
      var placeBoxTop = targetCenterY > viewportMid;
      box.classList.toggle('top', placeBoxTop);

      // Клик по элементу: обычный шаг → следующий шаг.
      // Навигационная цель (clickable: false) → клик гасим в capture-фазе,
      // чтобы обработчики попапа (таб-бары и т.п.) не срабатывали.
      if (step.clickable !== false) {
        var clickFn = function () { nextStep(); };
        targetEl.addEventListener('click', clickFn);
        targetClickHandler = { el: targetEl, fn: clickFn, capture: false };
      } else {
        var blockFn = function (e) {
          e.stopPropagation();
          e.preventDefault();
        };
        targetEl.addEventListener('click', blockFn, true);
        targetClickHandler = { el: targetEl, fn: blockFn, capture: true };
      }

      // Отменяем предыдущий таймер, чтобы при быстром листании
      // ореол не вспыхивал на старой цели.
      if (spotlightTimer) clearTimeout(spotlightTimer);
      spotlightTimer = setTimeout(function () {
        spotlightTimer = null;
        positionSpotlight(targetEl);
      }, 420);
    }
  } else {
    // Шаг без цели — окно снизу, ореола нет.
    box.classList.remove('top');
  }
}

// Позиционируем ореол вокруг цели и стрелку между окном и целью.
function positionSpotlight(targetEl) {
  var rect = targetEl.getBoundingClientRect();
  var pad = 4;
  spotlight.style.top    = (rect.top - pad) + 'px';
  spotlight.style.left   = (rect.left - pad) + 'px';
  spotlight.style.width  = (rect.width + pad * 2) + 'px';
  spotlight.style.height = (rect.height + pad * 2) + 'px';

  // Копируем радиус углов у цели (пилюля / круг / скругление плитки)
  var radius = window.getComputedStyle(targetEl).borderRadius;
  spotlight.style.borderRadius = radius || '12px';

  spotlight.classList.add('visible');

  var boxRect = box.getBoundingClientRect();
  var centerX = rect.left + rect.width / 2;

  if (box.classList.contains('top')) {
    // Окно сверху → стрелка под окном, остриём вниз
    arrow.classList.add('down');
    arrow.style.left = centerX + 'px';
    arrow.style.top = (boxRect.bottom + 4) + 'px';
    arrow.style.bottom = 'auto';
  } else {
    // Окно снизу → стрелка над окном, остриём вверх
    arrow.classList.remove('down');
    arrow.style.left = centerX + 'px';
    arrow.style.bottom = (window.innerHeight - boxRect.top + 4) + 'px';
    arrow.style.top = 'auto';
  }
  arrow.classList.add('visible');
}

function hideSpotlight() {
  // Сбрасываем отложенное позиционирование, если ещё не сработало.
  if (spotlightTimer) {
    clearTimeout(spotlightTimer);
    spotlightTimer = null;
  }
  if (spotlight) spotlight.classList.remove('visible');
  if (arrow) arrow.classList.remove('visible');
}

function nextStep() {
  if (currentIndex < currentSteps.length - 1) {
    renderStep(currentIndex + 1);
  } else {
    closeTutorial();
  }
}

function prevStep() {
  if (currentIndex > 0) renderStep(currentIndex - 1);
}

// Закрыть туториал и очистить состояние.
function closeTutorial() {
  if (!overlay) return;
  overlay.style.display = 'none';
  hideSpotlight();
  // Сбрасываем позицию окна — следующий запуск начнётся со стандартной (снизу).
  if (box) box.classList.remove('top');
  if (targetClickHandler) {
    targetClickHandler.el.removeEventListener(
      'click', targetClickHandler.fn, targetClickHandler.capture
    );
    targetClickHandler = null;
  }
  document.removeEventListener('keydown', onKeydown, true);
}

window.startTutorial = startTutorial;
window.closeTutorial = closeTutorial;