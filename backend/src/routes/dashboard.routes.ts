import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/kpis', dashboardController.getKPIs);
router.get('/activity', dashboardController.getRecentActivity);
router.get('/timeline', dashboardController.getTimeline);
export { router as dashboardRoutes };
