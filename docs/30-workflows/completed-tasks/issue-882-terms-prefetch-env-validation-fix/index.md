# issue-882 — `/terms` env validation prefetch エラーで `/` の JavaScript 有効 hydration が破綻

[実装区分: 実装仕様書] — 対象は `apps/web/src/lib/seo/site-metadata.ts` / `apps/web/app/layout.tsx` の env 参照経路。コード変更必須のため、ユーザー指定の有無に関わらず実装仕様書として作成し、2026-05-25 にローカル実装・検証まで完了した。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/882 |
| 状態 | CLOSED（クローズドのまま仕様書化） |
| workflow_state | implemented_local_evidence_captured |
| 優先度 | High |
| 分類 | bugfix / runtime |
| 対象 | `apps/web` 公開ページの client-side prefetch / hydration |
| 親 workflow | `home-page-prototype-alignment`（completed） |
| 関連 unassigned | `home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md`（本仕様書で吸収・closeout は本タスク Phase 12 で扱う） |

## 調査結果サマリ（current code 検証）

- `apps/web/app/layout.tsx` の `generateMetadata` が `buildBaseMetadata()` を呼び、`apps/web/src/lib/seo/site-metadata.ts` 内で `getPublicEnv()` を call する。
- `apps/web/src/lib/env.ts` の `getPublicEnv()` は zod `PublicEnvSchema.parse()` を使用しており、env 不足時は throw する。
- `next start`（OpenNext Workers context が無い経路）/ prefetch 経由 RSC fetch では `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` が `process.env` に存在しないため zod parse が throw し、`<Link href="/terms">` の RSC prefetch が 500 を返し、`/` 上の Console / Network error として現れる。
- git log に #882 / terms-prefetch を解消する commit は存在せず、**未解決**と判定。Issue は CLOSED されているが、コード経路自体は残存しているため CLOSED 維持のまま再発防止仕様として本タスクを作成する。

## 実装結果サマリ

- `apps/web/src/lib/env.ts` に `getPublicEnvSafe()` を追加し、既存 `getPublicEnv()` / `getEnv()` の throw 仕様は維持した。
- `apps/web/src/lib/seo/site-metadata.ts` は metadata 生成専用に safe fallback へ切り替え、env 未解決時も `/terms` RSC prefetch が zod parse で落ちない。
- `apps/web/src/lib/__tests__/env.spec.ts` / `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` に fallback regression を追加した。
- `apps/web/playwright/tests/terms-prefetch.spec.ts` で `/` 表示後の `/terms` hover prefetch 4xx / console error 0 件を固定した。

## 単一サイクル原則（CONST_007）

本仕様書群はすべて 03.実装.md の 1 サイクル内で完了させる。`/terms` 以外の route や public 全般の prefetch 影響範囲は本タスクスコープに包含し、別 PR / 将来 Issue への先送りはしない。2026-05-25 時点で未タスク化 0 件。
