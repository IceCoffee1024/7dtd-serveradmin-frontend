declare namespace API {
  namespace ColoredChat {
    interface Paged<T> {
      total: number;
      items: T[];
    }

    interface Settings {
      isEnabled: boolean;
      globalDefault: string | null;
      whisperDefault: string | null;
      friendsDefault: string | null;
      partyDefault: string | null;
      adminDefault: string | null;
      systemDefault: string | null;
      allowPlayerColorTags: boolean;
    }

    interface Profile {
      id: number;
      playerId: string;
      createdAt: string;
      customName: string | null;
      nameColor: string | null;
      textColor: string | null;
      description: string | null;
    }

    type ProfileQueryOrder = 'CreatedAt' | 'PlayerId' | 'CustomName';

    interface ProfileQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      order?: ProfileQueryOrder;
      desc?: boolean;
    }

    interface ProfileUpsert {
      playerId: string;
      customName?: string | null;
      nameColor?: string | null;
      textColor?: string | null;
      description?: string | null;
    }
  }
}
