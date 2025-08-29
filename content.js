// Content script - chạy trên các trang web
console.log('MQTT Extension Content Script loaded on:', window.location.href);

// Lắng nghe message từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'logMessage') {
        console.log('MQTT Message from Extension:', request.data);
    } else if (request.action === 'typeText') {
        console.log('Typing text:', request.text);
        typeTextWithDelay(request.text);
    } else if (request.action === 'getPageInfo') {
        sendResponse({
            url: window.location.href,
            title: document.title,
            ready: document.readyState === 'complete'
        });
    }
    
    return true; // Keep message channel open
});

// Function để gõ text với delay
function typeTextWithDelay(text) {
    if (!text || typeof text !== 'string') {
        console.warn('Invalid text for typing:', text);
        return;
    }

    console.log('Starting to type text:', text);
    
    const el = document.activeElement;
    if (!el || (!el.tagName.match(/INPUT|TEXTAREA/) && !el.isContentEditable)) {
        console.warn("Không có ô nhập liệu nào đang focus! Tìm kiếm input field...");
        
        // Tìm input field đầu tiên nếu không có element nào đang focus
        const inputField = document.querySelector('input[type="text"], input[type="search"], textarea, [contenteditable="true"]');
        if (inputField) {
            inputField.focus();
            console.log('Found and focused input field:', inputField);
            typeTextIntoElement(inputField, text);
        } else {
            console.warn('Không tìm thấy input field nào trên trang');
        }
        return;
    }
    
    typeTextIntoElement(el, text);
}

function typeTextIntoElement(element, text) {
    let i = 0;
    
    function typeChar() {
        if (i < text.length) {
            const char = text[i];
            const code = "Key" + char.toUpperCase();
            const keyCode = char.toUpperCase().charCodeAt(0);

            // keydown
            element.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: char,
                    code,
                    keyCode,
                    which: keyCode,
                    bubbles: true
                })
            );

            // thêm ký tự
            if (element.isContentEditable) {
                element.textContent += char;
            } else {
                element.value += char;
            }
            element.dispatchEvent(new Event("input", { bubbles: true }));

            // keyup
            element.dispatchEvent(
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
            element.dispatchEvent(enterEvent);
            element.dispatchEvent(
                new KeyboardEvent("keyup", {
                    key: "Enter",
                    code: "Enter",
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                })
            );
            
            console.log('Finished typing text:', text);
        }
    }

    typeChar();
}

// Thông báo cho background script biết content script đã load
chrome.runtime.sendMessage({
    action: 'contentScriptLoaded',
    url: window.location.href,
    timestamp: Date.now()
});

// Lắng nghe sự kiện page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page became visible, notifying background script');
        chrome.runtime.sendMessage({
            action: 'pageVisible',
            url: window.location.href,
            timestamp: Date.now()
        });
    }
});

// Lắng nghe sự kiện focus vào window
window.addEventListener('focus', () => {
    console.log('Window focused, notifying background script');
    chrome.runtime.sendMessage({
        action: 'windowFocused',
        url: window.location.href,
        timestamp: Date.now()
    });
});

console.log('MQTT Extension Content Script setup complete');