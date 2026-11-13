export const APP_ENVS = ['local', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

export interface Env {
  apiBaseUrl: string;
  appEnv: AppEnv;
}

type RawEnv = Partial<Record<'VITE_API_BASE_URL' | 'VITE_APP_ENV', string | undefined>>;

function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Validates the only two build-time variables. Fails fast on misconfiguration. */
export function parseEnv(raw: RawEnv): Env {
  const apiBaseUrl = raw.VITE_API_BASE_URL?.trim();
  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required');
  }
  if (!isAbsoluteUrl(apiBaseUrl)) {
    throw new Error('VITE_API_BASE_URL must be an absolute URL');
  }
  const appEnv = raw.VITE_APP_ENV?.trim();
  if (!APP_ENVS.includes(appEnv as AppEnv)) {
    throw new Error(`VITE_APP_ENV must be one of: ${APP_ENVS.join(', ')}`);
  }
  return { apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''), appEnv: appEnv as AppEnv };
}

export const env: Env = parseEnv(import.meta.env);
