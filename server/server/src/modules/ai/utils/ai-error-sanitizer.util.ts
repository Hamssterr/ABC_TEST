/**
 * Sanitizes and masks sensitive API keys, secrets, or passwords in error messages before logging or propagating.
 */
export function sanitizeAiError(err: unknown): string {
  if (!err) return 'AI request failed';
  const raw =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);

  // Mask potential keys or secrets
  return raw
    .replace(/AIza[0-9A-Za-z\-_]{30,}/g, '[REDACTED_API_KEY]')
    .replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
    .slice(0, 200);
}
