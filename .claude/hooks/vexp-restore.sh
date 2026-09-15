#!/bin/bash
# vexp-restore: context lifecycle restore on SessionStart (compact/resume). Fails open.
VEXP_BIN="/Users/caesarbuenviaje/.nvm/versions/node/v22.11.0/lib/node_modules/vexp-cli/node_modules/@vexp/core-darwin-arm64/bin/vexp-core"
[ -x "$VEXP_BIN" ] || exit 0
"$VEXP_BIN" session-context 2>/dev/null
exit 0
