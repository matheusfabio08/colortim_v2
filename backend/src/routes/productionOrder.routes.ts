import { Router } from 'express';
import { productionOrderController } from '../controllers/productionOrder.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.post('/', productionOrderController.create);
router.get('/', productionOrderController.getAll);
router.get('/:id', productionOrderController.getById);
router.post('/:id/complete', productionOrderController.complete);
router.post('/:id/reopen', productionOrderController.reopen);
router.get('/:id/history', productionOrderController.getHistory);
export { router as productionOrderRoutes };
