/** The global namespace for the app */
declare namespace App {

  interface Menu {
    label: string;
    icon?: Icon;
    children?: Menu[];
    index: string;
    keepAlive: boolean;
  }

  interface UserInfo {

  }

  interface ThemeSettings {
    appearance: {
      mode: 'light' | 'dark' | 'system';
      grayscale: false;
      colorWeakness: false;
      colors: {
        primary: string;
        info: string;
        warning: string;
        success: string;
        danger: string;
        surface: string;
      };
    };
    layout: {
      mode: 'side-menu' | 'top-menu';
      header: {
        height: number;
        showLogo: boolean;
        showTitle: boolean;
        showMenuCollapseBtn: boolean;
        showBreadcrumb: boolean;
        showBreadcrumbIcon: boolean;
        topMenuAlignment: 'left' | 'center' | 'right';
        // showGlobalSearchBtn: boolean;
        showFullscreenBtn: boolean;
        showLanguageSwitchBtn: boolean;
        showThemeConfigBtn: boolean;
      };
      sidebar: {
        collapsed: boolean;
        width: number;
        collapsedWidth: number;
      };
      tab: {
        visible: boolean;
        height: number;
        showIcon: boolean;
        style: 'google' | 'button' | 'smooth';
      };
      footer: {
        visible: boolean;
        height: number;
      };
    };

    general: {
      showTransitionAnimation: boolean;
      tableSize: 'small' | 'default' | 'large';
      scrollMode: 'outer' | 'inner';
      contextMenuStyle: 'default' | 'flat' | 'win10' | 'mac';
      popBoxStyle: 'element-plus' | 'sweetalert2' | 'bootstrap-5' | 'bootstrap-4' | 'material-ui' | 'bulma';
    };
  }
}
