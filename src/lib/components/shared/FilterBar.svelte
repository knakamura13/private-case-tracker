<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

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
        q = $page.url.searchParams.get(searchParam) ?? '';
    });

    function apply() {
        const url = new URL($page.url);
        if (q) url.searchParams.set(searchParam, q);
        else url.searchParams.delete(searchParam);
        goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
    }

    function onFilterChange(name: string, value: string) {
        const url = new URL($page.url);
        if (value) url.searchParams.set(name, value);
        else url.searchParams.delete(name);
        goto(url.toString(), { keepFocus: true, noScroll: true });
    }
</script>

<div class="filter-bar">
    <form
        class="filter-bar-search"
        onsubmit={(e) => {
            e.preventDefault();
            apply();
        }}
    >
        <Input name={searchParam} placeholder="Search…" bind:value={q} />
    </form>
    {#each filters as f (f.name)}
        <Select
            value={$page.url.searchParams.get(f.name) ?? ''}
            onchange={(e) => onFilterChange(f.name, (e.currentTarget as HTMLSelectElement).value)}
            class="filter-bar-select"
            aria-label={f.label}
        >
            <option value="">{f.label}: all</option>
            {#each f.options as o (o.value)}
                <option value={o.value}>{o.label}</option>
            {/each}
        </Select>
    {/each}
</div>
