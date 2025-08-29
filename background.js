// Background script - chạy nền
let mqttClient = null;
let isConnected = false;
let currentDeviceName = '';
let lockInput = false;
let messageQueue = [];
let activeTabs = new Map(); // Track active tabs
let lastReloadTime = 0;
const RELOAD_COOLDOWN = 5000; // 5 seconds cooldown between reloads

// Import MQTT.js library
importScripts('mqtt.min.js');

// Khởi tạo extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('MQTT Extension đã được cài đặt');
  loadSettings();
});

// Khởi động extension
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome khởi động - MQTT Extension starting...');
  loadSettings();
});

// Lắng nghe message từ popup và content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'connect') {
    connectMQTT(request.endpoint, request.deviceName);
    sendResponse({ success: true });
  } else if (request.action === 'disconnect') {
    disconnectMQTT();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ connected: isConnected });
  } else if (request.action === 'testConnection') {
    testMQTTConnection(request.endpoint, request.deviceName, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'publishMessage') {
    publishMQTTMessage(request.topic, request.message, sendResponse);
    return true;
  } else if (request.action === 'contentScriptLoaded') {
    handleContentScriptLoaded(request, sender);
    sendResponse({ success: true });
  } else if (request.action === 'pageVisible') {
    handlePageVisible(request, sender);
    sendResponse({ success: true });
  } else if (request.action === 'windowFocused') {
    handleWindowFocused(request, sender);
    sendResponse({ success: true });
  } else if (request.action === 'reloadExtension') {
    reloadExtension();
    sendResponse({ success: true });
  }
  return true;
});

// Xử lý khi content script được load
function handleContentScriptLoaded(request, sender) {
  console.log('Content script loaded on:', request.url, 'from tab:', sender.tab?.id);
  
  if (sender.tab) {
    activeTabs.set(sender.tab.id, {
      url: request.url,
      timestamp: request.timestamp,
      active: true
    });
    
    // Kiểm tra nếu đây là trang KiotViet và extension cần reload
    if (request.url.includes('malbon.kiotviet.vn') && shouldReloadExtension()) {
      console.log('KiotViet page detected, considering extension reload...');
      scheduleExtensionReload();
    }
  }
}

// Xử lý khi page trở nên visible
function handlePageVisible(request, sender) {
  console.log('Page became visible:', request.url, 'from tab:', sender.tab?.id);
  
  if (sender.tab && request.url.includes('malbon.kiotviet.vn')) {
    console.log('KiotViet page became visible, checking extension state...');
    
    // Kiểm tra state của extension
    if (!isConnected || mqttClient === null) {
      console.log('Extension state issue detected, attempting to reload...');
      scheduleExtensionReload();
    }
  }
}

// Xử lý khi window được focus
function handleWindowFocused(request, sender) {
  console.log('Window focused on:', request.url, 'from tab:', sender.tab?.id);
  
  if (sender.tab && request.url.includes('malbon.kiotviet.vn')) {
    console.log('KiotViet window focused, checking extension health...');
    
    // Kiểm tra health của extension
    checkExtensionHealth();
  }
}

// Kiểm tra health của extension
function checkExtensionHealth() {
  const now = Date.now();
  
  // Kiểm tra nếu MQTT client bị lỗi
  if (mqttClient && mqttClient.connected === false && isConnected) {
    console.log('MQTT client state mismatch detected, fixing...');
    isConnected = false;
    updateBadge('ERR', '#F44336');
  }
  
  // Kiểm tra nếu cần reload extension
  if (shouldReloadExtension()) {
    console.log('Extension health check failed, scheduling reload...');
    scheduleExtensionReload();
  }
}

// Kiểm tra xem có nên reload extension không
function shouldReloadExtension() {
  const now = Date.now();
  
  // Kiểm tra cooldown
  if (now - lastReloadTime < RELOAD_COOLDOWN) {
    return false;
  }
  
  // Kiểm tra các điều kiện cần reload
  if (!mqttClient && isConnected) return true;
  if (mqttClient && mqttClient.connected === false && isConnected) return true;
  if (mqttClient && mqttClient.connected === true && !isConnected) return true;
  
  return false;
}

// Lên lịch reload extension
function scheduleExtensionReload() {
  const now = Date.now();
  
  if (now - lastReloadTime < RELOAD_COOLDOWN) {
    console.log('Reload cooldown active, skipping...');
    return;
  }
  
  console.log('Scheduling extension reload...');
  lastReloadTime = now;
  
  // Disconnect trước
  if (mqttClient) {
    disconnectMQTT();
  }
  
  // Reload sau 1 giây
  setTimeout(() => {
    console.log('Executing extension reload...');
    reloadExtension();
  }, 1000);
}

