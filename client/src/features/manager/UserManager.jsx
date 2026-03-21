import React, { useState } from 'react';
import { FaUsers, FaSpinner, FaArchive } from 'react-icons/fa';
import { useUserManager } from '../../hooks/useUserManager.js';
import UserTable from '../../components/features/manager/UserTable.jsx';
import UserEditModal from '../modal/UserEditModal.jsx';
import { displayRole } from '../../utils/roleUtils.js';

export default function UserManager({ user }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortField, setSortField] = useState('username');
    const [sortOrder, setSortOrder] = useState('asc');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [userToRestore, setUserToRestore] = useState(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

    const {
        users,
        roles,
        isLoading,
        error,
        userToArchive,
        isArchiveModalOpen,
        showArchived,
        setUserToArchive,
        setIsArchiveModalOpen,
        setShowArchived,
        archiveUser,
        unarchiveUser,
        saveUser,
        setError,
    } = useUserManager(user);

    // Sort and filter users
    const sortedFilteredUsers = users
        .filter(u => roleFilter === 'all' || u.role === roleFilter)
        .filter(u => {
            const term = searchTerm.trim().toLowerCase();
            return !term || u.username?.toLowerCase().includes(term) || u.firstname?.toLowerCase().includes(term) || u.lastname?.toLowerCase().includes(term);
        })
        .sort((a, b) => {
            const valA = (a[sortField] || '').toString().toLowerCase();
            const valB = (b[sortField] || '').toString().toLowerCase();
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });

    const handleAddUser = () => {
        setUserToEdit(null);
        setIsEditModalOpen(true);
    };

    const handleEditUser = (userItem) => {
        setUserToEdit({ ...userItem, middle_name: userItem.middle_name || '' });
        setIsEditModalOpen(true);
    };

    const handleArchiveClick = (userItem) => {
        setUserToArchive(userItem);
        setIsArchiveModalOpen(true);
    };

    const confirmArchive = async () => {
        if (!userToArchive) return;
        setIsArchiveModalOpen(false);
        const result = await archiveUser(userToArchive.id);
        if (!result.success) setError(`Archive failed: ${result.message}`);
        setUserToArchive(null);
    };

    const handleUnarchiveClick = (userItem) => {
        setUserToRestore(userItem);
        setIsRestoreModalOpen(true);
    };

    const confirmRestore = async () => {
        if (!userToRestore) return;
        setIsRestoreModalOpen(false);
        const result = await unarchiveUser(userToRestore.id);
        if (!result.success) setError(`Restore failed: ${result.message}`);
        setUserToRestore(null);
    };

    const handleSaveUser = async (formData) => {
        const result = await saveUser(formData);
        if (result.success) {
            setIsEditModalOpen(false);
        } else {
            throw new Error(result.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-6 mb-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Search Users</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by name or username"
                        className="pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 text-base"
                        style={{ minWidth: '280px' }}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Filter by Role</label>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-base cursor-pointer"
                        style={{ minWidth: '180px' }}
                    >
                        <option value="all">All Roles</option>
                        {roles.map(role => (
                            <option key={role} value={role}>{displayRole(role)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                    <FaUsers className="mr-2" /> {showArchived ? 'Archived Users' : 'Current System Users'}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowArchived(prev => !prev)}
                        className={`flex items-center font-bold py-2 px-4 rounded-lg transition duration-150 border ${showArchived ? 'bg-slate-700 text-white border-slate-700 hover:bg-slate-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                    >
                        <FaArchive className="mr-2" /> {showArchived ? 'Show Active' : 'Archived'}
                    </button>
                    {!showArchived && (
                        <button
                            onClick={handleAddUser}
                            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-150"
                        >
                            Add New User
                        </button>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="text-center p-8 text-gray-500">
                    <FaSpinner className="animate-spin inline-block mr-2" /> Loading user data...
                </div>
            )}

            {error && !isLoading && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {!isLoading && !error && (
                <UserTable 
                    users={sortedFilteredUsers}
                    sortField={sortField}
                    setSortField={setSortField}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    onEdit={handleEditUser}
                    onArchive={showArchived ? undefined : handleArchiveClick}
                    onUnarchive={showArchived ? handleUnarchiveClick : undefined}
                    currentUserId={user?.userId}
                    emptyMessage={showArchived ? 'No archived users found.' : 'No users found. Try adding a new user.'}
                />
            )}

            {isEditModalOpen && (
                <UserEditModal 
                    userToEdit={userToEdit}
                    onSave={handleSaveUser}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}

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

            {isRestoreModalOpen && userToRestore && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-emerald-600 flex items-center">
                                <FaArchive className="mr-2" /> Confirm User Restoration
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to restore user <strong className="font-semibold">{userToRestore.username}</strong>?
                            </p>
                            <p className="text-emerald-700 mb-6 font-medium">
                                The user's account will be reactivated and will regain access to the system.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsRestoreModalOpen(false);
                                        setUserToRestore(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRestore}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Restore User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}