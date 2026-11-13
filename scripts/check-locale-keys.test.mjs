import { compareLocales, flattenKeys } from './check-locale-keys.mjs';

describe('check-locale-keys', () => {
  it('flattens nested keys with dots', () => {
    expect(flattenKeys({ a: { b: 'x', c: { d: 'y' } } })).toEqual(['a.b', 'a.c.d']);
  });

  it('reports missing and extra keys', () => {
    const result = compareLocales({ a: 'x', b: { c: 'y' } }, { a: 'x', d: 'z' });
    expect(result).toEqual({ missing: ['b.c'], extra: ['d'] });
  });

  it('reports nothing when keys match', () => {
    expect(compareLocales({ a: { b: 'x' } }, { a: { b: 'y' } })).toEqual({
      missing: [],
      extra: [],
    });
  });
});
