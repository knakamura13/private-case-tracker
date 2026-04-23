// Deprecated: Prisma/Postgres is no longer used at runtime.
// Kept only to avoid breaking any leftover imports during the migration.
// If this is still being imported, that is a bug.

export const db = new Proxy(
	{},
	{
		get(_t, prop) {
			throw new Error(
				`Prisma db access is disabled (attempted to read "${String(prop)}"). Remove $lib/server/db usage.`
			);
		}
	}
) as never;
