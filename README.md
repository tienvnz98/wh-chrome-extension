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

## Phát triển

Để phát triển thêm tính năng:

1. Sửa code trong các file tương ứng
2. Reload extension trong `chrome://extensions/`
3. Test các thay đổi

### Cập nhật MQTT.js
Để sử dụng phiên bản MQTT.js mới nhất:

```bash
# Download MQTT.js mới nhất
curl -o mqtt.min.js https://unpkg.com/mqtt@latest/dist/mqtt.min.js
```

## License

MIT License 