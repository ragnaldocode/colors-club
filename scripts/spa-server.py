#!/usr/bin/env python3
"""Static server for an Expo `output: 'single'` web export, with SPA fallback.

A plain `python3 -m http.server` on `dist/` answers 404 for every client-side
route (`/lista`, `/exame/123`), which breaks deep-link and reload verification.
This serves `index.html` for any path that is not a real file.

Usage:
    python3 spa-server.py <port> <dist-dir>

Run it as a tracked background process, then drive the page with the browser
tools. Rebuild+re-export after source edits; the served tree is static.
"""
import http.server
import os
import socketserver
import sys


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    root = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "dist")
    if not os.path.isdir(root):
        raise SystemExit(f"not a directory: {root}")

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=root, **kwargs)

        def do_GET(self):
            path = self.translate_path(self.path)
            if not os.path.exists(path) or os.path.isdir(path):
                self.path = "/index.html"
            return super().do_GET()

        def log_message(self, *args):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"serving {root} on http://127.0.0.1:{port} (SPA fallback on)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
