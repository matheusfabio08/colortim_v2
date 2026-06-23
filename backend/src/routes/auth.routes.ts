import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { loginRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();
router.post('/login', loginRateLimiter, authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export { router as authRoutes };
