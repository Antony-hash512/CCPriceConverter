# Launch and User Guide for Cryptocurrency Rate Calculator

## About the Project
**CCPriceConverter** is a browser-based cryptocurrency rate and exchange volume calculator that aggregates live quotes from 4 providers:
- **DefiLlama** (works directly in the browser, no API keys required)
- **CoinMarketCap** (requires an API key and a local proxy due to CORS restrictions)
- **CoinGecko** (works directly in the browser, optional Demo/Pro API key)
- **CoinPaprika** (works directly in the browser, optional Pro API key)

---

## Why is a Local Mini-Server Needed for CoinMarketCap?

The **CoinMarketCap** platform deliberately blocks direct browser-side requests (it lacks `Access-Control-Allow-Origin` CORS headers) to protect users' private API keys from client-side exposure. If you send a direct `fetch()` call from a browser to `pro-api.coinmarketcap.com`, the browser will reject the response with a security error.

To solve this, the project includes an ultra-lightweight local server (available in both **Node.js** and **Python 3** with zero external dependencies). The server:
1. Serves the static website files (`index.html`, CSS, JS).
2. Proxies requests to `https://pro-api.coinmarketcap.com` via the local endpoint `/api/cmc/*` with all required CORS headers appended.

---

## Launch Options

### Option 1: Run via Node.js (Recommended)

Ensure Node.js (v18+) is installed. **No external packages need to be installed**.

```bash
# Navigate to the project directory:
cd /home/mega/git/CCPriceConverter

# Start the server with a single command:
npm start
# or:
node server.js
```

The server will be available at: **`http://localhost:3000`**

---

### Option 2: Run via Python 3

If you prefer Python 3, it uses the standard Python library (no `pip install` required):

```bash
# Navigate to the project directory:
cd /home/mega/git/CCPriceConverter

# Start the server:
python3 server.py
```

The server will also be available at: **`http://localhost:3000`**

---

### Option 3: Run on a Custom Port

If port 3000 is occupied, pass the `PORT` environment variable:

```bash
PORT=8080 node server.js
# or
PORT=8080 python3 server.py
```

---

### Option 4: Standalone Run (Pure Static HTML)

You can also open `index.html` directly in your browser (via `file:///` or any static server such as Live Server in VS Code / Antigravity IDE).
- Providers **DefiLlama**, **CoinGecko**, and **CoinPaprika** will work directly via public CORS.
- For **CoinMarketCap** in this mode, a running local proxy or an accessible external CORS proxy is required (the interface displays an informative hint if the proxy is unavailable).

---

## Using the Interface

1. **Selecting Providers**:
   - **DefiLlama** is selected by default.
   - You can select anywhere from 1 to 4 providers.
   - If only one checkbox is active, it becomes locked from being unchecked (at least one source must always remain selected).
   - When activating CoinMarketCap, CoinGecko, or CoinPaprika, an API key input field appears to the right.
   - If you uncheck a provider, the entered key is not erased; it remains saved in memory and cached in `localStorage`.

2. **Entering Trade Parameters (Input)**:
   - In the **"Sell"** column, choose a cryptocurrency (BTC, ETH, BCH, ZEC, XMR, XRP) and enter the volume you are selling.
   - In the **"Buy"** column, choose a cryptocurrency and enter the expected volume you want to receive.

3. **Calculating**:
   - Click the **"Calculate"** button.
   - The button locks for 3 seconds with the label `"Sent"` to prevent accidental double-clicks.
   - Network requests are sent **strictly** upon clicking this button.

4. **Viewing Results (Output)**:
   - An informative card is displayed for each active provider:
     - Price per 1 unit of each selected currency in USD.
     - Total USD value of the sell volume and buy volume.
     - Volume difference (delta):
       - Loss $> 20$ USD $\to$ **Red color**.
       - Loss from $0$ to $20$ USD $\to$ **Yellow color**.
       - Profit $\to$ **Green color** with a red **`(WTF?)`** badge.
     - Loss/profit in percentage relative to the average of total volumes.

5. **Changing Language and Theme (at the very top of the page)**:
   - **Interface Language**: Instant switching between **English** (default) and **Русский** (saves choice to `localStorage` and immediately translates all on-screen results).
   - **Color Theme**: Choice between **Light**, **Dark** (default), and **System** (automatically adapts to your operating system settings).
