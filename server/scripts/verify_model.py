#!/usr/bin/env python3
"""
Verify YOLO model is present and loadable by OpenVINO.
"""

from pathlib import Path
import sys

def verify_model():
    try:
        from openvino.runtime import Core
        
        print("=" * 70)
        print("YOLO Model Verification")
        print("=" * 70)
        
        model_dir = Path(__file__).parent.parent / 'ml' / 'best_openvino_model'
        xml_path = model_dir / 'best.xml'
        bin_path = model_dir / 'best.bin'
        
        # Check files exist
        print(f"\nModel location: {model_dir}")
        print(f"  XML file: {xml_path.name} - {'✓' if xml_path.exists() else '✗ MISSING'}")
        print(f"  BIN file: {bin_path.name} - {'✓' if bin_path.exists() else '✗ MISSING'}")
        
        if not (xml_path.exists() and bin_path.exists()):
            print("\n✗ Model files missing or incomplete")
            return False
        
        # Try to load model
        print("\nLoading model with OpenVINO...")
        core = Core()
        model = core.read_model(model=str(xml_path))
        
        print(f"  Inputs: {len(model.inputs)}")
        for inp in model.inputs:
            print(f"    - {inp.name}: {inp.shape}")
        
        print(f"  Outputs: {len(model.outputs)}")
        for outp in model.outputs:
            print(f"    - {outp.name}: {outp.shape}")
        
        print("\n✓ Model loaded successfully")
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("  Install with: pip install openvino")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = verify_model()
    sys.exit(0 if success else 1)
