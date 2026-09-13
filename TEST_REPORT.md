# Test Report

## Result

The lesson completed end to end in headless Google Chrome 152.0.7977.83 at a 1280 × 900 viewport. The browser walk also exercised a 768 px reduced-motion context and a 360 × 800 touch context. No uncaught browser errors or horizontal overflow were observed. The checked examples below were run by `scripts/browser_qa.py`; the script writes the corresponding screenshots to `evidence/`.

## Acceptance mapping

| Requirement | Verification | Result |
|---|---|---|
| Show 0, 5, and 10 in a ten-frame | Browser walk checks 5, checks empty frame for 0, then fills all 10 spaces; unit test checks the round data | Pass |
| At least five number bonds to 10, including 0+10 and 5+5 | Browser walk completes all five rounds; feedback explicitly reads `7 + 3 = 10`, `0 + 10 = 10`, and `5 + 5 = 10` | Pass |
| Six original addition/subtraction stories within 10 and a fresh transfer challenge | Browser walk solves all seven and checks the displayed equations: 2+3, 8−3, 4+6, 9−4, 3+4, 7−2, and 3+4−2 | Pass |
| Gentle feedback, retry, and success gating | Incorrect count shows a retry cue and no next action; correct count reveals the next action only after Check | Pass |
| Two optional scaffold levels | Browser walk reads a strategy hint and then a modeled first step; neither blocks trying or retrying | Pass |
| Mouse/tap and keyboard alternatives | Browser walk activates ten-frame controls with keyboard, verifies focus stays on story counter buttons after increment, and taps mobile controls | Pass |
| Reset, replay, and locally remembered progress | Browser walk reloads mid-activity and verifies selected counters persist, then resets to the welcome screen | Pass |
| Responsive activity and mobile use | Browser walk checks no horizontal overflow at 1280 px, 768 px, and 360 px, and verifies buttons are at least 48 CSS px in the measured views | Pass |
| Reduced-motion preference | 768 px browser context with `prefers-reduced-motion: reduce` verifies the progress transition is reduced | Pass |
| No account, analytics, network API, or child data | Source inspection; only static assets and same-device `localStorage` are used | Pass |
| Educational references and public-facing guidance | Educator Guide includes Common Core K.OA.A.1–4 and NCETM number-bond references | Pass |

## Automated domain tests

`npm test` uses Node's built-in test runner. **6 tests passed, 0 failed**. It checks round coverage, each number bond, all story answers and the transfer equation, unique/bounded counter selection, invalid input handling, frame clamping, and the one-step scaffold content.

## Evidence images

- `evidence/01-counting.png` — checked five-counter frame and feedback.
- `evidence/02-make-ten.png` — checked 7+3 ten-frame and equation.
- `evidence/03-story-practice.png` — checked story screen, counters, feedback, and equation.
- `evidence/04-mobile-story.png` — touch-sized story controls at 360 px.
- `evidence/05-mobile-welcome.png` — welcome and course map at 360 px.
- `WALKTHROUGH.md` — numbered explanation of the image sequence.

The browser script is reproducible with Python Playwright and the skill's local static-server wrapper:

```sh
python3 /Users/c-gavin.yau/.agents/skills/webapp-testing/scripts/with_server.py \
  --server 'python3 -m http.server 4173' --port 4173 \
  python3 scripts/browser_qa.py
```

The live HTTPS preview and public-source URL are deployment checks and are reported separately once they have been read back from an unauthenticated browser.
