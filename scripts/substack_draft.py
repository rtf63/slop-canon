#!/usr/bin/env python3
"""Create a Substack DRAFT (never publish) from the newest Slop Canon poem.

Substack has no official publishing API, so this authenticates with your
`substack.sid` session cookie — the same session your browser uses. It only
ever creates a *draft*; a human publishes it from the Substack dashboard. That
deliberate human step is the daily editorial glance (and the heavy-day gate).

Run by .github/workflows/substack-draft.yml after the daily routine pushes a
new entry. Locally you can preview without touching Substack:

    DRY_RUN=1 python3 scripts/substack_draft.py

Environment:
    SUBSTACK_SID              your `substack.sid` cookie value  (GH secret)
    SUBSTACK_PUBLICATION_URL  e.g. https://slopcanon.substack.com
    DRY_RUN=1                 build + print the post, skip the network call
    ENTRY_FILE                optional: a specific entry .md (default: newest)
"""

import glob
import json
import os
import sys

ENTRIES_DIR = "src/content/entries"
SITE_URL = "https://slop-canon.vercel.app"  # TODO: swap for the real domain


def die(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def load_yaml():
    try:
        import yaml  # PyYAML
    except ImportError:
        die("PyYAML is required: pip install pyyaml")
    return yaml


def read_frontmatter(path):
    yaml = load_yaml()
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    parts = raw.split("---", 2)
    if len(parts) < 3:
        die(f"{path}: no frontmatter block")
    return yaml.safe_load(parts[1])


def newest_entry():
    if os.environ.get("ENTRY_FILE"):
        path = os.environ["ENTRY_FILE"]
        return path, read_frontmatter(path)
    best = None
    for path in glob.glob(f"{ENTRIES_DIR}/*.md"):
        data = read_frontmatter(path)
        if best is None or int(data["issue"]) > int(best[1]["issue"]):
            best = (path, data)
    if best is None:
        die(f"no entries found in {ENTRIES_DIR}")
    return best


def issue_label(n):
    return f"Nº{str(int(n)).zfill(3)}"


# ---- ProseMirror body (Substack's editor doc format) --------------------------

def _text(s, href=None, italic=False):
    node = {"type": "text", "text": s}
    marks = []
    if href:
        marks.append({"type": "link", "attrs": {"href": href}})
    if italic:
        marks.append({"type": "italic"})
    if marks:
        node["marks"] = marks
    return node


def _para(nodes):
    return {"type": "paragraph", "content": nodes}


def _lines_to_para(lines, italic=False):
    """One paragraph, newlines preserved via hard_break (keeps poem shape)."""
    content = []
    for i, line in enumerate(lines):
        if i:
            content.append({"type": "hard_break"})
        content.append(_text(line, italic=italic))
    return {"type": "paragraph", "content": content}


def build_body(e):
    content = []
    # the poem — one paragraph per stanza, line breaks kept
    for stanza in e["poem"].rstrip("\n").split("\n\n"):
        lines = [ln for ln in stanza.split("\n") if ln.strip() != ""]
        if lines:
            content.append(_lines_to_para(lines))
    content.append(_para([_text("— written by a language model", italic=True)]))
    content.append({"type": "horizontal_rule"})

    # the receipt: what it saw + linked sources
    prov = e.get("provenance", {}) or {}
    saw = prov.get("saw", []) or []
    if saw:
        content.append(_lines_to_para(["what it saw ▸"] + [f"· {s}" for s in saw]))
    sources = prov.get("sources", []) or []
    if sources:
        src_nodes = [_text("sources ▸")]
        for s in sources:
            src_nodes.append({"type": "hard_break"})
            src_nodes.append(_text(f"→ {s['title']}", href=s["url"]))
        content.append({"type": "paragraph", "content": src_nodes})

    # footer
    content.append({"type": "horizontal_rule"})
    content.append(_para([
        _text("Slop Canon — one machine-written poem a day, informed by the day's news. "),
        _text("Read it on the site →", href=SITE_URL),
    ]))
    return {"type": "doc", "content": content}


def build_post(e):
    label = issue_label(e["issue"])
    date = str(e.get("date", ""))[:10]
    return {
        "title": e["title"],
        "subtitle": f"Slop Canon · {label} · {date}",
        "body": build_body(e),
    }


# ---- Paste-ready plain text (Cloudflare-proof fallback) -----------------------

def render_text(e):
    """A copy-paste-ready post. Never hits the network, so it always works —
    paste into a new Substack post and hit Publish."""
    date = str(e.get("date", ""))[:10]
    out = [e["title"], f"Slop Canon · {issue_label(e['issue'])} · {date}", "",
           e["poem"].rstrip("\n"), "", "— written by a language model", "", "———"]
    prov = e.get("provenance", {}) or {}
    saw = prov.get("saw", []) or []
    if saw:
        out.append("what it saw ▸")
        out += [f"· {s}" for s in saw]
    sources = prov.get("sources", []) or []
    if sources:
        out += ["", "sources ▸"] + [f"→ {s['title']} — {s['url']}" for s in sources]
    out += ["", "———",
            f"Slop Canon — one machine-written poem a day, informed by the day's news. {SITE_URL}"]
    return "\n".join(out) + "\n"


def write_paste_ready(e):
    os.makedirs("substack-out", exist_ok=True)
    fn = f"substack-out/{str(int(e['issue'])).zfill(3)}.txt"
    with open(fn, "w", encoding="utf-8") as f:
        f.write(render_text(e))
    return fn


# ---- Substack draft creation (cookie-authenticated; best-effort) --------------

def try_create_draft(post, pub_url, sid):
    """Attempt the draft via the unofficial cookie API. Returns True on success.
    Never raises — Substack sits behind Cloudflare, which challenges automated
    calls from datacenter IPs (CI), so failure is expected there."""
    import requests

    s = requests.Session()
    s.cookies.set("substack.sid", sid, domain=pub_url.split("//", 1)[-1])
    s.headers.update({
        "content-type": "application/json",
        "accept": "application/json",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    })
    payload = {
        "draft_title": post["title"],
        "draft_subtitle": post["subtitle"],
        "draft_body": json.dumps(post["body"]),
        "audience": "everyone",
        "type": "newsletter",
    }
    try:
        me = s.get("https://substack.com/api/v1/user", timeout=20)
        if me.ok and isinstance(me.json(), dict) and me.json().get("id"):
            payload["draft_bylines"] = [{"id": me.json()["id"], "is_guest": False}]
    except Exception:
        pass

    try:
        r = s.post(f"{pub_url}/api/v1/drafts", data=json.dumps(payload), timeout=30)
    except Exception as ex:
        print(f"⚠ Substack API call errored: {ex}")
        return False
    if r.ok:
        draft_id = r.json().get("id")
        print(f"✓ Draft created: {pub_url}/publish/post/{draft_id}")
        return True
    blocked = r.status_code == 403 or "Just a moment" in r.text
    print(f"⚠ Substack API call failed: HTTP {r.status_code}"
          + (" — Cloudflare bot challenge (automated calls from CI are blocked)." if blocked else "."))
    print("  → Use the paste-ready post from this run's 'substack-post' artifact instead.")
    return False


def main():
    path, e = newest_entry()
    post = build_post(e)
    print(f"Newest entry: {path}  ({issue_label(e['issue'])} · {e['title']})")

    if os.environ.get("DRY_RUN"):
        print("\n----- paste-ready post -----")
        print(render_text(e))
        return

    fn = write_paste_ready(e)
    print(f"Paste-ready post written to {fn}")

    sid = os.environ.get("SUBSTACK_SID")
    pub = os.environ.get("SUBSTACK_PUBLICATION_URL")
    if sid and pub:
        try_create_draft(post, pub.rstrip("/"), sid)  # best-effort; never fatal
    else:
        print("No Substack secrets set; skipping the API attempt.")


if __name__ == "__main__":
    main()
