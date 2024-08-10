import { makeSequence } from "./sequence.ts";

addEventListener("message", ({ data }) => {
	const { numSteps } = data;
	const sequence = makeSequence(numSteps);
	postMessage({ sequence });
});

addEventListener("error", ({ error }) =>
	console.warn("orders.worker.js, unhandled error"),
);

addEventListener("messageerror", () =>
	console.warn("orders.worker.js, unhandled messageerror"),
);
