declare namespace API {
  namespace OnlineReward {
    interface Settings {
      isEnabled: boolean
      rewardIntervalMinutes: number
      rewardAmount: number
      rewardPartialPeriod: boolean
      playerMessage: string | null
    }
  }
}
