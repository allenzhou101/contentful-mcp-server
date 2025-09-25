import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const EnvSchema = z.object({
  CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: z
    .string()
    .describe('Contentful CMA token'),
  CONTENTFUL_HOST: z
    .string()
    .optional()
    .default('api.contentful.com')
    .describe('Contentful API host'),

  APP_ID: z.string().optional().describe('Contentful App ID'),
  SPACE_ID: z.string().optional().describe('Contentful Space ID'),
  ENVIRONMENT_ID: z
    .string()
    .optional()
    .default('master')
    .describe('Contentful environment ID'),
  ORGANIZATION_ID: z.string().optional().describe('Contentful organization ID'),
  MCP_SERVER_AUTH_TOKEN: z
    .string()
    .optional()
    .describe('Bearer token for MCP server authorization'),
});

export const env = EnvSchema.safeParse(process.env);

if (!env.success && process.env.TEST_TYPE !== 'unit') {
  console.error('Invalid environment variables', env.error.format());
  process.exit(1);
}
