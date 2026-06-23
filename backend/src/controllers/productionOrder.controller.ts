import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { productionOrderService } from '../services/productionOrder.service';
import { CreateProductionOrderSchema } from '../validators/schemas';

export const productionOrderController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = CreateProductionOrderSchema.parse(req.body);
      const result = await productionOrderService.create(input, req.user!.id);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, is_completed, client } = req.query as any;
      const ops = await productionOrderService.getAll({ status, is_completed: is_completed !== undefined ? is_completed === 'true' : undefined, client });
      res.json(ops);
    } catch (e) { next(e); }
  },
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await productionOrderService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try { await productionOrderService.complete(req.params.id, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async reopen(req: AuthRequest, res: Response, next: NextFunction) {
    try { await productionOrderService.reopen(req.params.id, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await productionOrderService.getHistory(req.params.id)); } catch (e) { next(e); }
  },
};
