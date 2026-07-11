// Maps each display slot to the transport-specific keys that can fill it, in
// preference order (BLE key first, since Mock defaults to emulate: 'ble').
const SLOTS = {
    time:       ['elapsedTime', 'workTime'],
    distance:   ['distance', 'workDistance'],
    pace:       ['currentPace', 'pace'],
    power:      ['averagePower', 'power'],
    // BLE-only: HID has no CSAFE command for a caloric burn *rate*, only the
    // cumulative `calories` total (see pm5-base's pm5-hid.js TODO).
    calories:   ['strokeCaloricBurnRate'],
    strokeRate: ['strokeRate', 'cadence'],
    heartRate:  ['heartRate'],
};

// Returns [key, value] for the first of `keys` present in `data`, or
// undefined if this event doesn't carry any of this slot's keys.
const pickSlot = (data, keys) => {
    const key = keys.find(k => k in data);
    return key === undefined ? undefined : [key, data[key]];
};

// ponytail: export shim so test/slots.test.mjs can import under node; a
// no-op in the browser (no `module`), same pattern as pm5-base/lib.
if (typeof module !== 'undefined') {
    module.exports = { SLOTS, pickSlot };
}
