import { type FOLD, type VecLine2 } from "rabbit-ear/types.js";

export type AxiomParams = {
	points?: [number, number][],
	lines?: VecLine2[],
	index?: number,
};

export type AxiomDef = {
	axiom: number,
	params: AxiomParams,
	result?: {
		line: VecLine2,
		segment?: [number, number][],
	},
};

export type DiagramFrame = AxiomDef & {
	assignment: string,
};
