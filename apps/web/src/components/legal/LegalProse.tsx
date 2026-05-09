// task-12: 法務文面 (privacy / terms) の typography 中心 wrapper
import type { ReactNode } from "react";

export interface LegalProseProps {
  children: ReactNode;
}

export function LegalProse({ children }: LegalProseProps) {
  return (
    <article className="prose" data-component="legal-prose">
      {children}
    </article>
  );
}
