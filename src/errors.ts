export type CodedError = Error & { code: string; retryable: boolean; status: number };

export function codedError(code: string, message: string, retryable = false, status = 500): CodedError {
  return Object.assign(new Error(message), { code, retryable, status });
}

export function errorCode(error: unknown): string {
  return (error as { code?: unknown } | null)?.code && typeof (error as { code?: unknown }).code === 'string'
    ? String((error as { code?: unknown }).code)
    : 'ASTERIA_INTERNAL_ERROR';
}
