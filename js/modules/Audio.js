// Audio Module 
import { AUDIO_PATHS } from '../utils/constants.js';

/**
 * Audio class for Focus Pro's sound notifications
 * Handles sound playback, volume control, and fallback mechanisms
 */
export class Audio {
  #audioElements = new Map();
  #volume = 0.5;
  #isMuted = false;
  #isEnabled = true;
  #audioContext = null;
  #gainNode = null;

  /**
   * Creates a new Audio instance
   * @param {Object} options - Configuration options
   * @param {number} options.volume - Initial volume level (0-1)
   * @param {boolean} options.enabled - Whether audio is enabled by default
   */
  constructor(options = {}) {
    this.#volume = options.volume ?? 0.5;
    this.#isEnabled = options.enabled ?? true;
    
    // Load mute preference from localStorage
    this.#isMuted = localStorage.getItem('focusPro_audioMuted') === 'true';
    
    this.#initializeAudio();
    this.#preloadAll();
  }

  /**
   * Initialize audio system and check for support
   * @private
   */
  #initializeAudio() {
    try {
      // Check if audio is supported
      if (!window.Audio || !window.AudioContext) {
        console.warn('Audio not supported in this browser');
        this.#isEnabled = false;
        return;
      }

      // Initialize Web Audio API as fallback
      this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.#gainNode = this.#audioContext.createGain();
      this.#gainNode.connect(this.#audioContext.destination);
      this.#gainNode.gain.value = this.#volume;

    } catch (error) {
      console.error('Failed to initialize audio:', error);
      this.#isEnabled = false;
    }
  }

  /**
   * Create and configure an audio element
   * @param {string} path - Path to the audio file
   * @returns {HTMLAudioElement|null} Configured audio element or null if failed
   * @private
   */
  #createAudioElement(path) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = this.#volume;
      
      // Add error handling
      audio.addEventListener('error', (error) => this.#handleAudioError(error));
      
      return audio;
    } catch (error) {
      console.error(`Failed to create audio element for ${path}:`, error);
      return null;
    }
  }

  /**
   * Handle audio playback errors gracefully
   * @param {Event} error - Audio error event
   * @private
   */
  #handleAudioError(error) {
    console.warn('Audio playback error:', error);
    // Could implement retry logic or fallback here
  }

  /**
   * Play audio with error handling and fallback
   * @param {HTMLAudioElement} audioElement - Audio element to play
   * @private
   */
  #playSound(audioElement) {
    if (!this.#isEnabled || this.#isMuted) {
      return;
    }

    try {
      // Try to play the audio element
      if (audioElement && audioElement.play) {
        audioElement.currentTime = 0;
        audioElement.volume = this.#volume;
        audioElement.play().catch((error) => {
          console.warn('Audio element playback failed, trying fallback:', error);
          this.#playFallbackSound();
        });
      } else {
        this.#playFallbackSound();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      this.#playFallbackSound();
    }
  }

  /**
   * Generate a simple beep sound using Web Audio API
   * @private
   */
  #playFallbackSound() {
    try {
      if (!this.#audioContext || !this.#gainNode) {
        return;
      }

      const oscillator = this.#audioContext.createOscillator();
      oscillator.connect(this.#gainNode);
      oscillator.frequency.setValueAtTime(800, this.#audioContext.currentTime);
      oscillator.type = 'sine';
      
      oscillator.start(this.#audioContext.currentTime);
      oscillator.stop(this.#audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Fallback sound generation failed:', error);
    }
  }

  /**
   * Preload all audio files
   * @private
   */
  #preloadAll() {
    try {
      Object.entries(AUDIO_PATHS).forEach(([key, path]) => {
        const audioElement = this.#createAudioElement(path);
        if (audioElement) {
          this.#audioElements.set(key, audioElement);
        }
      });
    } catch (error) {
      console.error('Failed to preload audio files:', error);
    }
  }

  /**
   * Play work session complete sound
   */
  playWorkComplete() {
    try {
      const audio = this.#audioElements.get('workComplete');
      this.#playSound(audio);
    } catch (error) {
      console.error('Failed to play work complete sound:', error);
      this.#playFallbackSound();
    }
  }

  /**
   * Play break complete sound
   */
  playBreakComplete() {
    try {
      const audio = this.#audioElements.get('breakComplete');
      this.#playSound(audio);
    } catch (error) {
      console.error('Failed to play break complete sound:', error);
      this.#playFallbackSound();
    }
  }

  /**
   * Play button click sound
   */
  playButtonClick() {
    try {
      const audio = this.#audioElements.get('buttonClick');
      this.#playSound(audio);
    } catch (error) {
      console.error('Failed to play button click sound:', error);
      this.#playFallbackSound();
    }
  }

  /**
   * Play warning sound (1 minute remaining)
   */
  playWarning() {
    try {
      const audio = this.#audioElements.get('warning');
      this.#playSound(audio);
    } catch (error) {
      console.error('Failed to play warning sound:', error);
      this.#playFallbackSound();
    }
  }

  /**
   * Set volume for all sounds
   * @param {number} level - Volume level (0-1)
   */
  setVolume(level) {
    try {
      const clampedLevel = Math.max(0, Math.min(1, level));
      this.#volume = clampedLevel;

      // Update all audio elements
      this.#audioElements.forEach(audio => {
        if (audio) {
          audio.volume = clampedLevel;
        }
      });

      // Update Web Audio API gain
      if (this.#gainNode) {
        this.#gainNode.gain.value = clampedLevel;
      }
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }

  /**
   * Toggle mute state
   * @returns {boolean} Current mute state
   */
  toggleMute() {
    try {
      this.#isMuted = !this.#isMuted;
      localStorage.setItem('focusPro_audioMuted', this.#isMuted.toString());
      return this.#isMuted;
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      return this.#isMuted;
    }
  }

  /**
   * Check if audio is enabled
   * @returns {boolean} Whether audio is enabled
   */
  isEnabled() {
    return this.#isEnabled && !this.#isMuted;
  }

  /**
   * Get current volume level
   * @returns {number} Current volume (0-1)
   */
  getVolume() {
    return this.#volume;
  }

  /**
   * Get current mute state
   * @returns {boolean} Whether audio is muted
   */
  isMuted() {
    return this.#isMuted;
  }

  /**
   * Preload all audio files (public method for manual preloading)
   */
  preloadAll() {
    this.#preloadAll();
  }

  /**
   * Clean up audio resources
   */
  destroy() {
    try {
      // Stop and clean up audio elements
      this.#audioElements.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      this.#audioElements.clear();

      // Close Web Audio API context
      if (this.#audioContext) {
        this.#audioContext.close();
      }
    } catch (error) {
      console.error('Failed to destroy audio resources:', error);
    }
  }
} 