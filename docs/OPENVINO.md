
OpenVINO runtime notes
======================

Overview
- The target device has an Intel iGPU. To use the iGPU for inference you need both host drivers/runtime (Level Zero or Intel OpenCL) and OpenVINO installed inside the container.

Host prerequisites (install on the target machine)
- Linux (Ubuntu/Debian recommended):
  - Install Intel Compute Runtime / Level Zero and Intel OpenCL packages. Intel provides oneAPI packages and runtime debs. Minimal steps (Ubuntu example):

    sudo apt update
    sudo apt install -y wget gnupg2 lsb-release
    # Add Intel repository and install Level Zero and OpenCL (follow Intel's official docs for exact repo URL/version)
    wget -qO - https://apt.repos.intel.com/oneapi/gpg | sudo apt-key add -
    sudo sh -c 'echo "deb https://apt.repos.intel.com/oneapi all main" > /etc/apt/sources.list.d/intel-oneapi.list'
    sudo apt update
    sudo apt install -y intel-level-zero-generic-runtime opencl-intel

  - After installing, verify the host sees the device (example):

    sudo apt install -y intel-gpu-tools
    sudo intel_gpu_top --version || true
    # or check Level Zero devices
    ls /dev/ | grep ze || true

- Windows / WSL2:
  - On Windows, install Intel Graphics drivers and ensure Docker Desktop WSL2 integration supports GPU access. Follow Docker Desktop and Intel driver docs for WSL2 GPU support.

Container-side notes (what we changed)
- `openvino==2024.1.0` is pinned in `server/requirements.txt`.
- `server/Dockerfile` installs small runtime libs: `libnuma1`, `libtbb2`, `libgomp1`, and `lsb-release` to help OpenVINO and its wheels run inside the container.

Build & test (on the target machine after host drivers are installed)
1) Build the server image:

  docker compose build --progress=plain server

2) Start an interactive shell in the image to test OpenVINO:

  docker run --rm -it --entrypoint bash agapai-web-app-server

3) Inside the container run:

  python -c "from openvino.runtime import Core; print('devices=', Core().get_available_devices())"

Expected: a list that includes `GPU` or `GPU.X` when the host drivers/runtime are available to the container. If only `CPU` is printed, the host-level runtime is missing or not exposed.

Troubleshooting
- If OpenVINO shows only `CPU`: verify host Level Zero/OpenCL runtime is installed and that the container has access to the device (WSL2/Docker Desktop config or bind /dev entries for Level Zero).
- If you need stricter reproducibility, pin `openvino` to a specific micro version in `requirements.txt`.

Notes
- Docker cannot install kernel drivers — the host must provide the low-level driver/runtime. The container supplies the OpenVINO Python package and user-space libraries.

