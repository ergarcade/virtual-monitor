// Pure-data checks for the slot-picking logic. No hardware, no DOM.
//   node --test test/slots.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { SLOTS, pickSlot } = createRequire(import.meta.url)('../slots.js');

test('pickSlot prefers the first matching key (BLE over HID)', () => {
    assert.deepEqual(pickSlot({ elapsedTime: 12, workTime: 99 }, SLOTS.time), ['elapsedTime', 12]);
});

test('pickSlot falls back to a later key when the first is absent', () => {
    assert.deepEqual(pickSlot({ workTime: 99 }, SLOTS.time), ['workTime', 99]);
});

test('pickSlot returns undefined when none of the slot keys are present', () => {
    assert.equal(pickSlot({}, SLOTS.time), undefined);
});
