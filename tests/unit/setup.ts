// Provide deterministic env for tests that import server modules.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.APP_URL ??= 'http://localhost:3000';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-test-secret-test-secret-test';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
process.env.PUBLIC_APP_NAME ??= 'Private Case Tracker';
process.env.FIELD_ENCRYPTION_KEY ??= 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
process.env.NODE_ENV ??= 'test';
