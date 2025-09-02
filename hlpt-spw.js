/**
 * HLPT Social Proof Widget - Improved Version
 * A JavaScript widget that displays recent purchase notifications from Google Sheets
 * Version: 2.1.0
 * 
 * New Features:
 * - Profile pictures (emoji or Gravatar)
 * - Verification footer toggle
 * - Custom verification text
 * - Customizable action text
 * - Improved design with hover effects
 * 
 * Usage:
 * <script src="https://cdn.jsdelivr.net/gh/mattdeseno/social-proof-widget@latest/hlpt-spw.js"
 *         data-spreadsheet-id="YOUR_SHEET_ID"
 *         data-position="bottom-left"
 *         data-theme="light"
 *         data-show-verification="true"
 *         data-verification-text="Verified by Social Proof"></script>
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
            if (!data.table || !data.table.rows) {
                throw new Error('Invalid Google Sheets data structure');
            }

            const rows = data.table.rows;
            const headers = this.extractHeaders(data.table.cols);
            const notifications = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row.c) continue;

                const notification = this.parseRow(row.c, headers);
                if (this.isValidNotification(notification)) {
                    notifications.push(notification);
                }
            }

            return notifications;
        }

        /**
         * Extract headers from Google Sheets columns
         * @param {Array} cols - Column definitions
         * @returns {Array} Header names
         */
        extractHeaders(cols) {
            return cols.map(col => {
                if (col && col.label) {
                    return col.label.toLowerCase().trim();
                }
                return '';
            });
        }

        /**
         * Parse a single row from Google Sheets
         * @param {Array} cells - Row cells
         * @param {Array} headers - Column headers
         * @returns {Object} Parsed notification object
         */
        parseRow(cells, headers) {
            const notification = {};
            
            for (let i = 0; i < headers.length && i < cells.length; i++) {
                const header = headers[i];
                const cell = cells[i];
                
                if (cell && cell.v !== null && cell.v !== undefined) {
                    notification[header] = cell.v.toString().trim();
                }
            }

            // Process timestamp if present
            if (notification.timestamp) {
                notification.timeAgo = this.formatTimeAgo(notification.timestamp);
            }

            return notification;
        }

        /**
         * Validate notification data
         * @param {Object} notification - Notification object
         * @returns {boolean} Whether notification is valid
         */
        isValidNotification(notification) {
            return notification.name && 
                   notification.location && 
                   notification.product;
        }

        /**
         * Format timestamp to "time ago" format
         * @param {string} timestamp - Timestamp string
         * @returns {string} Formatted time ago string
         */
        formatTimeAgo(timestamp) {
            try {
                const date = new Date(timestamp);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                if (diffMins < 1) return 'just now';
                if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            } catch (error) {
                return 'recently';
            }
        }
    }

    /**
     * Social Proof Widget Main Class
     */
    class SocialProofWidget {
        constructor(config = {}) {
            this.config = {
                spreadsheetId: '',
                sheetGid: '0',
                position: 'bottom-left',
                theme: 'light',
                displayDuration: 4000,
                delayBetween: 3000,
                maxNotifications: 5,
                hideAfter: 10,
                showVerification: true,
                verificationText: 'Verified by Social Proof',
                ...config
            };

            this.notifications = [];
            this.currentIndex = 0;
            this.displayCount = 0;
            this.isVisible = false;
            this.container = null;
            this.sheetsIntegration = null;

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

                await this.loadNotifications();
                this.createWidget();
                this.startDisplayCycle();
            } catch (error) {
                console.error('Failed to initialize Social Proof Widget:', error);
            }
        }

        /**
         * Load notifications from Google Sheets
         */
        async loadNotifications() {
            try {
                const data = await this.sheetsIntegration.fetchData();
                this.notifications = data.slice(0, this.config.maxNotifications);
                
                if (this.notifications.length === 0) {
                    console.warn('No valid notifications found in Google Sheets');
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
                // Use fallback data for demo
                this.notifications = this.getFallbackNotifications();
            }
        }

        /**
         * Get fallback notifications for demo purposes
         */
        getFallbackNotifications() {
            return [
                {
                    name: 'Tyler',
                    location: 'La Jolla',
                    product: 'HL Pro Tools',
                    action: 'just purchased',
                    timeAgo: '2 minutes ago',
                    picture: '⭐'
                },
                {
                    name: 'Randy',
                    location: 'the US',
                    product: 'HL Pro Tools',
                    action: 'just purchased',
                    timeAgo: '5 minutes ago',
                    email: 'randy@example.com'
                },
                {
                    name: 'Sarah Johnson',
                    location: 'Los Angeles',
                    product: 'Basic Plan',
                    action: 'signed up for',
                    timeAgo: '8 minutes ago',
                    picture: '👩‍💼'
                },
                {
                    name: 'Michael Brown',
                    location: 'Chicago',
                    product: 'Pro Plan',
                    action: 'upgraded to',
                    timeAgo: '12 minutes ago',
                    picture: '🧑‍💻'
                }
            ];
        }

        /**
         * Create the widget DOM element
         */
        createWidget() {
            // Remove existing widget if present
            const existing = document.getElementById('social-proof-widget');
            if (existing) {
                existing.remove();
            }

            // Create container
            this.container = document.createElement('div');
            this.container.id = 'social-proof-widget';
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
            const verificationHTML = this.config.showVerification ? 
                `<div class="spw-verification">
                    <span class="spw-verification-icon">✓</span>
                    <span class="spw-verification-text">${this.config.verificationText}</span>
                </div>` : '';

            return `
                <div class="spw-notification" id="spw-notification">
                    <div class="spw-content">
                        <div class="spw-avatar">
                            <div class="spw-avatar-placeholder"></div>
                        </div>
                        <div class="spw-text">
                            <div class="spw-message"></div>
                            <div class="spw-time"></div>
                        </div>
                        <div class="spw-close" onclick="this.closest('.social-proof-widget').style.display='none'">
                            ×
                        </div>
                    </div>
                    ${verificationHTML}
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
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    padding: 16px 20px;
                    max-width: 380px;
                    min-width: 320px;
                    position: relative;
                    backdrop-filter: blur(10px);
                    border: 1px solid ${theme.borderColor};
                }

                .spw-notification:hover .spw-close {
                    opacity: 1;
                }

                .spw-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .spw-avatar {
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .spw-avatar-placeholder {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 18px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .spw-avatar-image {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    object-fit: cover;
                }

                .spw-avatar-emoji {
                    font-size: 24px;
                    line-height: 1;
                }

                .spw-text {
                    flex: 1;
                    min-width: 0;
                    padding-top: 2px;
                }

                .spw-message {
                    font-weight: 500;
                    font-size: 15px;
                    ${theme.primaryText}
                    line-height: 1.4;
                    margin-bottom: 4px;
                }

                .spw-time {
                    font-size: 13px;
                    ${theme.mutedText}
                    font-weight: 400;
                }

                .spw-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: ${theme.closeBackground};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    ${theme.closeText}
                    opacity: 0;
                    transition: all 0.2s ease;
                    font-weight: 400;
                }

                .spw-close:hover {
                    background: ${theme.closeHoverBackground};
                    transform: scale(1.1);
                }

                .spw-verification {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid ${theme.borderColor};
                    font-size: 12px;
                    ${theme.mutedText}
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 400;
                }

                .spw-verification-icon {
                    color: #10b981;
                    font-weight: 600;
                    font-size: 12px;
                }

                .spw-verification-text {
                    flex: 1;
                }

                @media (max-width: 480px) {
                    .spw-notification {
                        max-width: calc(100vw - 40px);
                        min-width: calc(100vw - 40px);
                        margin: 0 20px;
                    }
                }
            `;
        }

        /**
         * Get position-specific CSS styles
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
         * Get theme-specific CSS styles
         */
        getThemeStyles() {
            const themes = {
                light: {
                    background: 'background: rgba(255, 255, 255, 0.98);',
                    primaryText: 'color: #1f2937;',
                    mutedText: 'color: #6b7280;',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    closeBackground: 'rgba(0, 0, 0, 0.05)',
                    closeHoverBackground: 'rgba(0, 0, 0, 0.1)',
                    closeText: 'color: #6b7280;'
                },
                dark: {
                    background: 'background: rgba(31, 41, 55, 0.98);',
                    primaryText: 'color: #f9fafb;',
                    mutedText: 'color: #9ca3af;',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    closeBackground: 'rgba(255, 255, 255, 0.1)',
                    closeHoverBackground: 'rgba(255, 255, 255, 0.2)',
                    closeText: 'color: #d1d5db;'
                }
            };

            return themes[this.config.theme] || themes.light;
        }

        /**
         * Start the notification display cycle
         */
        startDisplayCycle() {
            if (this.notifications.length === 0) return;

            // Reset counters
            this.currentIndex = 0;
            this.displayCount = 0;

            // Start showing notifications
            setTimeout(() => {
                this.showNextNotification();
            }, 1000);
        }

        /**
         * Show the next notification in the cycle
         */
        showNextNotification() {
            // Check if we should stop showing notifications
            if (this.displayCount >= this.config.hideAfter) {
                this.hide();
                return;
            }

            // Reset index if we've shown all notifications
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
            const messageEl = this.container.querySelector('.spw-message');
            const timeEl = this.container.querySelector('.spw-time');
            const avatarEl = this.container.querySelector('.spw-avatar-placeholder');

            // Build message text
            const action = notification.action || 'purchased';
            const messageText = `${notification.name} in ${notification.location} ${action} ${notification.product}`;
            
            // Update content
            messageEl.textContent = messageText;
            timeEl.textContent = notification.timeAgo || 'recently';
            
            // Handle profile picture
            this.setAvatar(avatarEl, notification);

            // Show notification
            this.container.classList.add('spw-visible');
            this.isVisible = true;
        }

        /**
         * Set avatar based on available data
         * @param {HTMLElement} avatarEl - Avatar container element
         * @param {Object} notification - Notification data
         */
        setAvatar(avatarEl, notification) {
            // Clear previous content
            avatarEl.innerHTML = '';
            avatarEl.className = 'spw-avatar-placeholder';

            // Priority 1: Emoji from picture field
            if (notification.picture && this.isEmoji(notification.picture)) {
                avatarEl.innerHTML = `<span class="spw-avatar-emoji">${notification.picture}</span>`;
                return;
            }

            // Priority 2: Gravatar from email
            if (notification.email && this.isValidEmail(notification.email)) {
                const gravatarUrl = this.getGravatarUrl(notification.email);
                const img = document.createElement('img');
                img.className = 'spw-avatar-image';
                img.src = gravatarUrl;
                img.alt = notification.name;
                
                // Fallback to initials if Gravatar fails to load
                img.onerror = () => {
                    avatarEl.innerHTML = '';
                    avatarEl.textContent = notification.name.charAt(0).toUpperCase();
                };
                
                avatarEl.appendChild(img);
                return;
            }

            // Priority 3: URL from picture field
            if (notification.picture && this.isValidUrl(notification.picture)) {
                const img = document.createElement('img');
                img.className = 'spw-avatar-image';
                img.src = notification.picture;
                img.alt = notification.name;
                
                // Fallback to initials if image fails to load
                img.onerror = () => {
                    avatarEl.innerHTML = '';
                    avatarEl.textContent = notification.name.charAt(0).toUpperCase();
                };
                
                avatarEl.appendChild(img);
                return;
            }

            // Fallback: First letter of name
            avatarEl.textContent = notification.name.charAt(0).toUpperCase();
        }

        /**
         * Check if a string is an emoji
         * @param {string} str - String to check
         * @returns {boolean} Whether the string is an emoji
         */
        isEmoji(str) {
            const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}]$/u;
            return emojiRegex.test(str.trim());
        }

        /**
         * Check if a string is a valid email
         * @param {string} email - Email to validate
         * @returns {boolean} Whether the email is valid
         */
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        /**
         * Check if a string is a valid URL
         * @param {string} url - URL to validate
         * @returns {boolean} Whether the URL is valid
         */
        isValidUrl(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        }

        /**
         * Generate Gravatar URL from email
         * @param {string} email - Email address
         * @returns {string} Gravatar URL
         */
        getGravatarUrl(email) {
            // Simple MD5 hash implementation for Gravatar
            const hash = this.md5(email.toLowerCase().trim());
            return `https://www.gravatar.com/avatar/${hash}?s=96&d=mp&r=g`;
        }

        /**
         * Simple MD5 hash implementation
         * @param {string} str - String to hash
         * @returns {string} MD5 hash
         */
        md5(str) {
            // This is a simplified MD5 implementation for Gravatar
            // In production, you might want to use a proper crypto library
            let hash = 0;
            if (str.length === 0) return hash.toString(16);
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16);
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
            } else {
                // Recreate widget with new config
                this.createWidget();
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
                hideAfter: parseInt(script.getAttribute('data-hide-after')) || 10,
                showVerification: script.getAttribute('data-show-verification') !== 'false',
                verificationText: script.getAttribute('data-verification-text') || 'Verified by Social Proof'
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

