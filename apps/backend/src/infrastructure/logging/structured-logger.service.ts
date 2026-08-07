import { Injectable, type LogLevel, type LoggerService } from '@nestjs/common';
import { RequestContext } from './request-context';

export type StructuredLogOutput = (
  line: string,
  stream: 'stdout' | 'stderr',
) => void;

type LogPayload = Record<string, unknown>;

const LEVELS: Record<LogLevel, string> = {
  log: 'info',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'verbose',
  fatal: 'fatal',
};

const STREAM_BY_LEVEL: Record<LogLevel, 'stdout' | 'stderr'> = {
  log: 'stdout',
  error: 'stderr',
  warn: 'stdout',
  debug: 'stdout',
  verbose: 'stdout',
  fatal: 'stderr',
};

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly output: StructuredLogOutput;
  private readonly levels: Set<LogLevel>;

  constructor(output: StructuredLogOutput = defaultOutput) {
    this.output = output;
    this.levels = new Set<LogLevel>([
      'log',
      'error',
      'warn',
      'debug',
      'verbose',
      'fatal',
    ]);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  setLogLevels(levels: LogLevel[]): void {
    this.levels.clear();
    for (const level of levels) this.levels.add(level);
  }

  private write(
    level: LogLevel,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    if (!this.levels.has(level)) return;
    const { stack, message: body } = this.extractMessage(message);
    const context = this.extractContext(message, optionalParams);
    const requestId = RequestContext.getId();
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level: LEVELS[level],
      message: body,
    };
    if (context !== undefined) payload.context = context;
    if (requestId !== undefined) payload.requestId = requestId;
    if (stack !== undefined) payload.stack = stack;
    this.output(JSON.stringify(payload), STREAM_BY_LEVEL[level]);
  }

  private extractMessage(message: unknown): {
    message: unknown;
    stack?: string;
  } {
    if (message instanceof Error) {
      return { message: message.message, stack: message.stack };
    }
    return { message };
  }

  private extractContext(
    message: unknown,
    optionalParams: unknown[],
  ): string | undefined {
    if (optionalParams.length === 0) return undefined;
    const last = optionalParams[optionalParams.length - 1];
    if (typeof last === 'string') return last;
    if (typeof message === 'string') {
      const context = optionalParams.find(
        (param): param is string => typeof param === 'string',
      );
      return context;
    }
    return undefined;
  }
}

function defaultOutput(line: string, stream: 'stdout' | 'stderr'): void {
  const target = stream === 'stderr' ? process.stderr : process.stdout;
  target.write(`${line}\n`);
}
