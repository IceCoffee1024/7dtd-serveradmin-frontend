import mitt from 'mitt';

const emitter = mitt();

export const EVENT_TYPE = {
  // UI: {
  //   THEME_CHANGE: 'UI:ThemeChange',
  // },
} as const;

export default emitter;
