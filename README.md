# Number Garden: Make Ten

A short, calm number lesson for learners around age six. Count objects in a ten-frame, find number pairs that make ten, and use counters to solve six original garden stories plus a fresh two-step challenge.

## Run locally

This is a dependency-free static site. It was tested with Node.js 22.22.3 and Google Chrome 152.0.7977.83. Run it in a current browser with ES modules, CSS Grid, Web Storage, and HTML buttons; other browsers were not included in this verification.

There is no build step and no package installation. From this directory, start a local development or production-preview server:

```sh
python3 -m http.server 4173 --directory .
```

Open `http://localhost:4173`. To check the learning model, run `npm test` (Node.js 20 or newer). Static hosting serves the same files; no build output, secrets, or environment file is required.

## What is included

- Three activities: count 0, 5, and 10; make five pairs to ten; solve six one-step stories and one fresh two-step story.
- Tap, mouse, and keyboard-operable controls; no drag-only interaction.
- Two optional hints in story practice: a strategy nudge and a model of one small step.
- Gentle retries, reset/replay, progress feedback, and a final summary.
- Responsive layouts, reduced-motion support, read-aloud prompts when the browser supports speech, and on-device progress only.
- No account, analytics, ads, remote API, or child data collection.

The lesson reflects kindergarten addition/subtraction goals for representing and solving within-10 problems with objects or drawings, and the use of number bonds to ten. See the [Educator Guide](EDUCATOR_GUIDE.md) for age notes, suggested facilitation, and source references.

The activity data and math operations live in `src/model.mjs`; `src/app.mjs` renders the screens and handles input, hints, feedback, navigation, and local progress. See [Architecture](ARCHITECTURE.md) for the state and answer-checking model.

## Project files

- `index.html`, `styles.css`, and `src/`: application source.
- `test/`: automated domain checks.
- `EDUCATOR_GUIDE.md`: lesson flow, accessibility notes, and citations.
- `ARCHITECTURE.md`: activity state and answer-checking model.
- `TEST_REPORT.md`: acceptance mapping and actual verification evidence.
- `WALKTHROUGH.md`: numbered screenshot walkthrough.
- `THIRD_PARTY_NOTICES.md`: source attribution and asset provenance.
- `evidence/`: numbered walkthrough screenshots captured during browser QA.

Progress is stored in this browser's local storage so a learner can resume on the same device. It is not sent to a server. Use **Start over** to clear lesson progress from the app.

Known limitations: progress does not sync between devices or browsers; read-aloud voices depend on browser and operating-system support; verification was run in Chrome 152.0.7977.83 rather than across a full browser matrix.
