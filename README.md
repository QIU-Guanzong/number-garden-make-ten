# Number Garden: Make Ten

A short, calm number lesson for learners around age six. Count objects in a ten-frame, find number pairs that make ten, and use counters to solve six original garden stories plus a fresh two-step challenge.

## Run locally

This is a dependency-free static site. From this directory, start any static HTTP server, for example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. For automated math-domain checks, run `npm test` (Node.js 20 or newer).

## What is included

- Three activities: count 0, 5, and 10; make five pairs to ten; solve six one-step stories and one fresh two-step story.
- Tap, mouse, and keyboard-operable controls; no drag-only interaction.
- Two optional hints in story practice: a strategy nudge and a model of one small step.
- Gentle retries, reset/replay, progress feedback, and a final summary.
- Responsive layouts, reduced-motion support, read-aloud prompts when the browser supports speech, and on-device progress only.
- No account, analytics, ads, remote API, or child data collection.

The lesson reflects kindergarten addition/subtraction goals for representing and solving within-10 problems with objects or drawings, and the use of number bonds to ten. See the [Educator Guide](EDUCATOR_GUIDE.md) for age notes, suggested facilitation, and source references.

## Project files

- `index.html`, `styles.css`, and `src/`: application source.
- `test/`: automated domain checks.
- `EDUCATOR_GUIDE.md`: lesson flow, accessibility notes, and citations.
- `TEST_REPORT.md`: acceptance mapping and actual verification evidence.
- `WALKTHROUGH.md`: numbered screenshot walkthrough.
- `evidence/`: numbered walkthrough screenshots captured during browser QA.

Progress is stored in this browser's local storage so a learner can resume on the same device. It is not sent to a server. Use **Start over** to clear lesson progress from the app.
