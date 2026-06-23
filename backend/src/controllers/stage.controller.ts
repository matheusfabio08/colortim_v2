import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { productionService } from '../services/production.service';
import { dryerService } from '../services/dryer.service';
import { untanglingService } from '../services/untangling.service';
import { rollingService } from '../services/rolling.service';
import { qualityService } from '../services/quality.service';
import { ProductionSchema, DryerSchema, UntanglingSchema, RollingSchema, QualitySchema } from '../validators/schemas';

export const stageController = {
  async completeProduction(req: AuthRequest, res: Response, next: NextFunction) {
    try { await productionService.complete(ProductionSchema.parse(req.body), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async completeDryer(req: AuthRequest, res: Response, next: NextFunction) {
    try { await dryerService.complete(DryerSchema.parse(req.body), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async completeUntangling(req: AuthRequest, res: Response, next: NextFunction) {
    try { await untanglingService.complete(UntanglingSchema.parse(req.body), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async completeRolling(req: AuthRequest, res: Response, next: NextFunction) {
    try { await rollingService.complete(RollingSchema.parse(req.body), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
  async completeQuality(req: AuthRequest, res: Response, next: NextFunction) {
    try { await qualityService.complete(QualitySchema.parse(req.body), req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
  },
};
