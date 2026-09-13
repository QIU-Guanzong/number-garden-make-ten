# Architecture Notes

The application is a static ES-module site with no runtime server. `src/model.mjs` holds the ten-frame round data, original story content, answer calculations, input bounds, and the one-step hint calculation. `src/app.mjs` owns the current activity and renders the navigation, learner prompts, ten-frames, story tray, feedback, and completion summary.

Counter state is represented by sets of distinct frame-slot indices or a bounded integer for the story tray. The story answer checker applies the signed steps to the starting quantity; the make-ten checker compares the number of added counters with the complement needed to reach ten. Success actions appear only after an explicit correct check, so guessing the current display cannot skip the feedback step. Learners can retry indefinitely.

The app stores only the current screen, activity indices, completion flags, and selected counter state in a versioned local-storage record. It does not send this progress off-device. Reset replaces the saved state with a clean welcome state. If browser storage is disabled, the lesson continues in memory for the current page.

There are no external runtime dependencies. Optional read-aloud uses the browser's user-invoked Speech Synthesis API; all prompts also remain visible on screen.
