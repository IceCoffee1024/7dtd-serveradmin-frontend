declare namespace API {
  namespace VoteKick {
    /** Vote-kick feature settings exposed to the management UI. */
    interface Settings {
      isEnabled: boolean;
      commandName: string | null;
      commandAliases: string[] | null;
      minOnlinePlayers: number;
      voteDurationSeconds: number;
      passThresholdPercent: number;
      initiatorCooldownSeconds: number;
      targetImmunitySeconds: number;
      kickReason: string | null;
      voteStartedMessage: string | null;
      votePassedMessage: string | null;
      voteFailedMessage: string | null;
      alreadyVotedMessage: string | null;
      cooldownMessage: string | null;
      cannotKickAdminMessage: string | null;
      targetNotFoundMessage: string | null;
      targetAlreadyGoneMessage: string | null;
      alreadyActiveMessage: string | null;
      usageTipMessage: string | null;
      notEnoughPlayersMessage: string | null;
      voteProgressMessage: string | null;
    }
  }
}
