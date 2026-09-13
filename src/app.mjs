import {
  QUANTITY_ROUNDS,
  MAKE_TEN_ROUNDS,
  STORY_PROBLEMS,
  TRANSFER_PROBLEM,
  applyCounterChange,
  answerForStory,
  equationForStory,
  firstStepHint,
  isExactCount,
  makeTenIsComplete,
  normalizeSlots,
  toggleSlot,
} from "./model.mjs";

const app = document.querySelector("#app");
const announcer = document.querySelector("#announcer");
const stageNames = ["Count", "Make ten", "Little stories"];
const PROGRESS_KEY = "number-garden-progress-v1";
let announcementTimer;

function readProgress() {
  try {
    const value = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "null");
    return value && value.version === 1 && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function boundedIndex(value, maximum) {
  return Number.isInteger(value) && value >= 0 && value <= maximum ? value : 0;
}

const saved = readProgress();
const state = {
  screen: ["welcome", "quantity", "bonds", "stories"].includes(saved.screen) ? saved.screen : "welcome",
  quantityIndex: boundedIndex(saved.quantityIndex, QUANTITY_ROUNDS.length),
  quantitySlots: normalizeSlots(saved.quantitySlots ?? []),
  quantityDone: saved.quantityDone === true,
  bondIndex: boundedIndex(saved.bondIndex, MAKE_TEN_ROUNDS.length),
  bondSlots: normalizeSlots(saved.bondSlots ?? []),
  bondsDone: saved.bondsDone === true,
  storyIndex: boundedIndex(saved.storyIndex, STORY_PROBLEMS.length + 1),
  storyCount: Number.isInteger(saved.storyCount) && saved.storyCount >= 0 && saved.storyCount <= 10
    ? saved.storyCount
    : STORY_PROBLEMS[0].start,
  storiesDone: saved.storiesDone === true,
  feedback: "",
  feedbackKind: "",
  muted: false,
};

function completedStages() {
  return [state.quantityDone, state.bondsDone, state.storiesDone].filter(Boolean).length;
}

function stageHeader(activeIndex) {
  const progress = completedStages();
  return `
    <header class="site-header">
      <a class="brand" href="#start" data-action="start" aria-label="Number Garden home">
        <span class="brand-mark" aria-hidden="true">10</span>
        <span><strong>Number Garden</strong><small>Make ten, one step at a time</small></span>
      </a>
      <div class="header-progress">
        <span class="progress-label">${progress} of 3 activities</span>
        <div class="progress-track" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${progress}">
          <span style="width:${(progress / 3) * 100}%"></span>
        </div>
      </div>
      <button class="quiet-button reset-button" type="button" data-action="reset">Start over</button>
    </header>
    <nav class="stage-nav" aria-label="Lesson activities">
      ${stageNames.map((name, index) => `
        <button type="button" class="stage-tab ${index === activeIndex ? "is-current" : ""} ${[state.quantityDone, state.bondsDone, state.storiesDone][index] ? "is-done" : ""}"
          data-screen="${["quantity", "bonds", "stories"][index]}" aria-current="${index === activeIndex ? "step" : "false"}">
          <span class="stage-number">${[state.quantityDone, state.bondsDone, state.storiesDone][index] ? "✓" : `0${index + 1}`}</span>
          <span>${name}</span>
        </button>`).join("")}
    </nav>`;
}

function footer() {
  return `<footer class="site-footer"><span>Made for curious learners and their grown-ups.</span><span>No account or tracking · Progress saves only on this device</span></footer>`;
}

function shell(content, activeIndex = -1) {
  return `${stageHeader(activeIndex)}<main id="app-main" class="page-shell">${content}</main>${footer()}`;
}

function welcomeView() {
  return `${stageHeader(-1)}
    <main id="app-main" class="page-shell welcome-layout" tabindex="-1">
      <section class="hero-copy" aria-labelledby="welcome-title">
        <p class="eyebrow"><span class="eyebrow-dot"></span> A short number adventure</p>
        <h1 id="welcome-title">Let’s make <span>ten.</span></h1>
        <p class="hero-lede">Count a little, fill a ten-frame, and use counters to solve garden stories. You can try again whenever you like.</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-action="start">Start the lesson <span aria-hidden="true">→</span></button>
          <button class="read-button" type="button" data-action="speak" aria-label="Read the lesson introduction aloud">▸ Read aloud</button>
        </div>
        <p class="gentle-note">About 8–12 minutes · A grown-up can join in · No score or timer</p>
      </section>
      <aside class="hero-art" aria-label="A garden with ten counters arranged in two rows">
        <div class="sun-disc" aria-hidden="true"></div>
        <div class="garden-label"><span>today’s little goal</span><strong>10</strong><span>make it together</span></div>
        <div class="hero-frame" aria-hidden="true">
          ${Array.from({ length: 10 }, (_, index) => `<i class="hero-seed seed-${index + 1}"></i>`).join("")}
        </div>
        <div class="leaf leaf-one" aria-hidden="true"></div><div class="leaf leaf-two" aria-hidden="true"></div>
        <span class="art-caption">Ten spaces. Lots of ways.</span>
      </aside>
      <section class="lesson-map" aria-label="What you will try">
        <div><span class="map-index">01</span><div><strong>Count a set</strong><p>Show zero, five, and ten.</p></div></div>
        <div><span class="map-index">02</span><div><strong>Make ten</strong><p>Try different number pairs.</p></div></div>
        <div><span class="map-index">03</span><div><strong>Help with a story</strong><p>Move counters as things change.</p></div></div>
      </section>
    </main>${footer()}`;
}

function frameMarkup({ fixed = 0, selected = new Set(), prefix = "space" }) {
  return `<div class="ten-frame" role="group" aria-label="Ten-frame with ten spaces">
    ${Array.from({ length: 10 }, (_, index) => {
      const locked = index < fixed;
      const filled = locked || selected.has(index);
      const spokenState = locked ? "fixed counter" : filled ? "counter" : "empty";
      return `<button class="frame-space ${filled ? "has-counter" : ""} ${locked ? "is-fixed" : ""}" type="button"
        data-slot="${index}" data-prefix="${prefix}" aria-label="Space ${index + 1}, ${spokenState}"
        aria-pressed="${filled}" ${locked ? "disabled" : ""}>
        <span class="counter-dot" aria-hidden="true"></span><span class="space-number" aria-hidden="true">${index + 1}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function feedbackMarkup() {
  if (!state.feedback) return `<div class="feedback-slot" aria-hidden="true"></div>`;
  return `<div class="feedback ${state.feedbackKind}"><span class="feedback-mark" aria-hidden="true">${state.feedbackKind === "good" ? "✓" : "i"}</span><p>${state.feedback}</p></div>`;
}

function quantityView() {
  const round = QUANTITY_ROUNDS[state.quantityIndex];
  if (round === undefined) {
    return shell(`<section class="completion-card">
      <p class="eyebrow">Activity 1 complete</p><h1>You made a set.</h1>
      <p>Zero, five, and ten can all fit in the same frame. Next, we’ll use two parts to make ten.</p>
      <button class="primary-button" type="button" data-action="go-bonds">Continue to make ten <span aria-hidden="true">→</span></button>
    </section>`, 0);
  }
  const selected = state.quantitySlots;
  const count = selected.size;
  const isCorrect = isExactCount(count, round) && state.feedbackKind === "good";
  const intro = state.quantityIndex === 0
    ? "Tap one space for each counter you need. Empty spaces stay empty."
    : round === 0 ? "This time, show zero. Leave every space empty." : "Now make a full set. Tap all ten spaces.";
  return shell(`<section class="activity-heading">
      <p class="eyebrow">Activity 1 · Count a set</p><h1>Show <span>${round}</span>.</h1><p>${intro}</p>
    </section>
    <section class="work-card" aria-labelledby="quantity-label">
      <div class="work-card-top"><div><span class="card-kicker">Round ${state.quantityIndex + 1} of ${QUANTITY_ROUNDS.length}</span><h2 id="quantity-label">Tap the spaces</h2></div><span class="tiny-badge">${count} of 10</span></div>
      ${frameMarkup({ selected, prefix: "quantity" })}
      <div class="work-card-bottom"><p class="count-readout" aria-live="polite">You have <strong>${count}</strong> ${count === 1 ? "counter" : "counters"}.</p>
        <div class="button-row"><button class="quiet-button" type="button" data-action="quantity-clear">Clear</button>
        <button class="primary-button" type="button" data-action="quantity-check">Check my set</button></div>
      </div>
      ${feedbackMarkup()}
      ${isCorrect ? `<div class="next-row"><span>Lovely counting.</span><button class="text-button" type="button" data-action="quantity-next">${state.quantityIndex === QUANTITY_ROUNDS.length - 1 ? "Finish counting" : "Next set"} →</button></div>` : ""}
    </section>
    <aside class="coach-note"><span aria-hidden="true">✦</span><p><strong>Try a way that helps you.</strong> You can tap spaces in any order. The number is how many counters you made.</p><button class="read-button" type="button" data-action="speak">▸ Read prompt aloud</button></aside>`, 0);
}

function bondsView() {
  const round = MAKE_TEN_ROUNDS[state.bondIndex];
  if (!round) {
    return shell(`<section class="completion-card">
      <p class="eyebrow">Activity 2 complete</p><h1>Ten has many pairs.</h1>
      <p>Seven and three make ten. So do zero and ten, and five and five. Next, use counters in little stories.</p>
      <button class="primary-button" type="button" data-action="go-stories">Open the story path <span aria-hidden="true">→</span></button>
    </section>`, 1);
  }
  const selected = state.bondSlots;
  const need = round.right;
  const isCorrect = makeTenIsComplete(round.left, selected.size)
    && selected.size === round.right
    && state.feedbackKind === "good";
  const isFirst = state.bondIndex === 0;
  const prompt = isFirst
    ? "Seven counters are already in. Add three more to fill every space."
    : "Tap the open spaces to finish the ten-frame.";
  return shell(`<section class="activity-heading">
      <p class="eyebrow">Activity 2 · Make ten</p><h1>${round.left} + <span>?</span> = 10</h1><p>${prompt}</p>
    </section>
    <section class="work-card" aria-labelledby="bond-label">
      <div class="work-card-top"><div><span class="card-kicker">Pair ${state.bondIndex + 1} of ${MAKE_TEN_ROUNDS.length}</span><h2 id="bond-label">Fill the garden bed</h2></div><span class="tiny-badge">${round.left + selected.size} of 10</span></div>
      ${frameMarkup({ fixed: round.left, selected, prefix: "bond" })}
      <div class="equation-strip" aria-live="polite"><span>${round.left}</span><span class="operator">+</span><span class="missing-part">${isCorrect ? selected.size : "?"}</span><span class="operator">=</span><strong>10</strong></div>
      <div class="work-card-bottom"><p class="count-readout">${selected.size} ${selected.size === 1 ? "new counter" : "new counters"} added${need === 0 ? "." : ` · ${need} needed.`}</p>
        <div class="button-row"><button class="quiet-button" type="button" data-action="bond-clear">Clear new counters</button><button class="primary-button" type="button" data-action="bond-check">Check the frame</button></div>
      </div>
      ${feedbackMarkup()}
      ${isCorrect ? `<div class="next-row"><span>That makes ten.</span><button class="text-button" type="button" data-action="bond-next">${state.bondIndex === MAKE_TEN_ROUNDS.length - 1 ? "Finish the pairs" : "Try another pair"} →</button></div>` : ""}
    </section>
    <aside class="coach-note"><span aria-hidden="true">✦</span><p><strong>Count the empty spaces.</strong> They show how many more you can add. Seven needs three more.</p><button class="read-button" type="button" data-action="speak">▸ Read prompt aloud</button></aside>`, 1);
}

function storyTray(count) {
  return `<div class="story-tray" role="img" aria-label="A tray showing ${count} counters and ${10 - count} empty places">
    ${Array.from({ length: 10 }, (_, index) => `<span class="tray-space ${index < count ? "tray-filled" : ""}" aria-hidden="true"><i></i></span>`).join("")}
  </div>`;
}

function storiesView() {
  const isTransfer = state.storyIndex === STORY_PROBLEMS.length;
  const problem = isTransfer ? TRANSFER_PROBLEM : STORY_PROBLEMS[state.storyIndex];
  if (state.storiesDone || !problem) {
    state.storiesDone = true;
    return shell(`<section class="completion-card final-card">
      <p class="eyebrow">All three activities complete</p><h1>Look what you figured out.</h1>
      <div class="summary-grid"><div><span>Count</span><strong>0, 5, 10</strong></div><div><span>Make ten</span><strong>5 pairs</strong></div><div><span>Story practice</span><strong>6 + a new challenge</strong></div></div>
      <p>You can make another garden or tell a grown-up how the counters helped.</p>
      <button class="primary-button" type="button" data-action="reset">Grow another garden <span aria-hidden="true">↻</span></button>
      <p class="next-practice"><strong>Next little practice:</strong> Find two different ways to make 8 using counters or things around you.</p>
    </section>`, 2);
  }
  const answer = answerForStory(problem);
  const isCorrect = isExactCount(state.storyCount, answer) && state.feedbackKind === "good";
  const storyLabel = isTransfer ? "Fresh challenge" : `Story ${state.storyIndex + 1} of ${STORY_PROBLEMS.length}`;
  const stepText = problem.steps.map((step) => `${step.sign === "+" ? "add" : "take away"} ${step.amount}`).join(", then ");
  return shell(`<section class="activity-heading">
      <p class="eyebrow">Activity 3 · Little stories</p><h1>Move the counters.</h1><p>Use the story to change the tray, then count what stays.</p>
    </section>
    <section class="work-card story-card" aria-labelledby="story-title">
      <div class="work-card-top"><div><span class="card-kicker">${storyLabel}</span><h2 id="story-title">${problem.title}</h2></div><span class="tiny-badge">${state.storyCount} on the tray</span></div>
      <p class="story-prompt">${problem.prompt}</p>
      <p class="story-steps"><span aria-hidden="true">↳</span> Start with ${problem.start}; ${stepText}.</p>
      ${storyTray(state.storyCount)}
      <p class="tray-caption" aria-live="polite">The tray shows <strong>${state.storyCount}</strong> ${state.storyCount === 1 ? problem.noun.replace(/s$/, "") : problem.noun}.</p>
      <div class="counter-controls" aria-label="Change the number of counters">
        <button class="counter-button" type="button" data-action="story-down" aria-label="Take away one counter" ${state.storyCount === 0 ? "disabled" : ""}>−<span>Take one away</span></button>
        <span class="counter-total" aria-live="polite">${state.storyCount}</span>
        <button class="counter-button" type="button" data-action="story-up" aria-label="Add one counter" ${state.storyCount === 10 ? "disabled" : ""}>+<span>Add one</span></button>
      </div>
      <div class="button-row story-buttons"><div class="scaffold-buttons"><button class="quiet-button" type="button" data-action="story-hint">Give me a hint</button><button class="quiet-button" type="button" data-action="story-model">Show one small step</button></div><button class="primary-button" type="button" data-action="story-check">Check my answer</button></div>
      ${feedbackMarkup()}
      ${isCorrect ? `<div class="equation-answer"><span>One way to record it</span><strong>${equationForStory(problem)}</strong></div><div class="next-row"><span>Good thinking.</span><button class="text-button" type="button" data-action="story-next">${isTransfer ? "See my garden" : state.storyIndex === STORY_PROBLEMS.length - 1 ? "Try a fresh challenge" : "Next story"} →</button></div>` : ""}
    </section>
    <aside class="coach-note"><span aria-hidden="true">✦</span><p><strong>Try each change in order.</strong> Counters can help you keep track while you think.</p><button class="read-button" type="button" data-action="speak">▸ Read story aloud</button></aside>`, 2);
}

function render(focusMain = true) {
  if (state.screen === "welcome") app.innerHTML = welcomeView();
  else if (state.screen === "quantity") app.innerHTML = quantityView();
  else if (state.screen === "bonds") app.innerHTML = bondsView();
  else if (state.screen === "stories") app.innerHTML = storiesView();
  const main = app.querySelector("#app-main");
  if (main) main.setAttribute("tabindex", "-1");
  if (focusMain) main?.focus({ preventScroll: true });
  window.clearTimeout(announcementTimer);
  if (announcer) {
    announcer.textContent = "";
    if (state.feedback) {
      const announcement = state.feedback;
      announcementTimer = window.setTimeout(() => { announcer.textContent = announcement; }, 25);
    }
  }
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      version: 1,
      screen: state.screen,
      quantityIndex: state.quantityIndex,
      quantitySlots: [...state.quantitySlots],
      quantityDone: state.quantityDone,
      bondIndex: state.bondIndex,
      bondSlots: [...state.bondSlots],
      bondsDone: state.bondsDone,
      storyIndex: state.storyIndex,
      storyCount: state.storyCount,
      storiesDone: state.storiesDone,
    }));
  } catch {
    // The lesson still works when browser storage is unavailable.
  }
}

