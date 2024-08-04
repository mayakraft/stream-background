import { get } from "svelte/store";
import { makeSequence } from "../origami/sequence.ts";
import { Fold, StepNumber, NumberOfFrames } from "./Model.ts";
import { ShowDiagramInfo } from "./App.ts";

export const DESIRED_STEPS = 9;
const STEP_DURATION = 4 * 1000; // 4 seconds

let stepCounterInterval: number;
let showDiagramInterval: number;

const startStepCounter = () => {
	if (stepCounterInterval) { clearInterval(stepCounterInterval); }
	if (showDiagramInterval) { clearInterval(showDiagramInterval); }
	StepNumber.set(0);
	setTimeout(() => {
		ShowDiagramInfo.set(true);
		showDiagramInterval = setInterval(() => ShowDiagramInfo.set(true), STEP_DURATION);
	}, STEP_DURATION / 2);
	stepCounterInterval = setInterval(() => {
		const maxStepNumber = (get(NumberOfFrames) - 1) / 2;
		const currentStepNumber = get(StepNumber);
		if (currentStepNumber + 1 >= maxStepNumber) {
			// clear the current loop we are inside of
			if (stepCounterInterval) { clearInterval(stepCounterInterval); }
			const startTime = performance.now();
			const result = makeSequence(DESIRED_STEPS);
			const endTime = performance.now();
			const duration = endTime - startTime;
			console.log(`generate sequence ${(duration / 1000).toFixed(2)}s`)
			const waitTime = Math.max((STEP_DURATION * 2) - duration, 0);
			setTimeout(() => {
				Fold.set(result);
				ShowDiagramInfo.set(false);
				startStepCounter();
			}, waitTime);
			return;
		}
		ShowDiagramInfo.set(false);
		StepNumber.update((prev) => ((prev + 1) >= maxStepNumber
			? prev
			: prev + 1));
	}, STEP_DURATION);
};

Fold.set(makeSequence(DESIRED_STEPS));
ShowDiagramInfo.set(false);
startStepCounter();
