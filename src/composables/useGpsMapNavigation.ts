import type { PositionDto } from '~/generated/api/types.gen';
import { useRoute, useRouter } from 'vue-router';

interface RegionMapTarget {
  centerX: number;
  centerZ: number;
  radius?: number;
}

function toRoundedNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

export function useGpsMapNavigation() {
  const route = useRoute();
  const router = useRouter();

  function viewRegionOnMap(target: RegionMapTarget): void {
    const centerX = toRoundedNumber(target.centerX);
    const centerZ = toRoundedNumber(target.centerZ);
    const radius = Math.max(1, toRoundedNumber(target.radius) ?? 64);
    if (centerX == null || centerZ == null) {
      return;
    }

    void router.push({
      name: 'GPSMap',
      params: { locale: route.params.locale },
      query: {
        regionCenterX: String(centerX),
        regionCenterZ: String(centerZ),
        regionRadius: String(radius),
      },
    });
  }

  function viewLandClaimContainerOnMap(position: PositionDto | null | undefined, radius = 64): void {
    if (position?.x == null || position.z == null) {
      return;
    }

    viewRegionOnMap({
      centerX: position.x,
      centerZ: position.z,
      radius,
    });
  }

  return {
    viewRegionOnMap,
    viewLandClaimContainerOnMap,
  };
}
