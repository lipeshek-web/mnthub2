#!/usr/bin/env python3
"""Attach to the OOPIF target itself, enable Network/Log, reload it, capture events."""
import json, time, urllib.request
import websocket

CDP_HTTP = "http://127.0.0.1:41053"

def get_targets():
    with urllib.request.urlopen(CDP_HTTP + "/json") as r:
        return json.load(r)

iframe = None
for t in get_targets():
    if t["type"] == "iframe" and "snack-runtime" in t["url"]:
        iframe = t
if not iframe:
    raise SystemExit("iframe target not found")
print("IFRAME:", iframe["url"][:120])

ws = websocket.create_connection(iframe["webSocketDebuggerUrl"], timeout=40, suppress_origin=True, max_size=None)
mid = 0
def cmd(method, **params):
    global mid
    mid += 1
    ws.send(json.dumps({"id": mid, "method": method, "params": params}))
    deadline = time.time() + 20
    while time.time() < deadline:
        try:
            msg = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            return {}
        if msg.get("id") == mid:
            return msg.get("result", {})
    return {}

cmd("Runtime.enable")
cmd("Page.enable")
cmd("Network.enable")
cmd("Log.enable")
# navigate the frame itself to its own URL (fresh load)
cmd("Page.navigate", url=iframe["url"])

events = []
deadline = time.time() + 75
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
        events.append(("REQ", p["request"]["method"], url[:160]))
    elif m == "Network.responseReceived":
        r = p["response"]
        events.append(("RESP", str(r["status"]), r["url"][:160]))
    elif m == "Network.webSocketCreated":
        events.append(("WSCREATE", p.get("url","")[:160], ""))
    elif m == "Network.webSocketFrameError":
        events.append(("WSERROR", str(p.get("errorMessage",""))[:200], ""))
    elif m == "Network.loadingFailed":
        events.append(("FAIL", p.get("errorText",""), p.get("type","")))
    elif m == "Log.entryAdded":
        e = p["entry"]
        events.append(("LOG", e["level"], (e.get("text","") + " | " + e.get("url",""))[:220]))
    elif m == "Runtime.exceptionThrown":
        events.append(("EXC", "", json.dumps(p["exceptionDetails"])[:400]))
    elif m == "Runtime.consoleAPICalled":
        txt = " ".join(str(a.get("value", a.get("description","")))[:150] for a in p.get("args", []))
        events.append(("CONSOLE", p.get("type",""), txt[:250]))

print("TOTAL EVENTS:", len(events))
for e in events[:120]:
    print(*e)
