// task-12: 法務文面 (privacy / terms) の typography 中心 wrapper
// Lane B: ui-prose クラス追加で Prose プリミティブと CSS 等価化（article タグは I-7 テスト互換のため維持）。
import type { ReactNode } from "react";

export interface LegalProseProps {
  children: ReactNode;
}

export function LegalProse({ children }: LegalProseProps) {
  return (
    <article className="prose ui-prose" data-component="legal-prose" data-size="default">
      {children}
    </article>
  );
}
