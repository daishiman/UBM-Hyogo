# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | 実装順序と rollback 境界 |

## 目的

実装者が D1 schema から route/sync wiring まで順序通りに進められる runbook を定義する。

## 実行タスク

1. 最新 migration 番号を予約する。
2. `schema_aliases` DDL を追加する。
3. repository を追加し、contract tests を先に赤くする。
4. repository 実装で tests を通す。
5. 07b apply path を `schema_aliases` INSERT に差し替える。
6. 03a lookup を alias-first に差し替える。
7. static guard と regression tests を追加する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 2 | `phase-02.md` | topology |
| Phase 4 | `phase-04.md` | test matrix |
| API routes | `apps/api/src/routes/admin/schema.ts` | 実装対象候補 |
| Sync modules | `apps/api/src/sync/schema/*` | 実装対象候補 |

## 実行手順

- 各 step は小さい commit 単位にできる粒度で進める。ただし commit はユーザー承認後。
- `schema_questions.stable_key` direct update を削除する場合、fallback read は維持する。
- apps/web 側 API client は path/request が変わらない限り編集しない。

## 統合テスト連携

| step | 直後に実行する検証 |
| --- | --- |
| DDL | local migration apply |
| repository | repository contract tests |
| 07b wiring | route tests |
| 03a lookup | sync tests |
| 全体 | `pnpm --filter @repo/api test` |

## 多角的チェック観点（AIが判断）

- migration と repository の column 名が一致しているか。
- queue resolved を alias insert 成功前に実行していないか。
- direct update 削除で既存 fallback read を壊していないか。

## サブタスク管理

| サブタスク | 並列可否 |
| --- | --- |
| DDL | 先行必須 |
| repository tests | DDL 設計後に可 |
| 07b wiring | repository 後 |
| 03a lookup | repository 後、07b と一部並列可 |
| static guard | 実装後 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 実装計画 | `phase-05.md` | runbook |

## 完了条件

- [ ] 実装順序が依存関係に沿っている
- [ ] rollback 境界が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 実装者がこの Phase だけで作業順序を判断できる

## 次Phase

Phase 6: 異常系設計
