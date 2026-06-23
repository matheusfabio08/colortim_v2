import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listaSaidaService } from '../services/listaSaida.service';

const router = Router();
router.use(authMiddleware);
router.get('/', async (req, res, next) => { try { res.json(await listaSaidaService.getAll(req.query.date as string)); } catch (e) { next(e); } });
router.post('/', async (req, res, next) => { try { res.status(201).json(await listaSaidaService.add(req.body)); } catch (e) { next(e); } });
router.delete('/:id', async (req, res, next) => { try { await listaSaidaService.remove(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });
export { router as listaSaidaRoutes };
