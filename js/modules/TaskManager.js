// Task Manager Module 
import { Storage } from './Storage.js';

/**
 * TaskManager class for handling task logic in Focus Pro
 * Manages current tasks, completed tasks, and provides analytics
 */
export class TaskManager {
  /**
   * Creates a new TaskManager instance
   * @param {Storage} storage - Storage instance for persistence
   */
  constructor(storage) {
    if (!storage || !(storage instanceof Storage)) {
      throw new Error('TaskManager requires a valid Storage instance');
    }
    
    this.storage = storage;
    this.currentTask = null;
    this.completedTasks = [];
    
    // Load existing data from storage
    this.syncWithStorage();
  }

  /**
   * Sets the current active task
   * @param {string} taskName - Name of the task to set as current
   * @returns {boolean} True if task was set successfully
   * @throws {Error} If task name is invalid
   */
  setCurrentTask(taskName) {
    if (!this.#validateTaskName(taskName)) {
      throw new Error('Task name must be a non-empty string');
    }

    this.currentTask = {
      name: taskName.trim(),
      startedAt: new Date(),
      id: this.#generateTaskId()
    };

    return true;
  }

  /**
   * Gets the current active task
   * @returns {Object|null} Current task object or null if no active task
   */
  getCurrentTask() {
    return this.currentTask;
  }

  /**
   * Completes the current task with duration tracking
   * @param {number} duration - Duration in minutes
   * @returns {Object} Completed task object
   * @throws {Error} If no current task or invalid duration
   */
  completeCurrentTask(duration) {
    if (!this.currentTask) {
      throw new Error('No active task to complete');
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      throw new Error('Duration must be a positive number');
    }

    const completedTask = this.completeTask(this.currentTask.name, duration);
    this.clearCurrentTask();
    
    return completedTask;
  }

  /**
   * Clears the current active task
   * @returns {boolean} True if task was cleared successfully
   */
  clearCurrentTask() {
    this.currentTask = null;
    return true;
  }

  /**
   * Completes a task and saves it to storage
   * @param {string} taskName - Name of the completed task
   * @param {number} duration - Duration in minutes
   * @returns {Object} Completed task object
   * @throws {Error} If task name or duration is invalid
   */
  completeTask(taskName, duration) {
    if (!this.#validateTaskName(taskName)) {
      throw new Error('Task name must be a non-empty string');
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      throw new Error('Duration must be a positive number');
    }

    const taskNameTrimmed = taskName.trim();
    const sessionCount = this.#calculateSessionsForTask(taskNameTrimmed);

    const completedTask = {
      id: this.#generateTaskId(),
      name: taskNameTrimmed,
      duration: duration,
      completedAt: new Date(),
      sessionCount: sessionCount + 1
    };

    this.completedTasks.push(completedTask);
    this.#saveToStorage();

    return completedTask;
  }

  /**
   * Calculates productivity score based on completed sessions
   * @returns {number} Productivity score (0-100)
   */
  getProductivityScore() {
    if (this.completedTasks.length === 0) {
      return 0;
    }

    const today = new Date().toDateString();
    const todayTasks = this.completedTasks.filter(task => 
      new Date(task.completedAt).toDateString() === today
    );

    if (todayTasks.length === 0) {
      return 0;
    }

    const totalDuration = todayTasks.reduce((sum, task) => sum + task.duration, 0);
    const averageDuration = totalDuration / todayTasks.length;
    
    // Score based on number of tasks and average duration
    const taskScore = Math.min(todayTasks.length * 10, 50);
    const durationScore = Math.min(averageDuration * 2, 50);
    
    return Math.round(taskScore + durationScore);
  }

