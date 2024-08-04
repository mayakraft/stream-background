import { derived } from "svelte/store";
import ear from "rabbit-ear";
import { type FOLD } from "rabbit-ear/types.js";
import { FoldedForm } from "./Model.ts";
import { Language } from "./App.ts";
import { type AxiomParams, type DiagramFrame } from "../types.ts";

export const DiagramInfo = derived<typeof FoldedForm, DiagramFrame>(
	FoldedForm,
	($FoldedForm) => $FoldedForm["ear:diagram"],
	undefined,
);

const AssignText = {
	en: {
		F: "fold and unfold",
		M: "mountain fold",
		V: "valley fold",
	}
};

export const DiagramInstructions = derived<[typeof DiagramInfo, typeof Language], string[]>(
	[DiagramInfo, Language],
	([$DiagramInfo, $Language]) => {
		if (!$DiagramInfo || $DiagramInfo.axiom === undefined) { return []; }
		const assignmentInstruction = AssignText[$Language][$DiagramInfo.assignment]
		const axiomInstruction = ear.text.axioms[$Language][$DiagramInfo.axiom];
		return [assignmentInstruction, axiomInstruction];
	},
	[],
);

export const DiagramLines = derived(
	[DiagramInfo],
	([$DiagramInfo]) => {
		if (!$DiagramInfo || $DiagramInfo.result === undefined) { return []; }
		const { result: { segment }, assignment } = $DiagramInfo;
		if (!segment) { return []; }
		try {
			return [{ segment, assignment }];
		} catch (error) {
			return [];
		}
	},
	[],
);

const getAxiomArrow = (graph: FOLD, axiom: number, params: AxiomParams, assignment: string) => {
	let arrows: object[] = [];
	try {
		const { points, lines, index } = params;
		switch (axiom) {
			case 1:
				arrows = ear.diagram.axiom1Arrows(graph, points[0], points[1]);
				break;
			case 2:
				arrows = ear.diagram.axiom2Arrows(graph, points[0], points[1]);
				break;
			case 3:
				const allArrows = ear.diagram.axiom3Arrows(graph, lines[0], lines[1]);
				arrows.push(allArrows[index]);
				break;
			case 4:
				arrows = ear.diagram.axiom4Arrows(graph, lines[0], points[0]);
				break;
			default: break;
		}
		arrows = arrows.filter(a => a !== undefined);
		if (assignment === "F") {
			arrows.forEach(arrow => { arrow.tail = arrow.head; });
		}
		return arrows
	} catch (err) {
		console.error(err);
		return [];
	}
};

export const DiagramArrows = derived(
	[DiagramInfo, FoldedForm],
	([$DiagramInfo, $FoldedForm]) => {
		if (!$DiagramInfo || !$DiagramInfo.params) { return []; }
		const { axiom, assignment } = $DiagramInfo;
		const params = $DiagramInfo.params;
		return axiom === undefined
			? []
			: getAxiomArrow($FoldedForm, axiom, params, assignment);
	},
	[],
);
