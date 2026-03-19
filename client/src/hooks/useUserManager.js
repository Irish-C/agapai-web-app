import { useState, useEffect } from 'react';
import { fetchUsers, fetchApi, fetchRolesApi } from '../services/apiService.js';
import { normalizeRole } from '../utils/roleUtils.js';

export const useUserManager = (user) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userToArchive, setUserToArchive] = useState(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

    // Load users from database
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

    // Load roles from database
    const loadRoles = async () => {
        try {
            const result = await fetchRolesApi();
            if (result && Array.isArray(result.data)) {
                setRoles(result.data.map(r => normalizeRole(r)));
            } else if (Array.isArray(result)) {
                setRoles(result.map(r => normalizeRole(r.role_name || r.role || r.name)));
            } else {
                setRoles([]);
            }
        } catch (err) {
            setRoles([]);
        }
    };

    // Fetch users on mount
    useEffect(() => {
        loadUsers();
    }, [user]);

    // Fetch roles on mount
    useEffect(() => {
        loadRoles();
    }, []);

    // Archive user
    const archiveUser = async (userId) => {
        try {
            const result = await fetchApi(`/users/${userId}/archive`, 'PATCH', { is_active: false });
            if (result.status === 'success') {
                setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
                return { success: true };
            } else {
                return { success: false, message: result.message || 'Server did not confirm archive.' };
            }
        } catch (err) {
            console.error("Archive error:", err);
            return { success: false, message: err.message || 'Server error.' };
        }
    };

    // Save user (create or update)
    const saveUser = async (formData) => {
        try {
            let result;
            if (formData.id) {
                result = await fetchApi(`/users/${formData.id}`, 'PATCH', formData);
            } else {
                result = await fetchApi('/users', 'POST', formData);
            }

            if (result.status === 'success') {
                loadUsers();
                return { success: true, message: `User ${formData.id ? 'updated' : 'created'} successfully!` };
            } else {
                throw new Error(result.message || "Failed to save user.");
            }
        } catch (err) {
            return { success: false, message: `Save Error: ${err.message || 'Network communication failed.'}` };
        }
    };

    return {
        users,
        roles,
        isLoading,
        error,
        userToArchive,
        isArchiveModalOpen,
        setUserToArchive,
        setIsArchiveModalOpen,
        archiveUser,
        saveUser,
        loadUsers,
        setError
    };
};
