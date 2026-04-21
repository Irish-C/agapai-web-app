FROM python:3.10-slim

WORKDIR /app

# Install dependencies for OpenCV/OpenVINO
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx libglib2.0-0 gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service logic
COPY . .

# If the AI service exposes an API, expose the port here
# EXPOSE 5001

# Command to run the Flask app/service
CMD ["python", "app.py"]