<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    interface FilterDef {
        name: string;
        label: string;
        options: { value: string; label: string }[];
    }

    let {
        filters = [],
        searchParam = 'q'
    }: {
        filters?: FilterDef[];
        searchParam?: string;
    } = $props();

    let q = $state('');
    $effect(() => {
        q = page.url.searchParams.get(searchParam) ?? '';
    });

    function apply() {
        const url = new URL(page.url);
        if (q) url.searchParams.set(searchParam, q);
        else url.searchParams.delete(searchParam);
        goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
    }

    function onFilterChange(name: string, value: string) {
        const url = new URL(page.url);
        if (value) url.searchParams.set(name, value);
        else url.searchParams.delete(name);
        goto(url.toString(), { keepFocus: true, noScroll: true });
    }
</script>

<div class="filter-bar">
    <form
        class="filter-bar__search"
        onsubmit={(e) => {
            e.preventDefault();
            apply();
        }}
    >
        <Input name={searchParam} placeholder="Search…" bind:value={q} />
    </form>
    {#each filters as f (f.name)}
        <Select
            value={page.url.searchParams.get(f.name) ?? ''}
            ariaLabel={f.label}
            position="bottom-end"
            size="sm"
            options={[{ value: '', label: `${f.label}: all` }, ...f.options]}
            onValueChange={(v) => onFilterChange(f.name, v)}
        />
    {/each}
</div>

<style>
    .filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
    }

    .filter-bar__search {
        flex: 1;
        min-width: 160px;
        margin: 0;
    }

    .filter-bar :global(.select-root) {
        min-width: 140px;
    }
</style>
