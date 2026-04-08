#!/usr/bin/env python3
"""
Verify GPU and OpenVINO device availability.
Lists all available compute devices that OpenVINO can use.
"""

def verify_openvino():
    try:
        from openvino.runtime import Core
        
        print("=" * 70)
        print("OpenVINO Device Verification")
        print("=" * 70)
        
        core = Core()
        devices = core.available_devices
        
        print(f"\nAvailable devices: {len(devices)}")
        for device in devices:
            print(f"  - {device}")
        
        # Try to get device properties
        print("\nDevice properties:")
        for device in devices:
            try:
                props = core.get_property(device)
                print(f"\n  {device}:")
                if hasattr(props, 'items'):
                    for key, val in props.items():
                        print(f"    {key}: {val}")
            except Exception as e:
                print(f"    (Could not read properties: {e})")
        
        print("\n✓ OpenVINO runtime is available")
        return True
        
    except ImportError:
        print("✗ OpenVINO not installed")
        print("  Install with: pip install openvino")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    verify_openvino()
