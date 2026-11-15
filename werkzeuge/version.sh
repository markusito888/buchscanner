#!/bin/bash
# Setzt die Versionsnummer in app/app.js und app/sw.js.
# Aufruf: werkzeuge/version.sh 0.1.1
set -e
[ -z "$1" ] && { echo "Aufruf: $0 <neue Version, z. B. 0.1.1>"; exit 1; }
cd "$(dirname "$0")/../app"
sed -i '' "s/^const VERSION = '[^']*';/const VERSION = '$1';/" app.js sw.js
grep -H "^const VERSION" app.js sw.js
