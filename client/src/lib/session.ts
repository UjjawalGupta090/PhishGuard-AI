const SESSION_STORAGE_KEY = 'phishguard_session_id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId || sessionId.trim() === '') {
    sessionId = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function setSessionId(id: string): void {
  if (typeof window !== 'undefined' && id) {
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }
}
