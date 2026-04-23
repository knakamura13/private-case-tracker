# Security Audit Report

## Summary
- **Repo / SHA**: private-case-tracker @ main branch
- **Date**: 2026-04-23
- **Scope**: Entire codebase (src/, infra/, configuration files)
- **Out of scope**: node_modules/, .git/, test fixtures, generated build artifacts
- **Counts** — Critical: 0 | High: 0 | Medium: 1 | Low: 3 | Info: 2 | Needs-Verification: 0

## Findings

### [SEC-001] KMS Key Policy Overly Permissive — Medium
- **Location**: `infra/cloudformation/data.yml:43-48`
- **Category**: IaC
- **Description**: The KMS key policy grants `kms:*` on `Resource: '*'` to the account root principal. While this is a standard AWS pattern that allows account administrators full key management, it exceeds the principle of least privilege. The application only needs specific KMS actions (encrypt/decrypt) on specific resources (DynamoDB table, S3 bucket).
- **Evidence**:
  ```yaml
  KeyPolicy:
    Version: '2012-10-17'
    Statement:
      - Sid: AllowAccountAdmin
        Effect: Allow
        Principal:
          AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
        Action: 'kms:*'
        Resource: '*'
  ```
- **Exploit Path**: If an attacker gains account administrator credentials (e.g., through compromised IAM user), they could use this broad permission to delete or disable the KMS key, rendering all encrypted data permanently inaccessible. This requires account-level compromise, which is a high-bar precondition.
- **Repro**: N/A (infrastructure configuration issue)
- **Remediation**: Restrict the key policy to only the necessary actions and resources:
  ```yaml
  Action: 
    - 'kms:Encrypt'
    - 'kms:Decrypt'
    - 'kms:GenerateDataKey'
    - 'kms:DescribeKey'
  Resource:
    - !GetAtt DynamoTable.Arn
    - !GetAtt DataBucket.Arn
  ```
  Alternatively, use AWS managed policies or service-linked roles for more granular control.
- **References**: CWE-732: Incorrect Permission Assignment for Critical Resource, AWS KMS Best Practices

### [SEC-002] Outdated cookie Dependency — Low
- **Location**: `package.json` (transitive dependency via @sveltejs/kit)
- **Category**: Deps
- **Description**: The `cookie` package version 0.6.0 is vulnerable to CVE-2024-47764, which allows cookie name, path, and domain fields to accept out-of-bounds characters. This could potentially be used to set unexpected cookie values if untrusted input is passed to these fields.
- **Evidence**: 
  ```json
  {
    "id": 1103907,
    "title": "cookie accepts cookie name, path, and domain with out of bounds characters",
    "severity": "low",
    "cves": ["CVE-2024-47764"]
  }
  ```
- **Exploit Path**: The application uses Better Auth for session management, which internally uses the `cookie` package. Better Auth controls cookie names and does not pass user input to cookie name/path/domain fields. The vulnerability is not directly exploitable in this codebase.
- **Repro**: N/A (dependency issue)
- **Remediation**: Update @sveltejs/kit to the latest version, which will pull in a patched version of the `cookie` package (>=0.7.0). Monitor for SvelteKit releases that include this update.
- **References**: CVE-2024-47764, GHSA-pxg6-pf52-xh8x

### [SEC-003] Outdated serialize-javascript Dependency — Low
- **Location**: `package.json` (transitive dependency via @vite-pwa/sveltekit)
- **Category**: Deps
- **Description**: The `serialize-javascript` package version 6.0.2 has known vulnerabilities. This is a transitive dependency used by the PWA build process (workbox-build -> @rollup/plugin-terser -> serialize-javascript).
- **Evidence**: 
  ```json
  {
    "id": 1113686,
    "severity": "low"
  }
  ```
- **Exploit Path**: This dependency is only used during the build process to serialize JavaScript for PWA service workers. It does not affect runtime security. An attacker would need to compromise the build pipeline or supply chain to exploit this.
- **Repro**: N/A (build-time dependency)
- **Remediation**: Update @vite-pwa/sveltekit to the latest version. Monitor for releases that include updated dependencies.
- **References**: npm advisory 1113686

### [SEC-004] Outdated fast-xml-parser Dependency — Low
- **Location**: `package.json` (transitive dependency via @aws-sdk/client-dynamodb)
- **Category**: Deps
- **Description**: The `fast-xml-parser` package has known vulnerabilities. This is a transitive dependency used by the AWS SDK for XML parsing in DynamoDB operations.
- **Evidence**: 
  ```json
  {
    "id": 1116957,
    "severity": "low"
  }
  ```
