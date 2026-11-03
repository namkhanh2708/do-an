 import { authApi } from './api/auth';
 import { translateDiagnosis } from './api/diagnosis';
 import { healthApi } from './api/health';
 import { incidentsApi } from './api/incidents';
 import { monitorsApi } from './api/monitors';
 import { reportsApi } from './api/reports';

 export const api = {
   ...authApi,
   translateDiagnosis,
   ...healthApi,
   ...monitorsApi,
   ...incidentsApi,
   ...reportsApi,
 };
