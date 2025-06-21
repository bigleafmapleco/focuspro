// FocusPro Main Application
// Main orchestrator that connects all modules and manages application state

import { Timer } from './modules/Timer.js';
import { UI } from './modules/UI.js';
import { Storage } from './modules/Storage.js';
import { TaskManager } from './modules/TaskManager.js';
import { Audio } from './modules/Audio.js';
import { CONSTANTS } from './utils/constants.js';

class App {
    constructor() {
        // Initialize all module instances
        this.timer = new Timer();
        this.ui = new UI();
        this.storage = new Storage();
        this.taskManager = new TaskManager();
        this.audio = new Audio();
        
        // Application state
        this.currentTask = null;
        this.isBreakMode = false;
        this.sessionCount = 0;
        this.settings = { ...CONSTANTS.DEFAULT_SETTINGS };
        
        // Bind methods to preserve context
        this.handleStart = this.handleStart.bind(this);
        this.handlePause = this.handlePause.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
        this.handleSettingsChange = this.handleSettingsChange.bind(this);
        this.completeSession = this.completeSession.bind(this);
        this.startBreak = this.startBreak.bind(this);
        
        // Bind timer callbacks
        this.onTimerTick = this.onTimerTick.bind(this);
        this.onTimerComplete = this.onTimerComplete.bind(this);
        this.onTimerStateChange = this.onTimerStateChange.bind(this);
        
        console.log('FocusPro App initialized');
    }
    
    /**
     * Initialize the application when DOM is loaded
     */
    async init() {
        try {
            console.log('Initializing FocusPro...');
            
            // Load saved settings and user preferences
            await this.loadUserPreferences();
            
            // Initialize UI with saved stats
            await this.updateStats();
            
            // Set up timer event listeners
            this.timer.onTick(this.onTimerTick);
            this.timer.onComplete(this.onTimerComplete);
            this.timer.onStateChange(this.onTimerStateChange);
            
            // Bind UI event handlers
            this.ui.bindEvents({
                start: this.handleStart,
                pause: this.handlePause,
                reset: this.handleReset,
                taskSubmit: this.handleTaskSubmit,
                settingsChange: this.handleSettingsChange
            });
            
            // Register service worker for offline support
            await this.registerServiceWorker();
            
            // Update UI with current settings
            this.ui.updateSettings(this.settings);
            
            console.log('FocusPro initialization complete');
            
        } catch (error) {
            console.error('Failed to initialize FocusPro:', error);
            this.handleError('Failed to initialize application', error);
        }
    }
    
    /**
     * Timer tick callback - updates display and progress
     */
    onTimerTick(timeLeft, progress) {
        this.ui.updateTimer(timeLeft);
        this.ui.updateProgress(progress);
    }
    
    /**
     * Timer completion callback - handles session end
     */
    async onTimerComplete() {
        try {
            console.log('Timer completed');
            
            // Play completion sound
            await this.audio.playSound('complete');
            
            // Save completed task if exists
            if (this.currentTask) {
                await this.taskManager.completeTask(this.currentTask);
                this.currentTask = null;
            }
            
            // Show completion notification
            this.ui.showNotification('Session completed!', 'success');
            
            // Handle session completion
            if (this.isBreakMode) {
                this.completeSession();
            } else {
                this.startBreak();
            }
            
        } catch (error) {
            console.error('Error handling timer completion:', error);
            this.handleError('Failed to complete session', error);
        }
    }
    
    /**
     * Timer state change callback - updates button states
     */
    onTimerStateChange(state) {
        this.ui.updateButtonStates(state);
        console.log('Timer state changed:', state);
    }
    
    /**
     * Start timer with current task
     */
    async handleStart() {
        try {
            if (!this.currentTask && !this.isBreakMode) {
                this.ui.showNotification('Please enter a task first', 'warning');
                return;
            }
            
            const duration = this.isBreakMode ? 
                this.settings.breakDuration : 
                this.settings.workDuration;
            
            await this.timer.start(duration);
            console.log('Timer started:', { duration, isBreak: this.isBreakMode });
            
        } catch (error) {
            console.error('Error starting timer:', error);
            this.handleError('Failed to start timer', error);
        }
    }
    
    /**
     * Pause timer
     */
    async handlePause() {
        try {
            await this.timer.pause();
            console.log('Timer paused');
        } catch (error) {
            console.error('Error pausing timer:', error);
            this.handleError('Failed to pause timer', error);
        }
    }
    
