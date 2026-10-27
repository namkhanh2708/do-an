 import { healthApi } from './api/health';
 import { incidentsApi } from './api/incidents';
 import { monitorsApi } from './api/monitors';
 import { reportsApi } from './api/reports';

 export const api = {
   ...healthApi,
   ...monitorsApi,
   ...incidentsApi,
   ...reportsApi,
 };
