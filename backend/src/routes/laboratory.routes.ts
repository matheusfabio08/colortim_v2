import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { laboratoryService } from '../services/laboratory.service';
import { LaboratorySchema } from '../validators/schemas';

const router = Router();
router.use(authMiddleware);
router.get('/', async (req, res, next) => { try { res.json(await laboratoryService.getRecords()); } catch (e) { next(e); } });
router.get('/kpis', async (req, res, next) => { try { res.json(await laboratoryService.getKPIs()); } catch (e) { next(e); } });
router.post('/', async (req: any, res, next) => { try { await laboratoryService.complete(LaboratorySchema.parse(req.body), req.user.id); res.json({ success: true }); } catch (e) { next(e); } });
router.delete('/:id', async (req, res, next) => { try { await laboratoryService.deleteRecord(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });
export { router as laboratoryRoutes };
