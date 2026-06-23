import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { boxService } from '../services/box.service';
import { BoxSchema } from '../validators/schemas';

type BoxNumber = 'box4' | 'box5' | 'box6';

export const boxController = {
  async getRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await boxService.getRecords(req.params.box as BoxNumber)); } catch (e) { next(e); }
  },
  async start(req: AuthRequest, res: Response, next: NextFunction) {
    try { await boxService.startProcessing(req.body.po_id, req.params.box as BoxNumber, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try { await boxService.complete(BoxSchema.parse(req.body), req.params.box as BoxNumber, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async revert(req: AuthRequest, res: Response, next: NextFunction) {
    try { await boxService.revert(req.body.po_id, req.params.box as BoxNumber, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
};
