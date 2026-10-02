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

## Obtaining API Keys

### DefiLlama
**No API key required.** DefiLlama provides a fully free and open API with no registration needed.

### CoinMarketCap (required key)
1. Go to the sign-up page: [pro.coinmarketcap.com/signup](https://pro.coinmarketcap.com/signup)
2. Create a free account (the **Basic** plan is free).
3. After confirming your email, log in to the Developer Portal.
4. Copy your API key from the Dashboard page.

**Free plan (Basic):** 10,000 calls/month, 30 calls/min — more than enough for this calculator.

### CoinGecko (optional key)
CoinGecko works without a key, but with strict rate limits (~10–30 req/min). A free Demo key is recommended for stable use:

1. Go to [coingecko.com/en/api/pricing](https://www.coingecko.com/en/api/pricing) and click **"Start for Free"** (Demo plan).
2. Sign up or log in to your CoinGecko account (no credit card required).
3. In the [Developer Dashboard](https://www.coingecko.com/en/api/dashboard), click **"+ Add New Key"** and copy your key.

**Free plan (Demo):** ~10,000 calls/month.

### CoinPaprika (optional key)
CoinPaprika works without a key on its free tier (20,000 calls/month, top 2,000 coins). Paid plans are available for extended access:

- API & pricing page: [coinpaprika.com/api](https://coinpaprika.com/api/)
- The **Pro** plan ($199/mo) removes asset limits and adds extended historical data.

The free keyless access is sufficient for this calculator.

---

## Using the Interface

1. **Selecting Providers**:
   - **DefiLlama** is selected by default.
   - You can select anywhere from 1 to 4 providers.
   - If only one checkbox is active, it becomes locked from being unchecked (at least one source must always remain selected).
   - When activating CoinMarketCap, CoinGecko, or CoinPaprika, an API key input field appears to the right.
   - An indicator appears to the left of the input: a floppy disk emoji (`💾`) when saved in `localStorage`, or a crossed-out floppy disk when non-saving mode is enabled.
   - If you uncheck a provider, the entered key is not erased; it remains saved in memory and cached in `localStorage` (unless non-saving mode is active).

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

6. **API Key Privacy & Storage Controls**:
   - **"Do not save keys" Checkbox**: Preventive security mode for shared or foreign computers. When checked, entered API keys remain strictly in runtime memory and are not written to `localStorage`. A crossed-out floppy disk icon is displayed next to inputs.
   - **"Clear keys" Button**: Immediately wipes all saved API keys from browser `localStorage` and clears current input fields.
   - **Interactive Modal on Activation**: When you check (activate) "Do not save keys" while keys are already stored in `localStorage`, a modal dialog appears offering options to **"Clear"** or **"Keep"** the stored keys.
