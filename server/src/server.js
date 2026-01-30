import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db.js';

// 1. Load Environment Variables
dotenv.config();

// 2. Initialize Express
const app = express();
const PORT = 3000;

// 3. Global BigInt Fix
// This must stay! It prevents errors when sending database IDs to the frontend.
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// 4. Middleware
app.use(cors());           // Allows your React app to talk to this server
app.use(express.json());   // Allows the server to read JSON data in requests

// 5. Test Route
// Visit http://localhost:3000/ in your browser to check if it works
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Agapai API is active' });
});

// 6. Example Database Route
// This uses your Prisma client to fetch from the 'camera' table
app.get('/api/cameras', async (req, res) => {
  try {
    const cameras = await prisma.camera.findMany();
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. START THE SERVER
// This keeps the process alive!
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// 8. Keep-Alive Heartbeat
setInterval(() => {
  // Heartbeat to keep the event loop busy
}, 1000 * 60 * 60);