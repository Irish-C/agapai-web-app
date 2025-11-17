// src/components/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUsers, FaEdit, FaSpinner, FaArchive } from 'react-icons/fa'; // FaArchive imported
import UserEditModal from './UserEditModal.jsx'; 
import { fetchUsers, fetchApi } from '../services/apiService.js'; 


const archiveUser = (userId) => fetchApi(`/users/${userId}/archive`, 'PATCH', { is_active: false }); 

// --- Assumed real API function for SAVE (Add/Edit) ---
const saveUserApi = (formData) => {
    if (formData.id) {
        return fetchApi(`/users/${formData.id}`, 'PATCH', formData);
    } else {
        return fetchApi('/users', 'POST', formData);
    }
};
// -----------------------------------------------------------

export default function UserManager({ user }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // States for Modals
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false); // Renamed state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    
    // State to manage which user is being handled
    const [userToArchive, setUserToArchive] = useState(null); // Renamed state
    const [userToEdit, setUserToEdit] = useState(null); 

    // --- Data Fetcher ---
    const loadUsers = async () => {
        if (!user || !user.userId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Note: Assuming fetchUsers now only returns ACTIVE users for display
            const userData = await fetchUsers(); 
            setUsers(Array.isArray(userData) ? userData : []);
        } catch (err) {
            console.error("Error loading users:", err);
            setError(err.message || 'Failed to load user list. Check server connection or permissions.'); 
        } finally {
            setIsLoading(false);
        }
    };

    // --- EFFECT: Fetch Users on Mount ---
    useEffect(() => {
        loadUsers();
    }, [user]); 


    // --- ARCHIVE HANDLERS (Replaced Delete) ---
    const handleArchiveClick = (userItem) => {
        setUserToArchive(userItem);
        setIsArchiveModalOpen(true);
    };

    const confirmArchive = async () => {
        if (!userToArchive) return;
        
        const userId = userToArchive.id;
        setIsArchiveModalOpen(false);
        setError(null); 

        try {
            // 🛑 Call the ARCHIVE API (PATCH to set is_active=False)
            const result = await archiveUser(userId); 
            
            if (result.status === 'success') {
                // Frontend update: filter the archived user out of the list
                setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
            } else {
                setError(`Archive failed: ${result.message || 'Server did not confirm archive.'}`);
            }

        } catch (err) {
            console.error("Archive error:", err);
            setError(`Archive failed for ${userToArchive.username}: ${err.message || 'Server error.'}`);
        } finally {
            setUserToArchive(null);
        }
    };
    
    // --- ADD/EDIT HANDLERS ---
    
    // Handles opening the modal for Adding a new user
    const handleAddUser = () => {
        setUserToEdit(null);
        setIsEditModalOpen(true);
    };

    // Handles opening the modal for Editing an existing user (Triggered by table button)
    const handleEditUser = (userItem) => {
        setUserToEdit(userItem);
        setIsEditModalOpen(true);
    };

    // 🛑 HANDLES SAVE FROM MODAL (Calls API)
    const handleSaveUser = async (formData) => {
        try {
            const result = await saveUserApi(formData);
            
            if (result.status === 'success') {
                setError(`User ${formData.id ? 'updated' : 'created'} successfully!`);
                setIsEditModalOpen(false);
                loadUsers(); // Refresh the list
            } else {
                throw new Error(result.message || "Failed to save user.");
            }
        } catch (err) {
            throw new Error(`Save Error: ${err.message || 'Network communication failed.'}`);
        }
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

            {/* Display loading spinner */}
            {isLoading && (
                <div className="text-center p-8 text-gray-500">
                    <FaSpinner className="animate-spin inline-block mr-2" /> Loading user data...
                </div>
            )}
            
            {/* Display error message */}
            {error && !isLoading && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* 🛑 Display table only if NOT loading AND NO error */}
            {!isLoading && !error && (
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
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No users found. Try adding a new user.
                                    </td>
                                </tr>
                            )}
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
                                        {/* 🛑 EDIT BUTTON: Calls handleEditUser which opens the modal with user data */}
                                        <button 
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            onClick={() => handleEditUser(u)} 
                                        >
                                            <FaEdit className="inline-block" /> Edit
                                        </button>
                                        {/* ARCHIVE BUTTON */}
                                        {u.id !== user.userId && ( 
                                            <button 
                                                className="text-yellow-600 hover:text-yellow-900"
                                                onClick={() => handleArchiveClick(u)} // Calls Archive Handler (Opens Modal)
                                            >
                                                <FaArchive className="inline-block" /> Archive
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* RENDER EDIT/ADD MODAL */}
            {isEditModalOpen && (
                <UserEditModal 
                    userToEdit={userToEdit} // Null for Add, object for Edit
                    onSave={handleSaveUser}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )} 

            {/* --- ARCHIVE Confirmation Modal --- */}
            {isArchiveModalOpen && userToArchive && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-yellow-600 flex items-center">
                                <FaArchive className="mr-2" /> Confirm User Archiving
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to archive user <strong className="font-semibold">{userToArchive.username}</strong>?
                            </p>
                            <p className="text-yellow-700 mb-6 font-medium">
                                The user's account will be deactivated, but their historical acknowledgement records will be preserved.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsArchiveModalOpen(false);
                                        setUserToArchive(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmArchive}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700"
                                >
                                    Archive User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}