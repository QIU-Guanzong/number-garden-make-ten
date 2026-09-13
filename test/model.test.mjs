import test from "node:test";
import assert from "node:assert/strict";
import {
  MAKE_TEN_ROUNDS,
  QUANTITY_ROUNDS,
  STORY_PROBLEMS,
  TRANSFER_PROBLEM,
  answerForStory,
  applyCounterChange,
  equationForStory,
  firstStepHint,
  isExactCount,
  makeTenIsComplete,
  normalizeSlots,
  toggleSlot,
} from "../src/model.mjs";

test("counting rounds cover zero, five, and ten", () => {
  assert.deepEqual(QUANTITY_ROUNDS, [5, 0, 10]);
  assert.ok(QUANTITY_ROUNDS.every((n) => n >= 0 && n <= 10));
});

test("make-ten rounds include required pairs and always sum to ten", () => {
  assert.ok(MAKE_TEN_ROUNDS.some(({ left, right }) => left === 0 && right === 10));
  assert.ok(MAKE_TEN_ROUNDS.some(({ left, right }) => left === 5 && right === 5));
  for (const { left, right } of MAKE_TEN_ROUNDS) assert.equal(left + right, 10);
  assert.equal(makeTenIsComplete(7, 3), true);
  assert.equal(makeTenIsComplete(7, 2), false);
});

test("six original story answers and transfer challenge stay within ten", () => {
  assert.equal(STORY_PROBLEMS.length, 6);
  assert.deepEqual(STORY_PROBLEMS.map(answerForStory), [5, 5, 10, 5, 7, 5]);
  assert.equal(answerForStory(TRANSFER_PROBLEM), 5);
  for (const answer of [...STORY_PROBLEMS, TRANSFER_PROBLEM].map(answerForStory)) {
    assert.ok(answer >= 0 && answer <= 10);
  }
  assert.equal(equationForStory(TRANSFER_PROBLEM), "3 + 4 − 2 = 5");
});

test("slot selection is unique, bounded, and safe for malformed saved data", () => {
  assert.deepEqual([...normalizeSlots([1, 1, 8, -1, 10, "2"])].sort(), [1, 8]);
  assert.deepEqual([...normalizeSlots(42)], []);
  assert.deepEqual([...toggleSlot(new Set([2]), 2)], []);
  assert.deepEqual([...toggleSlot(new Set(), 10)], []);
});

test("answers and counter changes reject invalid values and clamp to the frame", () => {
  assert.equal(isExactCount(0, 0), true);
  assert.equal(isExactCount(2.5, 2.5), false);
  assert.equal(applyCounterChange(0, -1), 0);
  assert.equal(applyCounterChange(10, 1), 10);
  assert.equal(applyCounterChange(4, 1), 5);
});

test("scaffold model shows one step without solving the whole story", () => {
  assert.match(firstStepHint(STORY_PROBLEMS[0]), /2 \+ 1 = 3/);
  assert.match(firstStepHint(STORY_PROBLEMS[1]), /8 − 1 = 7/);
  assert.doesNotMatch(firstStepHint(STORY_PROBLEMS[0]), /5/);
});
