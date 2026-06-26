/**
 * Profile Routes
 * All endpoints require authentication.
 */

import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = new Hono<AppBindings>();

// All routes in this file require authentication
router.use('*', authenticate);

// Profile view & edit
router.get('/',                          profileController.getProfile.bind(profileController));
router.put('/',                          profileController.updateProfile.bind(profileController));

// Password change
router.post('/change-password',          profileController.changePassword.bind(profileController));

// Secondary email
router.post('/secondary-email',          profileController.setSecondaryEmail.bind(profileController));
router.post('/secondary-email/verify',   profileController.verifySecondaryEmail.bind(profileController));

// Session management
router.get('/sessions',                  profileController.getSessions.bind(profileController));
router.delete('/sessions',               profileController.revokeOtherSessions.bind(profileController));
router.delete('/sessions/:id',           profileController.revokeSession.bind(profileController));

export default router;
