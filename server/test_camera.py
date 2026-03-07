import sys
import cv2

# Replace with your camera's actual RTSP URL
# Format: rtsp://username:password@IP_ADDRESS:PORT/stream_path
rtsp_url = sys.argv[1] if len(sys.argv) > 1 else "default_url"


print("Connecting to camera...")
cap = cv2.VideoCapture(rtsp_url)

if not cap.isOpened():
    print("Error: Could not open the stream. Check your LAN cable and IP address.")
else:
    ret, frame = cap.read()
    if ret:
        print("Success! Connection established.")
        cv2.imshow('LAN Camera Test', frame)
        cv2.waitKey(0) # Press any key to close the window
    else:
        print("Error: Could not read a frame from the stream.")

cap.release()
cv2.destroyAllWindows()