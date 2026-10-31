export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1] as const;

/** Seconds (motion and GSAP both take seconds). */
export const DUR = {
  micro: 0.16,
  ui: 0.3,
  reveal: 0.6,
  scene: 0.4,
  /** One hero beat: turn → swap → settle. */
  beat: 1.1,
  /** One sheen sweep across a case. */
  sheen: 0.7,
  /** Hero chips' selected indicator and label crossfade. */
  chip: 0.2,
  /** Headline second-line flip. */
  flip: 0.45,
} as const;

/** Milliseconds, for timers. */
export const AUTO_ADVANCE_MS = 6000;
export const IDLE_AFTER_INTERACTION_MS = 8000;
export const IDLE_SWAY_MS = 2000;

export const SPRING_UI = { stiffness: 260, damping: 28 } as const;
export const SPRING_TILT = { stiffness: 400, damping: 30 } as const;

export const GSAP_EASE_OUT = 'expo.out';
export const GSAP_EASE_INOUT = 'power3.inOut';
export const GSAP_EASE_SINE_OUT = 'sine.out';
