import { describe, expect, it } from 'vitest';
import { RequestContext } from './request-context';
import { StructuredLogger } from './structured-logger.service';

type CapturedLine = { line: string; stream: 'stdout' | 'stderr' };

function capturingLogger(): {
  logger: StructuredLogger;
  lines: CapturedLine[];
} {
  const lines: CapturedLine[] = [];
  const logger = new StructuredLogger((line, stream) => {
    lines.push({ line, stream });
  });
  return { logger, lines };
}

describe('StructuredLogger', () => {
  it('emits JSON lines with timestamp, level and message', () => {
    const { logger, lines } = capturingLogger();
    logger.log('hello');

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]!.line) as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.timestamp).toEqual(expect.any(String));
    expect(Date.parse(parsed.timestamp as string)).not.toBeNaN();
  });

  it('maps warn and error levels to their log levels', () => {
    const { logger, lines } = capturingLogger();
    logger.warn('careful');
    logger.error('boom');

    expect(JSON.parse(lines[0]!.line)).toMatchObject({
      level: 'warn',
      message: 'careful',
    });
    expect(JSON.parse(lines[1]!.line)).toMatchObject({
      level: 'error',
      message: 'boom',
    });
  });

  it('writes error level output to stderr and others to stdout', () => {
    const { logger, lines } = capturingLogger();
    logger.log('info');
    logger.error('oops');

    expect(lines[0]!.stream).toBe('stdout');
    expect(lines[1]!.stream).toBe('stderr');
  });

  it('keeps the last string argument as the context field', () => {
    const { logger, lines } = capturingLogger();
    logger.warn('session gone', 'SessionGateway');

    expect(JSON.parse(lines[0]!.line)).toMatchObject({
      level: 'warn',
      message: 'session gone',
      context: 'SessionGateway',
    });
  });

  it('serializes Error instances with message and stack', () => {
    const { logger, lines } = capturingLogger();
    const error = new Error('redis unavailable');
    logger.error(error);

    const parsed = JSON.parse(lines[0]!.line) as Record<string, unknown>;
    expect(parsed.message).toBe('redis unavailable');
    expect(parsed.stack).toEqual(expect.stringContaining('redis unavailable'));
  });

  it('includes the correlation request id when logged inside a request context', () => {
    const { logger, lines } = capturingLogger();
    RequestContext.run({ requestId: 'req-abc' }, () => {
      logger.log('handled');
    });

    expect(JSON.parse(lines[0]!.line)).toMatchObject({
      requestId: 'req-abc',
    });
  });

  it('omits the request id outside of a request context', () => {
    const { logger, lines } = capturingLogger();
    logger.log('startup');

    expect(JSON.parse(lines[0]!.line)).not.toHaveProperty('requestId');
  });

  it('filters out levels disabled via setLogLevels', () => {
    const { logger, lines } = capturingLogger();
    logger.setLogLevels(['error']);

    logger.log('hidden');
    logger.warn('also hidden');
    logger.error('visible');

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!.line)).toMatchObject({
      level: 'error',
      message: 'visible',
    });
  });
});
