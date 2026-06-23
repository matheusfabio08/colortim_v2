import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  async getKPIs(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await dashboardService.getKPIs()); } catch (e) { next(e); }
  },
  async getRecentActivity(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await dashboardService.getRecentActivity()); } catch (e) { next(e); }
  },
  async getTimeline(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await dashboardService.getProductionTimeline()); } catch (e) { next(e); }
  },
};
