import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CMC_PRO_API_KEY, Authorization');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // 1. Прокси для CoinMarketCap API
  if (pathname.startsWith('/api/cmc')) {
    const targetPath = pathname.replace(/^\/api\/cmc/, '') || '/v1/cryptocurrency/quotes/latest';
    const targetUrl = new URL(targetPath + reqUrl.search, 'https://pro-api.coinmarketcap.com');

    const cmcKey = req.headers['x-cmc_pro_api_key'] || reqUrl.searchParams.get('CMC_PRO_API_KEY');

    if (!cmcKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: {
          error_code: 1002,
          error_message: 'API key is missing. Please provide X-CMC_PRO_API_KEY header or enter key in UI.'
        }
      }));
      return;
    }

    try {
      console.log(`[CMC Proxy] Request to: ${targetUrl.pathname + targetUrl.search}`);
      const cmcResponse = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: {
          'X-CMC_PRO_API_KEY': cmcKey,
          'Accept': 'application/json',
          'Accept-Encoding': 'deflate, gzip'
        }
      });

      const responseData = await cmcResponse.text();
      res.writeHead(cmcResponse.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(responseData);
    } catch (err) {
      console.error('[CMC Proxy Error]:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: {
          error_code: 5002,
          error_message: `Proxy error reaching CoinMarketCap: ${err.message}`
        }
      }));
    }
    return;
  }

  // 2. Статические файлы
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Предотвращение выхода за пределы рабочей директории
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  if (!existsSync(safePath)) {
    // Fallback на index.html если запрошен несуществующий путь
    filePath = path.join(__dirname, 'index.html');
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  CCPriceConverter Server is running!`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  CMC Proxy:   http://localhost:${PORT}/api/cmc/*`);
  console.log(`======================================================\n`);
});
