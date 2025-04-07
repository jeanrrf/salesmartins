import winston from 'winston';
import { env } from 'process';

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: env.LOG_FILE_PATH || './logs/server.log',
      maxsize: parseInt(env.LOG_MAX_SIZE || '10485760'),
      maxFiles: parseInt(env.LOG_MAX_FILES || '7')
    })
  ]
});

export const apiLogger = (req: any, res: any, next: any) => {
  if (env.LOG_API_REQUESTS === 'true') {
    logger.info(`API Request: ${req.method} ${req.url}`, {
      body: req.body,
      query: req.query,
      headers: req.headers
    });
  }
  next();
};

export default logger;
