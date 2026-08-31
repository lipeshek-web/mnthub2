#!/usr/bin/env python3
"""Diagnose why the embedded Snack runtime stays at Loading: reload iframe and capture network/console."""
import json, time, urllib.request, base64, sys
import websocket

CDP_HTTP = "http://127.0.0.1:41053"

def get_targets():
    with urllib.request.urlopen(CDP_HTTP + "/json") as r:
        return json.load(r)

def find_page(substr):
    for t in get_targets():
        if t["type"] == "page" and substr in t["url"]:
            return t["webSocketDebuggerUrl"], t["url"]
    raise SystemExit("not found")

ws_url, page_url = find_page("snack.expo.dev/5SQWUSi5Rv3jLU6Zg_V4V")
ws = websocket.create_connection(ws_url, timeout=40, suppress_origin=True, max_size=None)
mid = 0
def cmd(method, **params):
    global mid
    mid += 1
    ws.send(json.dumps({"id": mid, "method": method, "params": params}))
    # drain until matching id, collecting events
    deadline = time.time() + 35
    result = None
    while time.time() < deadline:
        try:
            msg = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            break
        if msg.get("id") == mid:
            result = msg.get("result", {})
            break
    return result

cmd("Runtime.enable")
cmd("Page.enable")
cmd("Network.enable")
cmd("Log.enable")

events = []
# set iframe src to itself to re-navigate just the frame
cmd("Runtime.evaluate", expression="""
  (()=>{const f=document.querySelector('iframe'); const s=f.src; f.src=s; return 're-navigated';})()
""", returnByValue=True)

deadline = time.time() + 60
while time.time() < deadline:
    try:
        msg = json.loads(ws.recv())
    except websocket.WebSocketTimeoutException:
        continue
    except Exception:
        break
    m = msg.get("method")
    p = msg.get("params", {})
    if m == "Network.requestWillBeSent":
        url = p["request"]["url"]
        if "eascdn" in url or "snack" in url or "expo" in url or "ws" in p["request"].get("url",""):
            events.append(("REQ", p["request"]["method"], url[:150]))
        if p["request"]["url"].startswith("ws"):
            events.append(("WS", p["request"]["method"], url[:150]))
    elif m == "Network.responseReceived":
        r = p["response"]
        if r["status"] >= 400:
            events.append(("RESP", r["status"], r["url"][:150]))
    elif m == "Network.webSocketCreated":
        events.append(("WSCREATE", p.get("url", "")[:150], ""))
    elif m == "Network.webSocketFrameError":
        events.append(("WSERROR", str(p.get("errorMessage"))[:150], ""))
    elif m == "Log.entryAdded":
        e = p["entry"]
        events.append(("LOG", e["level"], (e.get("text","") + " " + e.get("url",""))[:200]))
    elif m == "Runtime.exceptionThrown":
        d = p["exceptionDetails"]
        events.append(("EXC", "", json.dumps(d)[:300]))
    elif m == "Runtime.consoleAPICalled":
        t = p.get("type")
        txt = " ".join(str(a.get("value", a.get("description","")))[:120] for a in p.get("args", []))
        events.append(("CONSOLE", t, txt[:200]))

for e in events:
    print(*e)
print("TOTAL EVENTS:", len(events))
