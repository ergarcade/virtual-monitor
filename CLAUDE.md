# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`virtual-monitor` is an on-screen replica of the Concept2 PM5's own display
(the "Just Row" screen), fed by live data from a real PM5 over
[pm5-base](https://github.com/ergarcade/pm5-base) (Bluetooth, USB, or a
replayed mock workout). Plain HTML/CSS/JS, no build step, no framework.

`pm5-base` is a git submodule (tracking `master`) providing `PM5`/`PM5HID`/
`PM5Mock` and the `pm5fields` label/formatter map — see its own
`pm5-base/CLAUDE.md` for the transport/protocol details. This repo only adds
the display layer on top.

```
index.html   page shell + fixed monitor-screen markup
app.js       transport connect flow (adapted from pm5-base/example/app.js)
slots.js     pure slot -> transport-key mapping, DOM-free
style.css    monitor bezel/screen styling
test/        node tests for slots.js
pm5-base/    submodule
```

## Running it

```
python3 -m http.server 8000
```

Visit `http://localhost:8000/`, pick a transport, click Connect. Mock needs no
hardware and works in any browser; BLE/HID need Chrome or Edge and a real PM5.

```
node --test
```

No linter or type checker configured (matches `pm5-base`).

## Architecture

Unlike `pm5-base/example/`, which renders one card per event type (or per
metric), this app has a **fixed screen layout** mimicking the PM5's physical
display: a big center pace readout plus a grid of Time/Meters/S-M/Watts/
Cal-Hr/Heart Rate cells.

- **`slots.js`** — `SLOTS` maps each display slot to the transport-specific
  keys that can fill it, in preference order (BLE key first, since Mock
  defaults to `emulate: 'ble'`) — e.g. `time: ['elapsedTime', 'workTime']`,
  since BLE and HID name the same concept differently (see `pm5-base`'s notes
  on this). Not every slot has an HID key: `calories` (labeled "Cal/Hr" on
  screen) maps only to BLE's `strokeCaloricBurnRate` — HID has no CSAFE
  command for a caloric burn *rate*, only a cumulative `calories` total (see
  `pm5-base/lib/pm5-hid.js`'s TODO), so that cell just stays unfilled over
  USB. `pickSlot(data, keys)` returns the first matching `[key, value]` pair
  from an event's data, or `undefined` if the event carries none of that
  slot's keys. Pure, DOM-free, node-tested (`test/slots.test.mjs`), same
  `module.exports` shim pattern as `pm5-base/lib`.
- **`app.js`** — the connect/lifecycle wiring (`TRANSPORTS` map, `connecting`/
  `connected`/`disconnected` handlers) is carried over near-verbatim from
  `pm5-base/example/app.js`. The only real difference is `cbMessage`: instead
  of building cards, it walks `SLOTS`, calls `pickSlot` per slot, and writes
  `pm5fields[key].printable(value)` into that slot's `#slot-<name>` element.
  `workoutType`/`workoutState` are written directly (BLE-only fields, no HID
  equivalent, so no slot mapping needed). The `.monitor.live` class (toggled
  on connect/disconnect) dims the screen when idle, mimicking a powered-off
  display.
- **`index.html`** loads `pm5-base/lib/*.js` via `<script>` tags (same load
  order as `pm5-base/example/index.html`), then `slots.js`, then `app.js`.

### Adding a new slot to the screen

Add an entry to `SLOTS` in `slots.js` (BLE key first, HID key second if it
exists), a `#slot-<name>` element in `index.html`, and read it in `app.js`'s
`cbMessage` loop — it already iterates `SLOTS` generically, so no other
changes needed there.
