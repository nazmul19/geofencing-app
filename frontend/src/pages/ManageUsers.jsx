import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Edit, User as UserIcon, Mail, Shield, CheckCircle, Calendar, Hash } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const ManageUsers = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '', role: 'END_USER' });

    useEffect(() => {
        if (!currentUser?.organization?.id) {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
    }, [currentUser, navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await usersApi.getByOrganization(currentUser.organization.id);
            setUsers(res.data);
            // Auto-select the first user if none selected
            if (res.data.length > 0 && !selectedUser) {
                setSelectedUser(res.data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await usersApi.create({
                ...formData,
                organizationId: currentUser.organization.id
            });
            setShowForm(false);
            setFormData({ email: '', password: '', role: 'END_USER' });
            fetchUsers();
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await usersApi.delete(id);
            if (selectedUser?.id === id) setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Team Management"
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
        >
            <div className="side-panels" style={{ width: '400px' }}>
                <section className="glass-panel" style={{ height: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ marginBottom: '16px' }}>
                        <h3>{showForm ? 'New User' : 'Organization Team'}</h3>
                        <div className="toolbar-btn" onClick={() => setShowForm(!showForm)}>
                            <UserPlus size={18} />
                        </div>
                    </div>

                    {showForm ? (
                        <form onSubmit={handleCreate} className="panel-list">
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%' }}
                            />
                            <input
                                type="password"
                                placeholder="Temporary Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%', marginTop: '8px' }}
                            />
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%', marginTop: '8px' }}
                            >
                                <option value="END_USER">End User (Field Staff)</option>
                                <option value="ORG_ADMIN">Org Admin (Manager)</option>
                            </select>
                            <button type="submit" className="action-button primary" style={{ marginTop: '16px' }}>Create Account</button>
                            <button type="button" onClick={() => setShowForm(false)} className="action-button" style={{ marginTop: '8px' }}>Cancel</button>
                        </form>
                    ) : (
                        <div className="panel-list" style={{ overflowY: 'auto' }}>
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    className={`list-item ${selectedUser?.id === u.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedUser(u)}
                                    style={{ padding: '16px' }}
                                >
                                    <div className="item-content">
                                        <div className="item-title" style={{ fontWeight: 600 }}>{u.email.split('@')[0]}</div>
                                        <div className="item-subtitle">{u.role}</div>
                                    </div>
                                    {u.id !== currentUser.id && (
                                        <Trash2 size={16} onClick={(e) => handleDelete(e, u.id)} style={{ color: '#ef4444', cursor: 'pointer', opacity: 0.6 }} />
                                    )}
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '0.9rem' }}>
                                    No users matching your search
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <div className="map-canvas" style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'center' }}>
                {selectedUser ? (
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', alignSelf: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '25px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserIcon size={40} color="white" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>{selectedUser.email.split('@')[0]}</h2>
                                <p style={{ margin: '4px 0 0 0', color: '#818cf8', fontWeight: 600 }}>{selectedUser.role}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#71717a', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Mail size={14} /> Email Address
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{selectedUser.email}</div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#71717a', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Shield size={14} /> Access Level
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{selectedUser.role === 'ORG_ADMIN' ? 'Administrator' : 'Field Operator'}</div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#71717a', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <CheckCircle size={14} /> Status
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 500, color: '#4ade80' }}>Active</div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#71717a', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Hash size={14} /> User ID
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#71717a' }}>{selectedUser.id}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                            <button className="action-button primary" style={{ flex: 1 }}>Reset Password</button>
                            <button className="action-button" style={{ flex: 1 }}>Update Permissions</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <UserIcon size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <p style={{ color: '#71717a' }}>Select a team member to view their profile</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageUsers;
