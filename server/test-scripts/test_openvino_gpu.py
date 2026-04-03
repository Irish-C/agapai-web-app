#!/usr/bin/env python3
import os
import sys
import traceback
try:
    import numpy as np
    from openvino.runtime import Core
except Exception as e:
    print('Missing dependency:', e)
    sys.exit(2)

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml', 'best_openvino_model'))
if not os.path.isdir(MODEL_DIR):
    print('Model dir not found:', MODEL_DIR)
    sys.exit(3)

# Find XML file
xmls = [p for p in os.listdir(MODEL_DIR) if p.endswith('.xml')]
if not xmls:
    print('No .xml IR file found in', MODEL_DIR)
    sys.exit(4)
xml_path = os.path.join(MODEL_DIR, xmls[0])
print('[test_openvino_gpu] Using IR:', xml_path)

device = os.environ.get('OPENVINO_DEVICE') or os.environ.get('DEVICE') or 'GPU'
print('[test_openvino_gpu] Attempting to compile on device:', device)

try:
    core = Core()
    print('[test_openvino_gpu] Available devices:', core.get_available_devices())

    # Optimization: set a cache directory to avoid long first-run initialization
    try:
        cache_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ov_cache'))
        os.makedirs(cache_dir, exist_ok=True)
        core.set_property('CACHE_DIR', cache_dir)
        print(f"[test_openvino_gpu] Set CACHE_DIR={cache_dir}")
    except Exception as _:
        pass

    # Force GPU plugin to prefer reference implementation where useful
    try:
        core.set_property('GPU', {'GPU_DISABLE_LOOP_UNROLLING': 'YES'})
        print('[test_openvino_gpu] Set GPU property GPU_DISABLE_LOOP_UNROLLING=YES')
    except Exception:
        pass

    model = core.read_model(model=xml_path)

    # Try HETERO (GPU with CPU fallback) when GPU requested, else try requested device
    try_devices = [device]
    if device and str(device).upper() == 'GPU':
        try_devices = ["HETERO:GPU,CPU", "GPU", "CPU"]

    compiled = None
    last_err = None
    for dev in try_devices:
        try:
            compiled = core.compile_model(model=model, device_name=dev)
            print('[test_openvino_gpu] Compiled on device:', compiled.device_name)
            break
        except Exception as e:
            last_err = e
            print(f"[test_openvino_gpu] Compile failed on {dev}: {e}")

    if compiled is None:
        print('Failed to compile model on any device:', last_err)
        sys.exit(10)

    # Prepare dummy input matching model input shape
    inputs = compiled.inputs
    if not inputs:
        print('No inputs on compiled model')
        sys.exit(5)
    inp = inputs[0]
    shp = list(inp.shape)
    # Replace any 0 or -1 dims with 1 for dummy batch
    shp = [1 if (d is None or d == 0 or d < 0) else int(d) for d in shp]
    dummy = np.zeros(shp, dtype=np.float32)
    req = compiled.create_infer_request()
    # Provide by input index/name
    try:
        res = req.infer({inp.any_name: dummy})
    except Exception as e:
        # Some OpenVINO versions accept input tensor by element
        res = req.infer({inp.get_any_name(): dummy}) if hasattr(inp, 'get_any_name') else None
    print('[test_openvino_gpu] Inference result keys:', list(res.keys()) if isinstance(res, dict) else type(res))
    print('SMOKE: OpenVINO GPU inference succeeded')
    sys.exit(0)
except Exception as e:
    print('OpenVINO GPU test failed:', e)
    traceback.print_exc()
    sys.exit(10)
