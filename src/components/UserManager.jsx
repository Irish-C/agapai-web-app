// src/components/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaSpinner, FaSearch } from 'react-icons/fa';
// You would need to add fetchUsers, addUser, deleteUser, etc. to apiService.js
// import { fetchUsers, addUser, deleteUser } from '../services/apiService'; 

export default function UserManager({ user }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // For Add/Edit User Modal

    // Dummy Data for immediate testing (Replace with real API fetch)
    useEffect(() => {
        setIsLoading(true);
        // Replace this with a real API call like: fetchUsers().then(setUsers);
        setTimeout(() => {
            setUsers([
                { id: 1, username: 'admin_user', email: 'admin@system.com', role: 'admin', created: '2023-01-01' },
                { id: 2, username: 'staff_sebastian', email: 'sebastian@site.com', role: 'staff', created: '2024-03-15' },
                { id: 3, username: 'staff_gabriel', email: 'gabriel@site.com', role: 'staff', created: '2024-05-20' },
            ]);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleDelete = (userId) => {
        if (window.confirm(`Are you sure you want to delete user ID ${userId}?`)) {
            // Implement deleteUser(userId) API call here
            setUsers(users.filter(u => u.id !== userId));
            console.log(`Deleting user ${userId}`);
        }
    };
    
    // Function to open modal for adding a user
    const handleAddUser = () => {
        setIsModalOpen(true);
        // In a real app, you'd pass a null user object to the modal
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
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
                                        {/* Prevent user from deleting themselves (or the primary admin) */}
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
            
            {/* Modal for Add/Edit User goes here */}
            {isModalOpen && <p>User Modal would be displayed here.</p>} 

        </div>
    );
}