## Railway cutover (DynamoDB + optional S3)

### 1. Provision AWS data layer

Deploy the CloudFormation stack (table + S3 + KMS + backups + auditing):

```bash
AWS_PROFILE=<your-profile> AWS_REGION=us-east-1 \
  APP_NAME=private-case-tracker \
  DYNAMO_TABLE=private-case-tracker \
  S3_BUCKET=private-case-tracker-data \
  ./infra/cloudformation/deploy.sh
```

### 2. Create a least-privilege IAM user for Railway

Attach a policy that allows only:

- `dynamodb:Get*`, `dynamodb:Put*`, `dynamodb:Query`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`, `dynamodb:BatchWriteItem` on the **specific table ARN** and its `index/GSI1`.
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the **specific bucket ARN**.
- `kms:Encrypt`, `kms:Decrypt`, `kms:GenerateDataKey`, `kms:DescribeKey` on the **specific key ARN**.

Create access keys for this user and copy them to Railway (below).

### 3. Required Railway variables (DynamoDB)

- `NODE_ENV=production`
- `APP_URL=https://<your-railway-domain>`
- `BETTER_AUTH_URL=https://<your-railway-domain>`
- `BETTER_AUTH_SECRET=<base64 32+ bytes>`
- `FIELD_ENCRYPTION_KEY=<base64 32 bytes>`
- `AWS_REGION=<e.g. us-east-1>`
- `DYNAMO_TABLE=<your table name>` (**required in production**)
- `AWS_ACCESS_KEY_ID=...`
- `AWS_SECRET_ACCESS_KEY=...`

### 4. Optional Railway variables (S3 uploads)

- `S3_ENDPOINT=https://s3.<region>.amazonaws.com`
- `S3_REGION=<same region or your bucket region>`
- `S3_BUCKET=<bucket name>`
- `S3_ACCESS_KEY_ID=...`
- `S3_SECRET_ACCESS_KEY=...`
- `S3_FORCE_PATH_STYLE=false`

### 5. Smoke checks after deploy

- `GET /health` should return `200` and `"store":"dynamodb"`.
- Sign up / login, create a task, create a note, create an evidence item, and confirm they persist across refresh.
- Check CloudWatch: the `*-dynamo-throttles` and `*-dynamo-system-errors` alarms should stay `OK`.

### 6. Ongoing hygiene

- Rotate `BETTER_AUTH_SECRET` + AWS keys on the schedule in `docs/aws/backups-and-restore-drills.md`.
- Run the quarterly restore drill.
