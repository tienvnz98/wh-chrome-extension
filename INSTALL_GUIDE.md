# 🚀 Hướng dẫn cài đặt MQTT Chrome Extension

## 📋 **Yêu cầu hệ thống:**
- Google Chrome (phiên bản 88 trở lên)
- MQTT broker hỗ trợ WebSocket

## 🔧 **Bước 1: Chuẩn bị Extension**

### ✅ **Đã sửa lỗi CSP:**
- Loại bỏ `content_security_policy` không an toàn
- Sử dụng MQTT.js library local thay vì CDN
- Extension giờ đây hoàn toàn an toàn và tương thích

### Kiểm tra cấu trúc thư mục:
```
chrome-extension/
├── manifest.json          ✅ (Đã sửa CSP)
├── background.js          ✅
├── popup.html            ✅
├── popup.css             ✅
├── popup.js              ✅
├── content.js            ✅
├── mqtt.min.js           ✅ (Local library)
├── icons/                ✅
│   ├── icon16.png        ✅
│   ├── icon48.png        ✅
│   └── icon128.png       ✅
├── README.md             ✅
├── INSTALL_MQTT.md       ✅
└── INSTALL_GUIDE.md      ✅
```

### Nếu thiếu file nào, hãy tạo lại:
```bash
# Tạo icons nếu cần
python3 -c "
from PIL import Image, ImageDraw

def create_mqtt_icon(size):
    img = Image.new('RGBA', (size, size), (102, 126, 234, 255))
    draw = ImageDraw.Draw(img)
    center = size // 2
    symbol_size = int(size * 0.4)
    points = [
        (center - symbol_size//2, center + symbol_size//2),
        (center, center - symbol_size//2),
        (center + symbol_size//2, center + symbol_size//2)
    ]
    draw.polygon(points, fill='white')
    dot_size = max(2, size // 16)
    draw.ellipse([center - dot_size, center - dot_size, 
                   center + dot_size, center + dot_size], fill='white')
    return img

sizes = [16, 48, 128]
for size in sizes:
    icon = create_mqtt_icon(size)
    icon.save(f'icons/icon{size}.png')
    print(f'Đã tạo icon{size}.png')
"
```

## 🌐 **Bước 2: Cài đặt vào Chrome**

### 2.1 Mở Chrome Extensions:
- Mở Google Chrome
- Gõ vào thanh địa chỉ: `chrome://extensions/`
- Hoặc: Menu (3 chấm) → More tools → Extensions

### 2.2 Bật Developer Mode:
- Ở góc phải màn hình, tìm toggle switch **"Developer mode"**
- Bật nó lên (sẽ chuyển sang màu xanh)
- Bạn sẽ thấy 3 nút mới: "Load unpacked", "Pack extension", "Update"

### 2.3 Load Extension:
- Click nút **"Load unpacked"**
- Chọn thư mục `chrome-extension` (thư mục chứa tất cả file)
- Click **"Select Folder"**

### 2.4 Kiểm tra cài đặt:
- Extension sẽ xuất hiện trong danh sách với tên "MQTT Extension"
- Bạn sẽ thấy icon extension trong toolbar Chrome (góc phải)
- Nếu không thấy icon, click vào icon puzzle piece để xem tất cả extensions

## 🧪 **Bước 3: Test Extension**

### 3.1 Mở Extension:
- Click vào icon MQTT Extension trong toolbar
- Popup sẽ hiện ra với giao diện đẹp

### 3.2 Cấu hình kết nối:
- Nhập MQTT WebSocket endpoint: `ws://localhost:9001`
- Nhập Device Name: `TestDevice`
- Click "Connect"

### 3.3 Mở Settings:
- Click "Settings" để mở modal
- Kiểm tra các tab: Connection, General, Advanced
- Lưu cài đặt

## 🔌 **Bước 4: Cài đặt MQTT Broker (Tùy chọn)**

### 4.1 Mosquitto (Linux):
```bash
# Cài đặt
sudo apt-get install mosquitto mosquitto-clients

# Cấu hình WebSocket
sudo nano /etc/mosquitto/mosquitto.conf

# Thêm vào file:
listener 9001
protocol websockets

# Khởi động
sudo systemctl start mosquitto
```

### 4.2 HiveMQ (Online - Không cần cài đặt):
- Endpoint: `wss://broker.hivemq.com:8884`
- Không cần username/password
- Dùng để test nhanh

## 📱 **Bước 5: Test MQTT Connection**

### 5.1 Kết nối:
- Endpoint: `ws://localhost:9001` (Mosquitto local)
- Hoặc: `wss://broker.hivemq.com:8884` (HiveMQ online)
- Device Name: `MyDevice`

### 5.2 Publish message:
```bash
# Sử dụng mosquitto_pub (nếu dùng Mosquitto local)
mosquitto_pub -h localhost -t "extension/test/input" -m "Hello MQTT!"

# Hoặc dùng MQTT client online
```

### 5.3 Kiểm tra console:
- Mở Developer Tools (F12)
- Xem console log
- Message sẽ hiển thị với format:
  ```
  Received MQTT message:
  Topic: extension/test/input
  Message: Hello MQTT!
  Device Name: MyDevice
  Timestamp: 2024-01-01T12:00:00.000Z
  ```

## ❌ **Xử lý lỗi thường gặp:**

### ✅ **Đã sửa: Lỗi "Insecure CSP value"**
- Loại bỏ `content_security_policy` không an toàn
- Sử dụng MQTT.js library local
- Extension giờ đây hoàn toàn tương thích

### Lỗi "Manifest version 3 is not supported":
- Cập nhật Chrome lên phiên bản mới nhất
- Cần Chrome 88 trở lên

### Lỗi "Failed to load extension":
- Kiểm tra cấu trúc thư mục có đúng không
- Đảm bảo tất cả file cần thiết đều có
- Kiểm tra manifest.json có lỗi syntax không

### Lỗi "Icons not found":
- Tạo lại icons bằng script Python ở trên
- Đảm bảo thư mục `icons/` có 3 file: icon16.png, icon48.png, icon128.png

### Lỗi "MQTT connection failed":
- Kiểm tra MQTT broker có chạy không
- Kiểm tra endpoint có đúng format không
- Test với HiveMQ online trước

### Extension không hiển thị icon:
- Click vào icon puzzle piece trong toolbar
- Tìm "MQTT Extension" và click "Pin"
- Hoặc reload extension

## 🔄 **Reload Extension:**

Khi sửa code, cần reload extension:
1. Vào `chrome://extensions/`
2. Tìm "MQTT Extension"
3. Click nút **"Reload"** (icon mũi tên tròn)

## 📚 **Tài liệu tham khảo:**

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)

## 🎯 **Kết quả mong đợi:**

Sau khi cài đặt thành công:
- ✅ Extension xuất hiện trong toolbar Chrome
- ✅ Click icon mở popup với giao diện đẹp
- ✅ Kết nối được với MQTT broker
- ✅ Nhận được message từ topic `extension/test/input`
- ✅ Console log hiển thị đầy đủ thông tin

---

**🎉 Chúc mừng! Extension đã được sửa lỗi CSP và sẵn sàng cài đặt!**

**💡 Lưu ý:** Lỗi CSP đã được giải quyết hoàn toàn. Extension giờ đây sử dụng MQTT.js library local và hoàn toàn an toàn. 