# Phase 03: 設計レビュー

## 判定: GO

## レビュー観点

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 既存 API 不変条件遵守 | OK | `apps/api/**` への変更なし。client 側のみ |
| OKLch トークン無関係 | OK | 色変更なし |
| D1 直接アクセス禁止 | OK | client → REST 経由のみ |
| 呼び出し順序の決定論性 | OK | `router.refresh → onSubmitted → onClose` 固定。dialog unmount は最後 |
| failure path の副作用最小化 | OK | refresh は success branch のみ |
| 重複 refresh の排除 | OK | parent (`RequestActionPanel`) の `router.refresh()` は削除し、dialog ローカル一本化 |
| テスト追加可能性 | OK | `useRouter` を mock 化し refresh 呼び出し回数 / 呼出順をアサート可能 |
| プロトタイプ正本順位 | 影響なし | UI 表示ロジックは不変 |

## 残リスクと緩和

| リスク | 緩和 |
| --- | --- |
| Playwright e2e flaky（server state 再 fetch のタイミング） | `aria-live=polite` の出現を `waitFor` で待つ |
| `useRouter()` 2 dialog 重複 hook | 共通化せず React idiom 維持（無視可能なコスト） |

## NO-GO 条件（該当なし）

- API 変更が必要 → 不要
- D1 schema 変更 → 不要
- token 変更 → 不要

→ Phase 4 へ進む
