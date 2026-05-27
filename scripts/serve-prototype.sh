#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-5180}"
ROOT="docs/00-getting-started-manual/claude-design-prototype"

python3 - "$PORT" "$ROOT" <<'PY'
import functools
import http.server
import socketserver
import sys

port = int(sys.argv[1])
root = sys.argv[2]

class PrototypeHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".jsx": "application/javascript",
    }

handler = functools.partial(PrototypeHandler, directory=root)
with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
    print(f"serving {root} at http://127.0.0.1:{port}/", flush=True)
    httpd.serve_forever()
PY
