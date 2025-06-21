/**
 * Focus Pro Timer Constants
 * 
 * This module contains all constants used throughout the Focus Pro timer application.
 * All objects are frozen to prevent accidental modifications during runtime.
 */

/**
 * Timer durations in seconds
 * @readonly
 * @enum {number}
 */
export const TIMER_DURATIONS = Object.freeze({
  /** Work session duration: 25 minutes */
  WORK_DURATION: 25 * 60,
  /** Short break duration: 5 minutes */
  SHORT_BREAK: 5 * 60,
  /** Long break duration: 15 minutes */
  LONG_BREAK: 15 * 60,
  /** Number of work sessions before a long break */
  SESSIONS_BEFORE_LONG_BREAK: 4
});

/**
 * Timer states enumeration
 * @readonly
 * @enum {string}
 */
export const TIMER_STATES = Object.freeze({
  /** Timer is not running and ready to start */
  IDLE: 'idle',
  /** Timer is currently running */
  RUNNING: 'running',
  /** Timer is paused and can be resumed */
  PAUSED: 'paused'
});

/**
 * Local storage keys for persisting application data
 * @readonly
 * @enum {string}
 */
export const STORAGE_KEYS = Object.freeze({
  /** User settings and preferences */
  SETTINGS: 'focusPro_settings',
  /** Timer session history */
  HISTORY: 'focusPro_history',
  /** User statistics and analytics */
  STATS: 'focusPro_stats'
});

/**
 * Audio file paths for timer notifications
 * @readonly
 * @enum {string}
 */
export const AUDIO_PATHS = Object.freeze({
  /** Sound played when work session completes */
  WORK_COMPLETE: '/assets/audio/work-complete.mp3',
  /** Sound played when break session completes */
  BREAK_COMPLETE: '/assets/audio/break-complete.mp3'
});

/**
 * DOM selectors using data attributes
 * @readonly
 * @enum {string}
 */
export const SELECTORS = Object.freeze({
  /** Main timer display element */
  TIMER: '[data-timer]',
  /** Start button */
  START_BUTTON: '[data-btn-start]',
  /** Pause button */
  PAUSE_BUTTON: '[data-btn-pause]',
  /** Reset button */
  RESET_BUTTON: '[data-btn-reset]',
  /** Skip button */
  SKIP_BUTTON: '[data-btn-skip]',
  /** Timer mode indicator */
  MODE_INDICATOR: '[data-mode]',
  /** Progress bar element */
  PROGRESS_BAR: '[data-progress]',
  /** Session counter */
  SESSION_COUNTER: '[data-sessions]',
  /** Settings panel */
  SETTINGS_PANEL: '[data-settings]',
  /** Statistics panel */
  STATS_PANEL: '[data-stats]',
  /** History panel */
  HISTORY_PANEL: '[data-history]',
  /** Notification container */
  NOTIFICATION: '[data-notification]',
  /** Audio toggle button */
  AUDIO_TOGGLE: '[data-audio-toggle]',
  /** Theme toggle button */
  THEME_TOGGLE: '[data-theme-toggle]',
  /** Work duration input */
  WORK_DURATION_INPUT: '[data-work-duration]',
  /** Short break duration input */
  SHORT_BREAK_INPUT: '[data-short-break]',
  /** Long break duration input */
  LONG_BREAK_INPUT: '[data-long-break]',
  /** Sessions before long break input */
  SESSIONS_INPUT: '[data-sessions-before-long]'
});

// Export all constants for use in other modules
export {
  TIMER_DURATIONS,
  TIMER_STATES,
  STORAGE_KEYS,
  AUDIO_PATHS,
  SELECTORS
}; 