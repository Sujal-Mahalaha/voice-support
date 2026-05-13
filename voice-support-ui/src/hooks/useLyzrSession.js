import { useState, useRef, useCallback } from 'react';

const SESSION_START_URL = process.env.REACT_APP_SESSION_START_URL;
const SESSION_END_URL   = process.env.REACT_APP_SESSION_END_URL;
const AGENT_ID          = process.env.REACT_APP_AGENT_ID;
const API_KEY           = process.env.REACT_APP_LYZR_API_KEY;
const USER_IDENTITY_ENV = process.env.REACT_APP_USER_IDENTITY;

function createFallbackIdentity() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `web-${crypto.randomUUID()}`;
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getUserIdentity() {
  if (typeof USER_IDENTITY_ENV === 'string' && USER_IDENTITY_ENV.trim()) {
    return USER_IDENTITY_ENV.trim();
  }

  if (typeof window === 'undefined') {
    return 'web-user';
  }

  try {
    const key = 'lyzr-user-identity';
    const cached = window.localStorage.getItem(key);
    if (cached) return cached;

    const generated = createFallbackIdentity();
    window.localStorage.setItem(key, generated);
    return generated;
  } catch (_) {
    return createFallbackIdentity();
  }
}

export function useLyzrSession() {
  const [sessionState, setSessionState] = useState('idle'); // idle | connecting | active | ending | error
  const [sessionInfo, setSessionInfo]   = useState(null);   // { roomName, url, userToken }
  const [error, setError]               = useState(null);
  const roomRef = useRef(null);

  const startSession = useCallback(async () => {
    setSessionState('connecting');
    setError(null);
    try {
      const res = await fetch(SESSION_START_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          agentId: AGENT_ID,
          userIdentity: getUserIdentity(),
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Session start failed (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      // Lyzr returns: { roomName, url, userToken, ... }
      roomRef.current = data.roomName;
      setSessionInfo(data);
      setSessionState('active');
      return data;
    } catch (err) {
      setError(err.message);
      setSessionState('error');
      return null;
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!roomRef.current) return;
    setSessionState('ending');
    try {
      await fetch(SESSION_END_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ roomName: roomRef.current }),
      });
    } catch (_) {
      // best-effort end
    } finally {
      roomRef.current = null;
      setSessionInfo(null);
      setSessionState('idle');
    }
  }, []);

  return { sessionState, sessionInfo, error, startSession, endSession };
}
