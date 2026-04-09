const { mean } = require('./stats');

describe('mean()', () => {
  it('calculates the average of multiple values', () => {
    expect(mean([10, 20, 30])).toBe(20);
  });

  it('returns the value itself for a single-element array', () => {
    expect(mean([42])).toBe(42);
  });

  it('handles decimal results', () => {
    expect(mean([1, 2])).toBe(1.5);
  });

  it('handles negative values', () => {
    expect(mean([-10, 10])).toBe(0);
  });

  it('returns NaN for an empty array', () => {
    expect(mean([])).toBeNaN();
  });

  it('handles large numbers', () => {
    expect(mean([1000000, 2000000, 3000000])).toBe(2000000);
  });
});
