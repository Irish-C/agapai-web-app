import React, { useState, useEffect } from 'react';
import { fetchReportsData } from '../services/apiService';
import { FaChartLine, FaSpinner, FaTable, FaExclamationTriangle, FaThermometerHalf, FaRunning, FaClock } from 'react-icons/fa';

/**
 * Renders the Reports Page with simulated QuestDB data.
 * This component demonstrates fetching REST API data.
 */
export default function ReportsPage({ user, logout }) {
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadReports = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch data using the updated API service
                const response = await fetchReportsData();
                setReportData(response.report || []);
            } catch (err) {
                console.error("Error loading report data:", err);
                setError(err.message || "Failed to load report data.");
            } finally {
                setIsLoading(false);
            }
        };

        loadReports();
    }, []);

    const convertUnixToTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            
            <main className="flex-grow container mx-auto p-6">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-6">
                    <FaChartLine className="mr-3 text-teal-600" />
                    Historical Reports
                </h1>

                {isLoading && (
                    <div className='flex items-center justify-center p-12 text-xl text-gray-700'>
                        <FaSpinner className='animate-spin mr-2' /> Fetching data from QuestDB simulation...
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center">
                        <FaExclamationTriangle className="mr-3" /> {error}
                    </div>
                )}

                {reportData && reportData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="p-4 bg-teal-600 text-white flex items-center">
                            <FaTable className="mr-2" />
                            <h2 className="text-xl font-semibold">Sensor Data Log</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <FaClock className="inline mr-1" /> Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <FaThermometerHalf className="inline mr-1" /> Temperature (°C)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <FaRunning className="inline mr-1" /> Activity Level (Score)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.map((data, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {convertUnixToTime(data.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {data.temperature.toFixed(1)}°C
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    data.activity > 60 ? 'bg-teal-100 text-teal-800' : 
                                                    data.activity > 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {data.activity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {reportData && reportData.length === 0 && !isLoading && (
                    <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-xl">
                        No historical data found for the requested period.
                    </div>
                )}

            </main>
        </div>
    );
}
