# Phase 11 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言
- タスク種別: バックエンド read 経路の最適化（apps/api repository + use-case）。
- 非視覚的理由: UI/UX・画面・DOM の変更なし。view 出力 `PublicMemberListResponse` の形状・値は不変で画面差分が発生しない。
- 代替証跡: 自動テスト（responseFields.repository.spec.ts / list-public-members.spec.ts）の PASS 件数 + fields クエリ回数 ≦ 1 の回帰 guard。
- スクリーンショットを作らない理由: UI/UX 変更なし（NON_VISUAL）。`screenshots/` は作成しない。

## 証跡
| 項目 | 結果 |
| --- | --- |
| typecheck | focused type-sensitive tests PASS。全体 typecheck は最終検証で実行 |
| lint | focused grep gates PASS。全体 lint は最終検証で実行 |
| use-case vitest | `list-public-members.spec.ts`: 10 tests PASS |
| repository vitest | `responseFields.repository.spec.ts`: 5 tests PASS |
| fields クエリ回数 ≦ 1 回帰 guard | PASS: 3 members で `FROM response_fields` query 1 件、SQL は `response_id IN` |
| 出力 PublicMemberListResponse 不変 | PASS: 既存 happy path `fullName` / `ubmZone` / `topTags` assertions 維持 |

## 実行コマンド

```bash
pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/responseFields.repository.spec.ts
```

## 既知制限
- 実 D1（Cloudflare staging/production）接続検証・実 DB パフォーマンス計測は範囲外。
- E2E は範囲外（use-case/repository 自動テストで担保）。
