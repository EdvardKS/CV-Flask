import sys
DASH = "/var/www/viewerSoftware/frontend/src/components/Dashboard.jsx"
SNIP = "/tmp/stopped_card.txt"

with open(DASH, "r") as f:
    s = f.read()
with open(SNIP, "r") as f:
    comp = f.read()

# 1. Insert component before NetworkCard
nc = "function NetworkCard() {"
idx = s.index(nc)
s2 = s[:idx] + comp + "\n\n" + s[idx:]

# 2. Add card render after Eventos Docker card
ev_marker = '<Card title="Eventos Docker (1h)"'
ridx = s2.index(ev_marker)
# Find the closing `</Card>}` after this point
end = s2.index("</Card>}", ridx) + len("</Card>}")

new_render = (
    "\n\n        {T('docker') && <Card title=\"Contenedores parados\" "
    'delay={0.29} className="lg:col-span-3" '
    'help="Containers en estado exited/dead. Boton para arrancar con docker start. Poll 3s.">'
    "\n          <StoppedContainersCard notify={notify} canWrite={canWrite} />"
    "\n        </Card>}"
)

s3 = s2[:end] + new_render + s2[end:]

with open(DASH, "w") as f:
    f.write(s3)
print("done, len:", len(s3))
