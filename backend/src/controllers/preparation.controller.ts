import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { preparationService } from '../services/preparation.service';
import { PreparationSchema, BatchPreparationSchema, CreateLotsSchema } from '../validators/schemas';

export const preparationController = {
  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try { await preparationService.complete(PreparationSchema.parse(req.body), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async completeBatch(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await preparationService.completeBatch(BatchPreparationSchema.parse(req.body), req.user!.id)); } catch (e) { next(e); }
  },
  async getAvailableForBatch(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await preparationService.getAvailableForBatch(req.query.color as string)); } catch (e) { next(e); }
  },
  async createLots(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await preparationService.createLots(CreateLotsSchema.parse(req.body), req.user!.id, req.user!.username)); } catch (e) { next(e); }
  },
};
