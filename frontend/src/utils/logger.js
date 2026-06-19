/**
 * Logging Utility
 * 콘솔 로그를 대체하는 로거
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(context) {
    this.context = context;
    this.level = LogLevel.INFO;
  }

  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    return { prefix, message, args };
  }

  debug(message, ...args) {
    if (this.level <= LogLevel.DEBUG) {
      const { prefix } = this._formatMessage('DEBUG', message, ...args);
      console.debug(prefix, message, ...args);
    }
  }

  info(message, ...args) {
    if (this.level <= LogLevel.INFO) {
      const { prefix } = this._formatMessage('INFO', message, ...args);
      console.info(prefix, message, ...args);
    }
  }

  warn(message, ...args) {
    if (this.level <= LogLevel.WARN) {
      const { prefix } = this._formatMessage('WARN', message, ...args);
      console.warn(prefix, message, ...args);
    }
  }

  error(message, ...args) {
    if (this.level <= LogLevel.ERROR) {
      const { prefix } = this._formatMessage('ERROR', message, ...args);
      console.error(prefix, message, ...args);
    }
  }
}

// 컨텍스트별 로거 생성
export const createLogger = (context) => new Logger(context);

// 기본 로거
export const logger = new Logger('App');

// 개발/운영 환경 설정
if (process.env.NODE_ENV === 'production') {
  // 운영: ERROR만 출력
  Object.values(Logger.prototype).forEach((method) => {
    if (typeof method === 'function' && method.name !== 'error') {
      // 다른 로그 레벨 비활성화
      Logger.prototype[method] = () => {};
    }
  });
}

export default Logger;
