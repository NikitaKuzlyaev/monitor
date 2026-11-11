const apiUrl = (path) => `/api${path}`;

export const getAdminSessionUrl = () => apiUrl('/admin/session');
export const getAdminLoginUrl = () => apiUrl('/admin/login');
export const getAdminLogoutUrl = () => apiUrl('/admin/logout');
export const getStaffUrl = () => apiUrl('/staff');
export const getSetAllUrl = () => apiUrl('/set-all');
export const getPulseSubmissionsUrl = () => apiUrl('/pulse/submissions');
export const getPulseStandingsUrl = () => apiUrl('/pulse/standings');
export const getPulseStatisticsUrl = () => apiUrl('/pulse/statistics');
export const getUnfreezeLogsUrl = () => apiUrl('/unfreeze/get-logs');
export const getUnfreezeUploadUrl = () => apiUrl('/unfreeze/load-logs');
export const getSarisConverterUrl = () => apiUrl('/utils/map-codeforces-log-into-saris');
