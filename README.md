# virtual-monitor

An on-screen replica of the Concept2 PM5's own display, driven by live data
from a real PM5 (Bluetooth or USB) or a replayed mock workout — built on
[pm5-base](https://github.com/ergarcade/pm5-base).

No build step, no package manager, no framework — plain HTML/CSS/JS.

## Running it

Serve the repo root with any static file server and open `index.html` in
Chrome or Edge (BLE/HID both need Chromium; Mock works in any browser):

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`, pick a transport, and click Connect.

## Getting the code

This repo pulls in `pm5-base` as a git submodule, so clone with:

```
git clone --recurse-submodules https://github.com/ergarcade/virtual-monitor.git
```

If you already cloned without that flag:

```
git submodule update --init
```

## Updating the pm5-base submodule

```
git submodule update --remote pm5-base
git add pm5-base
git commit -m "Update pm5-base submodule"
```

## Tests

`slots.js`'s pure key-picking logic has node tests, no browser required:

```
node --test
```
