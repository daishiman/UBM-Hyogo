"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";

export const ANNOUNCE_TTL_MS = 1000;

type Announcement = {
  id: number;
  text: string;
};

type AnnounceFn = (message: string) => void;

const IdentityConflictAnnounceContext = createContext<AnnounceFn | null>(null);

export function useIdentityConflictAnnounce(): AnnounceFn {
  return useContext(IdentityConflictAnnounceContext) ?? (() => {});
}

export function IdentityConflictAnnouncer({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [messages, setMessages] = useState<Announcement[]>([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeMessage = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const announce = useCallback(
    (text: string) => {
      if (!text) return;
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      setMessages((current) => [...current, { id, text }]);
      const timer = setTimeout(() => removeMessage(id), ANNOUNCE_TTL_MS);
      timersRef.current.set(id, timer);
    },
    [removeMessage],
  );

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    },
    [],
  );

  return (
    <IdentityConflictAnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="sr-only" data-announcer="identity-conflicts">
        {messages.map((message) => (
          <span key={message.id}>{message.text}</span>
        ))}
      </div>
    </IdentityConflictAnnounceContext.Provider>
  );
}
