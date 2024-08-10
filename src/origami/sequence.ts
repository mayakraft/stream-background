import ear from "rabbit-ear";
import { type FOLD, type VecLine2 } from "rabbit-ear/types.js";
import { type AxiomDef } from "../types.ts";

type LandmarkInformation = {
	points: [number, number][],
	lines: VecLine2[],
	points_counts: number[],
	lines_counts: number[],
};

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
 * @description Given a foldedForm FOLD object, find all "interesting"
 * landmarks suitable for input to a fold operation like an origami axiom.
 * The vertices and edges are clustered into points and lines, with
 * information regarding the number of vertices/edges sharing this location.
 * This can be done on a creasePattern, but the weights will all be uniform
 * and meaningless.
 * @param {FOLD} graph a FOLD graph in folded form
 * @returns {{
 *   points: [number, number][],
 *   lines: VecLine2,
 *   points_counts: number[],
 *   lines_counts: number[],
 * }} points and lines, and each entry's corresponding weight (number of
 * times it appears in the model).
 */
const getInterestingLandmarks = (graph: FOLD): LandmarkInformation => {
	// point info
	const clusters_vertices = ear.graph.getVerticesClusters(graph)
		.sort((a, b) => b.length - a.length);
	const points = clusters_vertices
		.map(([first]) => first)
		.map(vert => graph.vertices_coords[vert])
		.map(ear.math.resize2);
	const points_counts = clusters_vertices.map(arr => arr.length);

	// line info
	const { lines: uniqueLines, edges_line } = ear.graph.getEdgesLine(graph);
	const lines_edges = ear.graph.invertFlatToArrayMap(edges_line);
	const clusters_edges = uniqueLines
		.map((_, i) => i)
		.sort((a, b) => lines_edges[b].length - lines_edges[a].length)
		.map(i => lines_edges[i]);
	const lines = clusters_edges
		.map(([first]) => uniqueLines[edges_line[first]]);
	const lines_counts = clusters_edges.map(arr => arr.length);

	return { points, lines, points_counts, lines_counts };
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

// const getRandomWeightedElements = (array: any[], arrayWeight: number[], count: number) => {

const shuffle = (array: any[]) => {
	let index = array.length;
	while (index != 0) {
		let randomIndex = Math.floor(Math.random() * index);
		index--;
		[array[index], array[randomIndex]] = [array[randomIndex], array[index]];
	}
}

const getRandomWeightedIndices = (arrayWeight: number[]) => {
	const weightSum = arrayWeight.reduce((a, b) => a + b, 0);
	const arrayMap: number[] = Array.from(Array(weightSum));
	let counter = 0;
	arrayWeight.forEach((weight, i) => Array
		.from(Array(weight))
		.forEach(() => { arrayMap[counter++] = i; }));
	shuffle(arrayMap);
	return Array.from(new Set(arrayMap));
};

const randomAxiom1 = (graph: FOLD, params: LandmarkInformation): AxiomDef | undefined => {
	if (!graph.vertices_coords) { return; }
	const { points: pts, points_counts } = params;

	// randomly choose two points
	const points = getRandomWeightedIndices(points_counts)
		.slice(0, 2)
		.map(i => pts[i]);

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

const randomAxiom2 = (graph: FOLD, params: LandmarkInformation): AxiomDef | undefined => {
	if (!graph.vertices_coords) { return; }
	const { points: pts, points_counts } = params;
	// randomly choose two points
	const points = getRandomWeightedIndices(points_counts)
		.slice(0, 2)
		.map(i => pts[i]);

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

const randomAxiom3 = (graph: FOLD, params: LandmarkInformation): AxiomDef | undefined => {
	const { lines: ln, lines_counts } = params;
	// randomly choose two points
	const lines = getRandomWeightedIndices(lines_counts)
		.slice(0, 2)
		.map(i => ln[i]);

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

const randomAxiom4 = (graph: FOLD, params: LandmarkInformation): AxiomDef | undefined => {
	if (!graph.vertices_coords) { return; }
	const { points: pts, lines: ln, points_counts, lines_counts } = params;
	// randomly choose a line and a point
	const lines = getRandomWeightedIndices(lines_counts)
		.slice(0, 1)
		.map(i => ln[i]);
	const points = getRandomWeightedIndices(points_counts)
		.slice(0, 1)
		.map(i => pts[i]);

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

const makeRandomFold = (graph: FOLD, vertices_coordsFolded: [number, number][] | [number, number, number][]) => {
	if (!vertices_coordsFolded) {
		vertices_coordsFolded = ear.graph.makeVerticesCoordsFlatFolded(graph);
	}
	const folded = {
		...graph,
		vertices_coords: vertices_coordsFolded,
	};

	const landmarks = getInterestingLandmarks(folded);

	const solution1 = randomAxiom1(folded, landmarks);
	const solution2 = randomAxiom2(folded, landmarks);
	const solution3 = randomAxiom3(folded, landmarks);
	const solution4 = randomAxiom4(folded, landmarks);

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

	ear.graph.simpleFoldLine(graph, randomSolution.result.line, {
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

/**
 *
 */
export const dipatchNewSequence = async ({ numSteps = 6 } = {}) => (
	new Promise((resolve, reject) => {
		// const worker = new Worker("./worker.js");
		const worker = new Worker(
			new URL("./dispatch.js", import.meta.url),
			{ type: "module", name: "sequence generator dispatcher" },
		);
		worker.addEventListener("message", resolve);
		worker.addEventListener("error", reject);
		worker.postMessage({ numSteps });
	}));

// export const makeSequenceThreaded = ({ numSteps = 6 } = {}, callback) => {
// 	// const worker = new Worker("./worker.js");
// 	const worker = new Worker(
// 		new URL("./worker.js", import.meta.url),
// 		{ type: "module", name: "origami sequence generator" },
// 	);
// 	worker.addEventListener("message", callback);
// 	worker.addEventListener("error", callback);

// 	worker.postMessage({ numSteps });
// };
