# AGAPAI: Monitoring and Alert System for Elderly Care

**AGAPAI** is a specialized web application built for **real-time monitoring** and **centralized management** of 
security cameras in elderly care facilities or homes. It uses modern technologies to deliver instant alerts, 
streamlined device control, and secure user access.

## Table of Contents

- [Screenshots](#screenshots)
- [Core Features](#core-features)
- [Security & Access](#security--access)
- [Device & Data Management](#device--data-management)


## Screenshots
![Agapai poster/Screenshot Placeholder]

## Core Features

- **Camera Management:**
  Add, edit, and delete camera devices with real-time feed previews.

- **Location Management:**
  Organize cameras by physical locations (rooms, Hallways).

- **User Authentication:**
  Secure login system with role-based access control (Admin/User).

- **Real-Time Alerts:**
  Receive instant notifications for detected falls or inactivity.

- **Connection Resilience:**
  Socket.IO auto-reconnect with health checks, camera re-subscription, and missed-alert sync after reconnect.

## Realtime Reliability Documentation

Detailed technical documentation for reconnect, sync, and QA scenarios:

- [AUTO_RECONNECT_AND_SYNC.md](AUTO_RECONNECT_AND_SYNC.md)
- [RECONNECT_VERIFICATION.md](RECONNECT_VERIFICATION.md)
- [SOCKET_IO_TESTING.md](SOCKET_IO_TESTING.md)

## Security & Access

- **Role-Based Access Control (RBAC):**
  Limits sensitive settings (User Management, Device Management) to **Admin-only** operations.

- **Secure Authentication:**
  Implements JWT-based authentication for protected API usage.

## Device & Data Management

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


## Acknowledgements

We would like to thank the open-source community for their invaluable contributions and resources that have helped in the development of this project.
[FastAPI](https://fastapi.tiangolo.com/), [Vite](https://vitejs.dev/), [React](https://reactjs.org/), 
[Prisma](https://www.prisma.io/), [Socket.IO](https://socket.io/), [Tailwind CSS](https://tailwindcss.com/),
[JWT](https://jwt.io/), [Concurrently](https://www.npmjs.com/package/concurrently), and many others.

