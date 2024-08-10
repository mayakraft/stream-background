import { get } from "svelte/store";
import { type FOLD } from "rabbit-ear/types.js";
import { makeSequence, dipatchNewSequence } from "../origami/sequence.ts";
import { Fold, StepNumber, NumberOfFrames } from "./Model.ts";
import { ShowDiagramInfo } from "./App.ts";

export const DESIRED_STEPS = 9;
const STEP_DURATION = 4 * 1000; // 4 seconds

let stepCounterInterval: number;
let showDiagramInterval: number;

let nextSequence: FOLD;

// const startStepCounter = () => {
// 	if (stepCounterInterval) { clearInterval(stepCounterInterval); }
// 	if (showDiagramInterval) { clearInterval(showDiagramInterval); }
// 	StepNumber.set(0);
// 	setTimeout(() => {
// 		ShowDiagramInfo.set(true);
// 		showDiagramInterval = setInterval(() => ShowDiagramInfo.set(true), STEP_DURATION);
// 	}, STEP_DURATION / 2);
// 	stepCounterInterval = setInterval(() => {
// 		const maxStepNumber = (get(NumberOfFrames) - 1) / 2;
// 		const currentStepNumber = get(StepNumber);
// 		if (currentStepNumber + 1 >= maxStepNumber) {
// 			// clear the current loop we are inside of
// 			if (stepCounterInterval) { clearInterval(stepCounterInterval); }
// 			const startTime = performance.now();
// 			const result = makeSequence(DESIRED_STEPS);
// 			const endTime = performance.now();
// 			const duration = endTime - startTime;
// 			console.log(`generate sequence ${(duration / 1000).toFixed(2)}s`)
// 			const waitTime = Math.max((STEP_DURATION * 2) - duration, 0);
// 			setTimeout(() => {
// 				Fold.set(result);
// 				ShowDiagramInfo.set(false);
// 				startStepCounter();
// 			}, waitTime);
// 			return;
// 		}
// 		ShowDiagramInfo.set(false);
// 		StepNumber.update((prev) => ((prev + 1) >= maxStepNumber
// 			? prev
// 			: prev + 1));
// 	}, STEP_DURATION);
// };

// const startStepCounterThreaded = () => {
// 	if (stepCounterInterval) { clearInterval(stepCounterInterval); }
// 	if (showDiagramInterval) { clearInterval(showDiagramInterval); }
// 	StepNumber.set(0);
// 	setTimeout(() => {
// 		ShowDiagramInfo.set(true);
// 		showDiagramInterval = setInterval(() => ShowDiagramInfo.set(true), STEP_DURATION);
// 	}, STEP_DURATION / 2);
// 	stepCounterInterval = setInterval(() => {
// 		const maxStepNumber = (get(NumberOfFrames) - 1) / 2;
// 		const currentStepNumber = get(StepNumber);
// 		if (currentStepNumber + 1 >= maxStepNumber) {
// 			// clear the current loop we are inside of
// 			if (stepCounterInterval) { clearInterval(stepCounterInterval); }
// 			const startTime = performance.now();

// 			const callback = (event) => {
// 				const { sequence } = event.data;
// 				const endTime = performance.now();
// 				const duration = endTime - startTime;
// 				console.log(`generate sequence ${(duration / 1000).toFixed(2)}s`)
// 				const waitTime = Math.max((STEP_DURATION * 2) - duration, 0);
// 				setTimeout(() => {
// 					Fold.set(sequence);
// 					ShowDiagramInfo.set(false);
// 					startStepCounterThreaded();
// 				}, waitTime);
// 				return;
// 			};

// 			makeSequenceThreaded({ numSteps: DESIRED_STEPS }, callback);
// 			return;
// 		}
// 		ShowDiagramInfo.set(false);
// 		StepNumber.update((prev) => ((prev + 1) >= maxStepNumber
// 			? prev
// 			: prev + 1));
// 	}, STEP_DURATION);
// };

// const callback = (event) => {
// 	const { sequence } = event.data;
// 	const endTime = performance.now();
// 	const duration = endTime - startTime;
// 	console.log(`generate sequence ${(duration / 1000).toFixed(2)}s`)
// 	const waitTime = Math.max((STEP_DURATION * 2) - duration, 0);
// 	setTimeout(() => {
// 		Fold.set(sequence);
// 		ShowDiagramInfo.set(false);
// 		startStepCounterThreaded();
// 	}, waitTime);
// 	return;
// };

