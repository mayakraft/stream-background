<script lang="ts">
	import Origami from "./Origami.svelte";
	import {
		StepNumber,
		NumberOfSteps,
		ShowDiagramInfo,
		DiagramLines,
		DiagramArrows,
		CreasePattern,
		FoldedForm,
		DiagramInstructions,
	} from "../stores/Model.ts";

	const stepNumber = $derived(`Step ${$StepNumber + 1}`);

	const optionsFolded = {
		faces: {
			front: { fill: "#ddd" },
			back: { fill: "#7ae" },
		},
		strokeWidth: 0.005,
	};
</script>

<div class="container">
	<!-- <h3 class="center">exper-ori-ments</h3> -->
	<!-- <h3 class="center">algo-origami</h3> -->
	<h5>{stepNumber}</h5>
	<Origami
		Fold={$FoldedForm}
		options={optionsFolded}
		segments={$ShowDiagramInfo ? $DiagramLines : []}
		arrows={$ShowDiagramInfo ? $DiagramArrows : []} />
	<div class={$ShowDiagramInfo ? "opaque" : "transparent"}>
		{#each $DiagramInstructions as str}
			<p class="center">{str}</p>
		{/each}
		{#if $StepNumber >= $NumberOfSteps - 1}
			<p class="center">Completed</p>
		{/if}
	</div>
	<div class="spacer"></div>
	<Origami
		Fold={$CreasePattern}
		options={{ strokeWidth: 0.01 }} />
</div>

<style>
	.container {
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: space-evenly;
		margin: 0 1rem;
	}
	:global(.container > *) {
		max-height: 33vh;
		flex: 1;
	}
	.spacer {
		flex: 10;
	}
	.center {
		text-align: center;
	}
	.opaque {
		opacity: 1;
	}
	.transparent {
		opacity: 0;
	}
</style>
