/** 多签签名定位日志（prod 会禁用 console.log，故使用 warn/error） */
export const MULTI_SIGN_DEBUG_TAG = 'MultiSign-20260601';

function prefix() {
  return `[${MULTI_SIGN_DEBUG_TAG}]`;
}

export function msLog(step: string, data?: Record<string, unknown>) {
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
  console.error(prefix(), step, {
    message: err?.message || String(error),
    stack: err?.stack,
    ...data
  });
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
