import ear from "rabbit-ear";
import { type FOLD, type VecLine2 } from "rabbit-ear/types.js";
import { type AxiomParams, type AxiomDef } from "../types.ts";

// import type { SplitGraphEvent } from "rabbit-ear/graph/split/splitGraph.js";

const file_spec = 1.2;
const file_creator = "Rabbit Ear";

const clipLineInGraph = (graph: FOLD, line: VecLine2): [number, number][] | undefined => {
	if (!graph.vertices_coords) { return; }
	const vertices_coords2 = graph.vertices_coords.map(ear.math.resize2);
	const polygon = ear.math.convexHull(vertices_coords2)
		.map(i => vertices_coords2[i]);
	return ear.math.clipLineConvexPolygon(polygon, line);
};

/**
 * @description Given an array of values with some undefineds,
 * make a list of all indices in "array" which are valid (not undefined),
 * and choose one index from the list, return the index, not the value
 * of the array at that index.
 * @returns {number} the index of a valid location inside "array",
 * or "undefined" if the array only contains undefineds.
 */
const getRandomValidIndex = (array: any[]): number => {
	const validIndices = array
		.map((_, i) => i)
		.filter(i => array[i] !== undefined);
	return validIndices[Math.floor(Math.random() * validIndices.length)];
};

const randomAxiom1 = (graph: FOLD, params: AxiomParams): AxiomDef | undefined => {
	if (!graph.vertices_coords) { return; }
	const { points: pts } = params;
	// randomly choose two points
	const points = [pts[0], pts[1]];
	const line = ear.axiom.validAxiom1(graph, points[0], points[1]).shift();
	const result = line
		? { line, segment: clipLineInGraph(graph, line) }
		: undefined;
	return ({
		axiom: 1,
		params: { points },
		result,
	});
};

const randomAxiom2 = (graph: FOLD, params: AxiomParams): AxiomDef | undefined => {
	if (!graph.vertices_coords) { return; }
	const { points: pts } = params;
	// randomly choose two points
	const points = [pts[0], pts[1]];
	const line = ear.axiom.validAxiom2(graph, points[0], points[1]).shift();
	const result = line
		? { line, segment: clipLineInGraph(graph, line) }
		: undefined;
	return ({
		axiom: 2,
		params: { points },
		result,
	});
};

const randomAxiom3 = (graph: FOLD, params: AxiomParams): AxiomDef | undefined => {
	const { lines: ln } = params;
	// randomly choose two lines
	const lines = [ln[0], ln[1]];
	const solutions = ear.axiom.validAxiom3(graph, lines[0], lines[1]);
	const index = getRandomValidIndex(solutions);
	if (index === undefined) { return; }
	const line = solutions[index];
	const result = line
		? { line, segment: clipLineInGraph(graph, line) }
		: undefined;
	return {
		axiom: 3,
		params: { lines, index },
		result,
	};
};

const randomAxiom4 = (graph: FOLD, params: AxiomParams) => {
	if (!graph.vertices_coords) { return; }
	const { points: pts, lines: ln } = params;
	// randomly choose a line and a point
	const lines = [ln[0]];
	const points = [pts[0]];
	const line = ear.axiom.validAxiom4(graph, lines[0], points[0]).shift();
	const result = line
		? { line, segment: clipLineInGraph(graph, line) }
		: undefined;
	return ({
		axiom: 4,
		params: { lines, points },
		result,
	});
};

// const splitInfoToSegmentParams = (splitInfo: SplitGraphEvent) => {
// 	const vArr = splitInfo.vertices?.intersect
// 		.filter(n => n !== undefined) || [];
// 	const eArr = splitInfo.edges?.intersect
// 		.filter(el => el !== undefined)
// 		.map(({ a }) => a) || [];
// 	return [
// 		Math.max(...vArr, ...eArr),
// 		Math.min(...vArr, ...eArr),
// 	];
// };

/**
 * @param {FOLD} graph a FOLD graph in folded form
 */
const getInterestingLandmarks = (graph: FOLD) => {
	// point info
	const clusters_vertices = ear.graph.getVerticesClusters(graph)
		.sort((a, b) => b.length - a.length);
	const vertices = clusters_vertices.map(([first]) => first);
	const points = vertices.map(vert => graph.vertices_coords[vert])
		.map(ear.math.resize2);

	// line info
	const { lines, edges_line } = ear.graph.getEdgesLine(graph);
	const lines_edges = ear.graph.invertFlatToArrayMap(edges_line);
	const linesSortedIndices = lines
		.map((_, i) => i)
		.sort((a, b) => lines_edges[b].length - lines_edges[a].length)
	// const edgesSorted = linesSortedIndices.map(l => lines_edges[l]);
	const linesSorted = linesSortedIndices.map(l => lines[l]);

	return { points, lines: linesSorted };
};

