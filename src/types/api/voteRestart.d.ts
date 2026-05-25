declare namespace API {
  namespace VoteRestart {
    /** Vote-restart feature settings exposed to the management UI. */
    interface Settings {
      isEnabled: boolean;
      commandName: string | null;
      commandAliases: string[] | null;
      minOnlinePlayers: number;
      voteDurationSeconds: number;
      passThresholdPercent: number;
      initiatorCooldownSeconds: number;
      globalCooldownSeconds: number;
      warningLeadSeconds: number;
      voteStartedMessage: string | null;
      votePassedMessage: string | null;
      voteFailedMessage: string | null;
      alreadyVotedMessage: string | null;
      initiatorCooldownMessage: string | null;
      globalCooldownMessage: string | null;
      notEnoughPlayersMessage: string | null;
      alreadyActiveMessage: string | null;
      voteProgressMessage: string | null;
    }
  }
}
