 import { authApi } from './api/auth';
 import { healthApi } from './api/health';
 import { incidentsApi } from './api/incidents';
 import { monitorsApi } from './api/monitors';
 import { reportsApi } from './api/reports';

 export const api = {
   ...authApi,
   ...healthApi,
   ...monitorsApi,
   ...incidentsApi,
   ...reportsApi,
 };
