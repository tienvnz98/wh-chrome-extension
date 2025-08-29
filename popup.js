// Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('MQTT Extension Popup loaded');
    
    // Elements
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const openDialogBtn = document.getElementById('openDialogBtn');
    const publishBtn = document.getElementById('publishBtn');
    const publishTopic = document.getElementById('publishTopic');
    const publishMessage = document.getElementById('publishMessage');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    // Load settings when popup opens
    loadSettings();
    updateConnectionStatus();

    // Event Listeners
    connectBtn.addEventListener('click', handleConnect);
    disconnectBtn.addEventListener('click', handleDisconnect);
    reloadBtn.addEventListener('click', handleReload);
    openDialogBtn.addEventListener('click', openSettingsDialog);
    publishBtn.addEventListener('click', handlePublishMessage);

    // Functions
    function handleConnect() {
        console.log('Connect button clicked');
        
        // Lấy settings từ storage
        chrome.storage.local.get(['mqttEndpoint', 'deviceName'], (result) => {
            console.log('Retrieved settings:', result);
            
            const endpoint = result.mqttEndpoint;
            const device = result.deviceName;

            if (!endpoint || !device) {
                console.log('Missing settings, opening settings dialog');
                alert('Vui lòng cấu hình MQTT Endpoint và Device Name trong Settings trước!');
                openSettingsDialog();
                return;
            }

            if (!endpoint.startsWith('ws://') && !endpoint.startsWith('wss://')) {
                console.log('Invalid endpoint format:', endpoint);
                alert('MQTT Endpoint phải bắt đầu bằng ws:// hoặc wss://');
                return;
            }

            console.log('Attempting to connect to:', endpoint, 'with device:', device);
            
            connectBtn.disabled = true;
            connectBtn.textContent = 'Connecting...';

            chrome.runtime.sendMessage({
                action: 'connect',
                endpoint: endpoint,
                deviceName: device
            }, (response) => {
                console.log('Connect response:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    alert('Lỗi kết nối: ' + chrome.runtime.lastError.message);
                    connectBtn.disabled = false;
                    connectBtn.textContent = 'Connect';
                    return;
                }
                
                if (response && response.success) {
                    console.log('Connect successful');
                    updateConnectionStatus();
                    connectBtn.disabled = true;
                    disconnectBtn.disabled = false;
                    connectBtn.textContent = 'Connected';
                    
                    // Enable publish button
                    publishBtn.disabled = false;
                    
                    // Update topic placeholder with device name
                    updateTopicPlaceholder(device);
                } else {
                    console.log('Connect failed');
                    connectBtn.disabled = false;
                    connectBtn.textContent = 'Connect';
                }
            });
        });
    }

    function handleDisconnect() {
        console.log('Disconnect button clicked');
        
        chrome.runtime.sendMessage({
            action: 'disconnect'
        }, (response) => {
            console.log('Disconnect response:', response);
            
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                alert('Lỗi ngắt kết nối: ' + chrome.runtime.lastError.message);
                return;
            }
            
            if (response && response.success) {
                console.log('Disconnect successful');
                updateConnectionStatus();
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                connectBtn.textContent = 'Connect';
                
                // Disable publish button
                publishBtn.disabled = true;
            }
        });
    }

    function handleReload() {
        console.log('Reload button clicked');
        
        if (confirm('Bạn có chắc chắn muốn reload extension? Điều này sẽ ngắt kết nối MQTT hiện tại và khởi động lại extension.')) {
            reloadBtn.disabled = true;
            reloadBtn.textContent = 'Reloading...';
            
            chrome.runtime.sendMessage({
                action: 'reloadExtension'
            }, (response) => {
                console.log('Reload response:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    alert('Lỗi reload: ' + chrome.runtime.lastError.message);
                    reloadBtn.disabled = false;
                    reloadBtn.textContent = 'Reload Extension';
                    return;
                }
                
                if (response && response.success) {
                    console.log('Reload successful');
                    alert('Extension đã được reload thành công!');
                    
                    // Reset UI
                    setTimeout(() => {
                        updateConnectionStatus();
                        reloadBtn.disabled = false;
                        reloadBtn.textContent = 'Reload Extension';
                    }, 2000);
                } else {
                    console.log('Reload failed');
                    reloadBtn.disabled = false;
                    reloadBtn.textContent = 'Reload Extension';
                }
            });
        }
    }

    function handlePublishMessage() {
        const topic = publishTopic.value.trim();
        const message = publishMessage.value.trim();

        if (!topic || !message) {
            alert('Vui lòng nhập đầy đủ Topic và Message!');
            return;
        }

        console.log('Publishing message to topic:', topic, 'with message:', message);
        
        publishBtn.disabled = true;
        publishBtn.textContent = 'Publishing...';

        chrome.runtime.sendMessage({
            action: 'publishMessage',
            topic: topic,
            message: message
        }, (response) => {
            console.log('Publish response:', response);
            
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                alert('Lỗi publish: ' + chrome.runtime.lastError.message);
                publishBtn.disabled = false;
                publishBtn.textContent = 'Publish Message';
                return;
            }
            
            if (response && response.success) {
                console.log('Message published successfully');
                alert('Message đã được publish thành công!');
                
                // Clear message input
                publishMessage.value = '';
            } else {
                console.log('Publish failed:', response?.error);
                alert('Publish thất bại: ' + (response?.error || 'Unknown error'));
            }
            
            publishBtn.disabled = false;
            publishBtn.textContent = 'Publish Message';
        });
    }

    function updateTopicPlaceholder(deviceName) {
        // Update topic input with device name
        publishTopic.value = `desktop/device/${deviceName}/test`;
        publishTopic.placeholder = `desktop/device/${deviceName}/test`;
    }

    function openSettingsDialog() {
        console.log('Opening settings dialog');
        
        // Mở settings dialog trong tab mới
        chrome.tabs.create({
            url: chrome.runtime.getURL('settings-dialog.html'),
            active: true
        });
    }

    function loadSettings() {
        console.log('Loading settings...');
        
        // Load basic settings để hiển thị
        chrome.storage.local.get(['mqttEndpoint', 'deviceName'], (result) => {
            console.log('Settings loaded:', result);
            
            if (result.mqttEndpoint && result.deviceName) {
                // Có settings, có thể kết nối
                console.log('Settings found, enabling connect button');
                connectBtn.disabled = false;
                connectBtn.textContent = 'Connect';
                
                // Update topic placeholder
                updateTopicPlaceholder(result.deviceName);
            } else {
                // Chưa có settings, cần cấu hình
                console.log('No settings found, disabling connect button');
                connectBtn.disabled = true;
                connectBtn.textContent = 'Configure First';
            }
        });
    }

    function updateConnectionStatus() {
        console.log('Updating connection status...');
        
        chrome.runtime.sendMessage({
            action: 'getStatus'
        }, (response) => {
            console.log('Status response:', response);
            
            if (chrome.runtime.lastError) {
                console.error('Runtime error getting status:', chrome.runtime.lastError);
                return;
            }
            
            if (response && response.connected) {
                console.log('Status: Connected');
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Connected';
                
                // Enable publish button when connected
                publishBtn.disabled = false;
            } else {
                console.log('Status: Disconnected');
                statusDot.className = 'status-dot';
                statusText.textContent = 'Disconnected';
                
                // Disable publish button when disconnected
                publishBtn.disabled = true;
            }
        });
    }

    // Auto-update status every 2 seconds
    setInterval(updateConnectionStatus, 2000);
    
    console.log('MQTT Extension Popup setup complete');
}); 