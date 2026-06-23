import dotenv from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load environment variables
// Explicitly load .env file from project root (Claude Desktop may run from different directories)
const projectRoot = resolve(__dirname, '../..');

// Prevent dotenv@17.x from outputting logs to stdout
// In stdio transport, stdout must only be used for JSON RPC communication
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (() => true) as typeof process.stdout.write;
dotenv.config({ path: resolve(projectRoot, '.env') });
process.stdout.write = originalWrite;

/**
 * Environment variable schema definition
 * Uses Zod to validate environment variable types at runtime
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  PORT: z.string().transform(Number).optional().default('3000'),
  INAVI_DOMAIN: z
    .string()
    .url('INAVI_DOMAIN must be a valid URL')
    .optional()
    .default('https://imaps.inavi.com'),
});

/**
 * Parse and validate environment variables
 */
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Output to stderr to avoid polluting stdout in stdio transport
  process.stderr.write(`[MCP Server Error] Invalid environment variables:\n`);
  process.stderr.write(JSON.stringify(parsedEnv.error.format(), null, 2) + '\n');
  process.stderr.write(
    `[MCP Server Error] Please check your .env file at: ${resolve(projectRoot, '.env')}\n`,
  );
  throw new Error('Failed to load environment variables');
}

/**
 * Type-safe environment variable configuration object
 */
export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  inavi: {
    domain: parsedEnv.data.INAVI_DOMAIN,
    baseUrl: `${parsedEnv.data.INAVI_DOMAIN}/maps/v3.0`,
  },
  isDevelopment: parsedEnv.data.NODE_ENV === 'development',
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
} as const;

export type Config = typeof config;
