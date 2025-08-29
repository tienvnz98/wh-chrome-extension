# MQTT Chrome Extension

Một Chrome extension để kết nối và quản lý MQTT broker thông qua WebSocket, sử dụng thư viện MQTT.js.

## Tính năng

- ✅ Chạy nền (Background Service Worker)
- ✅ Modal settings với nhiều tab
- ✅ Cấu hình MQTT WebSocket endpoint
- ✅ Cấu hình Device Name
- ✅ Lưu settings vào localStorage
- ✅ Lắng nghe topic `extension/test/input`
- ✅ Console log các message nhận được
- ✅ Giao diện đẹp và responsive
- ✅ Sử dụng MQTT.js library chính thức
- ✅ **Tự động reload extension khi cần thiết**
- ✅ **Manual reload extension từ popup**
- ✅ **Theo dõi tab switching và page visibility**
- ✅ **Health check và auto-recovery**

## Cài đặt

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode" ở góc phải
3. Click "Load unpacked" và chọn thư mục chứa extension
4. Extension sẽ xuất hiện trong toolbar

## Sử dụng

### Kết nối MQTT
1. Click vào icon extension
2. Nhập MQTT WebSocket endpoint (ví dụ: `ws://localhost:9001`)
3. Nhập tên thiết bị
4. Click "Connect"

### Cài đặt
1. Click "Settings" trong popup
2. Chọn tab phù hợp:
   - **Connection**: Cấu hình endpoint và device name
   - **General**: Cài đặt auto-connect và reconnect
   - **Advanced**: Cấu hình topic prefix và QoS

### Monitoring
- Extension sẽ tự động subscribe vào topic `extension/test/input`
- Các message nhận được sẽ được log ra console
- Trạng thái kết nối hiển thị bằng badge và indicator
- **Extension tự động kiểm tra health và reload khi cần**

### Extension Reload
Extension có khả năng tự động reload để khắc phục các vấn đề về state:

1. **Tự động reload**: Khi phát hiện state không nhất quán
2. **Manual reload**: Click nút "Reload Extension" trong popup
3. **Tab switching detection**: Tự động kiểm tra khi chuyển tab
4. **Page visibility monitoring**: Theo dõi khi trang trở nên visible

**Khi nào extension tự động reload:**
- MQTT client state không nhất quán
- Khi load trang KiotViet (`malbon.kiotviet.vn`)
- Khi chuyển tab và quay lại
- Khi page trở nên visible

**Cách manual reload:**
1. Click icon extension
2. Click nút "Reload Extension" (màu cam)
3. Xác nhận reload
4. Extension sẽ disconnect MQTT và khởi động lại

## Cấu trúc dự án

```
chrome-extension/
├── manifest.json          # Cấu hình extension
├── background.js          # Service worker chạy nền
├── popup.html            # Giao diện popup
├── popup.css             # CSS cho popup
├── popup.js              # JavaScript cho popup
├── content.js            # Content script
├── mqtt.min.js           # MQTT.js library (local copy)
├── icons/                # Thư mục chứa icons
├── package.json          # Quản lý dự án
└── README.md             # Hướng dẫn sử dụng
```

## MQTT Implementation

### Sử dụng MQTT.js
Extension sử dụng thư viện **MQTT.js** - thư viện MQTT chính thức cho browser:

- **Kết nối**: `mqtt.connect(endpoint, options)`
- **Subscribe**: `client.subscribe(topic, callback)`
- **Message handling**: `client.on('message', callback)`
- **Auto-reconnect**: Tự động kết nối lại khi mất kết nối

### MQTT Topics

- **Subscribe**: `extension/test/input`
- **Message Format**: JSON với các trường:
  - `topic`: Tên topic
  - `payload`: Nội dung message
  - `timestamp`: Thời gian (nếu có)

## Lưu ý

- Extension sử dụng MQTT.js library để kết nối MQTT broker
- Settings được lưu vào Chrome localStorage
- Cần MQTT broker hỗ trợ WebSocket
- Extension tự động reconnect khi mất kết nối
- Sử dụng MQTT protocol chuẩn thay vì WebSocket thô

## Troubleshooting

### Không thể kết nối
- Kiểm tra MQTT broker có chạy không
- Kiểm tra endpoint có đúng format `ws://` hoặc `wss://`
- Kiểm tra firewall và network
- Đảm bảo MQTT broker hỗ trợ WebSocket

### Không nhận được message
- Kiểm tra topic có đúng `extension/test/input`
- Kiểm tra MQTT broker có publish message không
- Mở Developer Tools để xem console log
- Kiểm tra MQTT.js library có load thành công không

### Lỗi MQTT.js
- Kiểm tra file `mqtt.min.js` có tồn tại không
- Đảm bảo MQTT.js library tương thích với Chrome extension
- Có thể cần download MQTT.js mới nhất từ [npm](https://www.npmjs.com/package/mqtt)

### Extension Reload Issues
- **Extension không tự động reload**: Kiểm tra console log trong background script
- **Manual reload không hoạt động**: Đảm bảo extension có quyền `scripting` và `tabs`
- **State vẫn không nhất quán sau reload**: Thử restart Chrome hoặc reinstall extension
- **Content script không inject**: Kiểm tra manifest.json có đúng content_scripts không

**Debug extension reload:**
1. Mở `chrome://extensions/`
2. Click "Details" trên extension
3. Click "Service Worker" để xem background script console
4. Kiểm tra log messages về reload

## Phát triển

Để phát triển thêm tính năng:

1. Sửa code trong các file tương ứng
2. Reload extension trong `chrome://extensions/`
3. Test các thay đổi

### Testing Extension Reload
Sử dụng file `test-extension-reload.html` để test extension reload:

1. **Mở file test**: `test-extension-reload.html` trong Chrome
2. **Test manual reload**: Click "Reload Extension" button
3. **Test tab switching**: Chuyển tab và quay lại
4. **Test page visibility**: Minimize/maximize window
5. **Monitor console**: Xem log trong Developer Tools

**Test scenarios:**
- ✅ Extension reload khi state không nhất quán
- ✅ Auto-reload khi load trang KiotViet
- ✅ Tab switching detection
- ✅ Page visibility monitoring
- ✅ MQTT message handling sau reload

### Cập nhật MQTT.js
Để sử dụng phiên bản MQTT.js mới nhất:

```bash
# Download MQTT.js mới nhất
curl -o mqtt.min.js https://unpkg.com/mqtt@latest/dist/mqtt.min.js
```

## License

MIT License 