    /**
     * Reset timer and clear current task
     */
    async handleReset() {
        try {
            await this.timer.reset();
            this.currentTask = null;
            this.isBreakMode = false;
            this.ui.clearTask();
            this.ui.updateTimer(CONSTANTS.DEFAULT_SETTINGS.workDuration);
            console.log('Timer reset');
        } catch (error) {
            console.error('Error resetting timer:', error);
            this.handleError('Failed to reset timer', error);
        }
    }
    
    /**
     * Handle task submission from UI
     */
    async handleTaskSubmit(e) {
        try {
            e.preventDefault();
            const taskText = e.target.taskInput.value.trim();
            
            if (!taskText) {
                this.ui.showNotification('Please enter a task description', 'warning');
                return;
            }
            
            // Create new task
            this.currentTask = await this.taskManager.createTask(taskText);
            this.isBreakMode = false;
            
            // Update UI
            this.ui.setCurrentTask(this.currentTask);
            this.ui.clearTaskInput();
            
            console.log('Task set:', this.currentTask);
            
        } catch (error) {
            console.error('Error setting task:', error);
            this.handleError('Failed to set task', error);
        }
    }
    
    /**
     * Handle settings changes from UI
     */
    async handleSettingsChange(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            await this.storage.saveSettings(this.settings);
            
            // Update timer durations if timer is not running
            if (this.timer.getState() === 'idle') {
                const duration = this.isBreakMode ? 
                    this.settings.breakDuration : 
                    this.settings.workDuration;
                this.ui.updateTimer(duration);
            }
            
            console.log('Settings updated:', this.settings);
            
        } catch (error) {
            console.error('Error updating settings:', error);
            this.handleError('Failed to update settings', error);
        }
    }
    
    /**
     * Complete work session and switch to break
     */
    async completeSession() {
        try {
            this.sessionCount++;
            await this.storage.incrementSessions();
            
            // Update statistics
            await this.updateStats();
            
            // Show session completion message
            this.ui.showNotification(`Session ${this.sessionCount} completed!`, 'success');
            
            console.log('Session completed, count:', this.sessionCount);
            
        } catch (error) {
            console.error('Error completing session:', error);
            this.handleError('Failed to complete session', error);
        }
    }
    
    /**
     * Start break timer
     */
    async startBreak() {
        try {
            this.isBreakMode = true;
            this.ui.updateMode('break');
            this.ui.updateTimer(this.settings.breakDuration);
            this.ui.showNotification('Break time!', 'info');
            
            console.log('Break started');
            
        } catch (error) {
            console.error('Error starting break:', error);
            this.handleError('Failed to start break', error);
        }
    }
    
    /**
     * Update UI statistics from storage
     */
    async updateStats() {
        try {
            const stats = await this.storage.getStats();
            this.ui.updateStats(stats);
            console.log('Stats updated:', stats);
        } catch (error) {
            console.error('Error updating stats:', error);
            this.handleError('Failed to update statistics', error);
        }
    }
    
    /**
     * Load user preferences from storage
     */
    async loadUserPreferences() {
        try {
            const savedSettings = await this.storage.getSettings();
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
            
            const savedSessionCount = await this.storage.getSessionCount();
            if (savedSessionCount) {
                this.sessionCount = savedSessionCount;
            }
            
            console.log('User preferences loaded:', { settings: this.settings, sessionCount: this.sessionCount });
            
        } catch (error) {
            console.error('Error loading user preferences:', error);
            this.handleError('Failed to load preferences', error);
        }
    }
    
    /**
     * Register service worker for offline support
     */
    async registerServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service worker registered:', registration);
            }
        } catch (error) {
            console.warn('Service worker registration failed:', error);
        }
    }
    
    /**
     * Global error handler for graceful failures
     */
    handleError(message, error) {
        console.error(message, error);
        this.ui.showNotification(message, 'error');
    }
}

// Global error boundary
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Show user-friendly error message
    const app = window.focusProApp;
    if (app) {
        app.handleError('An unexpected error occurred', event.error);
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.focusProApp = new App();
        await window.focusProApp.init();
    } catch (error) {
        console.error('Failed to start FocusPro:', error);
        // Show critical error message
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <h2>FocusPro Failed to Load</h2>
                <p>Please refresh the page or check your browser console for details.</p>
            </div>
        `;
    }
}); 