// const stopLoops = (...intervalIDs) => {
// 	intervalIDs.forEach(id => clearInterval(id));
// }

/**
 *
 */
const resetAndStartAnimation = (sequence: FOLD) => {
	// clear any loops that might be running
	if (stepCounterInterval) { clearInterval(stepCounterInterval); }
	if (showDiagramInterval) { clearInterval(showDiagramInterval); }

	// reset animation to frame 0
	StepNumber.set(0);
	ShowDiagramInfo.set(false); // maybe
	Fold.set(sequence);

	dipatchNewSequence({ numSteps: DESIRED_STEPS })
		.then(({ data }) => { nextSequence = data.sequence })
		.catch((err) => console.error(err));

	// create a pattern that runs half a frame late, period matching frame length,
	// that turns on the "showDiagram" flag so that the second half of the frame
	// is showing the diagram information like arrows.
	setTimeout(() => {
		ShowDiagramInfo.set(true);
		showDiagramInterval = setInterval(() => ShowDiagramInfo.set(true), STEP_DURATION);
	}, STEP_DURATION / 2);

	stepCounterInterval = setInterval(() => {
		const maxStepNumber = (get(NumberOfFrames) - 1) / 2;
		const currentStepNumber = get(StepNumber);
		if (currentStepNumber + 1 >= maxStepNumber) {
			[stepCounterInterval, showDiagramInterval].forEach(clearInterval);
			resetAndStartAnimation(nextSequence);
			return;
		}
		ShowDiagramInfo.set(false);
		StepNumber.update((prev) => ((prev + 1) >= maxStepNumber
			? prev
			: prev + 1));
	}, STEP_DURATION);
};

// load previously calculated (and cached) sequence and start animation
// start background thread:
//   background thread spawns another thread to calculate a new sequence
//   background thread starts a timeout loop for 10 seconds to check on the worker
//     - if the worker is not done, cancel it and restart it (with less complexity)
//       and start another timeout loop doing the same thing.
//

// Fold.set(makeSequence(DESIRED_STEPS));
// ShowDiagramInfo.set(false);

dipatchNewSequence({ numSteps: DESIRED_STEPS })
	.then(({ data }) => resetAndStartAnimation(data.sequence))
	.catch((err) => console.error(err));



// const startStepCounterThreaded = () => {
// 	if (stepCounterInterval) { clearInterval(stepCounterInterval); }
// 	if (showDiagramInterval) { clearInterval(showDiagramInterval); }
// 	StepNumber.set(0);
// 	setTimeout(() => {
// 		ShowDiagramInfo.set(true);
// 		showDiagramInterval = setInterval(() => ShowDiagramInfo.set(true), STEP_DURATION);
// 	}, STEP_DURATION / 2);
// 	stepCounterInterval = setInterval(() => {
// 		const maxStepNumber = (get(NumberOfFrames) - 1) / 2;
// 		const currentStepNumber = get(StepNumber);
// 		if (currentStepNumber + 1 >= maxStepNumber) {
// 			// clear the current loop we are inside of
// 			if (stepCounterInterval) { clearInterval(stepCounterInterval); }
// 			const startTime = performance.now();

// 			const callback = (event) => {
// 				const { sequence } = event.data;
// 				const endTime = performance.now();
// 				const duration = endTime - startTime;
// 				console.log(`generate sequence ${(duration / 1000).toFixed(2)}s`)
// 				const waitTime = Math.max((STEP_DURATION * 2) - duration, 0);
// 				setTimeout(() => {
// 					Fold.set(sequence);
// 					ShowDiagramInfo.set(false);
// 					startStepCounterThreaded();
// 				}, waitTime);
// 				return;
// 			};

// 			makeSequenceThreaded({ numSteps: DESIRED_STEPS }, callback);
// 			return;
// 		}
// 		ShowDiagramInfo.set(false);
// 		StepNumber.update((prev) => ((prev + 1) >= maxStepNumber
// 			? prev
// 			: prev + 1));
// 	}, STEP_DURATION);
// };
