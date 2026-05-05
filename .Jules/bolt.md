## 2025-05-14 - [Environment Setup]

**Learning:** Running Vitest in this SvelteKit environment may fail with a `TSConfckParseError` if `.svelte-kit/tsconfig.json` is missing.
**Action:** Run `pnpm svelte-kit sync` to generate the required SvelteKit configuration files before running tests.

## 2025-05-14 - [Service Logic Optimization]

**Learning:** The dashboard was performing redundant DynamoDB calls by fetching questions twice with different status filters, and iterating over arrays multiple times for summaries.
**Action:** Consolidate multiple `ddbQuery` calls into one and use a single pass (loop) to calculate multiple statistics from the same dataset to reduce I/O and CPU overhead.
