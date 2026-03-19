import React from 'react';
import { ActionButtons } from '../../FormComponents.jsx';
import { normalizeRole, displayRole } from '../../../utils/roleUtils.js';

export default function UserTable({ 
    users, 
    sortField, 
    setSortField, 
    sortOrder, 
    setSortOrder, 
    onEdit, 
    onArchive, 
    currentUserId 
}) {
    const SortHeader = ({ field, label }) => (
        <th
            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none ${sortField === field ? 'text-teal-700' : 'text-gray-500'}`}
            onClick={() => {
                setSortField(field);
                setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
            }}
        >
            {label}
            <span className="ml-1 inline-flex flex-col items-center" style={{ verticalAlign: 'middle' }}>
                <span style={{ color: sortField === field && sortOrder === 'asc' ? '#0d9488' : '#aaa', fontSize: '1em', lineHeight: '1em' }}>▲</span>
                <span style={{ color: sortField === field && sortOrder === 'desc' ? '#0d9488' : '#aaa', fontSize: '1em', lineHeight: '1em' }}>▼</span>
            </span>
        </th>
    );

    return (
        <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <SortHeader field="username" label="Username" />
                        <SortHeader field="firstname" label="First Name" />
                        <SortHeader field="lastname" label="Last Name" />
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
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${normalizeRole(u.role) === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                    {displayRole(u.role)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <ActionButtons buttons={[
                                    { label: 'Edit', onClick: () => onEdit(u), className: 'bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold' },
                                    ...(u.id !== currentUserId ? [{ label: 'Archive', onClick: () => onArchive(u), className: 'bg-yellow-600 text-white text-xs py-1 px-2 rounded hover:bg-yellow-700 font-semibold' }] : [])
                                ]} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
