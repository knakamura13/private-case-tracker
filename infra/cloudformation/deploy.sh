#!/usr/bin/env bash
# Deploy the Private Case Tracker data layer (DynamoDB + S3 + backups + auditing).
# Usage:
#   AWS_PROFILE=my-profile AWS_REGION=us-east-1 \
#   APP_NAME=private-case-tracker DYNAMO_TABLE=private-case-tracker S3_BUCKET=private-case-tracker-data \
#   ./infra/cloudformation/deploy.sh
#
# Requires: aws cli v2 with credentials that can create KMS keys, DynamoDB tables,
# S3 buckets, AWS Backup plans, CloudTrail trails, and GuardDuty detectors.

set -euo pipefail

STACK_NAME="${STACK_NAME:-${APP_NAME:-private-case-tracker}-data}"
APP_NAME="${APP_NAME:-private-case-tracker}"
DYNAMO_TABLE="${DYNAMO_TABLE:-private-case-tracker}"
S3_BUCKET="${S3_BUCKET:-private-case-tracker-data}"
NONCURRENT_DAYS="${NONCURRENT_DAYS:-365}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-365}"
ENABLE_CLOUDTRAIL="${ENABLE_CLOUDTRAIL:-true}"
ENABLE_GUARDDUTY="${ENABLE_GUARDDUTY:-true}"

TEMPLATE_PATH="$(cd "$(dirname "$0")" && pwd)/data.yml"

echo "Deploying $STACK_NAME (region=${AWS_REGION:-default})"

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_PATH" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    AppName="$APP_NAME" \
    DynamoTableName="$DYNAMO_TABLE" \
    S3BucketName="$S3_BUCKET" \
    NoncurrentVersionRetentionDays="$NONCURRENT_DAYS" \
    BackupRetentionDays="$BACKUP_RETENTION_DAYS" \
    EnableCloudTrail="$ENABLE_CLOUDTRAIL" \
    EnableGuardDuty="$ENABLE_GUARDDUTY"

echo "Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' \
  --output table
