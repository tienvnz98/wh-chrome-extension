// Content script - chạy trên các trang web
console.log('MQTT Extension Content Script loaded');

// Lắng nghe message từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'logMessage') {
        console.log('MQTT Message from Extension:', request.data);
    }
});

// Có thể thêm các tính năng khác ở đây nếu cần 
function typeTextWithDelay() { const text = messageQueue?.pop(); if (!text) return; lockInput = true; const el = document.activeElement; if (!el || (!el.tagName.match(/INPUT|TEXTAREA/) && !el.isContentEditable)) { console.warn("Không có ô nhập liệu nào đang focus!"); return; } let i = 0; function typeChar() { if (i < text.length) { const char = text[i]; const code = "Key" + char.toUpperCase(); const keyCode = char.toUpperCase().charCodeAt(0); // keydown el.dispatchEvent(new KeyboardEvent("keydown", { key: char, code, keyCode, which: keyCode, bubbles: true })); // thêm ký tự if (el.isContentEditable) { el.textContent += char; } else { el.value += char; } el.dispatchEvent(new Event("input", { bubbles: true })); // keyup el.dispatchEvent(new KeyboardEvent("keyup", { key: char, code, keyCode, which: keyCode, bubbles: true })); i++; setTimeout(typeChar, 10); // delay giữa từng ký tự } else { // Gõ xong → Enter const enterEvent = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }); el.dispatchEvent(enterEvent); el.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true })); } } typeChar(); lockInput = false; }