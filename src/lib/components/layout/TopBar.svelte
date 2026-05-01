<script lang="ts">
	import { Search, Plus, Menu } from 'lucide-svelte';

	let { onOpenSearch, onToggleSidebar }: { onOpenSearch: () => void; onToggleSidebar: () => void } = $props();
</script>

<header class="topbar">
	<!-- Mobile Menu Toggle -->
	<button class="topbar-menu-btn" onclick={onToggleSidebar}>
		<Menu size={20} />
	</button>

	<!-- Search Pill -->
	<div class="search-container">
		<Search size={16} class="search-icon" />
		<button
			onclick={onOpenSearch}
			class="search-input"
		>
			Search tasks, evidence…
		</button>
		<span class="mono search-kb">⌘K</span>
	</div>

	<div style="flex: 1;"></div>

	<!-- Global Add -->
	<button class="btn primary" onclick={() => alert('Global Add clicked - modal coming soon')}>
		<Plus size={16} />
		<span class="add-label">Add</span>
	</button>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px 32px;
		border-bottom: 1px solid var(--hairline);
		background: var(--bg);
	}
	.topbar-menu-btn {
		display: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--ink-2);
	}
	@media (max-width: 768px) {
		.topbar-menu-btn {
			display: flex;
		}
	}
	.search-container {
		position: relative;
		flex: 1;
		max-width: 500px;
	}
	:global(.search-icon) {
		position: absolute;
		left: 18px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--ink-3);
	}
	.search-input {
		width: 100%;
		text-align: left;
		padding: 0 44px;
		height: 44px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--hairline);
		color: var(--ink-3);
		font-size: 14px;
		cursor: text;
	}
	.search-kb {
		position: absolute;
		right: 14px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 11px;
		color: var(--ink-3);
		background: var(--surface-3);
		padding: 2px 6px;
		border-radius: 6px;
	}
	.add-label {
		margin-left: 4px;
	}
	@media (max-width: 640px) {
		.add-label {
			display: none;
		}
	}
</style>
