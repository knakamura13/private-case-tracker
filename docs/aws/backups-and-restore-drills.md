## Backups + restore drills (non-negotiables)

The `infra/cloudformation/data.yml` stack provisions everything below. To deploy:

```bash
AWS_PROFILE=<your-profile> AWS_REGION=us-east-1 \
  APP_NAME=private-case-tracker \
  DYNAMO_TABLE=private-case-tracker \
  S3_BUCKET=private-case-tracker-data \
  ./infra/cloudformation/deploy.sh
```

The stack enables:

- **DynamoDB**: PITR on, SSE-KMS with a customer-managed key, `GSI1` projection ALL.
- **S3**: versioning on, public access blocked, SSE-KMS, lifecycle (noncurrent retention + MPU abort).
- **AWS Backup**: weekly scheduled backups of the Dynamo table with configurable retention.
- **CloudWatch alarms**: DynamoDB throttles and `SystemErrors`.
- **CloudTrail**: multi-region trail with log file validation (optional).
- **GuardDuty**: detector for threat findings (optional).

## DynamoDB

### Point-in-time recovery (PITR)

- **Provisioned by stack.** Remains enabled continuously.
- Verify: `aws dynamodb describe-continuous-backups --table-name <table>`.

### Scheduled backups (long-term retention)

- **Provisioned by stack** (weekly, default 365-day retention). Tune with `BackupRetentionDays`.

### Quarterly restore drill (table)

1. In AWS Backup (or DynamoDB → Backups), choose a recent recovery point.
2. Restore into a **staging table**, e.g. `private-case-tracker-restore-YYYYMMDD`.
3. In a staging deployment, set `DYNAMO_TABLE=<restored-table>`.
4. Validate:
   - `GET /health` returns `200` with `"store":"dynamodb"`.
   - Log in works.
   - Each list view loads (tasks, notes, evidence, forms, milestones, questions, documents, quick links).
   - Dashboard renders without errors.
5. Record in a short log: restore time, any missing data, any surprises in indexes/throughput.

## S3

### Versioning + lifecycle

- **Provisioned by stack.** Public access fully blocked. Versioning on.
- Noncurrent versions expire after `NoncurrentVersionRetentionDays` (default 365).
- Incomplete multipart uploads abort after 7 days.

### Quarterly restore drill (objects)

1. List object versions for a known key: `aws s3api list-object-versions --bucket <bucket> --prefix <key>`.
2. Copy a prior version back in place: `aws s3api copy-object --bucket <bucket> --key <key> --copy-source "<bucket>/<key>?versionId=<prior>"`.
3. Verify the app downloads the restored object via the normal signed-URL flow.

## Secrets rotation runbook

Schedule (every 90 days):

1. Rotate `BETTER_AUTH_SECRET` in Railway → this logs everyone out (expected).
2. Rotate AWS access keys used by Railway: create new keys, update Railway env, deactivate old keys, delete after 24h.
3. Rotate `FIELD_ENCRYPTION_KEY` only via a planned migration (rotating this invalidates encrypted fields unless re-encrypted). Document and test separately.
