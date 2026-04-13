import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-1" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-screen h-screen max-w-none max-h-none flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">
              {currentIndex + 1} of {totalSnapshots}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition text-gray-600"
            aria-label="Close gallery"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Main Image Display */}
        <div className="bg-gray-900 flex items-center justify-center relative flex-1 min-h-0">
          {currentSnapshot ? (
            <img
              src={currentSnapshot.startsWith('http') ? currentSnapshot : currentSnapshot}
              alt={`Snapshot ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                aria-label="Previous snapshot"
              >
                <FaChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                aria-label="Next snapshot"
              >
                <FaChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strips (if multiple snapshots) */}
        {totalSnapshots > 1 && (
          <div className="bg-gray-50 p-2 border-t border-gray-200 flex gap-2 overflow-x-auto flex-shrink-0">
            {snapshots.map((snapshot, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 transition overflow-hidden ${
                  index === currentIndex
                    ? 'border-teal-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={snapshot.startsWith('http') ? snapshot : snapshot}
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

  return createPortal(modalContent, document.body);
}
