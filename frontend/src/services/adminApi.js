import api from './api';

export const adminApi = {
    getPendingOrganizations: () => api.get('/organizations?status=PENDING'),
    approveOrganization: (id) => api.patch(`/organizations/${id}/approve`),
    rejectOrganization: (id) => api.patch(`/organizations/${id}/reject`),
};
