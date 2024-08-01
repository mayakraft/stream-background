<script lang="ts">
	import SidePanel from "./SidePanel.svelte";
</script>

<main class="grid-paper">
	<div class="left-side">
		<SidePanel />
	</div>
	<div class="chroma-key"></div>
</main>

<style>
	:root {
		/* --chroma-key: #080; */
		--chroma-key: transparent;
		--color1: #ddd;
		--color2: #e53;
		--color3: #eee;
	}

	main {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100vw;
		height: 100vh;
		background-color: #158;
	}

	.left-side {
		width: 33vw; /* 17vw; */
		height: 100%;
		background-color: transparent;
		padding: 3vmin 1vmin;
	}

	.chroma-key {
		background-color: var(--chroma-key);
		width: 100%;
		height: calc(100% - (3vmin * 2));
		border-radius: 0.5rem;
		margin: 0 3vmin 0 0;
	}

	.rainbow-gradient {
		background: linear-gradient(rgba(255,0,0,1) 0%, rgba(255,154,0,1) 10%, rgba(208,222,33,1) 20%, rgba(79,220,74,1) 30%, rgba(63,218,216,1) 40%, rgba(47,201,226,1) 50%, rgba(28,127,238,1) 60%, rgba(95,21,242,1) 70%, rgba(186,12,248,1) 80%, rgba(251,7,217,1) 90%, rgba(255,0,0,1) 100%)
		0 0/100% 200%;
		animation: a 20s linear infinite;
	}

	.pattern-zig-zag {
		background-color: var(--color3);
		opacity: 0.8;
		background: linear-gradient(135deg, var(--color2) 25%, transparent 25%) -10px 0/ 20px 20px, linear-gradient(225deg, var(--color1) 25%, transparent 25%) -10px 0/ 20px 20px, linear-gradient(315deg, var(--color2) 25%, transparent 25%) 0px 0/ 20px 20px, linear-gradient(45deg, var(--color1) 25%, var(--color3) 25%) 0px 0/ 20px 20px;
	}

	.pattern-isometric {
		background-color: var(--color3);
		opacity: 0.8;
		background-image:  linear-gradient(30deg, var(--color1) 12%, transparent 12.5%, transparent 87%, var(--color1) 87.5%, var(--color1)), linear-gradient(150deg, var(--color1) 12%, transparent 12.5%, transparent 87%, var(--color1) 87.5%, var(--color1)), linear-gradient(30deg, var(--color1) 12%, transparent 12.5%, transparent 87%, var(--color1) 87.5%, var(--color1)), linear-gradient(150deg, var(--color1) 12%, transparent 12.5%, transparent 87%, var(--color1) 87.5%, var(--color1)), linear-gradient(60deg, var(--color2) 25%, transparent 25.5%, transparent 75%, var(--color2) 75%, var(--color2)), linear-gradient(60deg, var(--color2) 25%, transparent 25.5%, transparent 75%, var(--color2) 75%, var(--color2));
		background-size: 20px 35px;
		background-position: 0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px;
	}

	.grid-paper {
		background-color: var(--color3);
		opacity: 0.8;
		background-image:  linear-gradient(var(--color1) 2px, transparent 2px), linear-gradient(90deg, var(--color1) 2px, transparent 2px), linear-gradient(var(--color1) 1px, transparent 1px), linear-gradient(90deg, var(--color1) 1px, var(--color3) 1px);
		background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
		background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
	}

	@keyframes a {
		to {background-position:0 -200%}
	}
</style>
