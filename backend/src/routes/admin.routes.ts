import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware, requireAdmin);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
export { router as adminRoutes };
