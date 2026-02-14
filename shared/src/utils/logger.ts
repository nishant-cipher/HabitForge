enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

class Logger {
    private serviceName: string;
    private minLevel: LogLevel;

    constructor(serviceName: string, minLevel: LogLevel = LogLevel.INFO) {
        this.serviceName = serviceName;
        this.minLevel = minLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.minLevel);
    }

    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${this.serviceName}] [${level}] ${message}${metaStr}`;
    }

    debug(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }

    info(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage(LogLevel.INFO, message, meta));
        }
    }

    warn(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, meta));
        }
    }

    error(message: string, error?: Error | any): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const meta = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            console.error(this.formatMessage(LogLevel.ERROR, message, meta));
        }
    }
}

export function createLogger(serviceName: string): Logger {
    const minLevel = process.env.LOG_LEVEL as LogLevel || LogLevel.INFO;
    return new Logger(serviceName, minLevel);
}

export { Logger, LogLevel };
