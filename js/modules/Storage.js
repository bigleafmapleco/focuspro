// Storage Module 
import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * Storage class for managing Focus Pro's local storage
 * Handles settings, task history, and statistics with error handling
 */
export class Storage {
  /**
   * Initialize storage with localStorage availability check and default values
   */
  constructor() {
    this.isAvailable = this.#checkLocalStorageAvailability();
    
    if (this.isAvailable) {
      this.#initializeStorage();
    }
  }

  /**
   * Check if localStorage is available in the current environment
   * @returns {boolean} True if localStorage is available
   */
  #checkLocalStorageAvailability() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }

  /**
   * Initialize storage with default values if empty
   */
  #initializeStorage() {
    try {
      // Initialize settings if not exists
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        const defaultSettings = {
          workDuration: 25,
          breakDuration: 5,
          soundEnabled: true,
          darkMode: false
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      }

      // Initialize task history if not exists
      if (!localStorage.getItem(STORAGE_KEYS.TASK_HISTORY)) {
        localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify([]));
      }

      // Initialize statistics if not exists
      if (!localStorage.getItem(STORAGE_KEYS.STATISTICS)) {
        const defaultStats = {
          sessions: 0,
          totalMinutes: 0,
          tasks: 0,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  // ===== SETTINGS METHODS =====

  /**
   * Save user settings to localStorage
   * @param {Object} settings - Settings object to save
   * @returns {boolean} Success status
   */
  saveSettings(settings) {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Get user settings or return defaults
   * @returns {Object} Settings object
   */
  getSettings() {
    if (!this.isAvailable) {
      return {
        workDuration: 25,
        breakDuration: 5,
        soundEnabled: true,
        darkMode: false
      };
    }

    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return this.#safeJsonParse(settings, {
        workDuration: 25,
        breakDuration: 5,
        soundEnabled: true,
        darkMode: false
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        workDuration: 25,
        breakDuration: 5,
        soundEnabled: true,
        darkMode: false
      };
    }
  }

  /**
   * Update a single setting
   * @param {string} key - Setting key to update
   * @param {*} value - New value for the setting
   * @returns {boolean} Success status
   */
  updateSetting(key, value) {
    if (!this.isAvailable) return false;

    try {
      const settings = this.getSettings();
      settings[key] = value;
      return this.saveSettings(settings);
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  }

  // ===== HISTORY METHODS =====

  /**
   * Save a completed task to history
   * @param {Object} task - Task object with name, duration, and optional notes
   * @returns {boolean} Success status
   */
  saveTask(task) {
    if (!this.isAvailable) return false;

    try {
      const taskHistory = this.getAllTasks();
      const taskWithTimestamp = {
        ...task,
        timestamp: new Date().toISOString(),
        date: this.#getDateKey()
      };
      
      taskHistory.push(taskWithTimestamp);
      localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(taskHistory));
      return true;
    } catch (error) {
      console.error('Error saving task:', error);
      return false;
    }
  }

  /**
   * Get tasks completed today only
   * @returns {Array} Array of today's tasks
   */
  getTodaysTasks() {
    if (!this.isAvailable) return [];

    try {
      const allTasks = this.getAllTasks();
      const today = this.#getDateKey();
      return allTasks.filter(task => task.date === today);
    } catch (error) {
      console.error('Error getting today\'s tasks:', error);
      return [];
    }
  }

  /**
   * Get all historical tasks
   * @returns {Array} Array of all tasks
   */
  getAllTasks() {
    if (!this.isAvailable) return [];

    try {
      const tasks = localStorage.getItem(STORAGE_KEYS.TASK_HISTORY);
      return this.#safeJsonParse(tasks, []);
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  }

  /**
   * Clear all task history
   * @returns {boolean} Success status
   */
  clearHistory() {
    if (!this.isAvailable) return false;

    try {
      localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify([]));
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }

  /**
   * Get tasks within a date range
   * @param {Date} startDate - Start date for range
   * @param {Date} endDate - End date for range
   * @returns {Array} Array of tasks within the date range
   */
  getTasksByDateRange(startDate, endDate) {
    if (!this.isAvailable) return [];

    try {
      const allTasks = this.getAllTasks();
      const startKey = this.#formatDateKey(startDate);
      const endKey = this.#formatDateKey(endDate);

      return allTasks.filter(task => {
        const taskDate = task.date;
        return taskDate >= startKey && taskDate <= endKey;
      });
    } catch (error) {
      console.error('Error getting tasks by date range:', error);
      return [];
    }
  }

  // ===== STATISTICS METHODS =====

  /**
   * Increment daily session count
   * @returns {boolean} Success status
   */
  incrementSessionCount() {
    if (!this.isAvailable) return false;

    try {
      const stats = this.getTodaysStats();
      stats.sessions += 1;
      stats.lastUpdated = new Date().toISOString();
      
      const allStats = this.#getAllStats();
      const todayKey = this.#getDateKey();
      allStats[todayKey] = stats;
      
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(allStats));
      return true;
    } catch (error) {
      console.error('Error incrementing session count:', error);
      return false;
    }
  }

  /**
   * Get today's statistics
   * @returns {Object} Today's stats object
   */
  getTodaysStats() {
    if (!this.isAvailable) {
      return {
        sessions: 0,
        totalMinutes: 0,
        tasks: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const allStats = this.#getAllStats();
      const todayKey = this.#getDateKey();
      
      if (!allStats[todayKey]) {
        allStats[todayKey] = {
          sessions: 0,
          totalMinutes: 0,
          tasks: 0,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return allStats[todayKey];
    } catch (error) {
      console.error('Error getting today\'s stats:', error);
      return {
        sessions: 0,
        totalMinutes: 0,
        tasks: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get weekly statistics (last 7 days)
   * @returns {Object} Weekly stats object
   */
  getWeeklyStats() {
    if (!this.isAvailable) return {};

    try {
      const allStats = this.#getAllStats();
      const weeklyStats = {};
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = this.#formatDateKey(date);
        
        weeklyStats[dateKey] = allStats[dateKey] || {
          sessions: 0,
          totalMinutes: 0,
          tasks: 0,
          lastUpdated: date.toISOString()
        };
      }
      
      return weeklyStats;
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return {};
    }
  }

  /**
   * Reset today's statistics
   * @returns {boolean} Success status
   */
  resetDailyStats() {
    if (!this.isAvailable) return false;

    try {
      const allStats = this.#getAllStats();
      const todayKey = this.#getDateKey();
      
      allStats[todayKey] = {
        sessions: 0,
        totalMinutes: 0,
        tasks: 0,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(allStats));
      return true;
    } catch (error) {
      console.error('Error resetting daily stats:', error);
      return false;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Check if a timestamp is from today
   * @param {string} timestamp - ISO timestamp string
   * @returns {boolean} True if timestamp is from today
   */
  #isToday(timestamp) {
    try {
      const taskDate = new Date(timestamp);
      const today = new Date();
      return this.#formatDateKey(taskDate) === this.#formatDateKey(today);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   * @returns {string} Date string in YYYY-MM-DD format
   */
  #getDateKey() {
    return this.#formatDateKey(new Date());
  }

  /**
   * Format a date to YYYY-MM-DD format
   * @param {Date} date - Date to format
   * @returns {string} Date string in YYYY-MM-DD format
   */
  #formatDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Safely parse JSON with fallback
   * @param {string} data - JSON string to parse
   * @param {*} fallback - Fallback value if parsing fails
   * @returns {*} Parsed data or fallback
   */
  #safeJsonParse(data, fallback) {
    try {
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return fallback;
    }
  }

  /**
   * Get all statistics from localStorage
   * @returns {Object} All statistics object
   */
  #getAllStats() {
    try {
      const stats = localStorage.getItem(STORAGE_KEYS.STATISTICS);
      return this.#safeJsonParse(stats, {});
    } catch (error) {
      console.error('Error getting all stats:', error);
      return {};
    }
  }
} 