import { ClientOptions } from 'contentful-management';
import { env } from '../config/env.js';
import { getVersion } from '../utils/getVersion.js';
import { contextStore } from '../tools/context/store.js';

/**
 * Creates a default Contentful client configuration without actually initializing it.
 */
export function getDefaultClientConfig(): ClientOptions {
  if (!env.success && process.env.TEST_TYPE !== 'unit') {
    throw new Error('Environment variables are not properly configured');
  }

  // Check for space ID override from headers first, then fall back to env
  const spaceIdOverride = contextStore.getSpaceIdOverride();
  const spaceId = spaceIdOverride || env.data!.SPACE_ID;

  const clientConfig: ClientOptions = {
    accessToken: env.data!.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
    host: env.data!.CONTENTFUL_HOST,
    space: spaceId,
    headers: {
      'X-Contentful-User-Agent-Tool': `contentful-mcp/${getVersion()}`, //Include user agent header for telemetry tracking
    },
  };

  return clientConfig;
}
