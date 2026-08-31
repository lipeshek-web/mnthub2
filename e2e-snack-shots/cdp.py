#!/usr/bin/env python3
"""CDP helper to drive the Snack preview iframe (agent-browser frame switch is broken for this OOPIF)."""
import json, sys, time, base64, urllib.request
import websocket

CDP_HTTP = "http://127.0.0.1:41053"

def get_targets():
    with urllib.request.urlopen(CDP_HTTP + "/json") as r:
        return json.load(r)

def find_page(ws_url_substr):
    for t in get_targets():
        if t["type"] == "page" and ws_url_substr in t["url"]:
            return t
    raise SystemExit("page target not found: " + ws_url_substr)

def find_iframe(url_substr):
    for t in get_targets():
        if t["type"] == "iframe" and url_substr in t["url"]:
            return t
    raise SystemExit("iframe target not found: " + url_substr)

class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30, max_size=None, suppress_origin=True)
        self.id = 0
    def cmd(self, method, **params):
        self.id += 1
        mid = self.id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        deadline = time.time() + 30
        while time.time() < deadline:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
        raise TimeoutError(method)
    def close(self):
        try: self.ws.close()
        except Exception: pass

def iframe_session():
    t = find_iframe("snack-runtime")
    c = CDP(t["webSocketDebuggerUrl"])
    c.cmd("Runtime.enable")
    return c

def evaluate(c, expr):
    r = c.cmd("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
    res = r.get("result", {})
    if res.get("subtype") == "error":
        raise RuntimeError(res.get("description", "eval error"))
    return res.get("value")

def main():
    cmd = sys.argv[1]
    if cmd == "text":
        c = iframe_session()
        print(evaluate(c, "document.body ? document.body.innerText.slice(0,3000) : 'no body'"))
        c.close()
    elif cmd == "eval":
        c = iframe_session()
        print(json.dumps(evaluate(c, sys.argv[2]), ensure_ascii=False, default=str))
        c.close()
    elif cmd == "click":
        # click a CSS selector inside the iframe via real DOM click
        sel = sys.argv[2]
        c = iframe_session()
        n = evaluate(c, f"(()=>{{const e=document.querySelector({json.dumps(sel)});if(!e)return 'NOT FOUND';e.click();return 'CLICKED '+e.tagName;}})()")
        print(n); c.close()
    elif cmd == "findtext":
        # find element containing text and click it
        txt = sys.argv[2]; tag = sys.argv[3] if len(sys.argv) > 3 else "*"
        c = iframe_session()
        n = evaluate(c, f"""(()=>{{
          const els=Array.from(document.querySelectorAll({json.dumps(tag)}));
          const t={json.dumps(txt)};
          const e=els.find(x=>x.childElementCount===0 && x.textContent.trim().includes(t)) ||
                  els.find(x=>x.textContent.trim()===t);
          if(!e) return 'NOT FOUND';
          e.dispatchEvent(new MouseEvent('click',{{bubbles:true,cancelable:true}}));
          return 'CLICKED['+e.tagName+']:'+e.textContent.trim().slice(0,60);
        }})()""")
        print(n); c.close()
    elif cmd == "fill":
        sel, val = sys.argv[2], sys.argv[3]
        c = iframe_session()
        n = evaluate(c, f"""(()=>{{
          const e=document.querySelector({json.dumps(sel)});
          if(!e) return 'NOT FOUND';
          const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
          setter.call(e,{json.dumps(val)});
          e.dispatchEvent(new Event('input',{{bubbles:true}}));
          e.dispatchEvent(new Event('change',{{bubbles:true}}));
          return 'FILLED:'+e.value;
        }})()""")
        print(n); c.close()
    elif cmd == "shot":
        # screenshot the whole browser page containing the iframe (t1 editor) or a given page substr
        substr = sys.argv[2] if len(sys.argv) > 2 else "snack.expo.dev/5SQWUSi5Rv3jLU6Zg_V4V"
        path = sys.argv[3]
        t = find_page(substr)
        c = CDP(t["webSocketDebuggerUrl"])
        r = c.cmd("Page.captureScreenshot", format="png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        print("saved " + path); c.close()
    elif cmd == "iframeshot":
        # screenshot ONLY the iframe target
        path = sys.argv[2]
        t = find_iframe("snack-runtime")
        c = CDP(t["webSocketDebuggerUrl"])
        r = c.cmd("Page.captureScreenshot", format="png", clip=None)
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        print("saved " + path); c.close()
    else:
        raise SystemExit("unknown cmd")

if __name__ == "__main__":
    main()
