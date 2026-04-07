#!/usr/bin/env python3
"""
Quick test to verify YOLO can detect people in a test image.
"""
import sys
import os
from pathlib import Path

# Add server to path
server_root = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(server_root))

def test_yolo():
    print("=" * 70)
    print("YOLO DETECTION TEST")
    print("=" * 70)
    
    # Test 1: Check if model exists
    print("\n[TEST 1] Checking if model exists...")
    model_path = os.path.join(server_root, 'ml', 'best_openvino_model')
    print(f"  Model path: {model_path}")
    print(f"  Exists: {os.path.exists(model_path)}")
    
    if os.path.exists(model_path):
        files = os.listdir(model_path)
        print(f"  Files in directory: {files}")
        has_xml = any(f.endswith('.xml') for f in files)
        has_bin = any(f.endswith('.bin') for f in files)
        print(f"  Has .xml: {has_xml}, Has .bin: {has_bin}")
    
    # Test 2: Try loading YOLO
    print("\n[TEST 2] Loading YOLO model...")
    try:
        from ultralytics import YOLO
        
        os.environ['OPENVINO_DEVICE'] = 'HETERO:GPU,CPU'
        print(f"  OPENVINO_DEVICE set to: {os.environ.get('OPENVINO_DEVICE')}")
        
        model = YOLO(model_path, task='detect')
        print("  ✓ Model loaded successfully!")
        
        # Check device
        try:
            device = model.device.type if hasattr(model, 'device') else 'UNKNOWN'
            print(f"  Actual device: {device}")
        except:
            print("  Could not determine actual device")
        
        # Check classes
        if hasattr(model, 'names'):
            print(f"  Model classes: {list(model.names.values())}")
            if 'person' in list(model.names.values()):
                print("  ✓ Model includes 'person' class")
            else:
                print("  ✗ WARNING: Model does NOT include 'person' class!")
        
    except Exception as e:
        print(f"  ✗ Failed to load YOLO: {e}")
        return False
    
    # Test 3: Test detection on a sample image
    print("\n[TEST 3] Testing detection on sample image...")
    try:
        import cv2
        import numpy as np
        
        # Create a test image with a simple object
        test_img = np.ones((480, 640, 3), dtype=np.uint8) * 255  # White image
        
        # Draw a simple shape that might trigger person detection
        cv2.rectangle(test_img, (100, 100), (300, 400), (0, 0, 255), -1)  # Red rectangle
        
        print("  Running inference...")
        results = model.predict(source=test_img, conf=0.3, imgsz=640, verbose=False)
        
        print(f"  Results: {len(results)} result(s)")
        if results and len(results) > 0:
            r = results[0]
            boxes = getattr(r, 'boxes', None)
            if boxes is not None:
                print(f"  Detections found: {len(boxes)}")
                for i, box in enumerate(boxes):
                    conf = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                    cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                    label = model.names.get(cls_id, f"Class {cls_id}") if hasattr(model, 'names') else f"Class {cls_id}"
                    print(f"    Box {i}: {label} (confidence={conf:.2%})")
            else:
                print("  No boxes detected")
        else:
            print("  ✗ No results returned from YOLO")
        
    except Exception as e:
        print(f"  ✗ Detection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)
    return True

if __name__ == '__main__':
    success = test_yolo()
    sys.exit(0 if success else 1)
