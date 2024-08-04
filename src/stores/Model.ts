import { writable, derived } from "svelte/store";
import ear from "rabbit-ear";
import { type FOLD } from "rabbit-ear/types.js";

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
