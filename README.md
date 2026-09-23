# Living Proxy

> Красивое и быстрое управление HTTP-прокси прямо из панели Chrome.

<p align="center">
  <strong>Живая тема · сезонные эффекты · умные исключения · понятный интерфейс</strong>
</p>

Living Proxy — расширение для Google Chrome, которое позволяет включать и выключать прокси в один клик, хранить список исключений и видеть состояние соединения в реальном времени. Интерфейс меняется в течение дня, а сезонные эффекты создают отдельную атмосферу для каждого времени года.

> [!NOTE]
> Расширение рассчитано на **Google Chrome 130 и новее** и устанавливается в режиме разработчика из распакованной папки.

## Возможности

- **Переключение в один клик** — включение и выключение прокси с большой интерактивной плитки.
- **Живая тема** — цвета интерфейса плавно меняются в зависимости от времени суток.
- **Сезонные эффекты** — снег, лепестки, светлячки и листья в зависимости от сезона.
- **Три цветовые схемы** — стандартная, пастельная и контрастная.
- **Список исключений** — домены и IPv4-адреса, которые обходят прокси.
- **Мониторинг задержки** — текущий ping и небольшая история измерений.
- **Информация об IP** — внешний IP-адрес и страна с флагом.
- **Журнал ошибок** — локальная история проблем с подключением.
- **Пошаговая инструкция** — встроенный туториал для первого запуска и настроек.
- **Проверка обновлений** — уведомление о новых релизах на GitHub.
- **Русский и английский интерфейс** — ручной выбор языка или автоматический режим.

## Установка

### Из релиза

1. Скачайте последний архив со страницы [Releases](https://github.com/Becca-hubx/Living-Proxy/releases/latest).
2. Распакуйте архив в отдельную папку.
3. Откройте в Chrome страницу `chrome://extensions/`.
4. Включите **Режим разработчика**.
5. Нажмите **Загрузить распакованное расширение**.
6. Выберите папку, в которую был распакован архив.

После установки закрепите Living Proxy на панели Chrome, чтобы открывать его быстрее.

### Из исходного кода

```text
1. Скачайте или клонируйте репозиторий.
2. Откройте chrome://extensions/.
3. Включите «Режим разработчика».
4. Нажмите «Загрузить распакованное расширение».
5. Выберите корневую папку проекта.
```

Дополнительная сборка и установка зависимостей не требуются: расширение состоит из обычных HTML, CSS и JavaScript-файлов.

## Быстрый старт

1. Откройте попап Living Proxy.
2. Перейдите во вкладку **Настройки**.
3. Откройте блок **Настройки прокси**.
4. Укажите адрес HTTP-прокси и порт от `1` до `65535`.
5. Нажмите **Сохранить**.
6. Вернитесь на вкладку **Прокси** и нажмите большую плитку.

Для повторного запуска встроенной инструкции нажмите кнопку **i** в нижней части попапа.

## Настройки

В расширении доступны:

| Настройка | Назначение |
| --- | --- |
| Язык | Русский, English или автоматический выбор по языку браузера |
| Цветовая схема | Стандартная, Пастель или Контраст |
| Сезонные частицы | Включение и отключение фоновой анимации |
| Анимация включения | Визуальный эффект при включении прокси |
| Исключения | Список доменов и IPv4-адресов без прокси |
| Журнал ошибок | Просмотр, копирование и очистка локальных логов |

## Как работает прокси

Living Proxy использует механизм прокси Chrome и применяет заданный HTTP-прокси к браузеру. Локальные адреса автоматически добавляются в список обхода. Добавленные пользователем домены и IP-адреса также не проходят через прокси.

> [!WARNING]
> Перед включением убедитесь, что адрес и порт принадлежат доверенному прокси-серверу. Прокси может видеть и обрабатывать сетевой трафик в соответствии со своей конфигурацией и политикой провайдера.

## Данные и внешние сервисы

Настройки и состояние расширения хранятся в локальном хранилище Chrome. Это включает:

- адрес и порт прокси;
- список исключений;
- настройки языка, темы и эффектов;
- журнал ошибок;
- кэш информации об IP.

Для отдельных функций расширение обращается к внешним сервисам:

- GitHub API — проверка последней версии расширения;
- `api.ipify.org` — получение внешнего IP;
- `ip-api.com` — определение страны по IP.

Доступность этих функций зависит от сети, настроек браузера и работы соответствующих сервисов. Само расширение не содержит встроенного прокси-сервера и не предоставляет прокси-доступ.

## Известные ограничения

- Поддерживается HTTP-прокси; SOCKS и прокси с отдельной авторизацией интерфейсом не настраиваются.
- Для загрузки распакованного расширения требуется включенный режим разработчика Chrome.
- Измерение ping показывает время ответа внешнего сервиса и не является полноценным тестом пропускной способности прокси.
- При недоступности внешних API информация об IP, стране или обновлениях может быть временно недоступна.

## Разработка с помощью ИИ

Living Proxy создан с использованием инструментов искусственного интеллекта. При разработке с помощью AI-инструментов создавались и дорабатывались код, интерфейс, логика сезонных тем и документация. Итоговая структура проекта, решения по поведению расширения и проверка изменений выполняются автором проекта.

## Автор

**Beccalviso** — [github.com/Becca-hubx](https://github.com/Becca-hubx)

Если проект оказался полезным, поставьте ⭐ в репозитории или поделитесь обратной связью.

---

<details>
<summary><strong>English version</strong></summary>

## Living Proxy

Living Proxy is a Chrome extension for quick HTTP proxy switching, bypass rules, connection status monitoring and a dynamic interface that follows the time of day and season.

### Features

- One-click proxy toggle
- Dynamic day/night theme
- Seasonal particle effects
- Standard, Pastel and Contrast color schemes
- Domain and IPv4 bypass list
- Real-time latency indicator and mini chart
- Public IP and country detection
- Local error log
- Built-in onboarding tutorial
- GitHub release update check
- Russian, English and automatic language modes

### Requirements

- Google Chrome 130 or newer
- Developer mode enabled for unpacked installation

### Installation

1. Download the latest archive from [Releases](https://github.com/Becca-hubx/Living-Proxy/releases/latest).
2. Unzip it into a separate folder.
3. Open `chrome://extensions/` in Chrome.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the unzipped project folder.

No build step or package installation is required.

### Quick start

1. Open the extension popup.
2. Go to **Settings**.
3. Enter the proxy host and a port from `1` to `65535`.
4. Click **Save**.
5. Return to the **Proxy** tab and click the main tile.

### Data and external services

Proxy settings, bypass rules, preferences, error logs and cached IP information are stored in Chrome local storage. The extension uses GitHub API for release checks, `api.ipify.org` for public IP detection and `ip-api.com` for country lookup.

### AI-assisted development

Living Proxy was created with the help of artificial intelligence tools. AI-assisted development was used for code, interface work, seasonal theme logic and documentation. The author reviews and adapts the resulting project structure and behavior.

### Author

**Beccalviso** — [github.com/Becca-hubx](https://github.com/Becca-hubx)

</details>
