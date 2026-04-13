declare namespace API {
  namespace Chat {
    interface CommonChatSettings {
      globalServerName?: string;
      whisperServerName?: string;
      chatCommandPrefixes?: string[];
      allowNoPrefix?: boolean;
      chatCommandSeparators?: string[];
    }

    interface ColoredChatSettings {
      isEnabled?: boolean;
      globalDefault?: string;
      whisperDefault?: string;
      friendsDefault?: string;
      partyDefault?: string;
      adminDefault?: string;
      systemDefault?: string;
      allowPlayerColorTags?: boolean;
    }

    interface ColoredChatProfile {
      [key: string]: unknown;
      id: number;
      playerId: string;
      createdAt: string;
      customName?: string | null;
      nameColor?: string | null;
      textColor?: string | null;
      description?: string | null;
    }

    interface ColoredChatProfileUpsert {
      playerId: string;
      customName?: string | null;
      nameColor?: string | null;
      textColor?: string | null;
      description?: string | null;
    }
  }
}
