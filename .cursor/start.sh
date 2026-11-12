#!/usr/bin/env bash
set -euo pipefail
web_up=0
api_up=0
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
  web_up=1
fi
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:4000/health; then
  api_up=1
fi
if [[ "$web_up" -eq 1 && "$api_up" -eq 1 ]]; then
  echo "SAKU stack already listening on ports 3000 and 4000"
  exit 0
fi
if [[ "$web_up" -eq 1 || "$api_up" -eq 1 ]]; then
  echo "SAKU stack is only partly up (web=$web_up api=$api_up); refusing to start a second copy" >&2
  exit 1
fi
exec npm run dev:stack
