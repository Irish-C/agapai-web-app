#!/usr/bin/env python3
"""
Re-export YOLO model for GPU optimization.

This script attempts to convert the model in a way that maximizes GPU compatibility.
Options include:
1. Using FP32 precision (instead of FP16) for better GPU support
2. Apply model optimization passes
3. Use quantization-aware settings
"""

import os
import sys
import shutil
from pathlib import Path

def export_model_for_gpu():
    """Export YOLO model with GPU-optimized settings."""
    try:
        from ultralytics import YOLO
    except Exception as e:
        print(f'❌ ultralytics not available: {e}')
        print('Install with: pip install ultralytics')
        return False
    
    try:
        print('=== GPU-Optimized Model Export ===\n')
        
        # The model is already in OpenVINO format
        # We need to check if we have the original PyTorch weights
        model_dir = Path(__file__).parent.parent / 'ml' / 'best_openvino_model'
        pytorch_model = model_dir.parent / 'best.pt'
        
        if not pytorch_model.exists():
            print(f'❌ Original PyTorch model not found: {pytorch_model}')
            print('   Cannot re-export without original weights')
            print('   The current model is already in OpenVINO format')
            print()
            print('=== Alternative: Apply OpenVINO Optimization ===')
            print('Using TRANSFORM optimization pass on existing model...')
            
            # Try to optimize the existing model
            try:
                from openvino.tools import mo
                from openvino import Core
                
                xml_path = model_dir / 'best.xml'
                bin_path = model_dir / 'best.bin'
                
                print(f'Loading model from: {xml_path}')
                core = Core()
                model = core.read_model(model=str(xml_path))
                
                # Apply transformations for better GPU support
                from openvino.runtime import passes
                manager = passes.PassManager()
                
                # Add optimization passes
                manager.register_pass(passes.ConvertQuantizedStatisticsToFloat())
                manager.register_pass(passes.SimplifyShapeOfSubGraphs())
                manager.run_passes(model)
                
                print('✅ Applied optimization passes')
                
                # Save optimized model
                backup_dir = model_dir.parent / 'best_openvino_model_backup'
                if backup_dir.exists():
                    shutil.rmtree(backup_dir)
                shutil.copytree(model_dir, backup_dir)
                print(f'   Backup saved to: {backup_dir}')
                
                # Serialize optimized model
                from openvino import serialize
                serialize(model, str(xml_path), str(bin_path))
                print(f'✅ Optimized model saved')
                
                return True
            except Exception as e:
                print(f'Note: Advanced optimization not available: {e}')
                return False
        
        else:
            print(f'Found PyTorch model: {pytorch_model}')
            print('Re-exporting with GPU-optimized settings...\n')
            
            # Load the PyTorch model
            model = YOLO(str(pytorch_model))
            
            # Backup the current OpenVINO model
            backup_dir = model_dir.parent / 'best_openvino_model_backup'
            if backup_dir.exists():
                shutil.rmtree(backup_dir)
            shutil.copytree(model_dir, backup_dir)
            print(f'✅ Backup saved to: {backup_dir}\n')
            
            # Export with GPU-optimized settings
            # FP32 precision typically has better GPU support than FP16
            export_path = model.export(
                format='openvino',
                imgsz=640,
                half=False,  # Use FP32 instead of FP16 for better GPU support
                optimize=True,  # Enable model optimization
                device='cpu',  # Export device (not inference device)
            )
            
            print(f'✅ Model exported to: {export_path}')
            print('   Precision: FP32 (better GPU compatibility)')
            print('   Optimization: Enabled')
            
            return True
            
    except Exception as e:
        print(f'❌ Export failed: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = export_model_for_gpu()
    if success:
        print('\n=== Testing GPU Inference ===')
        try:
            from openvino.runtime import Core
            import numpy as np
            
            core = Core()
            model_dir = Path(__file__).parent.parent / 'ml' / 'best_openvino_model'
            xml_path = model_dir / 'best.xml'
            
            print(f'Loading optimized model: {xml_path}')
            model = core.read_model(model=str(xml_path))
            
            # Try GPU compilation
            try:
                compiled_gpu = core.compile_model(model=model, device_name='GPU')
                print('✅ GPU compilation successful!')
            except Exception as e:
                print(f'⚠️  GPU compilation failed (using HETERO fallback)')
                print(f'   {str(e)[:100]}...')
                
                # Try HETERO
                compiled_hetero = core.compile_model(model=model, device_name='HETERO:GPU,CPU')
                print('✅ HETERO:GPU,CPU compilation successful')
                
        except Exception as e:
            print(f'Test error: {e}')
    
    sys.exit(0 if success else 1)
