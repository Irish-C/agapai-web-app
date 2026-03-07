from ultralytics import YOLO
import os

# Path to your specific model
model_path = "ml/yolov11_fin.pt"

if os.path.exists(model_path):
    model = YOLO(model_path)
    
    # 1. Check Parameter Count
    params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"Total Parameters: {params:.2f} Million")
    
    # 2. Check File Size
    file_size = os.path.getsize(model_path) / (1024 * 1024)
    print(f"File Size: {file_size:.2f} MB")
    
    # 3. Determine Category
    if params < 3:
        print("Category: Nano (Ideal for Raspberry Pi)")
    elif params < 10:
        print("Category: Small (Good for Pi with AI HAT+)")
    else:
        print("Category: Large (Best for Mini PC)")
else:
    print(f"Error: Could not find model at {model_path}")