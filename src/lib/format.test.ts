import { formatCalendarDate, formatMoney, formatNumber } from './format';

describe('format (es-MX, D-068)', () => {
  it('uses a decimal point and comma thousands', () => {
    expect(formatNumber(1234.5)).toBe('1,234.5');
  });

  it('formats integer cents in the API currency', () => {
    expect(formatMoney(49900, 'MXN')).toBe('$499.00');
    expect(formatMoney(123456, 'mxn')).toBe('$1,234.56');
    expect(formatMoney(0, 'MXN')).toBe('$0.00');
  });

  it('rejects amounts that are not integer cents', () => {
    expect(() => formatMoney(499.5, 'MXN')).toThrow('integer cents');
  });

  it('formats a calendar date without shifting the day', () => {
    expect(formatCalendarDate('2026-11-30')).toBe('30 nov 2026');
  });
});
