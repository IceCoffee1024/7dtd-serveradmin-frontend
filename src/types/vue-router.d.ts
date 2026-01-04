import 'vue-router';

declare module 'vue-router' {
  // Extend the RouteMeta interface to include custom properties
  interface RouteMeta {
    title?: string | (() => string);
    icon?: Icon;
    requiresAuth?: boolean;
    roles?: string[];
    hidden?: boolean;
    keepAlive?: boolean;
    iframeSrc?: string;
    link?: string;
    // affix?: boolean;
    // badge?: string | number;
    // order?: number;
    // frameSrc?: string;
  }
}
