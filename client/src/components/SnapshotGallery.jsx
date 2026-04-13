import React, { useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function SnapshotGallery({ isOpen, onClose, snapshots = [], title = "Incident Snapshots" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !snapshots || snapshots.length === 0) return null;

  const currentSnapshot = snapshots[currentIndex];
  const totalSnapshots = snapshots.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSnapshots) % totalSnapshots);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSnapshots);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {currentIndex + 1} of {totalSnapshots} snapshots
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            aria-label="Close gallery"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Main Image Display */}
        <div className="bg-gray-900 flex items-center justify-center relative" style={{ minHeight: '400px' }}>
          {currentSnapshot ? (
            <img
              src={currentSnapshot}
              alt={`Snapshot ${currentIndex + 1}`}
              className="max-h-96 max-w-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%236b7280"%3ESnapshot unavailable%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="text-center">
              <p className="text-gray-400">No snapshot available</p>
            </div>
          )}

          {/* Navigation Arrows */}
          {totalSnapshots > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                aria-label="Previous snapshot"
              >
                <FaChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                aria-label="Next snapshot"
              >
                <FaChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strips (if multiple snapshots) */}
        {totalSnapshots > 1 && (
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-3 overflow-x-auto">
            {snapshots.map((snapshot, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition overflow-hidden ${
                  index === currentIndex
                    ? 'border-teal-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={snapshot}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="%23e5e7eb" width="64" height="64"/%3E%3C/svg%3E';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
