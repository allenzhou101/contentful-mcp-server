import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../config/contentful.js';
import { z } from 'zod';

export const BaseToolSchema = z.object({
  spaceId: z
    .string()
    .optional()
    .describe(
      'The ID of the Contentful space (optional if provided via X-Contentful-Space-Id header)',
    ),
  environmentId: z.string().describe('The ID of the Contentful environment'),
});

/**
 * Creates a Contentful client with the correct configuration based on resource parameters
 *
 * @param params - Tool parameters that may include a resource
 * @returns Configured Contentful client
 */
export function createToolClient(params: z.infer<typeof BaseToolSchema>) {
  const clientConfig = getDefaultClientConfig();

  // If spaceId is provided in params, it overrides both header and env
  if (params.spaceId) {
    clientConfig.space = params.spaceId;
  }
  // If no spaceId in params, getDefaultClientConfig already handles header override

  // Validate that we have a space ID from somewhere
  if (!clientConfig.space) {
    throw new Error(
      'Space ID is required. Provide it either as a parameter, via X-Contentful-Space-Id header, or set SPACE_ID environment variable.',
    );
  }

  return ctfl.createClient(clientConfig, { type: 'plain' });
}
