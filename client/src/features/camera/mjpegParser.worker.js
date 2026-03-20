// Web Worker for MJPEG parsing - runs on separate thread
let buffer = new Uint8Array();
let frameCount = 0;
let lastLogTime = Date.now();

self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === 'append') {
    // Append new data to buffer
    const newBuffer = new Uint8Array(buffer.length + data.length);
    newBuffer.set(buffer, 0);
    newBuffer.set(data, buffer.length);
    buffer = newBuffer;

    // Parse frames
    const frames = [];
    while (buffer.length > 4) {
      // Find JPEG start (FFD8)
      let frameStart = -1;
      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === 0xff && buffer[i + 1] === 0xd8) {
          frameStart = i;
          break;
        }
      }

      if (frameStart === -1) {
        // No frame start found - discard old junk data
        if (buffer.length > 3000000) {
          buffer = buffer.slice(-1500000);
        } else {
          // Discard up to first valid JPEG boundary marker or trim if too much non-JPEG data
          let nextBoundary = buffer.indexOf(45); // Look for '-' character (boundary marker start)
          if (nextBoundary > 0 && nextBoundary < buffer.length - 10) {
            buffer = buffer.slice(nextBoundary);
          }
        }
        break;
      }

      // Find JPEG end (FFD9)
      let frameEnd = -1;
      for (let i = frameStart + 2; i < buffer.length - 1; i++) {
        if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
          frameEnd = i + 2;
          break;
        }
      }

      if (frameEnd === -1) {
        // Incomplete frame
        break;
      }

      // Extract frame
      const frameData = buffer.slice(frameStart, frameEnd);
      frames.push(frameData);
      frameCount++;

      // Log FPS
      const now = Date.now();
      if (now - lastLogTime >= 1000) {
        const fps = Math.round((frameCount / (now - lastLogTime)) * 1000);
        self.postMessage({ type: 'fps', fps });
        lastLogTime = now;
        frameCount = 0;
      }

      buffer = buffer.slice(frameEnd);
    }

    // Send parsed frames back to main thread
    if (frames.length > 0) {
      self.postMessage({
        type: 'frames',
        frames: frames.map(f => f.buffer),
      }, frames.map(f => f.buffer));
    }
  } else if (type === 'reset') {
    buffer = new Uint8Array();
    frameCount = 0;
    lastLogTime = Date.now();
  }
};