// Reload extension
function reloadExtension() {
  console.log('Reloading extension...');
  
  try {
    // Disconnect MQTT nếu đang kết nối
    if (mqttClient) {
      disconnectMQTT();
    }
    
    // Reset state
    isConnected = false;
    currentDeviceName = '';
    messageQueue = [];
    lockInput = false;
    
    // Update badge
    updateBadge('OFF', '#FF9800');
    
    // Load settings và auto-connect
    loadSettings();
    
    console.log('Extension reloaded successfully');
  } catch (error) {
    console.error('Error during extension reload:', error);
  }
}

// Update badge với text và color
function updateBadge(text, color) {
  try {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Test MQTT connection
function testMQTTConnection(endpoint, deviceName, sendResponse) {
  console.log('Testing MQTT connection to:', endpoint);

  try {
    // Tạo client ID duy nhất
    const clientId = `test_${deviceName}_${Date.now()}`;

    // Sử dụng MQTT.js để test connection
    const client = mqtt.connect(endpoint, {
      clientId: clientId,
      clean: true,
      connectTimeout: 10000,
      keepalive: 60
    });

    client.on('connect', () => {
      console.log('MQTT connection test successful');
      client.end();
      sendResponse({ success: true, message: 'Connection test successful' });
    });

    client.on('error', (error) => {
      console.error('MQTT connection test failed:', error);
      client.end();
      sendResponse({ success: false, error: 'Failed to connect to MQTT broker' });
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (client.connected === false) {
        client.end();
        sendResponse({ success: false, error: 'Connection timeout' });
      }
    }, 10000);

  } catch (error) {
    console.error('Test connection error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Publish MQTT message
function publishMQTTMessage(topic, message, sendResponse) {
  if (!mqttClient || !isConnected) {
    sendResponse({ success: false, error: 'Not connected to MQTT broker' });
    return;
  }

  try {
    console.log('Publishing MQTT message to topic:', topic, 'with message:', message);
    mqttClient.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        console.error('Subscribe error for topic:', topic, err);
      } else {
        console.log('Subscribed to topic:', topic);
      }
    });

    mqttClient.publish(topic, message, { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error('Failed to publish message:', error);
        sendResponse({ success: false, error: error.message });
      } else {
        console.log('Message published successfully to topic:', topic);
        sendResponse({ success: true, message: 'Message published successfully' });
      }
    });
  } catch (error) {
    console.error('Failed to publish message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function để gõ text vào active tab
function executeInput(text) {
  if (!text) {
    console.warn('No text to type');
    return;
  }

  console.log('Executing input for text:', text);
  
  // Tìm tab active
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      console.warn('No active tab found');
      return;
    }
    
    console.log('Found active tab:', tab.id, tab.url);
    
    // Kiểm tra nếu tab có content script
    if (activeTabs.has(tab.id)) {
      console.log('Tab has content script, sending typeText message');
      
      // Gửi message đến content script để gõ text
      chrome.tabs.sendMessage(tab.id, {
        action: 'typeText',
        text: text
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to content script:', chrome.runtime.lastError);
        } else {
          console.log('TypeText message sent successfully');
        }
      });
    } else {
      console.log('Tab does not have content script, injecting...');
      
      // Inject content script nếu cần
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        // Sau khi inject, gửi message
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'typeText',
            text: text
          });
        }, 500);
      });
    }
  });
}

