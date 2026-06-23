import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { pesagemService } from '../services/pesagem.service';

const router = Router();
router.use(authMiddleware);
router.get('/', async (req, res, next) => { try { res.json(await pesagemService.getAll()); } catch (e) { next(e); } });
router.get('/kpis', async (req, res, next) => { try { res.json(await pesagemService.getKPIs()); } catch (e) { next(e); } });
router.post('/start', async (req: any, res, next) => { try { await pesagemService.start(req.body.po_id, req.body.employee_id, req.user.id); res.json({ success: true }); } catch (e) { next(e); } });
router.post('/complete', async (req: any, res, next) => { try { await pesagemService.complete(req.body.po_id, req.body.notes, req.user.id); res.json({ success: true }); } catch (e) { next(e); } });
export { router as pesagemRoutes };
