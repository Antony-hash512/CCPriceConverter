[English](#english) | [Русский](#russian)

---

<a name="english"></a>
## English

# CCPriceConverter

**CCPriceConverter** is a modern, responsive browser-based cryptocurrency exchange rate and trade volume calculator. It fetches real-time quotes from multiple independent API providers and evaluates trade performance, calculating value differences and loss/profit metrics with visual indicators.

---

### Features

- **4 Quote Providers**:
  - **DefiLlama**: Free, public, no API key required (enabled by default).
  - **CoinMarketCap**: Supported via the built-in local CORS proxy with API key.
  - **CoinGecko**: Direct browser requests with optional Demo/Pro API key.
  - **CoinPaprika**: Direct browser requests with optional Pro API key.
- **6 Supported Cryptocurrencies**:
  - Bitcoin (`BTC`), Ethereum (`ETH`), Bitcoin Cash (`BCH`), Zcash (`ZEC`), Monero (`XMR`), Ripple (`XRP`).
- **Interactive UI & Provider Selection**:
  - Activate any combination from 1 to 4 providers.
  - **Minimum Selection Rule**: If only 1 provider is selected, its checkbox is locked from being unchecked.
  - **Smart API Key Fields**: Selecting a provider reveals its API key input. Unchecking hides the field without clearing the entered value (stored in state and cached in `localStorage`).
- **Trade Calculation Engine**:
  - Calculates total USD sell volume ($V_{\text{sell}} = Q_{\text{sell}} \times P_{\text{sell}}$) and buy volume ($V_{\text{buy}} = Q_{\text{buy}} \times P_{\text{buy}}$).
  - Difference / Delta: $\Delta = V_{\text{buy}} - V_{\text{sell}}$.
  - **Color-Coded Statuses**:
    - **Loss > $20**: Displayed in **Red**.
    - **Loss $0 – $20**: Displayed in **Yellow**.
    - **Profit**: Displayed in **Green** with an animated **`(WTF?)`** badge in Red.
  - **Relative Percentage Difference**: $100\% \times \frac{|\Delta|}{(V_{\text{sell}} + V_{\text{buy}}) / 2}$.
- **Strict On-Demand Fetching**:
  - API requests are sent **only** when clicking the **"Calculate"** button (no timer polling or background requests).
  - The button enters a 3-second lockout state with label **"Sent"** and a cooldown progress bar to prevent duplicate submissions.
- **Top Preferences & Security Bar**:
  - **Language Switcher**: Instant switching between **English** (default) and **Русский** with full dynamic re-translation of on-screen results.
  - **Theme Switcher**: **Light**, **Dark** (default), and **System** (follows OS preferences in real time).
  - **API Key Storage & Privacy Controls**:
    - **"Do not save keys" Checkbox**: Preventive non-saving mode designed for shared or foreign computers. When checked, entered API keys remain strictly in runtime memory and are never written to `localStorage`.
    - **"Clear keys" Button**: Immediately wipes all saved API keys from browser `localStorage` and clears active input fields.
    - **Visual Status Indicators**: Left of each API key input, displays a floppy disk (`💾`) icon when the key is saved in `localStorage`, or a crossed-out floppy disk icon when saving is blocked by the preventive checkbox.
    - **Safe Uncheck Confirmation**: If unchecking "Do not save keys" while keys are already stored in `localStorage`, an interactive modal dialog prompts the user to either **"Clear"** or **"Keep"** the stored keys.

---

### Why is a Local Mini-Server Needed for CoinMarketCap?

**CoinMarketCap's API** deliberately prohibits direct browser-side `fetch()` calls by omitting `Access-Control-Allow-Origin` CORS headers to protect developers' private API keys. Direct requests from a browser will result in a CORS error.

To solve this seamlessly, **CCPriceConverter** includes a lightweight local server that:
1. Serves the static assets (`index.html`, CSS, JS).
2. Acts as a reverse CORS proxy for `/api/cmc/*` requests, forwarding them to `https://pro-api.coinmarketcap.com` with the `X-CMC_PRO_API_KEY` header and appending CORS headers to the response.

---

### Quick Start

Zero external packages are required! Both **Node.js** and **Python 3** implementations use native standard libraries.

#### Option A: Run via Node.js (Recommended)
Requirements: Node.js 18+

```bash
# Start the server (default port 3000)
npm start
# or:
node server.js
```

#### Option B: Run via Python 3
Requirements: Python 3.8+

```bash
python3 server.py
```

#### Custom Port
```bash
PORT=8080 node server.js
# or
PORT=8080 python3 server.py
```

Then open your browser at: **`http://localhost:3000`**

---

### Running Unit Tests

Automatic tests for the math calculation engine, formatting, and edge cases:

```bash
node tests/calculator.test.js
```

---

### Project Structure

```text
CCPriceConverter/
├── index.html               # Semantic HTML markup and layout
├── package.json             # NPM start and dev scripts
├── server.js                # Zero-dependency Node.js static server & CMC CORS proxy
├── server.py                # Zero-dependency Python 3 static server & CMC CORS proxy
├── INSTRUCTIONS.md          # Step-by-step local usage guide (Russian)
├── README.md                # Bilingual documentation
├── css/
│   └── style.css            # Neo-Fintech design system (Dark & Light themes, Glassmorphism)
├── js/
│   ├── app.js               # Main application controller & event handlers
│   ├── calculator.js        # Mathematical formulas and trade difference engine
│   ├── providers.js         # API integration adapters for all 4 quote providers
│   ├── i18n.js              # Localization module (English & Russian)
│   └── theme.js             # Theme switcher (Light, Dark, System)
└── tests/
    └── calculator.test.js   # Unit tests for the calculator module
```

---

<br>

---

<a name="russian"></a>
## Russian

# CCPriceConverter

**CCPriceConverter** — современный браузерный калькулятор курсов криптовалют и объёмов обмена с адаптивным интерфейсом. Приложение собирает котировки в реальном времени от независимых API-провайдеров, сопоставляет стоимость сделки (покупка vs продажа) и визуализирует разницу (потери или профит) в удобном наглядном формате.

---

### Возможности

- **4 провайдера котировок**:
  - **DefiLlama**: Публичный DeFi-агрегатор, не требует API-ключа (включён по умолчанию).
  - **CoinMarketCap**: Поддерживается через встроенный локальный CORS-прокси с указанием API-ключа.
  - **CoinGecko**: Прямые браузерные запросы с поддержкой опционального Demo/Pro ключа.
  - **CoinPaprika**: Прямые браузерные запросы с поддержкой опционального Pro ключа.
- **6 поддерживаемых криптовалют**:
  - Bitcoin (`BTC`), Ethereum (`ETH`), Bitcoin Cash (`BCH`), Zcash (`ZEC`), Monero (`XMR`), Ripple (`XRP`).
- **Интерактивный интерфейс и управление провайдерами**:
  - Возможность активировать любое количество провайдеров от 1 до 4.
  - **Правило последнего чекбокса**: если активен только 1 провайдер, чекбокс блокируется от снятия (минимум один источник всегда выбран).
  - **Умные поля API-ключей**: при выборе провайдера плавно открывается поле ввода ключа. При снятии чекбокса поле скрывается, но значение сохраняется в памяти и кэшируется в `localStorage`.
- **Математический калькулятор сделки**:
  - Расчёт стоимости объёма продажи ($V_{\text{sell}} = Q_{\text{sell}} \times P_{\text{sell}}$) и покупки ($V_{\text{buy}} = Q_{\text{buy}} \times P_{\text{buy}}$).
  - Дельта (разница объёмов): $\Delta = V_{\text{buy}} - V_{\text{sell}}$.
  - **Цветовая дифференциация статусов**:
    - **Потери > $20**: Отображаются **красным цветом**.
    - **Потери от $0$ до $20$**: Отображаются **жёлтым цветом**.
    - **Профит**: Отображается **зелёным цветом** с красной пометкой **`(WTF?)`**.
  - **Потери / профит в процентах**: $100\% \times \frac{|\Delta|}{(V_{\text{sell}} + V_{\text{buy}}) / 2}$.
- **Запросы строго по требованию**:
  - Сетевые вызовы происходят **исключительно** по клику на кнопку **«Посчитать»** (никаких фоновых запросов или таймеров).
  - После клика кнопка блокируется на 3 секунды со статусом **«Отправлено»** и индикатором перезарядки.
- **Верхняя панель настроек и безопасности**:
  - **Смена языка**: мгновенное переключение между **English** (по умолчанию) и **Русский** с динамическим переводом всех уже рассчитанных результатов.
  - **Смена темы**: **Light** (светлая), **Dark** (тёмная — по умолчанию) и **System** (системная, подстраивается под тему ОС).
  - **Управление API-ключами и конфиденциальность**:
    - **Чекбокс «Не сохранять ключи»**: превентивный режим безопасности для работы на чужом или общем компьютере. При установленном чекбоксе введённые API-ключи хранятся исключительно в оперативной памяти сессии и не записываются в `localStorage`.
    - **Кнопка «Стереть ключи»**: мгновенно стирает все сохранённые ключи из `localStorage` браузера и очищает поля ввода.
    - **Индикаторы сохранения ключа**: слева от каждого поля ввода API-ключа отображается иконка дискеты (`💾`), если ключ сохранён в `localStorage`, либо перечёркнутая дискета, если сохранение заблокировано превентивным чекбоксом.
    - **Защита при снятии чекбокса**: если пользователь снимает отметку «Не сохранять», а в `localStorage` уже обнаружены ранее сохранённые ключи, открывается модальное окно с вариантами **«Очистить»** или **«Оставить»**.

---

### Зачем нужен локальный мини-сервер для CoinMarketCap?

API платформы **CoinMarketCap** сознательно блокирует прямые браузерные запросы (отсутствуют CORS-заголовки `Access-Control-Allow-Origin`), чтобы защитить приватные ключи разработчиков от утечки на клиенте. Прямой `fetch()` из браузера завершится ошибкой CORS.

Для решения этой проблемы в проект встроен сверхлёгкий сервер, который:
1. Раздаёт статические файлы приложения (`index.html`, CSS, JS).
2. Выступает в роли reverse CORS-прокси для эндпоинта `/api/cmc/*`, перенаправляя запросы на `https://pro-api.coinmarketcap.com` с заголовком `X-CMC_PRO_API_KEY` и возвращая ответ в браузер с необходимыми заголовками CORS.

---

### Быстрый запуск

Внешние библиотеки и пакеты **не требуются** — серверы на **Node.js** и **Python 3** написаны исключительно на встроенных стандартных библиотеках.

#### Вариант А: Запуск через Node.js (Рекомендуемый)
Требования: Node.js 18+

```bash
# Запуск сервера на порту 3000
npm start
# либо:
node server.js
```

#### Вариант Б: Запуск через Python 3
Требования: Python 3.8+

```bash
python3 server.py
```

#### Запуск на произвольном порту
```bash
PORT=8080 node server.js
# или
PORT=8080 python3 server.py
```

После запуска откройте в браузере: **`http://localhost:3000`**

---

### Запуск модульных тестов

Автоматическая проверка формул калькулятора, процентных соотношений и форматирования:

```bash
node tests/calculator.test.js
```

---

### Структура проекта

```text
CCPriceConverter/
├── index.html               # Разметка и семантическая структура веб-страницы
├── package.json             # NPM-скрипты запуска (start, dev)
├── server.js                # Сервер статики и CORS-прокси на чистом Node.js
├── server.py                # Сервер статики и CORS-прокси на чистом Python 3
├── INSTRUCTIONS.md          # Подробная русскоязычная инструкция по запуску
├── README.md                # Двуязычная документация проекта
├── css/
│   └── style.css            # Дизайн-система (тёмная и светлая темы, glassmorphism)
├── js/
│   ├── app.js               # Главный контроллер интерфейса и событий
│   ├── calculator.js        # Модуль математических расчетов объёмов и дельт
│   ├── providers.js         # Адаптеры интеграции с 4 API провайдеров котировок
│   ├── i18n.js              # Модуль локализации (English / Русский)
│   └── theme.js             # Модуль управления темой оформления (Light, Dark, System)
└── tests/
    └── calculator.test.js   # Модульные тесты калькулятора
```
