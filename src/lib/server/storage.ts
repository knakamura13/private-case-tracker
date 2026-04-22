import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { ENV, storageConfigured } from './env';

function client(): S3Client {
	if (!storageConfigured()) {
		throw new Error(
			'Object storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.'
		);
	}
	return new S3Client({
		endpoint: ENV.S3_ENDPOINT,
		region: ENV.S3_REGION,
		credentials: {
			accessKeyId: ENV.S3_ACCESS_KEY_ID!,
			secretAccessKey: ENV.S3_SECRET_ACCESS_KEY!
		},
		forcePathStyle: ENV.S3_FORCE_PATH_STYLE ?? true
	});
}

function bucket(): string {
	return ENV.S3_BUCKET!;
}

export interface UploadUrlInput {
	workspaceId: string;
	contentType: string;
	sizeBytes: number;
	filename: string;
}

export interface UploadUrlResult {
	uploadUrl: string;
	storageKey: string;
	expiresIn: number;
}

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

function safeName(name: string): string {
	return name
		.normalize('NFKD')
		.replace(/[^\w.\-]+/g, '_')
		.slice(0, 180);
}

export async function createUploadUrl(input: UploadUrlInput): Promise<UploadUrlResult> {
	if (input.sizeBytes > MAX_UPLOAD_BYTES) {
		throw new Error(`File too large. Max ${MAX_UPLOAD_BYTES} bytes.`);
	}
	const key = `workspaces/${input.workspaceId}/${randomUUID()}/${safeName(input.filename)}`;
	const cmd = new PutObjectCommand({
		Bucket: bucket(),
		Key: key,
		ContentType: input.contentType,
		ContentLength: input.sizeBytes
	});
	const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn: 60 * 5 });
	return { uploadUrl, storageKey: key, expiresIn: 60 * 5 };
}

export async function createDownloadUrl(storageKey: string, filename?: string): Promise<string> {
	const cmd = new GetObjectCommand({
		Bucket: bucket(),
		Key: storageKey,
		ResponseContentDisposition: filename ? `attachment; filename="${safeName(filename)}"` : undefined
	});
	return getSignedUrl(client(), cmd, { expiresIn: 60 * 10 });
}

export async function headObject(storageKey: string) {
	const cmd = new HeadObjectCommand({ Bucket: bucket(), Key: storageKey });
	return client().send(cmd);
}

export async function deleteObject(storageKey: string): Promise<void> {
	const cmd = new DeleteObjectCommand({ Bucket: bucket(), Key: storageKey });
	await client().send(cmd);
}
