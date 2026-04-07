#!/usr/bin/env python3
import os
import sys
import traceback
try:
    import numpy as np
except Exception:
    print('numpy not available')
    sys.exit(2)

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml', 'best_openvino_model'))
print(f"[smoke_infer] MODEL_PATH={MODEL_PATH}")
if not os.path.exists(MODEL_PATH):
    print('[smoke_infer] Model path not found')
    sys.exit(3)

ov_dev_env = os.environ.get('OPENVINO_DEVICE') or os.environ.get('DEVICE') or 'HETERO:GPU,CPU'
# If the model path looks like an OpenVINO export, tell ultralytics to use the
# OpenVINO runtime (device='openvino') and rely on OPENVINO_DEVICE to select
# the target device (CPU/GPU/HETERO). Passing 'GPU' directly will be interpreted as
# a CUDA device by ultralytics and will fail when torch has no CUDA available.
is_ov_export = os.path.isdir(MODEL_PATH) and any(p.endswith('.xml') or p.endswith('.bin') for p in __import__('glob').glob(os.path.join(MODEL_PATH, '*')))
# When using an OpenVINO-exported model, pass a CPU-like device to ultralytics
# (for example 'cpu') and let the OpenVINO runtime pick the actual target via
# the OPENVINO_DEVICE env var (e.g. 'HETERO:GPU,CPU'). Passing 'GPU' directly is treated
# as a CUDA device by ultralytics and will error when CUDA isn't available.
DEVICE = 'cpu' if is_ov_export else ov_dev_env
print(f"[smoke_infer] Using predict device={DEVICE} (OPENVINO_DEVICE={ov_dev_env})")

try:
    from ultralytics import YOLO
except Exception as e:
    print('[smoke_infer] ultralytics not importable:', e)
    traceback.print_exc()
    sys.exit(4)

try:
    model = YOLO(MODEL_PATH, task='detect')
    print('[smoke_infer] Model object created:', type(model))
except Exception as e:
    print('[smoke_infer] Failed to construct YOLO model:', e)
    traceback.print_exc()
    sys.exit(5)

# Warmup predict on a tiny dummy image
img = np.zeros((640, 640, 3), dtype=np.uint8)
try:
    print('[smoke_infer] Running predict...')
    res = model.predict(source=img, device=DEVICE, imgsz=640, verbose=False)
    print('[smoke_infer] Predict returned, len(results)=', len(res) if res is not None else 'None')
    # Print a brief summary of first result if available
    if res and len(res) > 0:
        r0 = res[0]
        boxes = getattr(r0, 'boxes', None)
        n = len(boxes) if boxes is not None else 'unknown'
        print(f'[smoke_infer] First result boxes={n}')
    print('[smoke_infer] SMOKE TEST: SUCCESS')
    sys.exit(0)
except Exception as e:
    print('[smoke_infer] Predict failed:', e)
    traceback.print_exc()
    sys.exit(6)
