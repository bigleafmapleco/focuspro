// UI Module 
import { SELECTORS } from '../utils/constants.js';

export class UI {
    constructor() {
        this.cacheElements();
    }

    /**
     * Cache all DOM elements using SELECTORS constants
     */
    cacheElements() {
        try {
            // Timer elements
            this.timerDisplay = document.querySelector(SELECTORS.TIMER_DISPLAY);
            this.startBtn = document.querySelector(SELECTORS.START_BTN);
            this.pauseBtn = document.querySelector(SELECTORS.PAUSE_BTN);
            this.resetBtn = document.querySelector(SELECTORS.RESET_BTN);
            
            // Task elements
            this.taskInput = document.querySelector(SELECTORS.TASK_INPUT);
            this.taskForm = document.querySelector(SELECTORS.TASK_FORM);
            this.historyContainer = document.querySelector(SELECTORS.HISTORY_CONTAINER);
            
            // Stats elements
            this.sessionsCompleted = document.querySelector(SELECTORS.SESSIONS_COMPLETED);
            this.totalTime = document.querySelector(SELECTORS.TOTAL_TIME);
            
            // Validate critical elements exist
            if (!this.timerDisplay || !this.startBtn || !this.pauseBtn || !this.resetBtn) {
                throw new Error('Critical timer elements not found');
            }
        } catch (error) {
            console.error('Failed to cache DOM elements:', error);
            throw error;
        }
    }

    /**
     * Timer UI Methods
     */
    
    /**
     * Update timer display with formatted time
     * @param {number} minutes - Minutes to display
     * @param {number} seconds - Seconds to display
     */
    updateTimerDisplay(minutes, seconds) {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = this.#formatTime(minutes, seconds);
        }
    }

    /**
     * Update circular progress indicator
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgress(percentage) {
        if (this.timerDisplay) {
            const clampedPercentage = Math.max(0, Math.min(100, percentage));
            this.timerDisplay.style.background = `conic-gradient(
                #4CAF50 ${clampedPercentage * 3.6}deg, 
                #e0e0e0 ${clampedPercentage * 3.6}deg 360deg
            )`;
        }
    }

    /**
     * Update button states based on timer state
     * @param {string} state - Timer state ('idle', 'running', 'paused')
     */
    updateButtons(state) {
        const states = {
            idle: { start: true, pause: false, reset: false },
            running: { start: false, pause: true, reset: true },
            paused: { start: true, pause: false, reset: true }
        };

        const buttonState = states[state] || states.idle;
        
        if (this.startBtn) this.startBtn.disabled = !buttonState.start;
        if (this.pauseBtn) this.pauseBtn.disabled = !buttonState.pause;
        if (this.resetBtn) this.resetBtn.disabled = !buttonState.reset;
    }

    /**
     * Animate timer completion with visual feedback
     */
    animateTimerComplete() {
        if (this.timerDisplay) {
            this.timerDisplay.classList.add('timer-complete');
            this.timerDisplay.style.animation = 'pulse 0.5s ease-in-out';
            
            setTimeout(() => {
                this.timerDisplay.classList.remove('timer-complete');
                this.timerDisplay.style.animation = '';
            }, 500);
        }
    }

    /**
     * Task UI Methods
     */
    
    /**
     * Get current task input value
     * @returns {string} Current task text
     */
    getTaskInput() {
        return this.taskInput ? this.taskInput.value.trim() : '';
    }

    /**
     * Clear task input field
     */
    clearTaskInput() {
        if (this.taskInput) {
            this.taskInput.value = '';
            this.taskInput.focus();
        }
    }

    /**
     * Add completed task to history
     * @param {string} task - Task description
     * @param {number} duration - Duration in minutes
     */
    addTaskToHistory(task, duration) {
        if (!this.historyContainer) return;

        const taskCard = this.#createElement('div', 'task-card', '');
        const taskContent = this.#createElement('div', 'task-content', '');
        const taskText = this.#createElement('p', 'task-text', task);
        const taskDuration = this.#createElement('span', 'task-duration', `${duration}min`);
        const taskTime = this.#createElement('span', 'task-time', new Date().toLocaleTimeString());

        taskContent.appendChild(taskText);
        taskContent.appendChild(taskDuration);
        taskCard.appendChild(taskContent);
        taskCard.appendChild(taskTime);

        // Add animation class
        taskCard.classList.add('task-card-enter');
        
        this.historyContainer.insertBefore(taskCard, this.historyContainer.firstChild);

        // Remove animation class after animation completes
        setTimeout(() => {
            taskCard.classList.remove('task-card-enter');
        }, 300);
    }

    /**
     * Toggle history section visibility
     */
    toggleHistory() {
        if (this.historyContainer) {
            this.historyContainer.classList.toggle('hidden');
        }
    }

    /**
     * Stats UI Methods
     */
    
    /**
     * Update completed sessions count
     * @param {number} count - Number of completed sessions
     */
    updateSessionCount(count) {
        if (this.sessionsCompleted) {
            this.sessionsCompleted.textContent = count.toString();
        }
    }

    /**
     * Update total focus time display
     * @param {number} minutes - Total minutes of focus time
     */
    updateTotalTime(minutes) {
        if (this.totalTime) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            if (hours > 0) {
                this.totalTime.textContent = `${hours}h ${remainingMinutes}m`;
            } else {
                this.totalTime.textContent = `${remainingMinutes}m`;
            }
        }
    }

    /**
     * Helper Methods
     */
    
    /**
     * Format time as MM:SS string
     * @param {number} minutes - Minutes
     * @param {number} seconds - Seconds
     * @returns {string} Formatted time string
     */
    #formatTime(minutes, seconds) {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(minutes)}:${pad(seconds)}`;
    }

    /**
     * Create DOM element with utility
     * @param {string} tag - HTML tag name
     * @param {string} className - CSS class name
     * @param {string} content - Text content
     * @returns {HTMLElement} Created element
     */
    #createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    /**
     * Show temporary notification
     * @param {string} message - Notification message
     * @param {number} duration - Display duration in ms (default: 3000)
     */
    showNotification(message, duration = 3000) {
        const notification = this.#createElement('div', 'notification', message);
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Event binding method
     * @param {Object} handlers - Event handler functions
     * @param {Function} handlers.onStart - Start button handler
     * @param {Function} handlers.onPause - Pause button handler
     * @param {Function} handlers.onReset - Reset button handler
     * @param {Function} handlers.onTaskSubmit - Task form submit handler
     */
    bindEvents(handlers) {
        // Use arrow functions to preserve 'this' context
        if (this.startBtn && handlers.onStart) {
            this.startBtn.addEventListener('click', (e) => handlers.onStart(e));
        }

        if (this.pauseBtn && handlers.onPause) {
            this.pauseBtn.addEventListener('click', (e) => handlers.onPause(e));
        }

        if (this.resetBtn && handlers.onReset) {
            this.resetBtn.addEventListener('click', (e) => handlers.onReset(e));
        }

        if (this.taskForm && handlers.onTaskSubmit) {
            this.taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handlers.onTaskSubmit(e);
            });
        }
    }
} 