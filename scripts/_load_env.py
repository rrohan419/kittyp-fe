#!/usr/bin/env python3
"""Print KEY=VALUE lines suitable for eval by bash (values safely quoted). Never logs values."""
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.is_file():
    sys.stderr.write(f"missing env file: {path}\n")
    sys.exit(1)

def emit(k: str, v: str) -> None:
    # POSIX-safe single-quote escaping
    safe = "'" + v.replace("'", "'\"'\"'") + "'"
    print(f"export {k}={safe}")

for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    if "=" not in line:
        continue
    key, _, val = line.partition("=")
    key = key.strip()
    if not key or not key.replace("_", "").isalnum() or key[0].isdigit():
        continue
    # strip optional surrounding quotes
    if len(val) >= 2 and ((val[0] == val[-1] == '"') or (val[0] == val[-1] == "'")):
        val = val[1:-1]
    emit(key, val)
