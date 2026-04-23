import { env } from '$env/dynamic/private';
import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: dev ? ['query', 'error', 'warn'] : ['error'],
		datasources: { db: { url: env.DATABASE_URL } }
	});

if (dev) globalForPrisma.prisma = db;
