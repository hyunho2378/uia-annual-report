#!/bin/zsh
cd "$(dirname "$0")" && npm install --no-audit --no-fund && npx vite --port 5192 --host 127.0.0.1