- **Exploit Path**: The AWS SDK uses this parser for internal XML serialization/deserialization with AWS services. User input is not directly passed to the parser. Exploitation would require compromising the AWS SDK or the DynamoDB service itself.
- **Repro**: N/A (transitive dependency in AWS SDK)
- **Remediation**: Update @aws-sdk/client-dynamodb to the latest version. The AWS team typically addresses these quickly in their SDK releases.
- **References**: npm advisory 1116957

### [SEC-005] Build Placeholder Secrets — Info
- **Location**: `src/lib/server/env.ts:34-51`
- **Category**: Secrets
- **Description**: The BUILD_PLACEHOLDER object contains weak placeholder secrets (`build-placeholder-secret-build-placeholder` and a predictable base64 string). These are only used during the SvelteKit build/prerender step when runtime environment variables are not available.
- **Evidence**:
  ```typescript
  const BUILD_PLACEHOLDER: Env = {
    BETTER_AUTH_SECRET: 'build-placeholder-secret-build-placeholder',
    FIELD_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    NODE_ENV: 'production'
  };
  ```
- **Exploit Path**: These placeholders are never used in production runtime. They are only used during static build/prerender to prevent build failures when environment variables are missing. The built application will fail to start in production if real environment variables are not provided (due to validation in `load()` function).
- **Repro**: N/A (build-time only)
- **Remediation**: This is acceptable for build-time placeholders. Consider adding a comment explaining these are build-only values and must never be used in production. Alternatively, use a build-time validation that fails if these placeholders are detected in a production build.
- **References**: CWE-798: Use of Hard-coded Credentials (mitigated by build-time-only usage)

### [SEC-006] Missing Explicit Security Headers — Info
- **Location**: `src/hooks.server.ts` (no explicit header configuration)
- **Category**: Config
- **Description**: The application does not explicitly set security headers such as Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy. SvelteKit/adapter-node may provide some default headers, but explicit configuration is missing.
- **Evidence**: No header configuration found in `hooks.server.ts` or SvelteKit config.
- **Exploit Path**: Without explicit CSP, the application relies on browser defaults. This could theoretically allow XSS payloads to load external resources if an XSS vulnerability were introduced. Without HSTS, the application is vulnerable to SSL stripping attacks (though this requires MITM position). The actual risk is low given the application's architecture (no user-generated HTML, no third-party script loading).
- **Repro**: N/A (missing configuration)
- **Remediation**: Add security headers in `src/hooks.server.ts`:
  ```typescript
  const securityHeadersHandle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (ENV.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    return response;
  };
  ```
  Consider adding CSP if the application evolves to include third-party resources or user-generated content.
- **References**: OWASP Secure Headers Project, CWE-693: Protection Mechanism Failure

## Needs Verification
None. All findings were confirmed through code analysis and dependency auditing.

## Coverage Map
**Directories examined:**
- `src/` — All TypeScript/JavaScript source code
- `infra/cloudformation/` — AWS CloudFormation templates
- `src/routes/` — All SvelteKit route handlers
- `src/lib/server/` — All server-side services and utilities
- `src/lib/schemas/` — All Zod validation schemas
- Configuration files: `package.json`, `svelte.config.js`, `vite.config.ts`, `docker-compose.yml`, `railway.json`, `.env.example`

**Files skipped:**
- `node_modules/` — Third-party dependencies (audited via pnpm audit)
- `.git/` — Version control metadata
- `build/` — Generated build artifacts
- `.svelte-kit/` — SvelteKit build output
- `tests/` — Test files (out of scope per audit parameters)
- `static/` — Static assets (icons, favicon - no executable code)

**Time budget:** ~45 minutes for comprehensive sweep across all security domains.

## Assumptions
- **Threat model**: Internet-facing web application with authenticated users (2-user workspace model). Handles PII (email addresses, names) and sensitive immigration case data (receipt numbers encrypted at rest). Multi-tenant isolation via workspaceId scoping.
- **Deployment**: Railway (Node.js container) with AWS DynamoDB and S3-compatible object storage. No direct database access from internet.
- **Attack surface**: Authenticated web interface, API endpoints, invitation system. No anonymous access except signup (with restrictions).
- **Data sensitivity**: Receipt numbers are the most sensitive field (encrypted). No SSNs, full passport numbers, or financial data stored. Application is for personal use by two individuals, not a multi-tenant SaaS.
