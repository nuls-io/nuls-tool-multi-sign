import { copys } from '@/utils/util';

/** 多签签名定位日志（prod 会禁用 console.log，故使用 warn/error） */
export const MULTI_SIGN_DEBUG_TAG = 'MultiSign-20260601';
const MAX_ENTRIES = 50;

type DiagLevel = 'info' | 'error';

interface DiagEntry {
  time: string;
  level: DiagLevel;
  step: string;
  data?: Record<string, unknown>;
  message?: string;
  stack?: string;
}

const entries: DiagEntry[] = [];

/** Sign 页注册：任意 msError 时自动展示诊断条（避免 catch 遗漏） */
let onDiagnosticShow: ((payload: { message: string }) => void) | null =
  null;

export function registerDiagnosticHandler(
  handler: (payload: { message: string }) => void
) {
  onDiagnosticShow = handler;
}

export function unregisterDiagnosticHandler() {
  onDiagnosticShow = null;
}

function prefix() {
  return `[${MULTI_SIGN_DEBUG_TAG}]`;
}

function pushEntry(entry: DiagEntry) {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

function safeStringify(obj: Record<string, unknown>) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
}

export function clearDiagnosticLogs() {
  entries.length = 0;
}

export function hasDiagnosticLogs() {
  return entries.length > 0;
}

/** 最近一次 error 级别日志（用于钱包内失败但未抛错时的兜底展示） */
export function getLastErrorMessage(): string | undefined {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].level === 'error') {
      return entries[i].message;
    }
  }
  return undefined;
}

/** 生成可复制的纯文本诊断报告 */
export function buildDiagnosticReport(
  context?: Record<string, unknown>
): string {
  const lines: string[] = [
    '=== MultiSign Diagnostic Report ===',
    `tag: ${MULTI_SIGN_DEBUG_TAG}`,
    `generatedAt: ${new Date().toISOString()}`,
    `url: ${typeof location !== 'undefined' ? location.href : ''}`,
    `userAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`
  ];

  if (context && Object.keys(context).length) {
    lines.push('--- pageContext ---');
    lines.push(safeStringify(context));
  }

  lines.push(`--- logs (${entries.length}) ---`);
  if (!entries.length) {
    lines.push('(empty)');
  } else {
    entries.forEach((e, i) => {
      lines.push(
        `#${i + 1} [${e.time}] ${e.level.toUpperCase()} ${e.step}`
      );
      if (e.message) {
        lines.push(`  message: ${e.message}`);
      }
      if (e.data) {
        lines.push(`  data: ${safeStringify(e.data)}`);
      }
      if (e.stack) {
        lines.push(`  stack: ${e.stack}`);
      }
    });
  }

  return lines.join('\n');
}

export function copyDiagnosticReport(context?: Record<string, unknown>) {
  const text = buildDiagnosticReport(context);
  copys(text);
  return text;
}

export function msLog(step: string, data?: Record<string, unknown>) {
  pushEntry({
    time: new Date().toISOString(),
    level: 'info',
    step,
    data
  });
  if (data) {
    console.warn(prefix(), step, data);
  } else {
    console.warn(prefix(), step);
  }
}

export function msError(
  step: string,
  error: unknown,
  data?: Record<string, unknown>
) {
  const err = error as { message?: string; stack?: string };
  pushEntry({
    time: new Date().toISOString(),
    level: 'error',
    step,
    data,
    message: err?.message || String(error),
    stack: err?.stack
  });
  const message = err?.message || String(error);
  console.error(prefix(), step, {
    message,
    stack: err?.stack,
    ...data
  });
  onDiagnosticShow?.({ message });
}

/** 日志里用的 hex 摘要，避免整段刷屏 */
export function hexBrief(hex: string, edge = 12) {
  if (!hex) return { len: 0, head: '', tail: '' };
  const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
  return {
    len: raw.length,
    head: raw.slice(0, edge),
    tail: raw.slice(-edge)
  };
}

export function bufBrief(buf: Buffer, edge = 12) {
  const hex = buf.toString('hex');
  return { byteLen: buf.length, ...hexBrief(hex, edge) };
}
