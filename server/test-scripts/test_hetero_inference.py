#!/usr/bin/env python3
"""Test OpenVINO inference with HETERO:GPU,CPU device."""
import os
import sys
import time
import traceback

try:
    from openvino.runtime import Core
    import numpy as np
except Exception as e:
    print(f'Missing dependency: {e}')
    sys.exit(2)

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml', 'best_openvino_model'))
if not os.path.isdir(MODEL_DIR):
    print(f'Model dir not found: {MODEL_DIR}')
    sys.exit(3)

# Find XML file
xmls = [p for p in os.listdir(MODEL_DIR) if p.endswith('.xml')]
if not xmls:
    print(f'No .xml IR file found in {MODEL_DIR}')
    sys.exit(4)
xml_path = os.path.join(MODEL_DIR, xmls[0])
print(f'[test_hetero] Using IR: {xml_path}')

try:
    core = Core()
    print(f'[test_hetero] Available devices: {core.get_available_devices()}')
    
    # Set cache to speedup compilation
    cache_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ov_cache'))
    os.makedirs(cache_dir, exist_ok=True)
    core.set_property({'CACHE_DIR': cache_dir})
    print(f'[test_hetero] Set CACHE_DIR={cache_dir}')
    
    # Read the model
    model = core.read_model(model=xml_path)
    print('[test_hetero] Model read successfully')
    
    # Compile with HETERO device - GPU will handle what it can, CPU for unsupported ops
    print('[test_hetero] Compiling with HETERO:GPU,CPU...')
    compiled = core.compile_model(model=model, device_name='HETERO:GPU,CPU')
    print(f'[test_hetero] Model compiled on device')
    
    # Prepare input
    inputs = compiled.inputs
    inp = inputs[0]
    shp = list(inp.shape)
    # Replace dynamic dims with 1
    shp = [1 if (d is None or d == 0 or d < 0) else int(d) for d in shp]
    dummy = np.zeros(shp, dtype=np.float32)
    
    # Run inference
    print('[test_hetero] Running inference...')
    req = compiled.create_infer_request()
    
    # Time the inference
    t0 = time.time()
    res = req.infer({inp.any_name: dummy})
    t1 = time.time()
    infer_ms = (t1 - t0) * 1000
    
    print(f'[test_hetero] Inference completed in {infer_ms:.2f}ms')
    print(f'[test_hetero] Result keys: {list(res.keys()) if isinstance(res, dict) else type(res)}')
    
    # Try with ultralytics
    print('\n[test_hetero] Testing with ultralytics...')
    try:
        from ultralytics import YOLO
        model_yolo = YOLO(MODEL_DIR, task='detect')
        
        # Create dummy image
        dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
        
        # Predict
        print('[test_hetero] Running ultralytics predict...')
        t0 = time.time()
        results = model_yolo.predict(source=dummy_img, device='cpu', imgsz=640, verbose=False)
        t1 = time.time()
        ultralytics_ms = (t1 - t0) * 1000
        
        print(f'[test_hetero] Ultralytics inference completed in {ultralytics_ms:.2f}ms')
        if results and len(results) > 0:
            r = results[0]
            boxes = getattr(r, 'boxes', None)
            n = len(boxes) if boxes is not None else 0
            print(f'[test_hetero] Detections: {n}')
        print('[test_hetero] ✅ HETERO GPU INFERENCE SUCCESS')
        sys.exit(0)
    except Exception as e:
        print(f'[test_hetero] Ultralytics test failed: {e}')
        traceback.print_exc()
        sys.exit(1)

except Exception as e:
    print(f'[test_hetero] Test failed: {e}')
    traceback.print_exc()
    sys.exit(10)
