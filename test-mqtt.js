const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://45.76.158.124:1883');

client.on('connect', function () {
    setInterval(function () {
        const payload = {
            "timestamp": "2025-08-29T08:27:25.686Z",
            "deviceName": "android_device",
            "data": {
                "rssi": -45,
                "epc": `${Date.now()}`,
                "freq": 915,
                "ant": 1
            }
        };
        client.publish('desktop/device/jmt/receiver', JSON.stringify(payload), function (err) {
            if (err) {
                console.error('Failed to publish:', err);
            } else {
                console.log('Payload published:', payload);
            }
        });
    }, 500); // Publish every 2 seconds
});
