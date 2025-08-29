// Background script - chạy nền
let mqttClient = null;
let isConnected = false;
let currentDeviceName = '';
let lockInput = false;
let messageQueue = [];

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

// Lắng nghe message từ popup
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
  }
  return true;
});

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

function typeTextWithDelay(text) {
  if (!text) return;

  lockInput = true;

  const el = document.activeElement;
  if (!el || (!el.tagName.match(/INPUT|TEXTAREA/) && !el.isContentEditable)) {
    console.warn("Không có ô nhập liệu nào đang focus!");
    return;
  }

  let i = 0;

  function typeChar() {
    if (i < text.length) {
      const char = text[i];
      const code = "Key" + char.toUpperCase();
      const keyCode = char.toUpperCase().charCodeAt(0);

      // keydown
      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: char,
          code,
          keyCode,
          which: keyCode,
          bubbles: true
        })
      );

      // thêm ký tự
      if (el.isContentEditable) {
        el.textContent += char;
      } else {
        el.value += char;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));

      // keyup
      el.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: char,
          code,
          keyCode,
          which: keyCode,
          bubbles: true
        })
      );

      i++;
      setTimeout(typeChar, 10); // delay giữa từng ký tự
    } else {
      // Gõ xong → Enter
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      el.dispatchEvent(enterEvent);
      el.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true
        })
      );
    }
  }

  typeChar();
  lockInput = false;
}
function excuteInput(text) {
  setTimeout(() => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]; // tab đang active
        if (!tab?.id) return;
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: typeTextWithDelay,
          args: [[text]]
        });
      });
      mqttClient.publish(topic + '/reply', JSON.stringify({ message: 'received', epc: messageData.data.epc }));
    } catch (error) {
      mqttClient.publish(topic + '/reply', JSON.stringify({ message: 'received', error: error.message }));
    }
  }, 500)
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
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

      console.log('MQTT connection established successfully');
    });

    // Xử lý message nhận được
    mqttClient.on('message', (topic, message) => {
      if (topic === `desktop/device/${currentDeviceName}/receiver`) {

        const messageData = JSON.parse(message.toString());
        messageQueue.push(messageData.data.epc);
        if (messageData.data.epc) {
          excuteInput(messageData.data.epc);
        }
      }
    });

    // Xử lý lỗi
    mqttClient.on('error', (error) => {
      console.error('MQTT Error:', error);
      isConnected = false;
      chrome.action.setBadgeText({ text: 'ERR' });
      chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
    });

    // Xử lý ngắt kết nối
    mqttClient.on('close', () => {
      console.log('MQTT Connection closed');
      isConnected = false;
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
    });

    // Xử lý reconnect
    mqttClient.on('reconnect', () => {
      console.log('MQTT Reconnecting...');
      chrome.action.setBadgeText({ text: 'REC' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
    });

    // Xử lý offline
    mqttClient.on('offline', () => {
      console.log('MQTT Client offline');
      isConnected = false;
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
    });

  } catch (error) {
    console.error('Failed to connect MQTT:', error);
    isConnected = false;
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
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
  chrome.action.setBadgeText({ text: 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });

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

// Cập nhật badge khi extension khởi động
chrome.action.setBadgeText({ text: 'OFF' });
chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });

console.log('MQTT Extension Background Script loaded'); 