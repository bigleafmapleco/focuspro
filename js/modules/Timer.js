// Timer Module 
import { TIMER_STATES, WORK_DURATION } from '../utils/constants.js';

/**
 * Timer class for Focus Pro Pomodoro timer
 * Manages countdown functionality with state management and callback support
 */
export class Timer {
  #duration;
  #remainingTime;
  #state;
  #intervalId;
  #callbacks;

  /**
   * Creates a new Timer instance
   * @param {number} duration - Initial duration in seconds (defaults to WORK_DURATION)
   */
  constructor(duration = WORK_DURATION) {
    this.#duration = duration;
    this.#remainingTime = duration;
    this.#state = TIMER_STATES.IDLE;
    this.#intervalId = null;
    this.#callbacks = {
      tick: [],
      complete: [],
      stateChange: []
    };
  }

  /**
   * Starts the timer countdown
   * Sets state to RUNNING and begins the countdown
   */
  start() {
    if (this.#state === TIMER_STATES.RUNNING) return;
    
    this.#setState(TIMER_STATES.RUNNING);
    this.#intervalId = setInterval(() => this.#tick(), 1000);
  }

  /**
   * Pauses the timer countdown
   * Sets state to PAUSED and stops the interval
   */
  pause() {
    if (this.#state !== TIMER_STATES.RUNNING) return;
    
    this.#setState(TIMER_STATES.PAUSED);
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  /**
   * Resets the timer to initial duration
   * Sets state to IDLE and clears any running interval
   */
  reset() {
    this.#remainingTime = this.#duration;
    this.#setState(TIMER_STATES.IDLE);
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  /**
   * Sets a new duration and resets the timer
   * @param {number} seconds - New duration in seconds
   */
  setDuration(seconds) {
    this.#duration = seconds;
    this.reset();
  }

  /**
   * Gets the remaining time in minutes and seconds
   * @returns {Object} Object with minutes and seconds properties
   */
  getRemainingTime() {
    const minutes = Math.floor(this.#remainingTime / 60);
    const seconds = this.#remainingTime % 60;
    return { minutes, seconds };
  }

  /**
   * Gets the progress percentage (0-100)
   * @returns {number} Progress percentage from 0 to 100
   */
  getProgress() {
    if (this.#duration === 0) return 0;
    return ((this.#duration - this.#remainingTime) / this.#duration) * 100;
  }

  /**
   * Gets the current timer state
   * @returns {string} Current timer state
   */
  getState() {
    return this.#state;
  }

  /**
   * Registers a callback for timer events
   * @param {string} event - Event type: 'tick', 'complete', or 'stateChange'
   * @param {Function} callback - Function to call when event occurs
   */
  on(event, callback) {
    if (this.#callbacks[event]) {
      this.#callbacks[event].push(callback);
    }
  }

  /**
   * Private method to handle timer tick
   * Decrements remaining time and calls tick callbacks
   */
  #tick() {
    if (this.#remainingTime <= 0) {
      this.#complete();
      return;
    }

    this.#remainingTime--;
    
    // Call all tick callbacks
    this.#callbacks.tick.forEach(callback => {
      try {
        callback(this.getRemainingTime(), this.getProgress());
      } catch (error) {
        console.error('Error in tick callback:', error);
      }
    });
  }

  /**
   * Private method to handle timer completion
   * Clears interval and calls completion callbacks
   */
  #complete() {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
    
    this.#setState(TIMER_STATES.COMPLETED);
    
    // Call all complete callbacks
    this.#callbacks.complete.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in complete callback:', error);
      }
    });
  }

  /**
   * Private method to update timer state
   * @param {string} newState - New timer state
   */
  #setState(newState) {
    if (this.#state === newState) return;
    
    const oldState = this.#state;
    this.#state = newState;
    
    // Call all state change callbacks
    this.#callbacks.stateChange.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in stateChange callback:', error);
      }
    });
  }
} 