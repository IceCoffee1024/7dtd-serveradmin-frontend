declare namespace API {
  namespace Teleport {
    interface HomeSettings {
      isEnabled: boolean
      cooldownSeconds: number
      setCurrencyRequired: number
      teleCurrencyRequired: number
      maxHomes: number
      listCommandName: string | null
      setCommandName: string | null
      deleteCommandName: string | null
      teleCommandName: string | null
      noHomeTip: string | null
      setLimitTip: string | null
      setSuccessTip: string | null
      overwriteTip: string | null
      deleteSuccessTip: string | null
      homeNotFoundTip: string | null
      coolingTip: string | null
      teleSuccessTip: string | null
      setCurrencyNotEnoughTip: string | null
      teleCurrencyNotEnoughTip: string | null
      allowDuringBloodMoon: boolean
      bloodMoonBlockedTip: string | null
    }

    interface CitySettings {
      isEnabled: boolean
      cooldownSeconds: number
      listCommandName: string | null
      teleCommandName: string | null
      noCitiesTip: string | null
      cityNotFoundTip: string | null
      coolingTip: string | null
      teleSuccessTip: string | null
      currencyNotEnoughTip: string | null
    }

    interface FriendSettings {
      isEnabled: boolean
      cooldownSeconds: number
      currencyRequired: number
      requestExpirySeconds: number
      friendBypass: boolean
      requestCommandName: string | null
      acceptCommandName: string | null
      rejectCommandName: string | null
      targetNotFoundTip: string | null
      requestSentTip: string | null
      requestReceivedTip: string | null
      acceptedTip: string | null
      rejectedTip: string | null
      targetRejectedTip: string | null
      noRequestTip: string | null
      coolingTip: string | null
      teleSuccessTip: string | null
      currencyNotEnoughTip: string | null
    }

    interface GlobalCooldownSettings {
      isEnabled: boolean
      cooldownSeconds: number
    }

    interface BackSettings {
      isEnabled: boolean
      cooldownSeconds: number
      currencyRequired: number
      commandName: string | null
      noPositionTip: string | null
      coolingTip: string | null
      teleSuccessTip: string | null
      currencyNotEnoughTip: string | null
    }

    interface FeatureSettings {
      isEnabled: boolean
      home: HomeSettings
      city: CitySettings
      friend: FriendSettings
      globalCooldown: GlobalCooldownSettings
      back: BackSettings
    }

    interface CityLocation {
      id: number
      name: string
      description: string | null
      x: number
      y: number
      z: number
      yawAngle: number
      currencyRequired: number
      isEnabled: boolean
      sortOrder: number
      createdAt: string
      updatedAt: string
    }

    interface SaveCityLocation {
      name: string
      description: string | null
      x: number
      y: number
      z: number
      yawAngle: number
      currencyRequired: number
      isEnabled: boolean
      sortOrder: number
    }

    interface HomeLocation {
      id: number
      playerId: string
      playerName: string
      homeName: string
      x: number
      y: number
      z: number
      createdAt: string
    }

    interface Paged<T> {
      total: number
      items: T[]
    }

    interface TeleportLog {
      id: number
      timestamp: string
      playerId: string
      playerName: string
      subSystem: string
      fromX: number
      fromY: number
      fromZ: number
      toX: number
      toY: number
      toZ: number
      costPaid: number
      remark: string | null
    }

    interface TeleportLogQuery {
      playerId?: string
      startTime?: string
      endTime?: string
      pageNumber?: number
      pageSize?: number
    }
  }
}
