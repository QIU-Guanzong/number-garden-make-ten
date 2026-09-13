export const QUANTITY_ROUNDS = [5, 0, 10];

export const MAKE_TEN_ROUNDS = [
  { left: 7, right: 3 },
  { left: 0, right: 10 },
  { left: 5, right: 5 },
  { left: 2, right: 8 },
  { left: 1, right: 9 },
];

export const STORY_PROBLEMS = [
  {
    title: "Kites for the field",
    prompt: "Mia has 2 red kites. Three blue kites join her. How many kites are there now?",
    start: 2,
    steps: [{ sign: "+", amount: 3 }],
    hint: "Start with Mia’s 2 kites. Count three more, one at a time.",
    noun: "kites",
  },
  {
    title: "Shells in a pail",
    prompt: "Kai finds 8 shells and gives 3 to a friend. How many shells stay in the pail?",
    start: 8,
    steps: [{ sign: "−", amount: 3 }],
    hint: "Begin at 8. Each shell Kai gives away leaves the pail.",
    noun: "shells",
  },
  {
    title: "Birds on a fence",
    prompt: "Four birds are on a fence. Six more land beside them. How many birds are there?",
    start: 4,
    steps: [{ sign: "+", amount: 6 }],
    hint: "Four is the starting group. Add the six birds that arrive.",
    noun: "birds",
  },
  {
    title: "Seed packets",
    prompt: "Nora has 9 seed packets. She plants 4 of them. How many packets are left?",
    start: 9,
    steps: [{ sign: "−", amount: 4 }],
    hint: "Show 9 first, then take away 4. The counters help you keep track.",
    noun: "packets",
  },
  {
    title: "Pear trees",
    prompt: "There are 3 pear trees in the garden. Four new trees are planted. How many trees now?",
    start: 3,
    steps: [{ sign: "+", amount: 4 }],
    hint: "Put 3 counters on the tray, then add 4 more.",
    noun: "trees",
  },
  {
    title: "Blue pots",
    prompt: "A gardener has 7 blue pots and moves 2 to another table. How many stay here?",
    start: 7,
    steps: [{ sign: "−", amount: 2 }],
    hint: "Begin with 7 pots. Move 2 away from the tray.",
    noun: "pots",
  },
];

export const TRANSFER_PROBLEM = {
  title: "One more pond visit",
  prompt: "Three ducks are on the pond. Four ducks join them, then two swim away. How many ducks are still there?",
  start: 3,
  steps: [
    { sign: "+", amount: 4 },
    { sign: "−", amount: 2 },
  ],
  hint: "Do one part at a time: add the four ducks, then take away the two that swim off.",
  noun: "ducks",
};

export function normalizeSlots(values, size = 10) {
  if (values === null || typeof values?.[Symbol.iterator] !== "function") return new Set();
  return new Set(
    [...values].filter((value) => Number.isInteger(value) && value >= 0 && value < size),
  );
}

export function toggleSlot(values, slot, size = 10) {
  const next = normalizeSlots(values, size);
  if (!Number.isInteger(slot) || slot < 0 || slot >= size) return next;
  if (next.has(slot)) next.delete(slot);
  else next.add(slot);
  return next;
}

export function isExactCount(count, target) {
  return Number.isInteger(count) && Number.isInteger(target) && count === target;
}

export function makeTenIsComplete(left, selectedRight) {
  return Number.isInteger(left)
    && Number.isInteger(selectedRight)
    && left >= 0
    && selectedRight >= 0
    && left + selectedRight === 10;
}

export function applyCounterChange(count, delta, min = 0, max = 10) {
  if (!Number.isInteger(count) || !Number.isInteger(delta)) return min;
  return Math.min(max, Math.max(min, count + delta));
}

export function answerForStory(problem) {
  return problem.steps.reduce(
    (total, step) => total + (step.sign === "+" ? step.amount : -step.amount),
    problem.start,
  );
}

export function equationForStory(problem) {
  const operations = problem.steps.map((step) => ` ${step.sign} ${step.amount}`).join("");
  return `${problem.start}${operations} = ${answerForStory(problem)}`;
}

export function firstStepHint(problem) {
  const first = problem.steps[0];
  if (!first) return "Start with the number in the story and change one counter at a time.";
  const next = problem.start + (first.sign === "+" ? 1 : -1);
  return first.sign === "+"
    ? `Let one join first: ${problem.start} + 1 = ${next}. Keep adding one counter at a time.`
    : `Take one away first: ${problem.start} − 1 = ${next}. Keep removing one counter at a time.`;
}