// Kết nối MQTT sử dụng MQTT.js
function connectMQTT(endpoint, deviceName) {
  console.log('Attempting to connect MQTT to:', endpoint, 'with device:', deviceName);

  try {
    // Tạo client ID duy nhất
    const clientId = `chrome_extension_${deviceName}_${Date.now()}`;
    currentDeviceName = deviceName;

    // Sử dụng MQTT.js để kết nối
    mqttClient = mqtt.connect(endpoint, {
      clientId: clientId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      username: '', // Có thể thêm username nếu cần
      password: ''  // Có thể thêm password nếu cần
    });

    // Xử lý sự kiện kết nối
    mqttClient.on('connect', () => {
      console.log('MQTT Connected successfully');
      isConnected = true;

      // Subscribe to topics sau khi kết nối
      const topics = [
        'extension/test/input',
        `desktop/device/${deviceName}`,
        'desktop/device/+/status',
        `desktop/device/${deviceName}/receiver`
      ];

      topics.forEach(topic => {
        mqttClient.subscribe(topic, { qos: 0 }, (err) => {
          if (err) {
            console.error(`Subscribe error for ${topic}:`, err);
          } else {
            console.log(`Subscribed to ${topic} successfully`);
          }
        });
      });

      // Lưu settings
      chrome.storage.local.set({
        mqttEndpoint: endpoint,
        deviceName: deviceName
      });

      // Cập nhật badge
      updateBadge('ON', '#4CAF50');

      console.log('MQTT connection established successfully');
    });

    // Xử lý message nhận được
    mqttClient.on('message', (topic, message) => {
      console.log('MQTT message received on topic:', topic);
      
      if (topic === `desktop/device/${currentDeviceName}/receiver`) {
        try {
          const messageData = JSON.parse(message.toString());
          console.log('Parsed message data:', messageData);
          
          if (messageData.data && messageData.data.epc) {
            messageQueue.push(messageData.data.epc);
            console.log('Added EPC to queue:', messageData.data.epc);
            
            // Thực hiện gõ text
            executeInput(messageData.data.epc);
            
            // Gửi reply
            if (mqttClient && mqttClient.connected) {
              mqttClient.publish(topic + '/reply', JSON.stringify({ 
                message: 'received', 
                epc: messageData.data.epc,
                timestamp: Date.now()
              }));
            }
          }
        } catch (error) {
          console.error('Error parsing MQTT message:', error);
          if (mqttClient && mqttClient.connected) {
            mqttClient.publish(topic + '/reply', JSON.stringify({ 
              message: 'error', 
              error: error.message,
              timestamp: Date.now()
            }));
          }
        }
      }
    });

    // Xử lý lỗi
    mqttClient.on('error', (error) => {
      console.error('MQTT Error:', error);
      isConnected = false;
      updateBadge('ERR', '#F44336');
    });

    // Xử lý ngắt kết nối
    mqttClient.on('close', () => {
      console.log('MQTT Connection closed');
      isConnected = false;
      updateBadge('OFF', '#FF9800');
    });

    // Xử lý reconnect
    mqttClient.on('reconnect', () => {
      console.log('MQTT Reconnecting...');
      updateBadge('REC', '#FF9800');
    });

    // Xử lý offline
    mqttClient.on('offline', () => {
      console.log('MQTT Client offline');
      isConnected = false;
      updateBadge('OFF', '#FF9800');
    });

  } catch (error) {
    console.error('Failed to connect MQTT:', error);
    isConnected = false;
    updateBadge('ERR', '#F44336');
  }
}

// Ngắt kết nối MQTT
function disconnectMQTT() {
  console.log('Disconnecting MQTT...');

  if (mqttClient) {
    mqttClient.end(true); // Force disconnect
    mqttClient = null;
  }
  isConnected = false;
  currentDeviceName = '';
  updateBadge('OFF', '#FF9800');

  console.log('MQTT disconnected');
}

// Load settings từ storage và auto-connect
function loadSettings() {
  chrome.storage.local.get(['mqttEndpoint', 'deviceName', 'autoConnect'], (result) => {
    console.log('Loaded settings:', result);

    if (result.mqttEndpoint && result.deviceName) {
      if (result.autoConnect !== false) { // Default to true if not set
        // Tự động kết nối nếu có settings và autoConnect = true
        console.log('Auto-connecting with saved settings...');
        setTimeout(() => {
          connectMQTT(result.mqttEndpoint, result.deviceName);
        }, 2000); // Delay 2 seconds to ensure extension is fully loaded
      } else {
        console.log('Auto-connect disabled, not connecting automatically');
      }
    } else {
      console.log('No settings found or auto-connect disabled');
    }
  });
}

// Lắng nghe tab events
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && tab.url.includes('malbon.kiotviet.vn')) {
      console.log('KiotViet tab activated, checking extension state...');
      checkExtensionHealth();
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('malbon.kiotviet.vn')) {
    console.log('KiotViet page loaded completely, checking extension...');
    
    // Cập nhật active tabs
    activeTabs.set(tabId, {
      url: tab.url,
      timestamp: Date.now(),
      active: true
    });
    
    // Kiểm tra health
    setTimeout(() => {
      checkExtensionHealth();
    }, 1000);
  }
});

// Cập nhật badge khi extension khởi động
updateBadge('OFF', '#FF9800');

console.log('MQTT Extension Background Script loaded with improved state management'); 