import { addLog, LogScope } from './db';

function genLog(severity: 'info' | 'warn' | 'error') {
    return (scope: LogScope, message: string, data?: unknown, ...rest: unknown[]) => {
        console[severity](`[${scope}]`, message, data, ...rest);

        addLog({ scope, message, data: data ?? null, timestamp: Date.now() });
    }
}

export const info = genLog('info');
export const warn = genLog('warn');
export const error = genLog('error');