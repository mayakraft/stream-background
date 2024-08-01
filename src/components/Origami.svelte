<script lang="ts">
	import ear from "rabbit-ear";
	import { type FOLD } from "rabbit-ear/types.js";

	let { Fold, options = {}, arrows = [], segments = [] }: { Fold: FOLD; options?: object; arrows?: object[]; segments?: object[] } = $props();
	let container: Element;

	$effect(() => {
		if (!container) { return; }
		while (container.children.length) {
			container.removeChild(container.children[0]);
		}
		const svg = ear.convert.foldToSvg(Fold, options) as SVGElement;
		container.appendChild(svg);

		const viewBox = svg.getAttribute("viewBox").split(" ").map(parseFloat);
		const vmin = Math.min(viewBox[2], viewBox[3]);

		const lineLayer = svg.g();
		segments.forEach(({ segment, assignment }) => {
			switch (assignment) {
				case "M": lineLayer.line(segment)
					.stroke("black")
					.strokeLinecap("round")
					.strokeDasharray(`${vmin * 0.04} ${vmin * 0.04} ${vmin * 0.001} ${vmin * 0.04}`)
					.strokeWidth(vmin * 0.02);
				break;
				case "V": lineLayer.line(segment)
					.stroke("black")
					.strokeLinecap("round")
					.strokeDasharray(`${vmin * 0.04} ${vmin * 0.04}`)
					.strokeWidth(vmin * 0.02);
				break;
				case "F": lineLayer.line(segment)
					.stroke("black")
					.strokeLinecap("round")
					.strokeDasharray(`${vmin * 0.001} ${vmin * 0.04}`)
					.strokeWidth(vmin * 0.02);
				break;
				default: break;
			}
		});

		const arrowLayer = svg.g().stroke("black").fill("black");
		arrows.forEach(arrow => arrowLayer.arrow(arrow));
	});
</script>

<div bind:this={container}></div>

<style>
	:global(svg) {
		width: 100%;
		height: 100%;
		overflow: visible;
	}
</style>
