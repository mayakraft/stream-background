import { get, writable, derived } from "svelte/store";
import ear from "rabbit-ear";
import { type FOLD } from "rabbit-ear/types.js";
import { makeSequence } from "../origami/sequence.ts";
import { Language } from "./App.ts";

export const DESIRED_STEPS = 8;
const STEP_DURATION = 4 * 1000; // 4 seconds

// a very particular FOLD file where
// - the top level frame is empty
// - file_frames contains N * 2 frames, alternating CP, foldedForm
//   where N is the number of steps in the folding sequence
export const Fold = writable<FOLD>({});

export const NumberOfFrames = derived(
	Fold,
	($Fold) => ear.graph.countFrames($Fold),
	0,
);

export const NumberOfSteps = derived(
	NumberOfFrames,
	($NumberOfFrames) => ($NumberOfFrames / 2) - 1,
	0,
);

// starting with 0 as the first step.
export const StepNumber = writable<number>(0);

//
export const ShowDiagramInfo = writable<boolean>(false);

// conversion between StepNumber and FrameNumber CP is
// StepNumber * 2 + 1 == FrameNumber
// the +1 is to skip the top level frame
export const FrameNumberCP = derived(
	StepNumber, $Step => $Step * 2 + 1, 1,
);

// conversion between StepNumber and FrameNumber is
// StepNumber * 2 + 2 == FrameNumber
// the + 2 is to skip the top level frame (+1) and then
// the stride is 2 (CP then foldedForm) so, another +1.
export const FrameNumberFoldedForm = derived(
	StepNumber, $Step => $Step * 2 + 2, 2,
);

export const CreasePattern = derived(
	[Fold, NumberOfFrames, FrameNumberCP],
	([$Fold, $NumberOfFrames, $FrameNumberCP]) => (
		$NumberOfFrames === 0 || $FrameNumberCP >= $NumberOfFrames
			? {}
			: ear.graph.flattenFrame($Fold, $FrameNumberCP)
	),
	{},
);

export const FoldedForm = derived(
	[Fold, NumberOfFrames, FrameNumberFoldedForm],
	([$Fold, $NumberOfFrames, $FrameNumberFoldedForm]) => (
		$NumberOfFrames === 0 || $FrameNumberFoldedForm >= $NumberOfFrames
			? {}
			: ear.graph.flattenFrame($Fold, $FrameNumberFoldedForm)
	),
	{},
);

export const DiagramInfo = derived(
	[FoldedForm],
	([$FoldedForm]) => $FoldedForm["ear:diagram"] ? $FoldedForm["ear:diagram"] : {},
	{},
);

const AssignText = {
	en: {
		F: "fold and unfold",
		M: "mountain fold",
		V: "valley fold",
	}
};

export const DiagramInstructions = derived(
	[DiagramInfo, Language],
	([$DiagramInfo, $Language]) => {
		// console.log($DiagramInfo);
		if ($DiagramInfo.axiom === undefined) { return []; }
		const assignmentInstruction = AssignText[$Language][$DiagramInfo.assignment]
		const axiomInstruction = ear.text.axioms[$Language][$DiagramInfo.axiom];
		return [assignmentInstruction, axiomInstruction];
	},
	[],
);

export const DiagramLines = derived(
	[DiagramInfo],
	([$DiagramInfo]) => {
		if ($DiagramInfo.segment === undefined) { return []; }
		const { segment, assignment } = $DiagramInfo;
		try {
			return [{ segment, assignment }];
		} catch (error) {
			return [];
		}
	},
	[],
);

export const DiagramArrows = derived(
	[DiagramInfo, FoldedForm],
	([$DiagramInfo, $FoldedForm]) => {
		// console.log($DiagramInfo);
		if ($DiagramInfo.axiom === undefined) { return []; }
		try {
			const { points, vertices, lines, edges } = $DiagramInfo.params;
			switch ($DiagramInfo.axiom) {
				case 1: return ear.diagram.axiom1Arrows($FoldedForm, points[0], points[1])
					.filter(a => a !== undefined);
				case 2: return ear.diagram.axiom2Arrows($FoldedForm, points[0], points[1])
					.filter(a => a !== undefined);
				case 3: return ear.diagram.axiom3Arrows($FoldedForm, lines[0], lines[1])
					.filter(a => a !== undefined);
				case 4: return ear.diagram.axiom4Arrows($FoldedForm, lines[0], points[0])
					.filter(a => a !== undefined);
				default: return [];
			}
		} catch (error) {
			return [];
		}
	},
	[],
);

let stepCounterInterval: number;
let showDiagramInterval: number;
let makeNewSequenceInterval: number;

const startStepCounter = () => {
	if (stepCounterInterval) { clearInterval(stepCounterInterval); }
	if (showDiagramInterval) { clearInterval(showDiagramInterval); }
	StepNumber.set(0);
	setTimeout(() => {
		ShowDiagramInfo.set(true);
		showDiagramInterval = setInterval(() => ShowDiagramInfo.set(true), STEP_DURATION);
	}, STEP_DURATION / 2);
	stepCounterInterval = setInterval(() => {
		ShowDiagramInfo.set(false);
		StepNumber.update((prev) => ((prev + 1) >= ((get(NumberOfFrames) - 2) / 2)
			? 0
			: prev + 1));
	}, STEP_DURATION);
};

const startWriteNewSequence = () => {
	if (makeNewSequenceInterval) { clearInterval(makeNewSequenceInterval); }
	makeNewSequenceInterval = setInterval(() => {
		Fold.set(makeSequence(DESIRED_STEPS));
		startStepCounter();
	}, STEP_DURATION * 12);
};

Fold.set(makeSequence(DESIRED_STEPS));

startWriteNewSequence();
startStepCounter();

// fetch("./sequence.fold")
// 	.then(res => res.json())
// 	.then(obj => Fold.set(obj))
// 	.catch(err => console.error(err));
