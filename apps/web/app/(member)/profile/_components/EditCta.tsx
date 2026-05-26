// workflow: mypage-prototype-alignment / Phase 5
// 旧素リンク版 EditCta を撤去し、client 版（EditCta.client.tsx）へ統合的に export を委譲する。
// page.tsx / ProfileHeader からの `import { EditCta } from "./EditCta"` を温存しつつ実体は client island。

export { EditCta } from "./EditCta.client";
export type { EditCtaProps } from "./EditCta.client";
