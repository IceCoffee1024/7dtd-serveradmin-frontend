import { describe, expect, it } from 'vitest';
import { getTransactionAmountDisplay } from './transactionDisplay';

describe('getTransactionAmountDisplay', () => {
  it('keeps extensible directions neutral instead of displaying them as expenses', () => {
    expect(getTransactionAmountDisplay('Hold', 50)).toEqual({
      className: 'text-slate-600 dark:text-slate-300',
      text: '50',
    });
  });
});
