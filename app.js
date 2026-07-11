const el = sel => document.querySelector(sel);

// Transport id -> how to build it and whether the browser supports it. All
// three classes share the same EventTarget-native API (connect/disconnect/
// connected + connecting/connected/disconnected events + MESSAGE_EVENTS), so
// everything below is transport-agnostic.
const TRANSPORTS = {
    bluetooth: { label: 'Bluetooth', build: () => new PM5(),    supported: () => !!navigator.bluetooth },
    usb:       { label: 'USB',       build: () => new PM5HID(), supported: () => !!navigator.hid },
    mock: {
        label: 'Mock',
        build: () => {
            const file = el('#mock-file').files[0];
            const source = !file
                ? { loadSamples: () => csvSource.loadFromUrl('pm5-base/lib/mock-data/concept2-result-44214428.csv') }
                : file.name.endsWith('.json')
                ? { loadEvents: () => eventsSource.loadFromFile(file) }
                : { loadSamples: () => csvSource.loadFromFile(file) };
            return new PM5Mock({ ...source, emulate: 'ble', speed: Number(el('#mock-speed').value), loop: true });
        },
        supported: () => true,
    },
};

let monitor = null;

const cbConnecting = () => {
    el('#connect').textContent = 'Connecting';
    el('#connect').disabled = true;
    el('#transport').disabled = true;
    el('#mock-file').disabled = true;
};

const cbConnected = () => {
    el('#connect').textContent = 'Disconnect';
    el('#connect').disabled = false;
    el('.monitor').classList.add('live');

    // Instance-first: PM5Mock sets MESSAGE_EVENTS per instance (shape depends
    // on `emulate`); PM5/PM5HID only have the static list.
    const events = monitor.MESSAGE_EVENTS ?? monitor.constructor.MESSAGE_EVENTS;
    for (const type of events) monitor.addEventListener(type, cbMessage);
};

const cbDisconnected = () => {
    el('#connect').textContent = 'Connect';
    el('#connect').disabled = false;
    el('#transport').disabled = false;
    el('#mock-file').disabled = false;
    el('.monitor').classList.remove('live');
    monitor = null;
};

// Unlike the example app's per-event-type cards, this is a fixed screen
// layout (mimicking the PM5's own display), so each data event just fills in
// whichever of its slots it carries.
const cbMessage = (event) => {
    for (const [slot, keys] of Object.entries(SLOTS)) {
        const hit = pickSlot(event.data, keys);
        if (!hit) continue;
        const [key, value] = hit;
        el(`#slot-${slot}`).textContent = pm5fields[key].printable(value);
    }

    if ('workoutType' in event.data) {
        el('#workout-type').textContent = pm5fields.workoutType.printable(event.data.workoutType);
    }
    if ('workoutState' in event.data) {
        el('#workout-state').textContent = pm5fields.workoutState.printable(event.data.workoutState);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const transportSel = el('#transport');
    const speedSel = el('#mock-speed');
    const fileSel = el('#mock-file');

    // Flag unsupported transports and default to the first supported one.
    let firstSupported = null;
    for (const [id, t] of Object.entries(TRANSPORTS)) {
        const opt = transportSel.querySelector(`option[value="${id}"]`);
        if (!opt) continue;
        if (t.supported()) {
            firstSupported ??= id;
        } else {
            opt.disabled = true;
            opt.textContent += ' (unsupported)';
        }
    }
    if (firstSupported) transportSel.value = firstSupported;

    // The speed control and file picker only apply to Mock.
    const syncMockControlsVisibility = () => {
        const isMock = transportSel.value === 'mock';
        speedSel.hidden = !isMock;
        fileSel.hidden = !isMock;
    };
    syncMockControlsVisibility();
    transportSel.addEventListener('change', syncMockControlsVisibility);
    speedSel.addEventListener('change', () => monitor?.setSpeed?.(Number(speedSel.value)));

    el('#connect').addEventListener('click', () => {
        if (monitor?.connected()) {
            monitor.disconnect();
            return;
        }

        const t = TRANSPORTS[transportSel.value];
        if (!t.supported()) {
            alert(`${t.label} is not supported by this browser.`);
            return;
        }

        monitor = t.build();
        monitor.addEventListener('connecting', cbConnecting);
        monitor.addEventListener('connected', cbConnected);
        monitor.addEventListener('disconnected', cbDisconnected);

        monitor.connect()
            .then(() => { if (!monitor?.connected()) cbDisconnected(); })  // picker cancelled
            .catch((error) => { console.log(error); cbDisconnected(); });
    });
});
