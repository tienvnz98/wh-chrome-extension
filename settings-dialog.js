// Settings Dialog JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const closeDialog = document.getElementById('closeDialog');
    const saveSettings = document.getElementById('saveSettings');
    const resetSettings = document.getElementById('resetSettings');
    const testConnection = document.getElementById('testConnection');
    
    // Tab elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Form elements
    const mqttEndpoint = document.getElementById('mqttEndpoint');
    const deviceName = document.getElementById('deviceName');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const autoConnect = document.getElementById('autoConnect');
    const reconnectInterval = document.getElementById('reconnectInterval');
    const maxReconnectAttempts = document.getElementById('maxReconnectAttempts');
    const connectionTimeout = document.getElementById('connectionTimeout');
    const topicPrefix = document.getElementById('topicPrefix');
    const qosLevel = document.getElementById('qosLevel');
    const keepalive = document.getElementById('keepalive');
    const cleanSession = document.getElementById('cleanSession');
    const enableLogging = document.getElementById('enableLogging');
    const logLevel = document.getElementById('logLevel');
    const maxLogEntries = document.getElementById('maxLogEntries');
    const autoClearLogs = document.getElementById('autoClearLogs');

    // Load settings when dialog opens
    loadSettings();

    // Event Listeners
    closeDialog.addEventListener('click', closeSettingsDialog);
    saveSettings.addEventListener('click', saveSettingsToStorage);
    resetSettings.addEventListener('click', resetSettingsToDefault);
    testConnection.addEventListener('click', testMQTTConnection);

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Close dialog when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === document.body) {
            closeSettingsDialog();
        }
    });

    // Functions
    function closeSettingsDialog() {
        // Gửi message đến popup để đóng dialog
        if (window.opener) {
            window.close();
        }
    }

    function switchTab(tabName) {
        // Remove active class from all tabs and contents
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    function loadSettings() {
        chrome.storage.local.get([
            'mqttEndpoint',
            'deviceName',
            'username',
            'password',
            'autoConnect',
            'reconnectInterval',
            'maxReconnectAttempts',
            'connectionTimeout',
            'topicPrefix',
            'qosLevel',
            'keepalive',
            'cleanSession',
            'enableLogging',
            'logLevel',
            'maxLogEntries',
            'autoClearLogs'
        ], (result) => {
            if (result.mqttEndpoint) mqttEndpoint.value = result.mqttEndpoint;
            if (result.deviceName) deviceName.value = result.deviceName;
            if (result.username) username.value = result.username;
            if (result.password) password.value = result.password;
            if (result.autoConnect !== undefined) autoConnect.checked = result.autoConnect;
            if (result.reconnectInterval) reconnectInterval.value = result.reconnectInterval;
            if (result.maxReconnectAttempts) maxReconnectAttempts.value = result.maxReconnectAttempts;
            if (result.connectionTimeout) connectionTimeout.value = result.connectionTimeout;
            if (result.topicPrefix) topicPrefix.value = result.topicPrefix;
            if (result.qosLevel) qosLevel.value = result.qosLevel;
            if (result.keepalive) keepalive.value = result.keepalive;
            if (result.cleanSession !== undefined) cleanSession.checked = result.cleanSession;
            if (result.enableLogging !== undefined) enableLogging.checked = result.enableLogging;
            if (result.logLevel) logLevel.value = result.logLevel;
            if (result.maxLogEntries) maxLogEntries.value = result.maxLogEntries;
            if (result.autoClearLogs !== undefined) autoClearLogs.checked = result.autoClearLogs;
        });
    }

    function saveSettingsToStorage() {
        const settings = {
            mqttEndpoint: mqttEndpoint.value.trim(),
            deviceName: deviceName.value.trim(),
            username: username.value.trim(),
            password: password.value.trim(),
            autoConnect: autoConnect.checked,
            reconnectInterval: parseInt(reconnectInterval.value),
            maxReconnectAttempts: parseInt(maxReconnectAttempts.value),
            connectionTimeout: parseInt(connectionTimeout.value),
            topicPrefix: topicPrefix.value.trim(),
            qosLevel: parseInt(qosLevel.value),
            keepalive: parseInt(keepalive.value),
            cleanSession: cleanSession.checked,
            enableLogging: enableLogging.checked,
            logLevel: logLevel.value,
            maxLogEntries: parseInt(maxLogEntries.value),
            autoClearLogs: autoClearLogs.checked
        };

        chrome.storage.local.set(settings, () => {
            showNotification('Settings đã được lưu thành công!', 'success');
            
            // Nếu auto-connect được bật và có endpoint + device name, thử kết nối
            if (settings.autoConnect && settings.mqttEndpoint && settings.deviceName) {
                showNotification('Auto-connect đã được bật. Extension sẽ tự động kết nối khi khởi động Chrome.', 'info');
            }
        });
    }

    function resetSettingsToDefault() {
        if (confirm('Bạn có chắc muốn reset tất cả settings về mặc định?')) {
            mqttEndpoint.value = '';
            deviceName.value = '';
            username.value = '';
            password.value = '';
            autoConnect.checked = true; // Default to true
            reconnectInterval.value = '5000';
            maxReconnectAttempts.value = '10';
            connectionTimeout.value = '30000';
            topicPrefix.value = 'extension';
            qosLevel.value = '0';
            keepalive.value = '60';
            cleanSession.checked = true;
            enableLogging.checked = true;
            logLevel.value = 'info';
            maxLogEntries.value = '100';
            autoClearLogs.checked = true;
            
            showNotification('Settings đã được reset về mặc định!', 'info');
        }
    }

    function testMQTTConnection() {
        const endpoint = mqttEndpoint.value.trim();
        const device = deviceName.value.trim();

        if (!endpoint || !device) {
            showNotification('Vui lòng nhập đầy đủ MQTT Endpoint và Device Name!', 'error');
            return;
        }

        if (!endpoint.startsWith('ws://') && !endpoint.startsWith('wss://')) {
            showNotification('MQTT Endpoint phải bắt đầu bằng ws:// hoặc wss://', 'error');
            return;
        }

        testConnection.disabled = true;
        testConnection.textContent = 'Testing...';

        // Gửi message đến background script để test connection
        chrome.runtime.sendMessage({
            action: 'testConnection',
            endpoint: endpoint,
            deviceName: device
        }, (response) => {
            testConnection.disabled = false;
            testConnection.textContent = 'Test Connection';
            
            if (response && response.success) {
                showNotification('Kết nối thành công!', 'success');
            } else {
                showNotification('Kết nối thất bại: ' + (response?.error || 'Unknown error'), 'error');
            }
        });
    }

    function showNotification(message, type = 'info') {
        // Tạo notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style cho notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        // Màu sắc theo type
        switch(type) {
            case 'success':
                notification.style.background = '#4caf50';
                break;
            case 'error':
                notification.style.background = '#f44336';
                break;
            case 'warning':
                notification.style.background = '#ff9800';
                break;
            default:
                notification.style.background = '#2196f3';
        }
        
        // Thêm vào body
        document.body.appendChild(notification);
        
        // Tự động xóa sau 3 giây
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // CSS animations cho notification
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}); 