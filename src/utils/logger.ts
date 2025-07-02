// src/utils/logger.ts
import { createLogger, format, transports } from 'winston';
import { TransformableInfo } from 'logform';

const { combine, timestamp, printf, colorize } = format;

// Формат логов: [LEVEL] YYYY-MM-DD HH:mm:ss - message
const logFormat = printf((info: TransformableInfo) => {
  return `[${info.level.toUpperCase()}] ${info.timestamp} - ${info.message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    // При необходимости можно добавить файл:
    // new transports.File({ filename: 'bot.log' }),
  ],
});

export default logger;
