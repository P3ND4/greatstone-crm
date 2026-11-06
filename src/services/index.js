// Service registry. UI imports from here, never from src/data/mock.
import { createCrudService } from './client.js';

export const contactsService = createCrudService('contacts', { searchFields: ['name', 'email', 'company', 'neighborhood'], defaultSort: 'name:asc' });
export const leadsService = createCrudService('leads', { searchFields: ['name', 'email', 'neighborhood', 'description'], defaultSort: 'createdAt:desc' });
export const opportunitiesService = createCrudService('opportunities', { searchFields: ['title'] });
export const invoicesService = createCrudService('invoices', { searchFields: ['number'], defaultSort: 'issuedAt:desc' });
export const estimatesService = createCrudService('estimates', { searchFields: ['number'], defaultSort: 'createdAt:desc' });
export const expensesService = createCrudService('expenses', { searchFields: ['category'], defaultSort: 'date:desc' });
export const appointmentsService = createCrudService('appointments', { searchFields: ['title', 'location'], defaultSort: 'start:asc' });
export const tasksService = createCrudService('tasks', { searchFields: ['title'], defaultSort: 'dueAt:asc' });
export const notesService = createCrudService('notes', { searchFields: ['body'] });
export const conversationsService = createCrudService('conversations', { searchFields: ['subject', 'lastMessage'] });
export const usersService = createCrudService('users', { searchFields: ['name', 'email'] });

export { dashboardService } from './dashboardService.js';
export { searchService } from './searchService.js';
export { lookupService } from './lookupService.js';
export { communicationsService } from './communicationsService.js';
export { prospectingService } from './prospectingService.js';
export { crmService } from './crmService.js';
export { projectsService } from './projectsService.js';
