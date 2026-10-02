#!/usr/bin/env python3
"""
CCPriceConverter: локальный мини-сервер на стандартной библиотеке Python 3.
Раздает статические файлы и выполняет роль CORS-прокси для CoinMarketCap API.
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import os
import sys

PORT = int(os.environ.get("PORT", 3000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CMC_PRO_API_KEY, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        # Проксирование запросов к CoinMarketCap
        if parsed_url.path.startswith("/api/cmc"):
            target_path = parsed_url.path.replace("/api/cmc", "")
            if not target_path:
                target_path = "/v1/cryptocurrency/quotes/latest"
            
            target_url = f"https://pro-api.coinmarketcap.com{target_path}"
            if parsed_url.query:
                target_url += f"?{parsed_url.query}"

            cmc_key = self.headers.get("X-CMC_PRO_API_KEY")
            if not cmc_key:
                query_params = urllib.parse.parse_qs(parsed_url.query)
                cmc_key = query_params.get("CMC_PRO_API_KEY", [None])[0]

            if not cmc_key:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":{"error_code":1002,"error_message":"API key missing. Provide X-CMC_PRO_API_KEY header."}}')
                return

            req = urllib.request.Request(target_url)
            req.add_header("X-CMC_PRO_API_KEY", cmc_key)
            req.add_header("Accept", "application/json")
            req.add_header("User-Agent", "CCPriceConverter/1.0")

            try:
                print(f"[CMC Proxy] Forwarding: {target_url}")
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(response.status)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(data)
            except urllib.error.HTTPError as e:
                err_data = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(err_data)
            except Exception as e:
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                import json
                err_msg = json.dumps({"status": {"error_code": 5002, "error_message": str(e)}})
                self.wfile.write(err_msg.encode('utf-8'))
            return

        # Обычная раздача статических файлов
        super().do_GET()

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        print("\n======================================================")
        print(f"  CCPriceConverter Python Server is running!")
        print(f"  Local URL:   http://localhost:{PORT}")
        print(f"  CMC Proxy:   http://localhost:{PORT}/api/cmc/*")
        print("======================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    run()
