# AGAPAI Documentation Hub

Welcome! This is the central hub for all AGAPAI documentation. All guides are in one easy-to-navigate folder.

---

## Getting Started

- [README.md](../README.md) - Setup instructions and project overview

---

## 📚 All Documentation

### 🎥 Video Streaming & Cameras

- **[Streaming Setup Guide](STREAMING_SETUP.md)** - How the relay architecture works, configuration, troubleshooting
- **[Camera Streaming Guide](CAMERA_STREAMING_GUIDE.md)** - Camera workflow and streaming operations

### 🚨 Alert System

- **[Alert System Guide](ALERT_SYSTEM.md)** - Fall detection, 3-tier inactivity alerts, Socket.IO events, testing, database schema, priority mapping

### 🤖 Activity Detection & AI

- **[Activity Detection Guide](ACTIVITY_DETECTION_GUIDE.md)** - Overview of detectable activities, color scheme, confidence thresholds
- **[Activity Detection Implementation](ACTIVITY_DETECTION_IMPLEMENTATION.md)** - Technical implementation details
- **[Activity Detection Quick Reference](ACTIVITY_DETECTION_QUICK_REF.md)** - Color codes and activity list (quick lookup)
- **[AI Debug Features](AI_DEBUG_FEATURES.md)** - Debug output documentation and logging

### 🔌 Architecture & Infrastructure

- **[Auto Reconnect & Sync System](AUTO_RECONNECT_AND_SYNC.md)** - Socket.IO resilience, health checks, auto-reconnection, missed-alert sync
- **[Redis Enhancement](REDIS_ENHANCEMENT.md)** - Frame caching, pub/sub, real-time messaging
- **[GPU Optimization](GPU_OPTIMIZATION.md)** - Hardware acceleration analysis, HETERO:GPU,CPU mode, performance metrics

### 📋 Reference & Configuration

- **[App Overview](APP.md)** - Product features, UI description, RBAC, authentication
- **[Rate Limiting](RATE_LIMITING.md)** - API rate limit configuration by environment
- **[Socket.IO Testing](SOCKET_IO_TESTING.md)** - Connection testing, health check scenarios, troubleshooting
- **[OpenVINO GPU Setup](OPENVINO.md)** - GPU driver installation, Docker setup, iGPU acceleration

---

## 🔍 Quick Lookup by Task

**I want to...**

| Task | Read This |
|------|-----------|
| Set up camera streaming | [Streaming Setup Guide](STREAMING_SETUP.md) |
| Understand activity detection | [Activity Detection Guide](ACTIVITY_DETECTION_GUIDE.md) |
| Debug AI/YOLO issues | [AI Debug Features](AI_DEBUG_FEATURES.md) |
| Configure alerts | [Alert System Guide](ALERT_SYSTEM.md) |
| Understand auto-reconnect | [Auto Reconnect & Sync](AUTO_RECONNECT_AND_SYNC.md) |
| Setup GPU acceleration | [OpenVINO GPU Setup](OPENVINO.md) |
| Configure rate limiting | [Rate Limiting](RATE_LIMITING.md) |
| Test Socket.IO connection | [Socket.IO Testing](SOCKET_IO_TESTING.md) |
| Check activity color codes | [Activity Quick Reference](ACTIVITY_DETECTION_QUICK_REF.md) |

---

## 📂 Documentation Files

All files are organized in a single `docs/` folder for easy access:

```
docs/
├── GUIDES.md (this file)
├── STREAMING_SETUP.md
├── CAMERA_STREAMING_GUIDE.md
├── ALERT_SYSTEM.md
├── ACTIVITY_DETECTION_GUIDE.md
├── ACTIVITY_DETECTION_IMPLEMENTATION.md
├── ACTIVITY_DETECTION_QUICK_REF.md
├── AI_DEBUG_FEATURES.md
├── AUTO_RECONNECT_AND_SYNC.md
├── REDIS_ENHANCEMENT.md
├── GPU_OPTIMIZATION.md
├── APP.md
├── RATE_LIMITING.md
├── SOCKET_IO_TESTING.md
└── OPENVINO.md
```

---

## 💡 Pro Tips

- **Quick Reference**: Use [Activity Quick Reference](ACTIVITY_DETECTION_QUICK_REF.md) for instant color/activity lookup
- **Troubleshooting**: Each major guide has its own troubleshooting section
- **Testing**: See [Socket.IO Testing](SOCKET_IO_TESTING.md) for realistic test scenarios
- **Debug**: Look for colored output in [AI Debug Features](AI_DEBUG_FEATURES.md)

---

## 🔗 Back to Project

- [Back to README](../README.md)

```
docs/
├── GUIDES.md                          👈 You are here
├── guides/
│   ├── STREAMING_SETUP.md            # Video streaming architecture
│   ├── CAMERA_STREAMING_GUIDE.md     # Camera operations
│   └── ALERT_SYSTEM.md               # Fall/inactivity alerts
├── features/
│   ├── ACTIVITY_DETECTION_GUIDE.md   # AI activity recognition
│   ├── ACTIVITY_DETECTION_IMPLEMENTATION.md
│   ├── ACTIVITY_DETECTION_QUICK_REF.md
│   └── AI_DEBUG_FEATURES.md          # Debug guide
├── architecture/
│   ├── AUTO_RECONNECT_AND_SYNC.md   # Socket.IO resilience
│   ├── REDIS_ENHANCEMENT.md         # Caching system
│   └── GPU_OPTIMIZATION.md          # Hardware acceleration
├── reference/
│   ├── APP.md                       # Product overview
│   ├── RATE_LIMITING.md             # API limits
│   └── SOCKET_IO_TESTING.md         # Connection tests
└── server/
    ├── OPENVINO.md                  # GPU driver setup
    └── RATE_LIMITING.md             # Server config
```

---

## 💡 Pro Tips

- **Quick Reference**: Use [Activity Quick Reference](ACTIVITY_DETECTION_QUICK_REF.md) for instant color/activity lookup
- **Troubleshooting**: Each major guide has its own troubleshooting section
- **Testing**: See [Socket.IO Testing](SOCKET_IO_TESTING.md) for realistic test scenarios
- **Debug**: Look for colored output in [AI Debug Features](AI_DEBUG_FEATURES.md)

---

## 🔗 Back to Project

- [Back to README](../README.md)