function setFeedback(message, kind = "info", restoreAction = null) {
  state.feedback = message;
  state.feedbackKind = kind;
  render(false);
  if (restoreAction) app.querySelector(`[data-action="${restoreAction}"]`)?.focus({ preventScroll: true });
}

function resetAll() {
  state.screen = "welcome";
  state.quantityIndex = 0;
  state.quantitySlots = new Set();
  state.quantityDone = false;
  state.bondIndex = 0;
  state.bondSlots = new Set();
  state.bondsDone = false;
  state.storyIndex = 0;
  state.storyCount = STORY_PROBLEMS[0].start;
  state.storiesDone = false;
  state.feedback = "";
  state.feedbackKind = "";
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  render();
}

function speakCurrent() {
  if (state.muted || !("speechSynthesis" in window)) return;
  const prompt = app.querySelector(".hero-lede, .activity-heading p:not(.eyebrow), .story-prompt")?.textContent?.trim();
  if (!prompt) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(prompt));
}

function setStoryCount(nextCount, action) {
  state.storyCount = nextCount;
  state.feedback = "";
  state.feedbackKind = "";
  render(false);
  app.querySelector(`[data-action="${action}"]`)?.focus({ preventScroll: true });
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button, a");
  if (!button) return;

  if (button.dataset.screen) {
    state.screen = button.dataset.screen;
    state.feedback = "";
    state.feedbackKind = "";
    render();
    return;
  }

  const action = button.dataset.action;
  if (action === "start") {
    state.screen = "quantity";
    render();
  } else if (action === "reset") {
    resetAll();
  } else if (action === "speak") {
    speakCurrent();
  } else if (action === "quantity-clear") {
    state.quantitySlots = new Set();
    state.feedback = "";
    state.feedbackKind = "";
    render(false);
    app.querySelector('[data-action="quantity-clear"]')?.focus({ preventScroll: true });
  } else if (action === "quantity-check") {
    const target = QUANTITY_ROUNDS[state.quantityIndex];
    if (isExactCount(state.quantitySlots.size, target)) setFeedback(`${target === 0 ? "Zero counters — every space is empty." : `You made ${target}. Nice counting.`}`, "good", "quantity-check");
    else if (state.quantitySlots.size < target) setFeedback(`You need ${target - state.quantitySlots.size} more ${target - state.quantitySlots.size === 1 ? "counter" : "counters"}. Tap another space.`, "info", "quantity-check");
    else setFeedback(`That is ${state.quantitySlots.size - target} too many. Clear a space and count again.`, "info", "quantity-check");
  } else if (action === "quantity-next") {
    state.quantityIndex += 1;
    state.quantitySlots = new Set();
    state.feedback = "";
    state.feedbackKind = "";
    if (state.quantityIndex >= QUANTITY_ROUNDS.length) state.quantityDone = true;
    render();
  } else if (action === "go-bonds") {
    state.screen = "bonds";
    state.feedback = "";
    state.feedbackKind = "";
    render();
  } else if (action === "bond-clear") {
    state.bondSlots = new Set();
    state.feedback = "";
    state.feedbackKind = "";
    render(false);
    app.querySelector('[data-action="bond-clear"]')?.focus({ preventScroll: true });
  } else if (action === "bond-check") {
    const round = MAKE_TEN_ROUNDS[state.bondIndex];
    if (round && makeTenIsComplete(round.left, state.bondSlots.size) && state.bondSlots.size === round.right) {
      setFeedback(`${round.left} + ${round.right} = 10. The whole frame is full.`, "good", "bond-check");
    } else {
      const needed = round.right - state.bondSlots.size;
      setFeedback(needed > 0 ? `There ${needed === 1 ? "is" : "are"} ${needed} empty ${needed === 1 ? "space" : "spaces"} left.` : "The frame has too many new counters. Clear a space and try again.", "info", "bond-check");
    }
  } else if (action === "bond-next") {
    state.bondIndex += 1;
    state.bondSlots = new Set();
    state.feedback = "";
    state.feedbackKind = "";
    if (state.bondIndex >= MAKE_TEN_ROUNDS.length) state.bondsDone = true;
    render();
  } else if (action === "go-stories") {
    state.screen = "stories";
    state.feedback = "";
    state.feedbackKind = "";
    render();
  } else if (action === "story-up") {
    setStoryCount(applyCounterChange(state.storyCount, 1), "story-up");
  } else if (action === "story-down") {
    setStoryCount(applyCounterChange(state.storyCount, -1), "story-down");
  } else if (action === "story-hint") {
    const problem = state.storyIndex >= STORY_PROBLEMS.length ? TRANSFER_PROBLEM : STORY_PROBLEMS[state.storyIndex];
    setFeedback(problem.hint, "info", "story-hint");
  } else if (action === "story-model") {
    const problem = state.storyIndex >= STORY_PROBLEMS.length ? TRANSFER_PROBLEM : STORY_PROBLEMS[state.storyIndex];
    setFeedback(firstStepHint(problem), "info", "story-model");
  } else if (action === "story-check") {
    const problem = state.storyIndex >= STORY_PROBLEMS.length ? TRANSFER_PROBLEM : STORY_PROBLEMS[state.storyIndex];
    const answer = answerForStory(problem);
    if (isExactCount(state.storyCount, answer)) setFeedback(`${problem.noun[0].toUpperCase()}${problem.noun.slice(1)}: ${equationForStory(problem)}. Your tray shows ${answer}.`, "good", "story-check");
    else setFeedback(`Your tray shows ${state.storyCount}. Count the story changes again, then try once more.`, "info", "story-check");
  } else if (action === "story-next") {
    state.storyIndex += 1;
    state.feedback = "";
    state.feedbackKind = "";
    if (state.storyIndex < STORY_PROBLEMS.length) state.storyCount = STORY_PROBLEMS[state.storyIndex].start;
    else if (state.storyIndex === STORY_PROBLEMS.length) state.storyCount = TRANSFER_PROBLEM.start;
    else state.storiesDone = true;
    render();
  } else if (button.dataset.slot !== undefined) {
    const index = Number(button.dataset.slot);
    if (button.dataset.prefix === "quantity") {
      state.quantitySlots = toggleSlot(state.quantitySlots, index);
      state.feedback = "";
      state.feedbackKind = "";
      render(false);
      app.querySelector(`[data-prefix="quantity"][data-slot="${index}"]`)?.focus({ preventScroll: true });
    } else if (button.dataset.prefix === "bond") {
      const round = MAKE_TEN_ROUNDS[state.bondIndex];
      if (round && index >= round.left) {
        state.bondSlots = toggleSlot(state.bondSlots, index);
        state.feedback = "";
        state.feedbackKind = "";
        render(false);
        app.querySelector(`[data-prefix="bond"][data-slot="${index}"]`)?.focus({ preventScroll: true });
      }
    }
  }
});

render(false);
