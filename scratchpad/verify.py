import re, json, urllib.request, gzip, sys
base = "https://ai-daeyeok.vercel.app"

def get(u):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Accept-Encoding": "gzip"})
    d = urllib.request.urlopen(r, timeout=30)
    b = d.read()
    if d.headers.get("Content-Encoding") == "gzip":
        b = gzip.decompress(b)
    return b.decode("utf-8", "ignore")

html = get(base + "/login")
pat = re.compile(r'(eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}|sb_publishable_[A-Za-z0-9_-]{20,})')
key = None
for s in sorted(set(re.findall(r'/_next/static/[^"\']+?\.js', html)))[:40]:
    try:
        txt = get(base + s)
    except Exception:
        continue
    m = pat.search(txt)
    if m:
        key = m.group(1)
        break
sys.stdout.write("key found: %s\n" % bool(key))
sys.stdout.flush()

req = urllib.request.Request(
    "https://alafyhejiaxukrkrmehh.supabase.co/rest/v1/character_options?kind=eq.tone&select=name,prompt,sort_order&order=sort_order",
    headers={"apikey": key, "Authorization": "Bearer " + key})
try:
    rows = json.load(urllib.request.urlopen(req, timeout=30))
except Exception as e:
    sys.stdout.write("REST failed: %s %s\n" % (type(e).__name__, e))
    body = getattr(e, "read", None)
    if body:
        sys.stdout.write(body().decode("utf-8", "ignore")[:400] + "\n")
    sys.exit(0)

sys.stdout.write("rows: %d\n" % len(rows))
gear = ["softbox", "light stand", "reflector panel", "strobe", "tripod"]
for r in rows:
    p = r["prompt"] or ""
    g = [w for w in gear if w in p.lower()]
    bg = [w for w in ["wall", "window", "bokeh", "behind the person"] if w in p.lower()]
    sys.stdout.write("sort=%s gear=%s bg=%s len=%d\n" % (r["sort_order"], g or "none", bg or "none", len(p)))
    sys.stdout.write("   " + p[:170].encode("ascii", "ignore").decode() + " ...\n")