  /**
   * Gets the most productive tasks by time spent
   * @param {number} limit - Maximum number of tasks to return (default: 5)
   * @returns {Array} Array of task objects with total duration
   */
  getMostProductiveTasks(limit = 5) {
    if (!limit || typeof limit !== 'number' || limit <= 0) {
      throw new Error('Limit must be a positive number');
    }

    const taskStats = {};
    
    this.completedTasks.forEach(task => {
      if (!taskStats[task.name]) {
        taskStats[task.name] = {
          name: task.name,
          totalDuration: 0,
          sessionCount: 0
        };
      }
      taskStats[task.name].totalDuration += task.duration;
      taskStats[task.name].sessionCount += 1;
    });

    return Object.values(taskStats)
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, limit);
  }

  /**
   * Gets statistics for a specific task
   * @param {string} taskName - Name of the task to get stats for
   * @returns {Object} Task statistics object
   * @throws {Error} If task name is invalid
   */
  getTaskStats(taskName) {
    if (!this.#validateTaskName(taskName)) {
      throw new Error('Task name must be a non-empty string');
    }

    const taskNameTrimmed = taskName.trim();
    const taskTasks = this.completedTasks.filter(task => 
      task.name === taskNameTrimmed
    );

    if (taskTasks.length === 0) {
      return {
        name: taskNameTrimmed,
        totalDuration: 0,
        sessionCount: 0,
        averageDuration: 0,
        lastCompleted: null
      };
    }

    const totalDuration = taskTasks.reduce((sum, task) => sum + task.duration, 0);
    const averageDuration = totalDuration / taskTasks.length;
    const lastCompleted = new Date(Math.max(...taskTasks.map(task => task.completedAt)));

    return {
      name: taskNameTrimmed,
      totalDuration: totalDuration,
      sessionCount: taskTasks.length,
      averageDuration: Math.round(averageDuration * 100) / 100,
      lastCompleted: lastCompleted
    };
  }

  /**
   * Gets current working streak information
   * @returns {Object} Streak information object
   */
  getStreakInfo() {
    if (this.completedTasks.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const today = new Date();
    const dates = [...new Set(this.completedTasks.map(task => 
      new Date(task.completedAt).toDateString()
    ))].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastActiveDate = null;

    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const nextDate = i < dates.length - 1 ? new Date(dates[i + 1]) : null;
      
      if (nextDate) {
        const dayDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 0;
        }
      } else {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }

    // Calculate current streak
    const lastDate = new Date(dates[dates.length - 1]);
    const daysSinceLastActive = (today - lastDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActive <= 1) {
      currentStreak = tempStreak;
    }

    lastActiveDate = lastDate;

    return {
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      lastActiveDate: lastActiveDate
    };
  }

  /**
   * Syncs with storage to load today's tasks
   * @returns {boolean} True if sync was successful
   */
  syncWithStorage() {
    try {
      const storedTasks = this.storage.getTodayTasks();
      if (storedTasks && Array.isArray(storedTasks)) {
        this.completedTasks = storedTasks.map(task => ({
          ...task,
          completedAt: new Date(task.completedAt)
        }));
      }
      return true;
    } catch (error) {
      console.error('Failed to sync with storage:', error);
      return false;
    }
  }

  /**
   * Generates a unique task ID using timestamp
   * @private
   * @returns {string} Unique task ID
   */
  #generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validates task name
   * @private
   * @param {string} name - Task name to validate
   * @returns {boolean} True if valid, false otherwise
   */
  #validateTaskName(name) {
    return name && typeof name === 'string' && name.trim().length > 0;
  }

  /**
   * Calculates session count for a specific task
   * @private
   * @param {string} taskName - Name of the task
   * @returns {number} Number of completed sessions for the task
   */
  #calculateSessionsForTask(taskName) {
    return this.completedTasks.filter(task => task.name === taskName).length;
  }

  /**
   * Saves completed tasks to storage
   * @private
   * @returns {boolean} True if save was successful
   */
  #saveToStorage() {
    try {
      this.storage.saveTodayTasks(this.completedTasks);
      return true;
    } catch (error) {
      console.error('Failed to save tasks to storage:', error);
      return false;
    }
  }
} 