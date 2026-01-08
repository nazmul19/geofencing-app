import api from './api';

export const usersApi = {
    getByOrganization: (orgId) => api.get(`/users?organizationId=${orgId}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.patch(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

export const routesApi = {
    getByOrganization: (orgId) => api.get(`/routes?organizationId=${orgId}`),
    create: (data) => api.post('/routes', data),
    update: (id, data) => api.patch(`/routes/${id}`, data),
    delete: (id) => api.delete(`/routes/${id}`),
};

export const geofencesApi = {
    getByOrganization: (orgId) => api.get(`/geofences?organizationId=${orgId}`),
    create: (data) => api.post('/geofences', data),
    update: (id, data) => api.patch(`/geofences/${id}`, data),
    delete: (id) => api.delete(`/geofences/${id}`),
};

export const routeAssignmentsApi = {
    getByOrganization: (orgId) => api.get(`/route-assignments?organizationId=${orgId}`),
    getByUser: (userId) => api.get(`/route-assignments?userId=${userId}`),
    create: (data) => api.post('/route-assignments', data),
    update: (id, data) => api.patch(`/route-assignments/${id}`, data),
    checkIn: (id, latitude, longitude) => api.post(`/route-assignments/${id}/check-in`, { latitude, longitude }),
    cancel: (id, cancelledById, reason) => api.post(`/route-assignments/${id}/cancel`, { cancelledById, reason }),
    delete: (id) => api.delete(`/route-assignments/${id}`),
};

export const notificationsApi = {
    getByUser: (userId) => api.get(`/notifications?userId=${userId}`),
    markAsRead: (id, userId) => api.patch(`/notifications/${id}/read?userId=${userId}`),
    markAllAsRead: (userId) => api.patch(`/notifications/read-all?userId=${userId}`),
    delete: (id, userId) => api.delete(`/notifications/${id}?userId=${userId}`),
};
