import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { fabricQualityService } from '../services/fabricQuality.service';
import { FabricQualityInspectionSchema } from '../validators/schemas';

const router = Router();
router.use(authMiddleware);
router.get('/', async (req, res, next) => { try { res.json(await fabricQualityService.getAll(req.query.status as string)); } catch (e) { next(e); } });
router.get('/:id', async (req, res, next) => { try { res.json(await fabricQualityService.getById(req.params.id)); } catch (e) { next(e); } });
router.post('/', async (req, res, next) => { try { res.status(201).json(await fabricQualityService.create(FabricQualityInspectionSchema.parse(req.body))); } catch (e) { next(e); } });
router.put('/:id', async (req, res, next) => { try { res.json(await fabricQualityService.update(req.params.id, req.body)); } catch (e) { next(e); } });
router.delete('/:id', async (req, res, next) => { try { await fabricQualityService.delete(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });
router.post('/complete-quality-malhas', async (req: any, res, next) => { try { await fabricQualityService.completeQualityMalhas(req.body.po_id, req.user.id); res.json({ success: true }); } catch (e) { next(e); } });
export { router as fabricQualityRoutes };
