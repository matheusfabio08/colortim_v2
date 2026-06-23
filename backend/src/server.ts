import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { checkDbConnection } from './config/database';
import { router } from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { requestLogger } from './middlewares/requestLogger.middleware';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.use('/api', router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function bootstrap() {
  try {
    await checkDbConnection();
    console.log('\u2705 Database connected');
    app.listen(env.PORT, () => {
      console.log(`\ud83d\ude80 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('\u274c Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
export { app };
