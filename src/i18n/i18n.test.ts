import i18n, { ACTIVE_LANGUAGE } from '@/i18n';

describe('i18n (D-062)', () => {
  it('always uses Spanish, whatever the browser language', () => {
    expect(navigator.language).toMatch(/^en/);
    expect(ACTIVE_LANGUAGE).toBe('es');
    expect(i18n.language).toBe('es');
    expect(i18n.t('notFound.title')).toBe('Página no encontrada');
  });

  it('falls back to the English source for keys missing in Spanish', () => {
    i18n.addResource('en', 'translation', 'test.onlyInEnglish', 'English source');
    expect(i18n.t('test.onlyInEnglish' as never)).toBe('English source');
  });

  it('formats interpolated numbers with es-MX (D-068)', () => {
    i18n.addResource('es', 'translation', 'test.distance', '{{value, number}} m');
    expect(i18n.t('test.distance' as never, { value: 1000.5 } as never)).toBe('1,000.5 m');
  });
});
