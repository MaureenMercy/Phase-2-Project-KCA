#!/usr/bin/env bash
set -euo pipefail
npm ci
node -e "require('./backend/node_modules/mongodb-memory-server-core/lib/util/postinstallHelper').postInstallEnsureBinary(undefined, false).then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });"
