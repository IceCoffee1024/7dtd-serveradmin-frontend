declare namespace API {
  namespace GameNotice {
    interface Settings {
      isEnabled: boolean;
      welcomeNotice: string | null;
      rotatingNotices: string[] | null;
      rotatingIntervalSeconds: number;
      bloodMoonNotice1: string | null;
      bloodMoonNotice2: string | null;
      bloodMoonNotice3: string | null;
    }
  }
}
