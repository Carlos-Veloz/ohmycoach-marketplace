import createClient from 'openapi-fetch';
import { env } from '@/lib/env';
import type { paths } from './generated/schema';

/**
 * Client for public endpoints (catalog, program and publisher pages), with no token and no
 * cookies. The authenticated client with `client: STOREFRONT` and the refresh loop arrives in S1.
 */
export const publicClient = createClient<paths>({ baseUrl: env.apiBaseUrl });
