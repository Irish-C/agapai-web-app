import socketio
import time

sio = socketio.Client()

@sio.event
def connect():
    print("✅ Test Script Connected to Server")

# Simulate the AI sending a 'fall_detected' event
def send_test_fall():
    sio.connect('http://127.0.0.1:5000')
    test_data = {
        'camera_id': 'CAM-01',
        'location': 'Living Room',
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'image_url': 'https://via.placeholder.com/300'
    }
    print("🚨 Sending Fall Alert...")
    sio.emit('new_alert', test_data)
    time.sleep(2)
    sio.disconnect()

if __name__ == '__main__':
    send_test_fall()