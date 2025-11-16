# 🏡 **AGAPAI: Smart Elderly Care Monitoring System**

**AGAPAI** is a specialized web application built for **real-time monitoring** and **centralized management** of security cameras in elderly care facilities or homes. It uses modern technologies to deliver instant alerts, streamlined device control, and secure user access.

---

## ✨ **Core Features & Value Proposition**

AGAPAI ensures **secure**, **reliable**, and **organized** control over your monitoring infrastructure.

---

### 🔐 **Security & Access**

- **Role-Based Access Control (RBAC):**  
  Limits sensitive settings (User Management, Device Management) to **Admin-only** operations.

- **Secure Authentication:**  
  Implements JWT-based authentication for protected API usage.

---

### 📷 **Device & Data Management**

- **Real-Time Camera Feeds:**  
  Stream live RTSP/HTTP camera feeds directly from the dashboard.

- **Unified Management Dashboard:**  
  Manage **Locations** and **Cameras** in a single, structured interface.

- **Full CRUD Support:**  
  Create, read, update, and delete all cameras and locations.

- **Scrollable Lists:**  
  Clean UI for handling large device/location lists without clutter.

- **Safety Prompts:**  
  Critical actions (like deleting devices or locations) require confirmation via modal pop-ups.

---

### ⚡ **Real-Time Communication**

- **Instant Alerts:**  
  Receives simulated fall/inactivity alerts via WebSockets from the backend inference engine.

- **Responsive UI:**  
  Smooth experience across desktop and mobile devices.

---

## 💻 **Technologies Used**

A modern, asynchronous backend paired with a dynamic React frontend.

| Area | Technology | Purpose |
|------|------------|---------|
| **Frontend** | React.js (Vite) | UI framework & client-side routing |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **APIs / Icons** | React Router, React Icons | Routing & iconography |
| **Backend** | Python / Flask | RESTful API + core logic |
| **Authentication** | Flask-JWT-Extended, Bcrypt | Secure token auth + password hashing |
| **Database** | SQLAlchemy | ORM & database modeling |
| **Real-time** | Flask-SocketIO (Eventlet) | WebSocket-based live updates & alerts |

---

## 🚀 **Installation & Setup**

To run AGAPAI locally, install and configure both the backend and frontend components.

---

### 1. **Backend Setup (Python / Flask)**

_Requires Python 3.9+ installed on your machine._
