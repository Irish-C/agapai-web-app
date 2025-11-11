import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaChartBar } from 'react-icons/fa';

/**
 * Renders the Today's Incident Log and Activity Summary sidebar.
 * It receives 'incidents' from CameraGrid.jsx (which listens to the WebSocket).
 */
export default function TodayReport({ incidents }) {
  
  // --- Determine System Status (If the incidents array is empty) ---
  const incidentCount = incidents.length;
  const isClear = incidentCount === 0;

  // --- Placeholder for Activity Summary Data (REST API Data) ---
  // This data would typically be fetched via a REST API call to QuestDB/Flask
  const mockActivityData = [
    { label: 'Mov.', value: 80, percentage: '40%', color: 'bg-teal-500' },
    { label: 'Rest', value: 120, percentage: '60%', color: 'bg-green-500' },
    { label: 'Incid.', value: incidents.length > 0 ? 30 : 0, percentage: `${incidents.length > 0 ? 15 : 0}%`, color: 'bg-red-500' },
  ];
  
  return (
    <div className="space-y-6 sticky top-14 h-fit">

      {/* 1. REAL-TIME INCIDENT LOG (WebSocket Data) */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Today's Incident Log</h3>

        {isClear ? (
          // System Clear State (Horay!)
          <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center">
            <FaCheckCircle className="mr-3 text-xl" />
            <p className="font-semibold">All systems clear! No incidents recorded today. 🎉</p>
          </div>
        ) : (
          // Incident Active State (A scrollable log for multiple alerts)
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {incidents.map((incident, index) => (
              <div 
                key={index} 
                className="p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg flex items-start animate-pulse-once"
              >
                <FaExclamationTriangle className="mt-1 mr-3 flex-shrink-0 text-xl text-red-600" />
                <div>
                  <p className="font-bold text-base">{incident.type || 'Unknown Incident'}!</p>
                  <p className="text-sm">Location: <span className='font-medium'>{incident.location}</span></p>
                  <p className="text-xs text-gray-600 mt-1">Time: {new Date(incident.timestamp * 1000).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ACTIVITY SUMMARY (Placeholder for REST API Data) */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
          <FaChartBar className="mr-2 text-teal-600" />
          Activity Summary (Mock 24h)
        </h3>

        <div className="space-y-4">
            {mockActivityData.map((data, index) => (
                <div key={index}>
                    <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1">
                        <span>{data.label}</span>
                        <span>{data.percentage}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className={`${data.color} h-2.5 rounded-full transition-all duration-700 ease-out`} 
                            style={{ width: data.percentage }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">Data refreshed hourly from simulated QuestDB.</p>
      </div>
    </div>
  );
}