/**
 * HLPT Social Proof Widget - Enhanced Version with Fixed Gravatar
 * Filename: hlpt-spw.js
 * v2.3.0
 * A lightweight, customizable social proof widget that displays recent notifications
 * from Google Sheets with profile pictures, custom colors, and verification badges.
 */

(function() {
    'use strict';

    /**
     * Proper MD5 hash function for Gravatar URLs
     */
    function md5(string) {
        function rotateLeft(value, amount) {
            var lbits = (value << amount) | (value >>> (32 - amount));
            return lbits;
        }

        function addUnsigned(x, y) {
            var x4 = (x & 0x40000000);
            var y4 = (y & 0x40000000);
            var x8 = (x & 0x80000000);
            var y8 = (y & 0x80000000);
            var result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
            if (x4 & y4) {
                return (result ^ 0x80000000 ^ x8 ^ y8);
            }
            if (x4 | y4) {
                if (result & 0x40000000) {
                    return (result ^ 0xC0000000 ^ x8 ^ y8);
                } else {
                    return (result ^ 0x40000000 ^ x8 ^ y8);
                }
            } else {
                return (result ^ x8 ^ y8);
            }
        }

        function f(x, y, z) { return (x & y) | ((~x) & z); }
        function g(x, y, z) { return (x & z) | (y & (~z)); }
        function h(x, y, z) { return (x ^ y ^ z); }
        function i(x, y, z) { return (y ^ (x | (~z))); }

        function ff(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function gg(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function hh(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function ii(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function convertToWordArray(string) {
            var wordArray = [];
            var wordCount = (((string.length + 8) - ((string.length + 8) % 64)) / 64) + 1;
            var messageLength = wordCount * 16;
            wordArray[messageLength - 1] = undefined;
            for (var i = 0; i < messageLength; i++) {
                wordArray[i] = 0;
            }
            var bytePosition = 0;
            var byteCount = 0;
            while (byteCount < string.length) {
                wordArray[bytePosition] = (wordArray[bytePosition] | (string.charCodeAt(byteCount) << (8 * (byteCount % 4))));
                byteCount++;
                if (byteCount % 4 === 0) {
                    bytePosition++;
                }
            }
            wordArray[bytePosition] = (wordArray[bytePosition] | (0x80 << (8 * (byteCount % 4))));
            wordArray[messageLength - 2] = string.length << 3;
            wordArray[messageLength - 1] = string.length >>> 29;
            return wordArray;
        }

        function wordToHex(value) {
            var wordToHexValue = "", wordToHexValueTemp = "", byte, count;
            for (count = 0; count <= 3; count++) {
                byte = (value >>> (count * 8)) & 255;
                wordToHexValueTemp = "0" + byte.toString(16);
                wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
            }
            return wordToHexValue;
        }

        var x = convertToWordArray(string);
        var a = 0x67452301;
        var b = 0xEFCDAB89;
        var c = 0x98BADCFE;
        var d = 0x10325476;

        for (var k = 0; k < x.length; k += 16) {
            var AA = a;
            var BB = b;
            var CC = c;
            var DD = d;
            a = ff(a, b, c, d, x[k + 0], 7, 0xD76AA478);
            d = ff(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
            c = ff(c, d, a, b, x[k + 2], 17, 0x242070DB);
            b = ff(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
            a = ff(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
            d = ff(d, a, b, c, x[k + 5], 12, 0x4787C62A);
            c = ff(c, d, a, b, x[k + 6], 17, 0xA8304613);
            b = ff(b, c, d, a, x[k + 7], 22, 0xFD469501);
            a = ff(a, b, c, d, x[k + 8], 7, 0x698098D8);
            d = ff(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
            c = ff(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
            b = ff(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
            a = ff(a, b, c, d, x[k + 12], 7, 0x6B901122);
            d = ff(d, a, b, c, x[k + 13], 12, 0xFD987193);
            c = ff(c, d, a, b, x[k + 14], 17, 0xA679438E);
            b = ff(b, c, d, a, x[k + 15], 22, 0x49B40821);
            a = gg(a, b, c, d, x[k + 1], 5, 0xF61E2562);
            d = gg(d, a, b, c, x[k + 6], 9, 0xC040B340);
            c = gg(c, d, a, b, x[k + 11], 14, 0x265E5A51);
            b = gg(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
            a = gg(a, b, c, d, x[k + 5], 5, 0xD62F105D);
            d = gg(d, a, b, c, x[k + 10], 9, 0x2441453);
            c = gg(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
            b = gg(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
            a = gg(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
            d = gg(d, a, b, c, x[k + 14], 9, 0xC33707D6);
            c = gg(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
            b = gg(b, c, d, a, x[k + 8], 20, 0x455A14ED);
            a = gg(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
            d = gg(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
            c = gg(c, d, a, b, x[k + 7], 14, 0x676F02D9);
            b = gg(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);
            a = hh(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
            d = hh(d, a, b, c, x[k + 8], 11, 0x8771F681);
            c = hh(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
            b = hh(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
            a = hh(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
            d = hh(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
            c = hh(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
            b = hh(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
            a = hh(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
            d = hh(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
            c = hh(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
            b = hh(b, c, d, a, x[k + 6], 23, 0x4881D05);
            a = hh(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
            d = hh(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
            c = hh(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
            b = hh(b, c, d, a, x[k + 2], 23, 0xC4AC5665);
            a = ii(a, b, c, d, x[k + 0], 6, 0xF4292244);
            d = ii(d, a, b, c, x[k + 7], 10, 0x432AFF97);
            c = ii(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
            b = ii(b, c, d, a, x[k + 5], 21, 0xFC93A039);
            a = ii(a, b, c, d, x[k + 12], 6, 0x655B59C3);
            d = ii(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
            c = ii(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
            b = ii(b, c, d, a, x[k + 1], 21, 0x85845DD1);
            a = ii(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
            d = ii(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
            c = ii(c, d, a, b, x[k + 6], 15, 0xA3014314);
            b = ii(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
            a = ii(a, b, c, d, x[k + 4], 6, 0xF7537E82);
            d = ii(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
            c = ii(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
            b = ii(b, c, d, a, x[k + 9], 21, 0xEB86D391);
            a = addUnsigned(a, AA);
            b = addUnsigned(b, BB);
            c = addUnsigned(c, CC);
            d = addUnsigned(d, DD);
        }

        return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
    }

    /**
     * Google Sheets Integration Class
     */
    class GoogleSheetsIntegration {
        constructor(spreadsheetId, sheetGid = '0') {
            this.spreadsheetId = spreadsheetId;
            this.sheetGid = sheetGid;
            this.baseUrl = 'https://docs.google.com/spreadsheets/d/';
        }

        /**
         * Fetch data from Google Sheets
         */
        async fetchData() {
            const url = `${this.baseUrl}${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${this.sheetGid}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const csvText = await response.text();
                return this.parseCSV(csvText);
            } catch (error) {
                console.error('Error fetching Google Sheets data:', error);
                throw error;
            }
        }

        /**
         * Parse CSV data into notification objects
         */
        parseCSV(csvText) {
            const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) return [];

            // Parse header row
            const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
            const notifications = [];

            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length < 4) continue;

                const notification = {};
                headers.forEach((header, index) => {
                    if (values[index]) {
                        notification[header] = values[index].trim();
                    }
                });

                // Validate required fields
                if (notification.name && notification.location && notification.product && notification.timestamp) {
                    notifications.push(notification);
                }
            }

            return notifications;
        }

        /**
         * Parse a single CSV line handling quoted values
         */
        parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current);
            return result;
        }
    }

    /**
     * Social Proof Widget Class
     */
    class SocialProofWidget {
        constructor(config = {}) {
            this.config = {
                spreadsheetId: config.spreadsheetId || '',
                sheetGid: config.sheetGid || '0',
                position: config.position || 'bottom-left',
                primaryColor: config.primaryColor || '#667eea',
                displayDuration: parseInt(config.displayDuration) || 4000,
                delayBetween: parseInt(config.delayBetween) || 3000,
                maxNotifications: parseInt(config.maxNotifications) || 5,
                hideAfter: parseInt(config.hideAfter) || 10,
                showVerification: config.showVerification !== 'false',
                verificationText: config.verificationText || 'Verified by Google',
                showTimeAgo: config.showTimeAgo !== 'false'
            };

            this.notifications = [];
            this.currentIndex = 0;
            this.displayCount = 0;
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
                    product: 'SaaStember',
                    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                    email: 'matthew.deseno@gmail.com',
                    action: 'is enjoying'
                },
                {
                    name: 'Randy',
                    location: 'the US',
                    product: 'HLPT',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    email: 'randy@example.com',
                    action: 'just purchased'
                },
                {
                    name: 'Sarah Johnson',
                    location: 'Los Angeles',
                    product: 'SaaStember',
                    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
                    picture: '🧑',
                    action: 'signed up for'
                },
                {
                    name: 'Michael Brown',
                    location: 'Chicago',
                    product: 'HLPT',
                    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
                    picture: '👨',
                    action: 'upgraded to'
                }
            ];
        }

        /**
         * Create the widget container and apply styles
         */
        createWidget() {
            // Apply styles first
            this.applyStyles();

            // Create container
            this.container = document.createElement('div');
            this.container.className = 'social-proof-widget';
            this.container.innerHTML = this.getWidgetHTML();

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
                        <div class="spw-avatar"></div>
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
         * Generate secondary color from primary color
         */
        generateSecondaryColor(primaryColor) {
            const hex = primaryColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const factor = 0.8;
            const newR = Math.round(r * factor);
            const newG = Math.round(g * factor * 0.9);
            const newB = Math.round(b * factor * 1.1);
            
            const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
            return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
        }

        /**
         * Get widget CSS styles - matches demo exactly
         */
        getWidgetCSS() {
            const position = this.getPositionStyles();
            const primaryColor = this.config.primaryColor;
            const secondaryColor = this.generateSecondaryColor(primaryColor);
            
            return `
                .social-proof-widget {
                    position: fixed !important;
                    ${position}
                    z-index: 9999 !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease-in-out;
                    pointer-events: none;
                    max-width: 380px !important;
                }

                .social-proof-widget.spw-visible {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }

                .spw-notification {
                    background: rgba(255, 255, 255, 0.98) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
                    padding: 16px 20px !important;
                    position: relative;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 0, 0, 0.08) !important;
                    font-family: inherit !important;
                }

                .spw-notification:hover .spw-close {
                    opacity: 1;
                }

                .spw-content {
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 12px !important;
                }

                .spw-avatar {
                    width: 48px !important;
                    height: 48px !important;
                    border-radius: 12px !important;
                    background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: white !important;
                    font-weight: 600 !important;
                    font-size: 18px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    flex-shrink: 0 !important;
                    margin-top: 2px !important;
                    font-family: inherit !important;
                }

                .spw-avatar img {
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 12px !important;
                    object-fit: cover !important;
                }

                .spw-text {
                    flex: 1 !important;
                    min-width: 0;
                    padding-top: 2px !important;
                }

                .spw-message {
                    font-weight: 500 !important;
                    font-size: 15px !important;
                    color: #1f2937 !important;
                    line-height: 1.4 !important;
                    margin-bottom: 4px !important;
                    font-family: inherit !important;
                }

                .spw-time {
                    font-size: 13px !important;
                    color: #6b7280 !important;
                    font-weight: 400 !important;
                    font-family: inherit !important;
                }

                .spw-close {
                    position: absolute !important;
                    top: 12px !important;
                    right: 12px !important;
                    width: 24px !important;
                    height: 24px !important;
                    border-radius: 6px !important;
                    background: rgba(0, 0, 0, 0.05) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    font-size: 16px !important;
                    line-height: 1 !important;
                    color: #6b7280 !important;
                    opacity: 0;
                    transition: all 0.2s ease;
                    font-weight: 400 !important;
                    font-family: inherit !important;
                    border: none !important;
                }

                .spw-close:hover {
                    background: rgba(0, 0, 0, 0.1) !important;
                    transform: scale(1.1);
                }

                .spw-verification {
                    margin-top: 12px !important;
                    padding-top: 12px !important;
                    border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
                    font-size: 12px !important;
                    color: #6b7280 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    font-weight: 400 !important;
                    font-family: inherit !important;
                }

                .spw-verification-icon {
                    color: #10b981 !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    font-family: inherit !important;
                }

                .spw-verification-text {
                    flex: 1;
                    font-family: inherit !important;
                }

                @media (max-width: 480px) {
                    .social-proof-widget {
                        max-width: calc(100vw - 40px) !important;
                        margin: 0 20px !important;
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
         * Start the notification display cycle
         */
        startDisplayCycle() {
            if (this.notifications.length === 0) return;

            // Reset counters
            this.currentIndex = 0;
            this.displayCount = 0;

            // Start first notification after initial delay
            setTimeout(() => {
                this.displayNextNotification();
            }, 2000);
        }

        /**
         * Display the next notification in the cycle
         */
        displayNextNotification() {
            if (this.displayCount >= this.config.hideAfter) {
                this.container.style.display = 'none';
                return;
            }

            const notification = this.notifications[this.currentIndex];
            this.displayNotification(notification);

            this.currentIndex = (this.currentIndex + 1) % this.notifications.length;
            this.displayCount++;

            // Schedule next notification
            setTimeout(() => {
                this.hideNotification();
                setTimeout(() => {
                    this.displayNextNotification();
                }, this.config.delayBetween);
            }, this.config.displayDuration);
        }

        /**
         * Display a specific notification
         */
        async displayNotification(notification) {
            const messageEl = this.container.querySelector('.spw-message');
            const timeEl = this.container.querySelector('.spw-time');
            const avatarEl = this.container.querySelector('.spw-avatar');

            // Update message
            const action = notification.action || 'purchased';
            messageEl.textContent = `${notification.name} in ${notification.location} ${action} ${notification.product}`;

            // Update time
            if (this.config.showTimeAgo) {
                timeEl.textContent = this.formatTimeAgo(notification.timestamp);
                timeEl.style.display = 'block';
            } else {
                timeEl.style.display = 'none';
            }

            // Update avatar with Gravatar support
            await this.updateAvatar(avatarEl, notification);

            // Show widget
            this.showNotification();
        }

        /**
         * Update avatar with Gravatar, emoji, or initials
         */
        async updateAvatar(avatarEl, notification) {
            // Clear current content
            avatarEl.innerHTML = '';
            
            console.log('Updating avatar for:', notification.name, 'Email:', notification.email);

            // Try Gravatar first if email is provided
            if (notification.email && notification.email.includes('@')) {
                console.log('Attempting Gravatar for:', notification.email);
                const gravatarWorked = await this.tryGravatar(avatarEl, notification);
                if (gravatarWorked) {
                    console.log('✅ Gravatar loaded successfully for:', notification.email);
                    return;
                }
                console.log('❌ Gravatar failed for:', notification.email);
            }

            // Try emoji/picture
            if (notification.picture) {
                if (this.isEmoji(notification.picture)) {
                    console.log('Using emoji:', notification.picture);
                    avatarEl.innerHTML = `<span style="font-size: 24px; line-height: 1;">${notification.picture}</span>`;
                    return;
                } else if (notification.picture.startsWith('http')) {
                    console.log('Trying image URL:', notification.picture);
                    const img = document.createElement('img');
                    img.src = notification.picture;
                    img.alt = notification.name;
                    img.style.cssText = 'width: 100%; height: 100%; border-radius: 12px; object-fit: cover;';
                    
                    img.onload = () => {
                        console.log('✅ Image loaded successfully');
                        avatarEl.innerHTML = '';
                        avatarEl.appendChild(img);
                    };
                    
                    img.onerror = () => {
                        console.log('❌ Image failed, using initials');
                        this.setInitials(avatarEl, notification.name);
                    };
                    return;
                }
            }

            // Fallback to initials
            console.log('Using initials for:', notification.name);
            this.setInitials(avatarEl, notification.name);
        }

        /**
         * Try to load Gravatar image
         */
        async tryGravatar(avatarEl, notification) {
            return new Promise((resolve) => {
                const email = notification.email.toLowerCase().trim();
                const emailHash = md5(email);
                const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=96&d=404`;
                
                console.log('Email:', email);
                console.log('MD5 Hash:', emailHash);
                console.log('Gravatar URL:', gravatarUrl);
                
                const img = document.createElement('img');
                img.src = gravatarUrl;
                img.alt = notification.name;
                img.style.cssText = 'width: 100%; height: 100%; border-radius: 12px; object-fit: cover;';
                
                img.onload = () => {
                    console.log('✅ Gravatar image loaded successfully');
                    avatarEl.innerHTML = '';
                    avatarEl.appendChild(img);
                    resolve(true);
                };
                
                img.onerror = () => {
                    console.log('❌ Gravatar not found or failed to load');
                    resolve(false);
                };
                
                // Timeout after 3 seconds
                setTimeout(() => {
                    if (!avatarEl.querySelector('img')) {
                        console.log('❌ Gravatar timeout');
                        resolve(false);
                    }
                }, 3000);
            });
        }

        /**
         * Set initials in avatar
         */
        setInitials(avatarEl, name) {
            const initials = name.charAt(0).toUpperCase();
            avatarEl.textContent = initials;
        }

        /**
         * Check if string is an emoji
         */
        isEmoji(str) {
            return /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}]$/u.test(str.trim());
        }

        /**
         * Show notification with animation
         */
        showNotification() {
            this.container.classList.add('spw-visible');
        }

        /**
         * Hide notification with animation
         */
        hideNotification() {
            this.container.classList.remove('spw-visible');
        }

        /**
         * Format timestamp to relative time
         */
        formatTimeAgo(timestamp) {
            try {
                let date;
                
                // Try parsing the timestamp
                if (timestamp.includes('/')) {
                    // Handle MM/DD/YYYY format
                    const parts = timestamp.split('/');
                    if (parts.length === 3) {
                        date = new Date(parts[2], parts[0] - 1, parts[1]);
                    }
                } else {
                    date = new Date(timestamp);
                }
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                    // Fallback to random recent time for demo
                    const randomMinutes = Math.floor(Math.random() * 120) + 5; // 5-125 minutes ago
                    date = new Date(Date.now() - randomMinutes * 60 * 1000);
                }
                
                const now = new Date();
                const diffInSeconds = Math.floor((now - date) / 1000);
                
                if (diffInSeconds < 60) {
                    return 'just now';
                } else if (diffInSeconds < 3600) {
                    const minutes = Math.floor(diffInSeconds / 60);
                    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
                } else if (diffInSeconds < 86400) {
                    const hours = Math.floor(diffInSeconds / 3600);
                    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
                } else {
                    const days = Math.floor(diffInSeconds / 86400);
                    return `${days} day${days !== 1 ? 's' : ''} ago`;
                }
            } catch (error) {
                console.error('Error formatting time:', error);
                return 'recently';
            }
        }
    }

    /**
     * Auto-initialize widget from script tag data attributes
     */
    function autoInitialize() {
        const scripts = document.querySelectorAll('script[src*="hlpt-spw.js"]');
        
        scripts.forEach(script => {
            const config = {
                spreadsheetId: script.dataset.spreadsheetId || '',
                sheetGid: script.dataset.sheetGid || '0',
                position: script.dataset.position || 'bottom-left',
                primaryColor: script.dataset.primaryColor || '#667eea',
                displayDuration: script.dataset.displayDuration || '4000',
                delayBetween: script.dataset.delayBetween || '3000',
                maxNotifications: script.dataset.maxNotifications || '5',
                hideAfter: script.dataset.hideAfter || '10',
                showVerification: script.dataset.showVerification !== 'false',
                verificationText: script.dataset.verificationText || 'Verified by Google',
                showTimeAgo: script.dataset.showTimeAgo !== 'false'
            };

            if (config.spreadsheetId) {
                new SocialProofWidget(config);
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInitialize);
    } else {
        autoInitialize();
    }

    // Export for manual initialization
    window.SocialProofWidget = SocialProofWidget;

})();

