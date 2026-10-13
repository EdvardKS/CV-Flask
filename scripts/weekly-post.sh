#!/usr/bin/env bash
set -euo pipefail
export HOME="${HOME:-/home/ubuntu}"
export PATH="/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec flock -n /tmp/edvardks-weekly-post.lock node "$HERE/weekly-post.mjs" "$@"
