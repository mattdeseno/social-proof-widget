/**
 * Social Proof Widget - Standalone Version
 * A JavaScript widget that displays recent purchase notifications from Google Sheets
 * Version: 1.0.0
 * 
 * Usage:
 * <script src="https://cdn.jsdelivr.net/gh/yourusername/social-proof-widget@main/hlpt-spw.js"
 *         data-spreadsheet-id="YOUR_SHEET_ID"
 *         data-position="bottom-left"
 *         data-theme="light"></script>
 */

(function() {
    'use strict';

    /**
     * Google Sheets Integration Module
     * Fetches data from a public Google Sheet using the JSON endpoint
     */
    class GoogleSheetsIntegration {
        constructor(spreadsheetId, sheetGid = '0') {
            this.spreadsheetId = spreadsheetId;
            this.sheetGid = sheetGid;
            this.baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&tq&gid=${sheetGid}`;
        }

        /**
         * Fetch data from Google Sheets
         * @returns {Promise<Array>} Array of row objects
         */
        async fetchData() {
            try {
                const response = await fetch(this.baseUrl);
                const text = await response.text();
                
                // Remove JSONP wrapper
                const jsonString = text.substring(47).slice(0, -2);
                const data = JSON.parse(jsonString);
                
                return this.parseSheetData(data);
            } catch (error) {
                console.error('Error fetching Google Sheets data:', error);
                throw error;
            }
        }

        /**
         * Parse the Google Sheets JSON response
         * @param {Object} data - Raw Google Sheets JSON data
         * @returns {Array} Parsed data array
         */
        parseSheetData(data) {
            const table = data.table;
            const columns = table.cols.map(col => col.label || col.id);
            const rows = [];

            table.rows.forEach(row => {
                const rowData = {};
                row.c.forEach((cell, index) => {
                    const columnName = columns[index];
                    let value = '';
                    
                    if (cell) {
                        value = cell.f ? cell.f : (cell.v || '');
                    }
                    
                    rowData[columnName] = value;
                });
                rows.push(rowData);
            });

            return rows;
        }

        /**
         * Get recent purchase notifications
         * Expected columns: Name, Location, Product, Timestamp
         * @param {number} limit - Maximum number of notifications to return
         * @returns {Promise<Array>} Array of notification objects
         */
        async getRecentNotifications(limit = 10) {
            const data = await this.fetchData();
            
            // Filter out empty rows and sort by timestamp (assuming newest first)
            const notifications = data
                .filter(row => row.Name && row.Location && row.Product)
                .slice(0, limit)
                .map(row => ({
                    name: row.Name,
                    location: row.Location,
                    product: row.Product,
                    timestamp: row.Timestamp || 'recently',
                    timeAgo: this.calculateTimeAgo(row.Timestamp)
                }));

            return notifications;
        }

        /**
         * Calculate time ago from timestamp
         * @param {string} timestamp - Timestamp string
         * @returns {string} Human readable time ago
         */
        calculateTimeAgo(timestamp) {
            if (!timestamp) return 'recently';
            
            try {
                const date = new Date(timestamp);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'just now';
                if (diffMins < 60) return `${diffMins} min ago`;
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                return 'recently';
            } catch (error) {
                return 'recently';
            }
        }
    }

    /**
     * Social Proof Widget
     * Main widget class that handles display and functionality
     */
    class SocialProofWidget {
        constructor(options = {}) {
            // Default configuration
            this.config = {
                spreadsheetId: options.spreadsheetId || '',
                sheetGid: options.sheetGid || '0',
                position: options.position || 'bottom-left',
                displayDuration: options.displayDuration || 4000,
                delayBetween: options.delayBetween || 3000,
                maxNotifications: options.maxNotifications || 5,
                hideAfter: options.hideAfter || 10,
                theme: options.theme || 'light',
                showVerification: options.showVerification !== false,
                customStyles: options.customStyles || {},
                ...options
            };

            this.notifications = [];
            this.currentIndex = 0;
            this.isVisible = false;
            this.displayCount = 0;
            this.container = null;
            this.sheetsIntegration = null;

            // Initialize if spreadsheet ID is provided
            if (this.config.spreadsheetId) {
                this.init();
            }
        }

        /**
         * Initialize the widget
         */
        async init() {
            try {
                this.sheetsIntegration = new GoogleSheetsIntegration(
                    this.config.spreadsheetId, 
                    this.config.sheetGid
                );

                // Create widget container
                this.createContainer();
                
                // Load notifications
                await this.loadNotifications();
                
                // Start displaying notifications
                if (this.notifications.length > 0) {
                    this.startDisplayCycle();
                }
            } catch (error) {
                console.error('Social Proof Widget initialization failed:', error);
            }
        }

        /**
         * Create the widget container
         */
        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'social-proof-widget';
            this.container.innerHTML = this.getWidgetHTML();
            
            // Apply styles
            this.applyStyles();
            
            // Add to page
            document.body.appendChild(this.container);
        }

        /**
         * Get widget HTML structure
         */
        getWidgetHTML() {
            return `
                <div class="spw-notification" id="spw-notification">
                    <div class="spw-content">
                        <div class="spw-avatar">
                            <div class="spw-avatar-placeholder"></div>
                        </div>
                        <div class="spw-text">
                            <div class="spw-name"></div>
                            <div class="spw-action"></div>
                            <div class="spw-time"></div>
                        </div>
                        <div class="spw-close" onclick="this.closest('.social-proof-widget').style.display='none'">
                            ×
                        </div>
                    </div>
                    ${this.config.showVerification ? '<div class="spw-verification">Verified by Social Proof</div>' : ''}
                </div>
            `;
        }

        /**
         * Apply CSS styles to the widget
         */
        applyStyles() {
            const styleId = 'social-proof-widget-styles';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = this.getWidgetCSS();
            document.head.appendChild(style);
        }

        /**
         * Get widget CSS styles
         */
        getWidgetCSS() {
            const position = this.getPositionStyles();
            const theme = this.getThemeStyles();
            
            return `
                .social-proof-widget {
                    position: fixed;
                    ${position}
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease-in-out;
                    pointer-events: none;
                }

                .social-proof-widget.spw-visible {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }

                .spw-notification {
                    ${theme.background}
                    ${theme.border}
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    padding: 12px 16px;
                    max-width: 320px;
                    min-width: 280px;
                    position: relative;
                    backdrop-filter: blur(10px);
                }

                .spw-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .spw-avatar {
                    flex-shrink: 0;
                }

                .spw-avatar-placeholder {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                }

                .spw-text {
                    flex: 1;
                    min-width: 0;
                }

                .spw-name {
                    font-weight: 600;
                    font-size: 14px;
                    ${theme.primaryText}
                    margin-bottom: 2px;
                }

                .spw-action {
                    font-size: 13px;
                    ${theme.secondaryText}
                    margin-bottom: 2px;
                    line-height: 1.3;
                }

                .spw-time {
                    font-size: 12px;
                    ${theme.mutedText}
                }

                .spw-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    line-height: 1;
                    ${theme.mutedText}
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .spw-close:hover {
                    opacity: 1;
                    background: rgba(0, 0, 0, 0.2);
                }

                .spw-verification {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                    font-size: 11px;
                    ${theme.mutedText}
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .spw-verification::before {
                    content: "✓";
                    color: #10b981;
                    font-weight: bold;
                }

                /* Responsive design */
                @media (max-width: 480px) {
                    .social-proof-widget {
                        left: 16px !important;
                        right: 16px !important;
                        bottom: 16px !important;
                    }
                    
                    .spw-notification {
                        max-width: none;
                        min-width: auto;
                    }
                }
            `;
        }

        /**
         * Get position styles based on configuration
         */
        getPositionStyles() {
            const positions = {
                'bottom-left': 'bottom: 20px; left: 20px;',
                'bottom-right': 'bottom: 20px; right: 20px;',
                'top-left': 'top: 20px; left: 20px;',
                'top-right': 'top: 20px; right: 20px;'
            };
            return positions[this.config.position] || positions['bottom-left'];
        }

        /**
         * Get theme styles
         */
        getThemeStyles() {
            const themes = {
                light: {
                    background: 'background: rgba(255, 255, 255, 0.95);',
                    border: 'border: 1px solid rgba(0, 0, 0, 0.1);',
                    primaryText: 'color: #1f2937;',
                    secondaryText: 'color: #4b5563;',
                    mutedText: 'color: #9ca3af;'
                },
                dark: {
                    background: 'background: rgba(31, 41, 55, 0.95);',
                    border: 'border: 1px solid rgba(255, 255, 255, 0.1);',
                    primaryText: 'color: #f9fafb;',
                    secondaryText: 'color: #d1d5db;',
                    mutedText: 'color: #9ca3af;'
                }
            };
            return themes[this.config.theme] || themes.light;
        }

        /**
         * Load notifications from Google Sheets
         */
        async loadNotifications() {
            try {
                this.notifications = await this.sheetsIntegration.getRecentNotifications(
                    this.config.maxNotifications
                );
            } catch (error) {
                console.error('Failed to load notifications:', error);
                this.notifications = [];
            }
        }

        /**
         * Start the display cycle
         */
        startDisplayCycle() {
            if (this.notifications.length === 0) return;

            // Show first notification after initial delay
            setTimeout(() => {
                this.showNextNotification();
            }, 2000);
        }

        /**
         * Show the next notification
         */
        showNextNotification() {
            if (this.displayCount >= this.config.hideAfter) {
                this.hide();
                return;
            }

            if (this.currentIndex >= this.notifications.length) {
                this.currentIndex = 0;
            }

            const notification = this.notifications[this.currentIndex];
            this.displayNotification(notification);
            
            this.currentIndex++;
            this.displayCount++;

            // Schedule next notification
            setTimeout(() => {
                this.hideNotification();
                setTimeout(() => {
                    this.showNextNotification();
                }, this.config.delayBetween);
            }, this.config.displayDuration);
        }

        /**
         * Display a notification
         */
        displayNotification(notification) {
            const nameEl = this.container.querySelector('.spw-name');
            const actionEl = this.container.querySelector('.spw-action');
            const timeEl = this.container.querySelector('.spw-time');
            const avatarEl = this.container.querySelector('.spw-avatar-placeholder');

            // Update content
            nameEl.textContent = notification.name;
            actionEl.textContent = `from ${notification.location} purchased ${notification.product}`;
            timeEl.textContent = notification.timeAgo;
            
            // Set avatar initial
            avatarEl.textContent = notification.name.charAt(0).toUpperCase();

            // Show notification
            this.container.classList.add('spw-visible');
            this.isVisible = true;
        }

        /**
         * Hide current notification
         */
        hideNotification() {
            this.container.classList.remove('spw-visible');
            this.isVisible = false;
        }

        /**
         * Hide the widget completely
         */
        hide() {
            if (this.container) {
                this.container.style.display = 'none';
            }
        }

        /**
         * Show the widget
         */
        show() {
            if (this.container) {
                this.container.style.display = 'block';
                this.displayCount = 0;
                this.startDisplayCycle();
            }
        }

        /**
         * Update configuration
         */
        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
            
            if (newConfig.spreadsheetId && newConfig.spreadsheetId !== this.config.spreadsheetId) {
                this.init();
            }
        }

        /**
         * Destroy the widget
         */
        destroy() {
            if (this.container) {
                this.container.remove();
            }
            
            const styles = document.getElementById('social-proof-widget-styles');
            if (styles) {
                styles.remove();
            }
        }
    }

    // Auto-initialize if configuration is provided via data attributes
    function autoInitialize() {
        const script = document.querySelector('script[data-spreadsheet-id]');
        if (script) {
            const config = {
                spreadsheetId: script.getAttribute('data-spreadsheet-id'),
                sheetGid: script.getAttribute('data-sheet-gid') || '0',
                position: script.getAttribute('data-position') || 'bottom-left',
                theme: script.getAttribute('data-theme') || 'light',
                displayDuration: parseInt(script.getAttribute('data-display-duration')) || 4000,
                delayBetween: parseInt(script.getAttribute('data-delay-between')) || 3000,
                maxNotifications: parseInt(script.getAttribute('data-max-notifications')) || 5,
                hideAfter: parseInt(script.getAttribute('data-hide-after')) || 10
            };

            window.socialProofWidget = new SocialProofWidget(config);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInitialize);
    } else {
        autoInitialize();
    }

    // Make classes available globally
    window.SocialProofWidget = SocialProofWidget;
    window.GoogleSheetsIntegration = GoogleSheetsIntegration;

})();

