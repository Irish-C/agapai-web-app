import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function SnapshotGallery({ isOpen, onClose, snapshots = [], title = "Incident Snapshots" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSnapshot = snapshots[currentIndex];
  const totalSnapshots = snapshots.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSnapshots) % totalSnapshots);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSnapshots);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSnapshots]);

  if (!isOpen || !snapshots || snapshots.length === 0) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-0" onClick={onClose}>
      <div className="bg-slate-900 w-screen h-screen max-w-none max-h-none flex flex-col border-l border-r border-slate-700" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 flex-shrink-0 bg-slate-800">
          <div>
            <h2 className="text-base font-semibold text-blue-400">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Snapshot {currentIndex + 1} of {totalSnapshots}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 transition text-slate-300"
            aria-label="Close gallery"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Main Image Display */}
        <div className="bg-slate-950 flex items-center justify-center relative flex-1 min-h-0">
          {currentSnapshot ? (
            <img
              src={currentSnapshot.startsWith('http') ? currentSnapshot : currentSnapshot}
              alt={`Snapshot ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%235e718d" width="400" height="300"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%2394a3b8"%3ESnapshot unavailable%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="text-center">
              <p className="text-slate-400">No snapshot available</p>
            </div>
          )}

          {/* Navigation Arrows */}
          {totalSnapshots > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-800/70 hover:bg-blue-600/70 text-white transition"
                aria-label="Previous snapshot"
              >
                <FaChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-800/70 hover:bg-blue-600/70 text-white transition"
                aria-label="Next snapshot"
              >
                <FaChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strips (if multiple snapshots) */}
        {totalSnapshots > 1 && (
          <div className="bg-slate-800 px-4 py-3 border-t border-slate-700 flex gap-3 overflow-x-auto flex-shrink-0">
            {snapshots.map((snapshot, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-14 h-14 transition overflow-hidden border-2 ${
                  index === currentIndex
                    ? 'border-blue-600 shadow-sm'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <img
                  src={snapshot.startsWith('http') ? snapshot : snapshot}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="%23475569" width="64" height="64"/%3E%3C/svg%3E';
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
