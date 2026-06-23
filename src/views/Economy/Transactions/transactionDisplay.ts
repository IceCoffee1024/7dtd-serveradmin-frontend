export interface TransactionAmountDisplay {
  className: string;
  text: string;
}

export function getTransactionAmountDisplay(
  direction: string | null | undefined,
  amount: number | string | null | undefined,
): TransactionAmountDisplay {
  const amountText = amount == null ? '--' : String(amount);

  switch (direction) {
    case 'Income':
      return {
        className: 'text-emerald-600 dark:text-emerald-400',
        text: `+${amountText}`,
      };
    case 'Expense':
      return {
        className: 'text-rose-600 dark:text-rose-400',
        text: `-${amountText}`,
      };
    default:
      return {
        className: 'text-slate-600 dark:text-slate-300',
        text: amountText,
      };
  }
}
