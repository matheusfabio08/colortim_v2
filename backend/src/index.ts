import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth';
import productionOrdersRouter from './routes/productionOrders';
import stagesRouter from './routes/stages';
import dashboardRouter from './routes/dashboard';
import employeesRouter from './routes/employees';
import adminRouter from './routes/admin';
import miscRouter from './routes/misc';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => callback(null, origin || '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/production-orders', productionOrdersRouter);
app.use('/api', stagesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/admin', adminRouter);
app.use('/api', miscRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
