import { useRoute, useRouter } from 'vue-router';

export interface PlayerProfileNavigationTarget {
  playerId?: string | null;
  playerName?: string | null;
}

export function usePlayerProfileNavigation() {
  const route = useRoute();
  const router = useRouter();

  function viewPlayerProfile(target: PlayerProfileNavigationTarget) {
    const playerId = target.playerId?.trim();
    if (!playerId) {
      return;
    }

    const playerName = target.playerName?.trim();
    void router.push({
      name: 'PlayerProfile',
      params: {
        locale: route.params.locale,
        playerId,
      },
      query: playerName ? { playerName } : undefined,
    });
  }

  return {
    viewPlayerProfile,
  };
}
