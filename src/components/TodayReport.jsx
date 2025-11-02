import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaChartBar } from 'react-icons/fa';

/**
 * Renders the Today's Incident Log and Activity Summary sidebar.
 * It receives 'incidents' from CameraGrid.jsx (which listens to the WebSocket).
 */
export default function TodayReport({ incidents }) {
  
  // --- Determine System Status ---
  const incidentCount = incidents.length;
  const isClear = incidentCount === 0;

  // --- Placeholder for Activity Summary Data (REST API Data) ---
  const mockActivityData = [
    { label: 'Mov.', value: 20 },
    { label: 'Rest', value: 50 },
    { label: 'Inact.', value: 15 },
  ];
  
  return (
    <div className="space-y-4">

      {/* 1. REAL-TIME INCIDENT LOG (WebSocket Data) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Today's Incident Log</h3>

        {isClear ? (
          // System Clear State
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
            <FaCheckCircle className="mr-2" />
            <p>All systems clear. No incidents recorded today.</p>
          </div>
        ) : (
          // Incident Active State
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {incidents.map((incident, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md flex items-start">
                <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{incident.type} Detected!</p>
                  <p className="text-sm">Location: {incident.location}</p>
                  <p className="text-xs text-gray-500">Time: {new Date(incident.timestamp * 1000).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ACTIVITY SUMMARY (REST API Data) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaChartBar className="mr-2" />
          Activity Summary (Last 24h)
        </h3>

        {/* This is where your actual chart will be rendered after fetching REST data */}
        <div className="flex justify-around items-end h-32 border-b border-gray-300 pt-2">
          {mockActivityData.map((data, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="w-8 bg-teal-500 rounded-t-md" 
                style={{ height: `${data.value}%` }} 
                title={`${data.value}% ${data.label}`}
              ></div>
              <span className="text-xs text-gray-600 mt-1">{data.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-2 text-gray-500 text-center">Data represents percentage of total recorded time.</p>
      </div>

    </div>
  );
}