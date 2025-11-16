// src/components/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { fetchUsers } from '../services/apiService.js'; 

export default function UserManager({ user }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- EFFECT: Fetch Users from API ---
    useEffect(() => {
        const loadUsers = async () => {
            if (!user) return;

            setIsLoading(true);
            setError(null);

            try {
                const userData = await fetchUsers(); 
                setUsers(userData);
            } catch (err) {
                console.error("Error loading users:", err);
                // The error message for the user is set here
                setError('Failed to load user list. Check server connection or permissions.'); 
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers();
    }, [user]); 


    const handleDelete = (userId) => {
        if (window.confirm(`Are you sure you want to delete user ID ${userId}?`)) {
            // TODO: Implement deleteUser(userId) API call here
            setUsers(users.filter(u => u.id !== userId));
            console.log(`Deleting user ${userId}`);
        }
    };
    
    const handleAddUser = () => {
        setIsModalOpen(true);
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                    <FaUsers className="mr-2" /> Current System Users
                </h3>
                
                <button 
                    onClick={handleAddUser}
                    className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-150"
                >
                    <FaUserPlus className="mr-2" /> Add New User
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center p-8 text-gray-500">
                    <FaSpinner className="animate-spin inline-block mr-2" /> Loading user data...
                </div>
            ) : (
                <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th> 
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th> 
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.firstname}</td> 
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.lastname}</td> 
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            onClick={() => console.log(`Edit user ${u.id}`)}
                                        >
                                            <FaEdit className="inline-block" /> Edit
                                        </button>
                                        {/* Ensure the logged-in user cannot delete themselves */}
                                        {u.id !== user.userId && ( 
                                            <button 
                                                className="text-red-600 hover:text-red-900"
                                                onClick={() => handleDelete(u.id)}
                                            >
                                                <FaTrash className="inline-block" /> Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isModalOpen && <p>User Modal would be displayed here.</p>} 

        </div>
    );
}