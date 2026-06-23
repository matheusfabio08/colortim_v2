import { Router } from 'express';
import { preparationController } from '../controllers/preparation.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.post('/', preparationController.complete);
router.post('/batch', preparationController.completeBatch);
router.get('/batch/available', preparationController.getAvailableForBatch);
router.post('/lots', preparationController.createLots);
export { router as preparationRoutes };
