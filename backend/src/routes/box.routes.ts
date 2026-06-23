import { Router } from 'express';
import { boxController } from '../controllers/box.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/:box', boxController.getRecords);
router.post('/:box/start', boxController.start);
router.post('/:box/complete', boxController.complete);
router.post('/:box/revert', boxController.revert);
export { router as boxRoutes };
