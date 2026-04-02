// Web Worker for MJPEG parsing - runs on separate thread
let buffer = new Uint8Array();
let frameCount = 0;
let lastLogTime = Date.now();

// Helper: find sequence in buffer
function indexOfSequence(buf, seq, from = 0) {
  for (let i = from; i <= buf.length - seq.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length; j++) {
      if (buf[i + j] !== seq[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

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
      const frameStart = indexOfSequence(buffer, new Uint8Array([0xff, 0xd8]));
      if (frameStart === -1) {
        // No frame start found - discard old junk data if too large
        if (buffer.length > 3000000) {
          buffer = buffer.slice(-1500000);
        }
        break;
      }

      // Find JPEG end (FFD9) after start
      const frameEndRel = indexOfSequence(buffer, new Uint8Array([0xff, 0xd9]), frameStart + 2);
      if (frameEndRel === -1) {
        // Incomplete frame
        break;
      }

      const frameEnd = frameEndRel + 2;

      // Extract frame
      const frameData = buffer.slice(frameStart, frameEnd);
      frames.push(frameData);
      frameCount++;

      // Log FPS roughly once per second
      const now = Date.now();
      if (now - lastLogTime >= 1000) {
        const fps = Math.round((frameCount / (now - lastLogTime)) * 1000);
        self.postMessage({ type: 'fps', fps });
        lastLogTime = now;
        frameCount = 0;
      }

      buffer = buffer.slice(frameEnd);
    }

    // If frames found, decode the newest frame into an ImageBitmap (off-main-thread) and send that.
    if (frames.length > 0) {
      // Prefer decoding only the latest frame to avoid unnecessary work
      const latest = frames[frames.length - 1];

      (async () => {
        try {
          const blob = new Blob([latest], { type: 'image/jpeg' });
          // decode off-main-thread
          const bitmap = await createImageBitmap(blob);
          // Transfer ImageBitmap to main thread (fast, GPU-backed when available)
          self.postMessage({ type: 'bitmap' , bitmap }, [bitmap]);
        } catch (e) {
          // If decoding fails in worker, fallback to sending raw buffers (transfer)
          try {
            self.postMessage({ type: 'frames', frames: frames.map(f => f.buffer) }, frames.map(f => f.buffer));
          } catch (e2) {
            // give up silently
          }
        }
      })();
    }
  } else if (type === 'reset') {
    buffer = new Uint8Array();
    frameCount = 0;
    lastLogTime = Date.now();
  }
};
