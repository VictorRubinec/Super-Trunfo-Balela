import { describe, it, expect } from 'vitest';
import { validateAttribute } from './cardValidation';

describe('Card Attributes Validation', () => {
  it('should keep values between 1 and 10', () => {
    expect(validateAttribute(5)).toBe(5);
    expect(validateAttribute(1)).toBe(1);
    expect(validateAttribute(10)).toBe(10);
  });

  it('should clamp values lower than 1 to 1,', () => {
    expect(validateAttribute(0)).toBe(1);
    expect(validateAttribute(-5)).toBe(1);
  });

  it('should clamp values higher than 10 to 10', () => {
    expect(validateAttribute(11)).toBe(10);
    expect(validateAttribute(99)).toBe(10);
  });

  it('should handle NaN by returning 1', () => {
    expect(validateAttribute(NaN)).toBe(1);
  });
});
