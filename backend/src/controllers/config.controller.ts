import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { configService } from '../services/config.service';

export const configController = {
  async listFibras(_req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.fibras.list()); } catch (e) { next(e); } },
  async createFibra(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(201).json(await configService.fibras.create(req.body.name)); } catch (e) { next(e); } },
  async toggleFibra(req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.fibras.toggle(req.params.id)); } catch (e) { next(e); } },
  async deleteFibra(req: AuthRequest, res: Response, next: NextFunction) { try { await configService.fibras.delete(req.params.id); res.json({ success: true }); } catch (e) { next(e); } },
  async listRegioes(_req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.regioes.list()); } catch (e) { next(e); } },
  async createRegiao(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(201).json(await configService.regioes.create(req.body.name)); } catch (e) { next(e); } },
  async toggleRegiao(req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.regioes.toggle(req.params.id)); } catch (e) { next(e); } },
  async deleteRegiao(req: AuthRequest, res: Response, next: NextFunction) { try { await configService.regioes.delete(req.params.id); res.json({ success: true }); } catch (e) { next(e); } },
  async listTransportadoras(_req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.transportadoras.list()); } catch (e) { next(e); } },
  async createTransportadora(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(201).json(await configService.transportadoras.create(req.body.name)); } catch (e) { next(e); } },
  async toggleTransportadora(req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.transportadoras.toggle(req.params.id)); } catch (e) { next(e); } },
  async deleteTransportadora(req: AuthRequest, res: Response, next: NextFunction) { try { await configService.transportadoras.delete(req.params.id); res.json({ success: true }); } catch (e) { next(e); } },
  async listEmployees(req: AuthRequest, res: Response, next: NextFunction) { try { res.json(await configService.employees.list(req.query.sector as string)); } catch (e) { next(e); } },
  async createEmployee(req: AuthRequest, res: Response, next: NextFunction) { try { res.status(201).json(await configService.employees.create(req.body.name, req.body.sector)); } catch (e) { next(e); } },
  async deleteEmployee(req: AuthRequest, res: Response, next: NextFunction) { try { await configService.employees.delete(req.params.id); res.json({ success: true }); } catch (e) { next(e); } },
};
