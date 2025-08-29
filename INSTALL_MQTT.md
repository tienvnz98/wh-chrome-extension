# Hướng dẫn cài đặt MQTT.js

## Tải MQTT.js thực tế

File `mqtt.min.js` hiện tại là một implementation đơn giản. Để sử dụng MQTT.js chính thức, hãy làm theo các bước sau:

### Phương pháp 1: Download trực tiếp

```bash
# Tải MQTT.js mới nhất
curl -o mqtt.min.js https://unpkg.com/mqtt@latest/dist/mqtt.min.js

# Hoặc tải phiên bản cụ thể
curl -o mqtt.min.js https://unpkg.com/mqtt@5.3.5/dist/mqtt.min.js
```

### Phương pháp 2: Sử dụng npm

```bash
# Cài đặt MQTT.js
npm install mqtt

# Copy file từ node_modules
cp node_modules/mqtt/dist/mqtt.min.js ./
```

### Phương pháp 3: Tải từ GitHub

1. Truy cập: https://github.com/mqttjs/MQTT.js
2. Download file `mqtt.min.js` từ thư mục `dist/`
3. Đặt vào thư mục gốc của extension

## Kiểm tra MQTT.js

Sau khi tải file, kiểm tra xem MQTT.js có hoạt động không:

1. Mở popup của extension
2. Mở Developer Tools (F12)
3. Kiểm tra console có lỗi gì không
4. Kiểm tra `window.mqtt` có tồn tại không

## Cấu hình MQTT Broker

### Test với MQTT Broker local

1. **Mosquitto** (Linux/Mac):
```bash
# Cài đặt
sudo apt-get install mosquitto mosquitto-clients

# Khởi động với WebSocket support
mosquitto -c /etc/mosquitto/mosquitto.conf
```

2. **Eclipse Mosquitto** (Windows):
   - Download từ: https://mosquitto.org/download/
   - Cấu hình WebSocket port 9001

3. **HiveMQ** (Online):
   - Truy cập: https://www.hivemq.com/public-mqtt-broker/
   - Endpoint: `wss://broker.hivemq.com:8884`

### Cấu hình mosquitto.conf

```conf
# WebSocket port
listener 9001
protocol websockets

# MQTT port
listener 1883
protocol mqtt
```

## Test Extension

1. **Kết nối**:
   - Endpoint: `ws://localhost:9001`
   - Device Name: `TestDevice`

2. **Publish message**:
```bash
# Sử dụng mosquitto_pub
mosquitto_pub -h localhost -t "extension/test/input" -m "Hello from MQTT!"

# Hoặc sử dụng MQTT client online
```

3. **Kiểm tra console**:
   - Mở Developer Tools
   - Xem console log
   - Message sẽ hiển thị với format:
     ```
     Received MQTT message:
     Topic: extension/test/input
     Message: Hello from MQTT!
     Device Name: TestDevice
     Timestamp: 2024-01-01T12:00:00.000Z
     ```

## Troubleshooting

### Lỗi WebSocket
- Kiểm tra MQTT broker có chạy không
- Kiểm tra port WebSocket có mở không
- Kiểm tra firewall

### Lỗi MQTT.js
- Đảm bảo file `mqtt.min.js` đã được tải đúng
- Kiểm tra console có lỗi JavaScript không
- Reload extension sau khi thay đổi file

### Lỗi kết nối
- Kiểm tra endpoint format: `ws://` hoặc `wss://`
- Kiểm tra MQTT broker có hỗ trợ WebSocket không
- Test với MQTT broker online trước

## Tài liệu tham khảo

- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [MQTT Protocol](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [WebSocket MQTT](https://www.hivemq.com/blog/mqtt-over-websockets-with-mosquitto/) 