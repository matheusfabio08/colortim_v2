import { Router } from 'express';
import { stageController } from '../controllers/stage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.post('/production', stageController.completeProduction);
router.post('/dryer', stageController.completeDryer);
router.post('/untangling', stageController.completeUntangling);
router.post('/rolling', stageController.completeRolling);
router.post('/quality', stageController.completeQuality);
export { router as stageRoutes };
