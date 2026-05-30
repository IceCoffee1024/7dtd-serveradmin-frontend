import type { useQueryCache } from '@pinia/colada';
import type {
  EconomyLeaderboardItemDto,
  EconomyTransactionsGetTransactionsData,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { economyTransactionsExportTransactionsQuery } from '~/generated/api/@pinia/colada.gen';
import { invalidateGeneratedQueries } from './generated';

type QueryCache = ReturnType<typeof useQueryCache>;

export type EconomyLeaderboardRow = EconomyLeaderboardItemDto & { rank: number };
export type EconomyTransactionFilters = Omit<NonNullable<EconomyTransactionsGetTransactionsData['query']>, 'pageNumber' | 'pageSize' | 'order' | 'desc'>;

export async function invalidateEconomyQueries() {
  await invalidateGeneratedQueries('Economy');
}

export async function invalidateEconomyAndTransactionsQueries() {
  await invalidateGeneratedQueries(['Economy', 'EconomyTransactions']);
}

export async function invalidateEconomyShopQueries() {
  await invalidateGeneratedQueries('EconomyShop');
}

export async function invalidateEconomyRedeemCodeQueries() {
  await invalidateGeneratedQueries('EconomyRedeemCode');
}

export function toEconomyLeaderboardRows(items: EconomyLeaderboardItemDto[]): EconomyLeaderboardRow[] {
  return items.map((item, index) => ({ ...item, rank: index + 1 }));
}

export async function exportEconomyTransactionsCsv(queryCache: QueryCache, filters: EconomyTransactionFilters): Promise<void> {
  const options = economyTransactionsExportTransactionsQuery({ query: filters });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  if (state.data == null) {
    throw new Error('Empty transaction export response');
  }

  saveBlob(state.data, `transactions_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
}

function saveBlob(data: Blob, fileName: string): void {
  const url = URL.createObjectURL(data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
