// Content script - chạy trên các trang web
console.log('MQTT Extension Content Script loaded');

// Lắng nghe message từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'logMessage') {
        console.log('MQTT Message from Extension:', request.data);
    }
});

// Có thể thêm các tính năng khác ở đây nếu cần 