import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaSpinner, FaTimes } from 'react-icons/fa';
// 🛑 Import UserEditModal (the modal component)
import UserEditModal from './UserEditModal.jsx'; 
import { fetchUsers, fetchApi } from '../services/apiService.js'; 

// --- Assumed real API function for DELETE ---
const deleteUser = (userId) => fetchApi(`/users/${userId}`, 'DELETE');
// --- Assumed real API function for SAVE (Add/Edit) ---
const saveUserApi = (formData) => {
    if (formData.id) {
        // If formData has an ID, it's an update (PATCH)
        return fetchApi(`/users/${formData.id}`, 'PATCH', formData);
    } else {
        // If no ID, it's a creation (POST)
        return fetchApi('/users', 'POST', formData);
    }
};
// -----------------------------------------------------------

export default function UserManager({ user }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // States for Modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // 🛑 Removed redundant isModalOpen, using isEditModalOpen for Add/Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    
    // State to manage which user is being handled
    const [userToDelete, setUserToDelete] = useState(null); 
    const [userToEdit, setUserToEdit] = useState(null); // Holds user object if editing, null if adding

    // --- Data Fetcher ---
    const loadUsers = async () => {
        if (!user || !user.userId) return;

        setIsLoading(true);
        setError(null);

        try {
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


    // --- DELETE HANDLERS ---
    const handleDeleteClick = (userItem) => {
        setUserToDelete(userItem);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        
        const userId = userToDelete.id;
        setIsDeleteModalOpen(false);
        setError(null); 

        try {
            const result = await deleteUser(userId); 
            
            if (result.status === 'success') {
                setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
            } else {
                setError(`Deletion failed: ${result.message || 'Server did not confirm deletion.'}`);
            }

        } catch (err) {
            console.error("Deletion error:", err);
            setError(`Deletion failed for ${userToDelete.username}: ${err.message || 'Server error.'}`);
        } finally {
            setUserToDelete(null);
        }
    };
    
    // --- ADD/EDIT HANDLERS ---
    
    // Handles opening the modal for Adding a new user
    const handleAddUser = () => {
        setUserToEdit(null); // Indicates 'Add' mode
        setIsEditModalOpen(true);
    };

    // Handles opening the modal for Editing an existing user (Triggered by table button)
    const handleEditUser = (userItem) => {
        setUserToEdit(userItem); // Indicates 'Edit' mode
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
            // Throw error back to modal to display internally
            throw new Error(`Save Error: ${err.message || 'Network communication failed.'}`);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                    <FaUsers className="mr-2" /> Current System Users
                </h3>
                
                {/* 🛑 'ADD NEW USER' button calls handleAddUser to open modal */}
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
                                        <button 
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            onClick={() => handleEditUser(u)} // 🛑 Calls Edit Handler
                                        >
                                            <FaEdit className="inline-block" /> Edit
                                        </button>
                                        {/* Ensure the logged-in user cannot delete themselves (using the user prop ID) */}
                                        {u.id !== user.userId && ( 
                                            <button 
                                                className="text-red-600 hover:text-red-900"
                                                onClick={() => handleDeleteClick(u)} // 🛑 Calls Delete Handler (Opens Modal)
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
            
            {/* 🛑 RENDER EDIT/ADD MODAL (Conditional rendering for the modal) */}
            {isEditModalOpen && (
                <UserEditModal 
                    userToEdit={userToEdit} // Null for Add, object for Edit
                    onSave={handleSaveUser}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )} 

            {/* --- Delete Confirmation Modal --- */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-red-600 flex items-center">
                                <FaTrash className="mr-2" /> Confirm User Deletion
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to permanently delete user <strong className="font-semibold">{userToDelete.username}</strong>?
                            </p>
                            <p className="text-red-700 mb-6 font-medium">
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setUserToDelete(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}