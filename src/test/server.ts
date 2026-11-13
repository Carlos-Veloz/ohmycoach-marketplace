import { setupServer } from 'msw/node';
import { env } from '@/lib/env';

export const api = (path: string) => `${env.apiBaseUrl}${path}`;

/** No default handlers: every test declares the endpoints it uses, unhandled requests fail. */
export const server = setupServer();
