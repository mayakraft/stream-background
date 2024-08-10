/** @type {Worker | undefined} */
let worker;
/** @type {number | undefined} */
let timeoutID;

const MIN_COMPLETION_TIME = 5 * 1000;

/**
 * @param {any} data
 * @param {(e: MessageEvent) => void} onMessage
 * @param {(error: ErrorEvent) => void} onError
 */
const spawnThread = (data, onMessage, onError) => {
	console.log("spawning a thread");
	if (worker) {
		worker.terminate();
	}
	if (timeoutID !== undefined) {
		clearTimeout(timeoutID);
	}

	worker = new Worker(new URL("./worker.js", import.meta.url), {
		type: "module",
		name: "make new folding sequence",
	});

	worker.addEventListener("message", onMessage);
	worker.addEventListener("error", onError);
	worker.postMessage(data);

	// set a timeout if the worker is not completed by the end, kill it
	// and start a new thread. it might be trying to solve a problem too difficult.
	timeoutID = setTimeout(() => {
		timeoutID = undefined;
		console.log("worker finished in time");
		if (worker) {
			console.log("worker DID NOT finish in time. starting a new thread");
			spawnThread(data, onMessage, onError)
		}
	}, MIN_COMPLETION_TIME);
}

addEventListener("message", ({ data }) => {
	/** @param {MessageEvent} event */
	const onMessage = (event) => {
		const { data } = event;
		postMessage(data);
		worker = undefined;
	};

	/** @param {ErrorEvent} error */
	const onError = (error) => {
		console.error(error);
		spawnThread(data, onMessage, onError);
	}

	spawnThread(data, onMessage, onError);
});

// addEventListener("error", ({ error }) =>
// 	console.warn("dispatch.worker.js, unhandled error"),
// );

// addEventListener("messageerror", () =>
// 	console.warn("dispatch.worker.js, unhandled messageerror"),
// );



// import { makeSequence } from "./sequence.ts";

// addEventListener("message", ({ data }) => {
// 	const { numSteps } = data;
// 	const sequence = makeSequence(numSteps);
// 	postMessage({ sequence });
// });

// addEventListener("error", ({ error }) =>
// 	console.warn("orders.worker.js, unhandled error"),
// );

// addEventListener("messageerror", () =>
// 	console.warn("orders.worker.js, unhandled messageerror"),
// );
