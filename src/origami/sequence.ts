import ear from "rabbit-ear";
// import type { SplitGraphEvent } from "rabbit-ear/graph/split/splitGraph.js";

const file_spec = 1.2;
const file_creator = "Rabbit Ear";

const clipLineInGraph = (graph, line) => {
	const polygon = ear.math.convexHull(graph.vertices_coords)
		.map(i => graph.vertices_coords[i]);
	return ear.math.clipLineConvexPolygon(polygon, line);
};

const randomAxiom1 = (graph, vertices) => {
	const points = vertices.map(v => graph.vertices_coords[v]);
	const line = ear.axiom.validAxiom1(graph, points[0], points[1]).shift();
	const segment = line ? clipLineInGraph(graph, line) : undefined;
	return ({
		axiom: 1,
		params: {
			vertices,
			points,
		},
		line,
		segment,
	});
};

const randomAxiom2 = (graph, vertices) => {
	const points = vertices.map(v => graph.vertices_coords[v]);
	const line = ear.axiom.validAxiom2(graph, points[0], points[1]).shift();
	const segment = line ? clipLineInGraph(graph, line) : undefined;
	return ({
		axiom: 2,
		params: {
			vertices,
			points,
		},
		line,
		segment,
	});
};

const randomAxiom3 = (graph, lines) => {
	const solutions = ear.axiom.validAxiom3(graph, lines[0], lines[1])
		.filter(a => a !== undefined);
	const index = Math.floor(Math.random() * solutions.length);
	const line = solutions[index];
	const segment = line ? clipLineInGraph(graph, line) : undefined;
	return {
		axiom: 3,
		params: { lines: [lines[0], lines[1]] },
		line,
		segment,
	};
};

const randomAxiom4 = (graph, lines, vertices) => {
	const points = vertices.map(v => graph.vertices_coords[v]);
	const line = ear.axiom.validAxiom4(graph, lines[0], points[0]).shift();
	const segment = line ? clipLineInGraph(graph, line) : undefined;
	return ({
		axiom: 4,
		params: { lines: [lines[0]], points: [points[0]] },
		line,
		segment,
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

const makeRandomFold = (graph, vertices_coordsFolded) => {
	if (!vertices_coordsFolded) {
		vertices_coordsFolded = ear.graph.makeVerticesCoordsFlatFolded(graph);
	}
	const folded = {
		...graph,
		vertices_coords: vertices_coordsFolded,
	};

	// point info
	const clusters_vertices = ear.graph.getVerticesClusters(folded)
		.sort((a, b) => b.length - a.length);
	const vertices = clusters_vertices.map(([first]) => first);
	const points = vertices.map(vert => folded.vertices_coords[vert]);

	// line info
	const { lines, edges_line } = ear.graph.getEdgesLine(folded);
	const lines_edges = ear.graph.invertFlatToArrayMap(edges_line);
	const linesSorted = lines
		.map((_, i) => i)
		.sort((a, b) => lines_edges[b].length - lines_edges[a].length)
		.map(l => lines[l]);

	const solution1 = randomAxiom1(folded, vertices);
	const solution2 = randomAxiom2(folded, vertices);
	const solution3 = randomAxiom3(folded, linesSorted);
	const solution4 = randomAxiom4(folded, linesSorted, vertices);

	const definedSolutions = [
		solution1,
		solution2,
		solution3,
		solution4,
	].filter(({ line }) => line !== undefined);

	// todo: can create a convex hull, single face, intersect with the
	// single face, if the face is split into two we have a valid overlap.
	// i think.
	const defineSolutionsSplits = definedSolutions
		.map(({ line }) => ear.graph.splitGraphWithLine(structuredClone(folded), line));

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

	if (!randomSolution || !randomSolution.line) { return undefined; }

	// random F, M, or V
	const assignment = Array.from("MVF")[Math.floor(Math.random() * 3)];

	ear.graph.foldLine(graph, randomSolution.line, {
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
