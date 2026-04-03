#!/usr/bin/env python3
import os
import sys
try:
    import importlib.util
    if not importlib.util.find_spec('openvino.runtime'):
        print('openvino.runtime not installed')
        sys.exit(2)
    from openvino.runtime import Core
    core = Core()
    devs = core.get_available_devices()
    print('OpenVINO available devices:', devs)
    # Also print environment hints
    print('OPENVINO_DEVICE env:', os.environ.get('OPENVINO_DEVICE'))
    print('DEVICE env:', os.environ.get('DEVICE'))
    try:
        from openvino.runtime import get_version
        try:
            print('OpenVINO version:', get_version())
        except Exception:
            pass
    except Exception:
        pass
except Exception as e:
    print('Failed to query OpenVINO devices:', e)
    sys.exit(1)
