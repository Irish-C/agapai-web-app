🏡 AGAPAI: Smart Elderly Care Monitoring System

AGAPAI is a specialized web application designed for the real-time monitoring and centralized management of security cameras in elderly care facilities or households. It leverages real-time technologies to provide immediate alerts and a controlled environment for managing all devices and users.

✨ Core Features & Value Proposition

AGAPAI focuses on providing secure, reliable, and organized control over monitoring infrastructure.

Security & Access

Role-Based Access Control (RBAC): Restricts sensitive settings (User Management, Device Management) exclusively to Admin users, ensuring data integrity.

Secure Authentication: Uses modern JWT tokens for authenticated API communication.

Device & Data Management

Real-time Camera Feed Display: View live feeds from configured RTSP/HTTP cameras.

Unified Management Dashboard: Centralized screen for managing both Locations (e.g., Main Hall, Bedroom) and Cameras concurrently.

CRUD Operations: Full capability to Create, Read, Update, and Delete cameras and locations.

Scrollable Management Lists: Efficient display of large lists of devices and locations without cluttering the interface.

Modal Confirmation: Requires explicit confirmation for critical deletion actions (e.g., removing a camera or location).

Real-time Communication

Real-time Alerts: Receives immediate incident alerts (simulated via WebSockets) directly from the backend inference system.

Responsive Interface: User-friendly design adaptable to desktop and mobile views.

💻 Technologies Used

This project is built using a modern, asynchronous Python backend and a single-page React application.

Area

Technology

Purpose

Frontend

React.js (Vite)

User Interface and Client-Side Routing

Styling

Tailwind CSS (for single-file components)

Utility-first styling for fast, responsive design

APIs/Icons

React Router, Font Awesome (via React Icons)

Client-side routing and rich iconography

Backend

Python / Flask

Core RESTful API and Business Logic

Authentication

Flask-JWT-Extended / Bcrypt

Token-based security and password hashing

Database

SQLAlchemy

Python SQL Toolkit and ORM

Real-time

Flask-SocketIO (Eventlet)

Bi-directional communication for live frames and alerts

🚀 Installation & Setup

To run AGAPAI locally, you must set up both the backend and frontend environments.

1. Backend Setup (Python / Flask)

Assumes Python 3.9+ and pip are installed.

# Navigate to the backend directory
cd backend

# Create a virtual environment and activate it
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt 

# Set environment variables (FLASK_SECRET_KEY, DATABASE_URL, etc.)
# You will need to create a .env file here.

# Initialize the database (must be done once)
flask --app app create_db

# Seed initial data (optional, for testing)
flask --app app seed_db

# Run the Flask server with SocketIO (using eventlet)
python app.py


2. Frontend Setup (React / Vite)

Assumes Node.js and npm/yarn are installed.

# Navigate back to the root directory
cd ..

# Install Node dependencies
npm install

# Start the frontend application (which also proxies API calls to port 5000)
npm run dev


The application will typically be available at http://localhost:5173.