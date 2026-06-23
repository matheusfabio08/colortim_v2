import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminService } from '../services/admin.service';

export const adminController = {
  async listUsers(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await adminService.listUsers()); } catch (e) { next(e); }
  },
  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.status(201).json(await adminService.createUser(req.body)); } catch (e) { next(e); }
  },
  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await adminService.updateUser(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await adminService.resetPassword(req.params.id, req.body.password)); } catch (e) { next(e); }
  },
};
