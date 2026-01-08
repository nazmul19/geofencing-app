import React, { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, Trash2, MailOpen, XOctagon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/orgApi';

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationsApi.getByUser(user.id);
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle size={18} style={{ color: '#4ade80' }} />;
            case 'WARNING': return <AlertTriangle size={18} style={{ color: '#fbbf24' }} />;
            case 'DANGER': return <XOctagon size={18} style={{ color: '#ef4444' }} />;
            default: return <Info size={18} style={{ color: '#818cf8' }} />;
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationsApi.markAsRead(id, user.id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await notificationsApi.delete(id, user.id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${diffInDays}d ago`;
    };

    return (
        <DashboardLayout title="Notifications">
            <div className="side-panels" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <section className="glass-panel" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bell size={24} style={{ color: '#818cf8' }} />
                            <h3 style={{ margin: 0 }}>System Alerts</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{notifications.filter(n => !n.isRead).length} Unread</span>
                            {notifications.length > 0 && (
                                <button
                                    onClick={fetchNotifications}
                                    style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    Refresh
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="panel-list" style={{ gap: '12px', flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                        ) : notifications.length > 0 ? notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`list-item ${notif.isRead ? '' : 'unread'}`}
                                style={{
                                    background: notif.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(129, 140, 248, 0.05)',
                                    border: notif.isRead ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(129, 140, 248, 0.2)',
                                    flexDirection: 'row',
                                    padding: '20px',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div style={{ marginTop: '4px' }}>{getIcon(notif.type)}</div>
                                <div className="item-content" style={{ flex: 1, marginLeft: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="item-title" style={{ fontSize: '1rem', fontWeight: 600 }}>{notif.title}</div>
                                        <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{formatTime(notif.createdAt)}</span>
                                    </div>
                                    <div className="item-subtitle" style={{ fontSize: '0.9rem', marginTop: '4px', lineHeight: 1.5 }}>
                                        {notif.message}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#818cf8',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: 0
                                                }}
                                            >
                                                <MailOpen size={14} /> Mark as Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notif.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: 0
                                            }}
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '100px 0', color: '#71717a' }}>
                                <Bell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>You have no notifications at this time.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default Notifications;