const makeRandomFold = (graph: FOLD, vertices_coordsFolded: [number, number][] | [number, number, number][]) => {
	if (!vertices_coordsFolded) {
		vertices_coordsFolded = ear.graph.makeVerticesCoordsFlatFolded(graph);
	}
	const folded = {
		...graph,
		vertices_coords: vertices_coordsFolded,
	};

	const params = getInterestingLandmarks(folded);

	const solution1 = randomAxiom1(folded, params);
	const solution2 = randomAxiom2(folded, params);
	const solution3 = randomAxiom3(folded, params);
	const solution4 = randomAxiom4(folded, params);

	const definedSolutions = [
		solution1,
		solution2,
		solution3,
		solution4,
	].filter(el => el !== undefined && el.result !== undefined);

	// console.log("definedSolutions", definedSolutions);

	// todo: can create a convex hull, single face, intersect with the
	// single face, if the face is split into two we have a valid overlap.
	// i think.
	const defineSolutionsSplits = definedSolutions
		.map(({ result }) => ear.graph.splitGraphWithLine(structuredClone(folded), result.line));

	// console.log("defineSolutionsSplits", defineSolutionsSplits);

	// const defineSolutionSegmentParams = defineSolutionsSplits
	// 	.map(splitInfoToSegmentParams);
	// const defineSolutionSegments = defineSolutionSegmentParams
	// 	.map((params, i) => definedSolutions[i].line);

	const facesSplitCount = defineSolutionsSplits
		.map(result => result
			.faces
			.map
			.filter(arr => arr.length > 1).length > 0);
	// todo create a segment from the operation above

	const validSolutions = definedSolutions
		.filter((_, i) => facesSplitCount[i]);

	const randomIndex = Math.floor(Math.random() * validSolutions.length);
	const randomSolution = validSolutions[randomIndex];

	if (!randomSolution || !randomSolution.result) { return undefined; }

	// random F, M, or V
	const assignment = Array.from("MVF")[Math.floor(Math.random() * 3)];

	ear.graph.foldLine(graph, randomSolution.result.line, {
		assignment,
		// foldAngle,
		vertices_coordsFolded,
	});
	return { ...randomSolution, assignment };
};

export const makeSequence = (numSteps = 6) => {
	const graph = ear.graph.square();
	graph.faceOrders = [];
	// folded vertices_coords
	let vertices_coords = ear.graph.makeVerticesCoordsFlatFolded(graph);
	const file_frames = [];

	file_frames.push({
		...structuredClone(graph),
		frame_classes: ["creasePattern"],
	});
	file_frames.push({
		frame_inherit: true,
		frame_parent: 1,
		vertices_coords,
		frame_classes: ["foldedForm"],
	});

	const startTime = performance.now();

	for (let i = 1; i <= numSteps; i += 1) {
		const loopStart = performance.now();
		const operation = makeRandomFold(graph, vertices_coords);
		if (!operation) { continue; }

		file_frames[file_frames.length - 2]["ear:diagram"] = operation;

		// run the layer solver
		vertices_coords = ear.graph.makeVerticesCoordsFlatFolded(graph);
		graph.faceOrders = ear.layer({ ...graph, vertices_coords }).faceOrders();

		// make cp and folded form, solve face orders for folded form.
		const creasePattern = structuredClone({
			...graph,
			frame_classes: ["creasePattern"],
		});

		const foldedForm = structuredClone({
			frame_inherit: true,
			frame_parent: i * 2 + 1,
			vertices_coords,
			frame_classes: ["foldedForm"],
		});

		// add to FOLD
		file_frames.push(creasePattern);
		file_frames.push(foldedForm);

		const loopEnd = performance.now();
		// console.log(`loop ${i}: ${loopEnd - loopStart} , total: ${loopEnd - startTime}`);
		if (loopEnd - loopStart > 5_000) { break; }
		if (loopEnd - startTime > 10_000) { break; }
	}

	return {
		file_spec,
		file_creator,
		file_description: "randomly generated folding sequence",
		file_frames,
	};
};
