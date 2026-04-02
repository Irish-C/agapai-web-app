import React from 'react';

export default function Modal({ isOpen, onClose, title, message, warning, icon: Icon, confirmText, onConfirm, isDangerous = false }) {
  if (!isOpen) return null;

  const bgColor = isDangerous ? 'text-red-600' : 'text-yellow-600';
  const btnColor = isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h4 className={`text-xl font-bold flex items-center ${bgColor}`}>
            {Icon && <Icon className="mr-2" />}
            {title}
          </h4>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          {warning && <p className="text-red-700 mb-6 font-medium text-sm">{warning}</p>}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${btnColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
