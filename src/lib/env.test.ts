import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepts valid values and trims the trailing slash', () => {
    expect(
      parseEnv({ VITE_API_BASE_URL: 'http://localhost:8000/api/v1/', VITE_APP_ENV: 'local' }),
    ).toEqual({ apiBaseUrl: 'http://localhost:8000/api/v1', appEnv: 'local' });
  });

  it('rejects a missing or relative API base URL', () => {
    expect(() => parseEnv({ VITE_APP_ENV: 'local' })).toThrow('VITE_API_BASE_URL');
    expect(() => parseEnv({ VITE_API_BASE_URL: '/api/v1', VITE_APP_ENV: 'local' })).toThrow(
      'absolute URL',
    );
  });

  it('rejects an unknown environment', () => {
    expect(() =>
      parseEnv({ VITE_API_BASE_URL: 'http://localhost:8000/api/v1', VITE_APP_ENV: 'dev' }),
    ).toThrow('VITE_APP_ENV');
  });
});
