import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, X } from 'lucide-react';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [pendingOrgs, setPendingOrgs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'SUPER_USER') {
            navigate('/dashboard'); // unauthorized redirect
            return;
        }
        fetchPending();
    }, [user, navigate]);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getPendingOrganizations();
            setPendingOrgs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await adminApi.approveOrganization(id);
            fetchPending(); // refresh list
        } catch (error) {
            alert('Failed to approve');
        }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject this organization?')) return;
        try {
            await adminApi.rejectOrganization(id);
            fetchPending();
        } catch (error) {
            alert('Failed to reject');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#1e1e2f', color: '#fff', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Super Admin Portal</h1>
                        <span style={{ color: '#aaa' }}>{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="action-button" style={{ width: 'auto', background: '#333' }}>
                        <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                    </button>
                </header>

                <h2 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Pending Approvals</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Loading requests...</div>
                ) : pendingOrgs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#555', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '10px' }}>
                        No pending organization requests.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {pendingOrgs.map(org => (
                            <div key={org.id} style={{
                                background: 'rgba(30,30,40,0.8)',
                                border: '1px solid #444',
                                padding: '20px',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#fff' }}>{org.name || 'Unnamed Org'}</h3>
                                    <div style={{ color: '#aaa', fontSize: '0.9em' }}>Domain: <span style={{ color: '#60a5fa' }}>{org.emailDomain}</span></div>
                                    <div style={{ color: '#666', fontSize: '0.8em', marginTop: '5px' }}>Requested: {new Date(org.createdAt).toLocaleString()}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApprove(org.id)}
                                        style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                                    >
                                        <Check size={18} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(org.id)}
                                        style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                                    >
                                        <X size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
