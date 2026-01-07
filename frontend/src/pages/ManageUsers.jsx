import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Edit } from 'lucide-react';

const ManageUsers = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', role: 'END_USER' });

    useEffect(() => {
        if (!user?.organization?.id) {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await usersApi.getByOrganization(user.organization.id);
            setUsers(res.data);
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
                organizationId: user.organization.id
            });
            setShowForm(false);
            setFormData({ email: '', password: '', role: 'END_USER' });
            fetchUsers();
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this user?')) return;
        try {
            await usersApi.delete(id);
            fetchUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#1e1e2f', color: '#fff', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <Link to="/dashboard" style={{ color: '#aaa' }}><ArrowLeft /></Link>
                    <h1 style={{ margin: 0 }}>Manage Users</h1>
                </header>

                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        fontWeight: 600
                    }}
                >
                    <UserPlus size={18} /> Add User
                </button>

                {showForm && (
                    <form onSubmit={handleCreate} style={{
                        background: 'rgba(30,30,40,0.8)',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                    }}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                        />
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                        >
                            <option value="END_USER">End User</option>
                            <option value="ORG_ADMIN">Org Admin</option>
                        </select>
                        <button type="submit" style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                            Create User
                        </button>
                    </form>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Loading users...</div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#555', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '10px' }}>
                        No users found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {users.map(u => (
                            <div key={u.id} style={{
                                background: 'rgba(30,30,40,0.8)',
                                border: '1px solid #444',
                                padding: '15px 20px',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{u.email}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.85em' }}>{u.role}</div>
                                </div>
                                <button
                                    onClick={() => handleDelete(u.id)}
                                    style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}
                                    disabled={u.id === user.id}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;
