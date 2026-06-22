import type {
  EconomyCreateRedeemCodeRequestDto,
  EconomyRedeemCodeDto,
  EconomyShopItemDto,
  EconomyUpsertShopItemRequestDto,
} from '~/generated/api/types.gen';

export type EconomyShopProductType = 'GameItem' | 'RewardPackage';

export type EconomyShopItemWithRewardPackage = EconomyShopItemDto & {
  productType?: EconomyShopProductType | string | null;
  rewardPackageId?: number | null;
};

export type EconomyUpsertShopItemWithRewardPackage = EconomyUpsertShopItemRequestDto & {
  productType?: EconomyShopProductType | string | null;
  rewardPackageId?: number | null;
};

export type EconomyRedeemCodeWithRewardPackage = EconomyRedeemCodeDto & {
  rewardPackageId?: number | null;
};

export type EconomyCreateRedeemCodeWithRewardPackage = EconomyCreateRedeemCodeRequestDto & {
  rewardPackageId?: number | null;
};
