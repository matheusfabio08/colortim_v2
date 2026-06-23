import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { pcpService } from '../services/pcp.service';

const router = Router();
router.use(authMiddleware);
router.get('/', async (req, res, next) => { try { res.json(await pcpService.getAll()); } catch (e) { next(e); } });
router.get('/kpis', async (req, res, next) => { try { res.json(await pcpService.getKPIs()); } catch (e) { next(e); } });
router.get('/status/:status', async (req, res, next) => { try { res.json(await pcpService.getByStatus(req.params.status)); } catch (e) { next(e); } });
router.put('/:id/priority', async (req: any, res, next) => { try { res.json(await pcpService.updatePriority(req.params.id, req.body.priority, req.body.priority_notes, req.user.id)); } catch (e) { next(e); } });
router.put('/:id/sequence', async (req, res, next) => { try { res.json(await pcpService.updateSequenceOrder(req.params.id, req.body.sequence_order)); } catch (e) { next(e); } });
export { router as pcpRoutes };
