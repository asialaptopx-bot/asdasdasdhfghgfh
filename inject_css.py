#!/usr/bin/env python3
import re, sys

INDEX = "/home/user/sohil-panel/index.js"
CSS_FILE = "/home/user/sohil-panel/new-app.css"

with open(CSS_FILE, "r", encoding="utf-8") as f:
    css = f.read()

# Escape for embedding in a JS double-quoted string
css_escaped = (
    css.replace("\\", "\\\\")
       .replace("\n", "\\n")
       .replace('"', '\\"')
)

with open(INDEX, "r", encoding="utf-8") as f:
    t = f.read()

start_marker = 'appCss: "'
end_marker = '",\n  appJs: "'

si = t.find(start_marker)
if si == -1:
    print("ERROR: start_marker not found"); sys.exit(1)
si += len(start_marker)

ei = t.find(end_marker, si)
if ei == -1:
    print("ERROR: end_marker not found"); sys.exit(1)

new_t = t[:si] + css_escaped + t[ei:]

with open(INDEX, "w", encoding="utf-8") as f:
    f.write(new_t)

print("CSS injected successfully.")
print("Old CSS length:", ei - si)
print("New CSS length:", len(css_escaped))

# Syntax check
import subprocess
r = subprocess.run(["node", "--check", INDEX], capture_output=True, text=True)
if r.returncode == 0:
    print("node --check: SYNTAX OK")
else:
    print("node --check FAILED:", r.stderr)
    sys.exit(1)
