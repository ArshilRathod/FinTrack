import { test, expect } from '@jest/globals';
import { calcTotal } from '../src/utils/calcTotal.js';

test('calculates total expenses correctly', () => {
    const expenses = [
        { amount: 100 },
        { amount: 200 },
        { amount: 300 }
    ];

    expect(calcTotal(expenses)).toBe(600);
});

test('returns 0 for empty array', () => {
    expect(calcTotal([])).toBe(0);
});